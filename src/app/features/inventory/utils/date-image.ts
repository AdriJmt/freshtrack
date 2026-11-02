import { DateCrop } from '../types/date-crop.type';
export type { DateCrop } from '../types/date-crop.type';

/** Enlarge only the selected print, normalize contrast and optionally binarize it. */
export function prepareDateImage(image: HTMLImageElement | HTMLCanvasElement, crop: DateCrop, binary: boolean): HTMLCanvasElement {
  const imageWidth = image instanceof HTMLCanvasElement ? image.width : image.naturalWidth;
  const imageHeight = image instanceof HTMLCanvasElement ? image.height : image.naturalHeight;
  const sourceWidth = imageWidth * crop.width / 100;
  const sourceHeight = imageHeight * crop.height / 100;
  const scale = Math.min(3, 1280 / Math.max(sourceWidth, sourceHeight));
  const padding = 24;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sourceWidth * scale)) + padding * 2;
  canvas.height = Math.max(1, Math.round(sourceHeight * scale)) + padding * 2;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Traitement de la photo indisponible.');
  context.fillStyle = 'white';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, imageWidth * crop.left / 100, imageHeight * crop.top / 100,
    sourceWidth, sourceHeight, padding, padding, canvas.width - padding * 2, canvas.height - padding * 2);
  const pixels = context.getImageData(padding, padding, canvas.width - padding * 2, canvas.height - padding * 2);
  const histogram = new Uint32Array(256);
  let total = 0;
  for (let i = 0; i < pixels.data.length; i += 4) {
    const grey = Math.round(pixels.data[i] * .299 + pixels.data[i + 1] * .587 + pixels.data[i + 2] * .114);
    histogram[grey]++; total += grey;
  }
  const count = pixels.data.length / 4;
  const percentile = (fraction: number) => {
    let sum = 0;
    for (let value = 0; value < 256; value++) { sum += histogram[value]; if (sum >= count * fraction) return value; }
    return 255;
  };
  const low = percentile(.02), high = percentile(.98);
  const invert = total / count < 120;
  for (let i = 0; i < pixels.data.length; i += 4) {
    const grey = pixels.data[i] * .299 + pixels.data[i + 1] * .587 + pixels.data[i + 2] * .114;
    let value = high - low >= 20 ? Math.max(0, Math.min(255, (grey - low) * 255 / (high - low))) : grey;
    if (invert) value = 255 - value;
    pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value;
  }
  if (binary) {
    // Adaptive threshold preserves faded ink under uneven lighting.
    const width = pixels.width, height = pixels.height, stride = width + 1;
    const integral = new Float64Array(stride * (height + 1));
    for (let y = 0; y < height; y++) {
      let row = 0;
      for (let x = 0; x < width; x++) {
        row += pixels.data[(y * width + x) * 4];
        integral[(y + 1) * stride + x + 1] = integral[y * stride + x + 1] + row;
      }
    }
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const x1 = Math.max(0, x - 20), x2 = Math.min(width, x + 21);
      const y1 = Math.max(0, y - 20), y2 = Math.min(height, y + 21);
      const mean = (integral[y2 * stride + x2] - integral[y1 * stride + x2] - integral[y2 * stride + x1] + integral[y1 * stride + x1]) / ((x2 - x1) * (y2 - y1));
      const i = (y * width + x) * 4;
      const value = pixels.data[i] < mean - 10 ? 0 : 255;
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value;
    }
  }
  context.putImageData(pixels, padding, padding);
  return canvas;
}
