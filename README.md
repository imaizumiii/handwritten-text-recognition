# Handwritten Text Recognition — Neural Network Visualizer

手書き文字認識ニューラルネットワークのインタラクティブな3Dビジュアライザーです。React・TypeScript・Three.js・Viteで構築されており、16×16グリッド入力層・隠れ層・出力層を持つフィードフォワードネットワークをレンダリングします。加重エッジ接続、ブルームポストプロセッシング、順伝播アニメーション、キャンバスへの手書き入力とTensorFlow.jsによるリアルタイム推論に対応しています。

## 技術スタック

- React 19 + TypeScript
- Three.js / React Three Fiber / Drei
- TensorFlow.js v4
- Vite 8

---

## インストール手順

### 前提条件

以下のソフトウェアが事前にインストールされている必要があります。

| ソフトウェア | バージョン | 入手先 |
|---|---|---|
| Node.js | v18 以上 | https://nodejs.org/ |
| npm | Node.js に同梱 | — |
| Python *(任意)* | v3.9 以上 | https://www.python.org/ |

> **注意:** Python は `model/train_mnist.py` でモデルを再学習する場合のみ必要です。ブラウザでの動作には不要です。

---

### 1. リポジトリのクローン

```bash
git clone https://github.com/<your-username>/handwritten-text-recognition.git
cd handwritten-text-recognition
```

### 2. 依存パッケージのインストール

```bash
npm install
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:5173](http://localhost:5173) を開くと、アプリが表示されます。ファイルを編集すると自動的にホットリロードされます。

### 4. プロダクションビルド

```bash
# TypeScriptのコンパイルとバンドル
npm run build

# ビルド結果のプレビュー
npm run preview
```

ビルド成果物は `dist/` ディレクトリに出力されます。

### 5. コードの静的解析

```bash
npm run lint
```

---

### モデルの再学習（任意）

Python環境でMNISTモデルを再学習する場合は以下の手順に従ってください。

```bash
# Python依存ライブラリのインストール
pip install tensorflow numpy

# 学習スクリプトの実行
python model/train_mnist.py
```

学習済みモデルは `public/` に配置することでブラウザから読み込まれます。

---

## プロジェクト構成

```
handwritten-text-recognition/
├── model/
│   └── train_mnist.py              # MNISTモデル学習スクリプト
├── public/                         # 静的ファイル（学習済みモデルなど）
└── src/
    ├── App.tsx                     # キャンバス・カメラ・ライティング・UI
    ├── components/
    │   ├── CameraAnimator.tsx      # カメラアニメーション制御
    │   ├── DrawingCanvas.tsx       # 手書き入力キャンバス
    │   ├── Edge.tsx                # エッジ／EdgeBatchラインレンダラー
    │   ├── InputPanel.tsx          # 入力パネルUI
    │   ├── NeuralNetwork.tsx       # ネットワーク配置・エッジ・アニメーション
    │   ├── NeuronInstances.tsx     # InstancedMeshニューロンレンダラー
    │   ├── ParticleSystem.tsx      # InstancedMeshパーティクルアニメーション
    │   └── PredictionDisplay.tsx   # 推論結果表示
    └── utils/
        ├── imageProcessing.ts      # 画像前処理ユーティリティ
        ├── inference.ts            # 推論実行ロジック
        └── modelLoader.ts          # モデルロードユーティリティ
```

## ライセンス

MIT
