import * as tf from '@tensorflow/tfjs'

export interface LayerActivation {
  layerIndex: number   // 0=入力, 1=隠れ1(128), 2=隠れ2(64), 3=出力(10)
  values: number[]     // その層のニューロンのアクティベーション値
}

export interface InferenceResult {
  activations: LayerActivation[]  // 全4層分
  prediction: number              // argmax（予測した数字）
  probabilities: number[]         // Softmax 出力（10要素）
}

/**
 * 中間層の出力を一括取得するモデルを model ごとにキャッシュする。
 * WeakMap を使うことで、元モデルが GC されれば自動解放される。
 */
const intermediateModelCache = new WeakMap<tf.LayersModel, tf.LayersModel>()

function getIntermediateModel(model: tf.LayersModel): tf.LayersModel {
  const cached = intermediateModelCache.get(model)
  if (cached !== undefined) return cached

  // model.layers の各層の output を一括出力するモデルを生成する。
  // Sequential モデルでは各層の output が単一の SymbolicTensor になる。
  const outputs = model.layers.map(
    (layer) => layer.output as tf.SymbolicTensor
  )

  const intermediate = tf.model({ inputs: model.inputs, outputs })
  intermediateModelCache.set(model, intermediate)
  return intermediate
}

/**
 * MNIST モデルに対して推論を実行し、全層のアクティベーションを返す。
 *
 * @param model   loadMNISTModel() で取得した LayersModel
 * @param mnistData 長さ 784 の正規化済みグレースケール値（0〜1）
 */
export function runInference(
  model: tf.LayersModel,
  mnistData: number[]
): InferenceResult {
  const intermediate = getIntermediateModel(model)

  // tf.tidy() のコールバック型は TensorContainer を返す関数に制限されており、
  // InferenceResult のような独自オブジェクトを返せない。
  // そのため手動で dispose() し、メモリリークを防ぐ。
  const inputTensor = tf.tensor2d([mnistData], [1, 784])

  // 全層の出力を一度に取得（InputLayer → Dense1 → Dense2 → Output）
  const layerTensors = intermediate.predict(inputTensor) as tf.Tensor[]

  try {
    // 各層のアクティベーションを number[] に変換
    const activations: LayerActivation[] = layerTensors.map((tensor, i) => ({
      layerIndex: i,
      values: Array.from(tensor.dataSync()),
    }))

    // 入力層（index 0）は mnistData そのものを使用する
    activations[0] = { layerIndex: 0, values: mnistData }

    // 最終層（Softmax）から予測結果を取得
    const probabilities = activations[activations.length - 1].values
    const prediction = probabilities.indexOf(Math.max(...probabilities))

    return { activations, prediction, probabilities }
  } finally {
    // InputLayer の output は inputTensor と同じ参照になる場合があるため
    // Set で重複を除外してから dispose する（二重解放の防止）
    const toDispose = new Set<tf.Tensor>([inputTensor, ...layerTensors])
    toDispose.forEach((t) => t.dispose())
  }
}
