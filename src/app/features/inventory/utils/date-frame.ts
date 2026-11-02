import { DateCrop } from '../types/date-crop.type';

/** Relative focus score: used to choose a frame, never to reject camera movement. */
export function dateFrameSharpness(canvas: HTMLCanvasElement): number {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context || canvas.width < 3 || canvas.height < 3) return 0;
  const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const grey = new Float32Array(canvas.width * canvas.height);
  for (let index = 0; index < grey.length; index++) {
    const offset = index * 4;
    grey[index] = .299 * rgba[offset] + .587 * rgba[offset + 1] + .114 * rgba[offset + 2];
  }
  let sum = 0, square = 0, count = 0;
  for (let y = 1; y < canvas.height - 1; y++) for (let x = 1; x < canvas.width - 1; x++) {
    const index = y * canvas.width + x;
    const edge = grey[index - 1] + grey[index + 1] + grey[index - canvas.width] + grey[index + canvas.width] - 4 * grey[index];
    sum += edge; square += edge * edge; count++;
  }
  return count ? Math.max(0, square / count - (sum / count) ** 2) : 0;
}

/** Take a short burst and retain the clearest date area while the user moves naturally. */
export async function captureDateFrame(video: HTMLVideoElement, region: DateCrop, active: () => boolean): Promise<HTMLCanvasElement | null> {
  const frame = document.createElement('canvas');
  frame.width = video.videoWidth; frame.height = video.videoHeight;
  const context = frame.getContext('2d');
  const sample = document.createElement('canvas');
  sample.width = 320;
  const width = frame.width * region.width / 100, height = frame.height * region.height / 100;
  sample.height = Math.max(24, Math.round(sample.width * height / width));
  const sampleContext = sample.getContext('2d', { willReadFrequently: true });
  if (!context || !sampleContext) throw new Error('Capture vidéo indisponible.');
  let best = -1;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await new Promise(resolve => setTimeout(resolve, 70));
    if (!active()) return null;
    if (video.readyState < 2) continue;
    sampleContext.drawImage(video, frame.width * region.left / 100, frame.height * region.top / 100,
      width, height, 0, 0, sample.width, sample.height);
    const score = dateFrameSharpness(sample);
    if (score > best) { best = score; context.drawImage(video, 0, 0, frame.width, frame.height); }
  }
  return best >= 0 ? frame : null;
}
