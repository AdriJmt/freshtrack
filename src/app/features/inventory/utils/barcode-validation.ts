import { BarcodeFormat } from '@zxing/library';

/** Validate the retail format as well as its check digit; expand compressed UPC-E for lookup. */
export function retailBarcode(value: string, format: BarcodeFormat): string | null {
  let code = value;
  if (format === BarcodeFormat.UPC_E) {
    if (!/^[01]\d{7}$/.test(code)) return null;
    const body = code.slice(1, 7), last = body[5];
    code = code[0] + (last <= '2' ? body.slice(0, 2) + last + '0000' + body.slice(2, 5)
      : last === '3' ? body.slice(0, 3) + '00000' + body.slice(3, 5)
      : last === '4' ? body.slice(0, 4) + '00000' + body[4]
      : body.slice(0, 5) + '0000' + last) + code[7];
  } else {
    const length = format === BarcodeFormat.EAN_8 ? 8 : format === BarcodeFormat.EAN_13 ? 13
      : format === BarcodeFormat.UPC_A ? 12 : format === BarcodeFormat.CODE_128 ? 14 : 0;
    if (!length || code.length !== length) return null;
  }
  if (!/^\d+$/.test(code)) return null;
  let sum = 0;
  for (let i = code.length - 2, weight = 3; i >= 0; i--, weight = weight === 3 ? 1 : 3) sum += Number(code[i]) * weight;
  return (10 - sum % 10) % 10 === Number(code.at(-1)) ? code : null;
}

/** Keep useful readings across blurred frames without accepting competing codes. */
export class BarcodeConsensus {
  private readings: { code: string; at: number }[] = [];

  observe(code: string | null, now = Date.now()): boolean {
    this.readings = this.readings.filter(reading => now - reading.at <= 6000);
    if (!code) return false;
    this.readings.push({ code, at: now });
    this.readings = this.readings.slice(-6);
    const hits = this.readings.filter(reading => reading.code === code).length;
    const competing = this.readings.length - hits;
    return hits >= 3 && hits >= competing + 2;
  }
}
