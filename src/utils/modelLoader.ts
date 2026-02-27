import * as tf from '@tensorflow/tfjs'

export type ModelStatus = 'idle' | 'loading' | 'ready' | 'error'

const MODEL_URL = '/model/model.json'

// シングルトンキャッシュ
let cachedModel: tf.LayersModel | null = null
let currentStatus: ModelStatus = 'idle'

// ロード中の Promise を保持し、同時呼び出し時に重複リクエストを防ぐ
let loadingPromise: Promise<tf.LayersModel> | null = null

export function getModelStatus(): ModelStatus {
  return currentStatus
}

export async function loadMNISTModel(): Promise<tf.LayersModel> {
  // キャッシュ済みなら即返す
  if (cachedModel !== null) {
    return cachedModel
  }

  // ロード中なら同じ Promise を返す（重複リクエスト防止）
  if (loadingPromise !== null) {
    return loadingPromise
  }

  currentStatus = 'loading'

  loadingPromise = tf.loadLayersModel(MODEL_URL)
    .then((model) => {
      cachedModel = model
      currentStatus = 'ready'
      loadingPromise = null
      console.info('[modelLoader] MNIST モデルのロード完了')
      return model
    })
    .catch((err: unknown) => {
      currentStatus = 'error'
      loadingPromise = null

      const isNotFound =
        err instanceof Error && err.message.toLowerCase().includes('404')

      if (isNotFound) {
        console.error(
          '[modelLoader] モデルファイルが見つかりません。\n' +
          '  → model/train_mnist.py を実行して public/model/ にモデルを生成してください。\n' +
          `  → 期待パス: ${MODEL_URL}`
        )
      } else {
        console.error('[modelLoader] モデルのロードに失敗しました:', err)
      }

      throw err
    })

  return loadingPromise
}
