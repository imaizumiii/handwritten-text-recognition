/**
 * DrawingCanvas（28×28）の ImageData を MNIST 互換グレースケール配列に変換する
 */

const BACKGROUND_THRESHOLD = 0.1;

export function imageDataToMNIST(imageData: ImageData): number[] {
  const pixels = new Array<number>(784);
  const { data } = imageData;

  for (let i = 0; i < 784; i++) {
    const value = data[i * 4] / 255; // R チャンネル（= G = B）
    pixels[i] = value < BACKGROUND_THRESHOLD ? 0.0 : value;
  }

  return pixels;
}
