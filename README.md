# Handwritten Text Recognition — Neural Network Visualizer

An interactive 3D visualization of a neural network built with React, TypeScript, Three.js, and Vite. The app renders a feed-forward network with a 16×16 grid input layer, hidden layers, and an output layer, complete with weighted edge connections, bloom post-processing, and forward-propagation animation.

## Tech Stack

- React 19 + TypeScript
- Three.js / React Three Fiber / Drei
- Vite 8

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm (comes with Node.js)

## Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/handwritten-text-recognition.git
cd handwritten-text-recognition

# Install dependencies
npm install
```

## Usage

```bash
# Start the dev server with hot-reload
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview

# Run ESLint
npm run lint
```

## Project Structure

```
src/
├── App.tsx                        # Canvas, camera, lighting, UI
├── components/
│   ├── NeuralNetwork.tsx          # Network layout, edges, animation
│   ├── NeuronInstances.tsx        # InstancedMesh neuron renderer
│   ├── ParticleSystem.tsx         # InstancedMesh particle animation
│   └── Edge.tsx                   # Edge / EdgeBatch line renderers
└── main.tsx                       # Entry point
```
