"""
MNIST Handwritten Digit Classifier — Training Script
=====================================================

Model Architecture (Dense-only, no CNN):
  Input  : 784  (28x28 flattened, normalized to [0, 1])
  Dense1 : 128 neurons, ReLU
  Dense2 :  64 neurons, ReLU
  Output :  10 neurons, Softmax  (digits 0-9)

Output:
  Saves a TensorFlow.js LayersModel to ../public/model/
  Files produced:
    public/model/model.json   — architecture + weight manifest
    public/model/*.bin        — binary weight shards

Load in the browser with:
  const model = await tf.loadLayersModel('/model/model.json');

Requirements:
  pip install tensorflow tensorflowjs
"""

import os
import pathlib

import numpy as np
import tensorflow as tf
import tensorflowjs as tfjs


# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = pathlib.Path(__file__).parent          # handwritten-text-recognition/model/
PROJECT_ROOT = SCRIPT_DIR.parent                     # handwritten-text-recognition/
OUTPUT_DIR = PROJECT_ROOT / "public" / "model"       # Vite static assets

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Data
# ---------------------------------------------------------------------------
print("Loading MNIST dataset...")
(x_train, y_train), (x_test, y_test) = tf.keras.datasets.mnist.load_data()

# Flatten 28x28 → 784 and normalize to [0, 1]
x_train = x_train.reshape(-1, 784).astype("float32") / 255.0
x_test  = x_test.reshape(-1, 784).astype("float32") / 255.0

print(f"  Train samples : {len(x_train)}")
print(f"  Test  samples : {len(x_test)}")

# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------
model = tf.keras.Sequential(
    [
        tf.keras.layers.Input(shape=(784,), name="input"),
        tf.keras.layers.Dense(128, activation="relu",    name="dense1"),
        tf.keras.layers.Dense(64,  activation="relu",    name="dense2"),
        tf.keras.layers.Dense(10,  activation="softmax", name="output"),
    ],
    name="mnist_dense",
)

model.summary()

model.compile(
    optimizer="adam",
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"],
)

# ---------------------------------------------------------------------------
# Training  (5 epochs — speed over accuracy for this project)
# ---------------------------------------------------------------------------
print("\nTraining...")
model.fit(
    x_train, y_train,
    epochs=5,
    batch_size=256,
    validation_data=(x_test, y_test),
    verbose=1,
)

# ---------------------------------------------------------------------------
# Evaluate
# ---------------------------------------------------------------------------
loss, acc = model.evaluate(x_test, y_test, verbose=0)
print(f"\nTest accuracy : {acc:.4f}  (loss: {loss:.4f})")

# ---------------------------------------------------------------------------
# Export to TensorFlow.js LayersModel format
# ---------------------------------------------------------------------------
print(f"\nSaving TensorFlow.js model to: {OUTPUT_DIR}")
tfjs.converters.save_keras_model(model, str(OUTPUT_DIR))

# List generated files
print("\nGenerated files:")
for f in sorted(OUTPUT_DIR.iterdir()):
    size_kb = f.stat().st_size / 1024
    print(f"  {f.name:<30}  {size_kb:>7.1f} KB")

print("\nDone! Load in browser with:")
print("  const model = await tf.loadLayersModel('/model/model.json');")
