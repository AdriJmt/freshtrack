export interface NativeBarcode {
  rawValue: string;
  format: string;
  cornerPoints?: { x: number; y: number }[];
}
export interface NativeBarcodeDetector {
  detect(source: HTMLCanvasElement): Promise<NativeBarcode[]>;
}
export interface NativeBarcodeDetectorConstructor {
  new (options: { formats: string[] }): NativeBarcodeDetector;
  getSupportedFormats(): Promise<string[]>;
}
