import { Injectable } from '@angular/core';
import { BarcodeFormat, Result, ResultPoint } from '@zxing/library';
import { prepareZXingModule, readBarcodes, type ReadResult } from 'zxing-wasm/reader';
import { retailBarcode } from '../utils/barcode-validation';
import { DateCrop } from '../types/date-crop.type';

const FORMATS = new Map<string, BarcodeFormat>([
  ['EAN13', BarcodeFormat.EAN_13], ['EAN8', BarcodeFormat.EAN_8],
  ['UPCA', BarcodeFormat.UPC_A], ['UPCE', BarcodeFormat.UPC_E], ['Code128', BarcodeFormat.CODE_128],
]);

@Injectable({ providedIn: 'root' })
export class BarcodeDecoderService {
  private initialization?: Promise<void>;

  initialize(): Promise<void> {
    return this.initialization ??= this.load();
  }

  private async load(): Promise<void> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        prepareZXingModule({
          overrides: { locateFile: (path: string) => new URL(`assets/scanner/${path}`, document.baseURI).href },
          fireImmediately: true,
        }),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('Le moteur de lecture ne répond pas. Rechargez la page.')), 15000);
        }),
      ]);
    } catch {
      this.initialization = undefined;
      throw new Error('Le moteur de lecture n’a pas pu être chargé. Vérifiez la connexion puis réessayez.');
    } finally { clearTimeout(timer); }
  }

  async read(source: HTMLCanvasElement, region?: DateCrop): Promise<Result | null> {
    await this.initialize();
    const centerX = region ? region.left + region.width / 2 : 50;
    const centerY = region ? region.top + region.height / 2 : 50;
    // Different aspect ratios isolate bars from nearby text without assuming their orientation.
    const areas: DateCrop[] = [{ left: 0, top: 0, width: 100, height: 100 }];
    for (const [width, height, offsetX, offsetY] of [
      [60, 60, 0, 0], [20, 60, 0, 0], [60, 20, 0, 0],
      [30, 90, 0, 0], [90, 30, 0, 0],
      [20, 80, -20, 0], [20, 80, 20, 0], [80, 20, 0, -20], [80, 20, 0, 20],
    ]) {
      areas.push({ left: Math.max(0, Math.min(100 - width, centerX + offsetX - width / 2)),
        top: Math.max(0, Math.min(100 - height, centerY + offsetY - height / 2)), width, height });
    }
    for (const area of areas) {
      const result = await this.readArea(source, area, region);
      if (result === 'ambiguous') return null;
      if (result) return result;
    }
    return null;
  }

  private async readArea(source: HTMLCanvasElement, area: DateCrop, region?: DateCrop): Promise<Result | 'ambiguous' | null> {
    const left = source.width * area.left / 100, top = source.height * area.top / 100;
    const width = source.width * area.width / 100, height = source.height * area.height / 100;
    const scale = Math.min(1, 2560 / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale)); canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Analyse des pixels caméra indisponible.');
    context.drawImage(source, left, top, width, height, 0, 0, canvas.width, canvas.height);
    let results = await this.readPixels(canvas);
    let restore = (x: number, y: number) => ({ x, y });
    if (!results.length) {
      // On red packaging, luminance makes black bars and their background similarly dark.
      const channel = document.createElement('canvas'); channel.width = canvas.width; channel.height = canvas.height;
      const channelContext = channel.getContext('2d')!;
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < pixels.data.length; i += 4) pixels.data[i + 1] = pixels.data[i + 2] = pixels.data[i];
      channelContext.putImageData(pixels, 0, 0);
      results = await this.readPixels(channel);
    }
    if (!results.length) {
      const inverted = document.createElement('canvas'); inverted.width = canvas.width; inverted.height = canvas.height;
      const invertedContext = inverted.getContext('2d')!;
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < pixels.data.length; i += 4) {
        pixels.data[i] = 255 - pixels.data[i]; pixels.data[i + 1] = 255 - pixels.data[i + 1]; pixels.data[i + 2] = 255 - pixels.data[i + 2];
      }
      invertedContext.putImageData(pixels, 0, 0);
      results = await this.readPixels(inverted);
    }
    if (!results.length) {
      const turned = document.createElement('canvas');
      turned.width = Math.ceil(canvas.width * 1.3); turned.height = Math.ceil(canvas.height + canvas.width * .5);
      const turnedContext = turned.getContext('2d')!;
      for (const degrees of [-20, 20, -10, 10]) {
        const angle = degrees * Math.PI / 180;
        turnedContext.fillStyle = 'white'; turnedContext.fillRect(0, 0, turned.width, turned.height);
        turnedContext.save(); turnedContext.translate(turned.width / 2, turned.height / 2);
        turnedContext.rotate(angle); turnedContext.drawImage(canvas, -canvas.width / 2, -canvas.height / 2); turnedContext.restore();
        results = await this.readPixels(turned);
        if (results.length) {
          restore = (x, y) => ({
            x: (x - turned.width / 2) * Math.cos(angle) + (y - turned.height / 2) * Math.sin(angle) + canvas.width / 2,
            y: -(x - turned.width / 2) * Math.sin(angle) + (y - turned.height / 2) * Math.cos(angle) + canvas.height / 2,
          });
          break;
        }
      }
    }
    const valid = results.flatMap(result => {
      const format = FORMATS.get(result.format);
      const code = format === undefined ? null : retailBarcode(result.text, format);
      if (!code) return [];
      const corners = [result.position.topLeft, result.position.topRight, result.position.bottomRight, result.position.bottomLeft];
      const center = restore(corners.reduce((sum, point) => sum + point.x, 0) / 4, corners.reduce((sum, point) => sum + point.y, 0) / 4);
      const x = (left + center.x * width / canvas.width) / source.width * 100;
      const y = (top + center.y * height / canvas.height) / source.height * 100;
      if (region && (x < region.left || x > region.left + region.width || y < region.top || y > region.top + region.height)) return [];
      return [{ result, code, format: format! }];
    });
    // Never choose arbitrarily when multiple different product codes are visible.
    if (new Set(valid.map(item => item.code)).size > 1) return 'ambiguous';
    if (!valid.length) return null;
    const { result, code, format } = valid[0];
    const points = [result.position.topLeft, result.position.topRight, result.position.bottomRight, result.position.bottomLeft];
    return new Result(code, new Uint8Array(), 0, points.map(point => {
      const restored = restore(point.x, point.y);
      return new ResultPoint(left + restored.x * width / canvas.width, top + restored.y * height / canvas.height);
    }), format === BarcodeFormat.UPC_E ? BarcodeFormat.UPC_A : format);
  }
  private readPixels(canvas: HTMLCanvasElement): Promise<ReadResult[]> {
    return readBarcodes(canvas.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, canvas.width, canvas.height), {
      formats: ['EAN13', 'EAN8', 'UPCA', 'UPCE', 'Code128'],
      tryHarder: true, tryRotate: true, tryInvert: true, tryDownscale: true,
      minLineCount: 1, maxNumberOfSymbols: 4,
    });
  }
}
