/** A genuine EAN-13 image, used to exercise decoding rather than mock its result. */
export function barcodeFixture(code = '3017620422003'): HTMLCanvasElement {
  const left = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
  const even = ['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
  const parity = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'][+code[0]];
  let bits = '101';
  for (let i = 1; i <= 6; i++) bits += (parity[i - 1] === 'L' ? left : even)[+code[i]];
  bits += '01010';
  for (let i = 7; i < 13; i++) bits += left[+code[i]].replace(/[01]/g, bit => bit === '0' ? '1' : '0');
  bits += '101';
  const canvas = document.createElement('canvas');
  canvas.width = 960; canvas.height = 720;
  const context = canvas.getContext('2d')!;
  context.fillStyle = 'white'; context.fillRect(0, 0, canvas.width, canvas.height);
  const module = 5, x = (canvas.width - bits.length * module) / 2;
  context.fillStyle = 'black';
  for (let i = 0; i < bits.length; i++) if (bits[i] === '1') context.fillRect(Math.round(x + i * module), 280, module, 160);
  return canvas;
}

/** User-supplied image, served exclusively by the test runner. */
export async function realBarcodePhoto(): Promise<HTMLCanvasElement> {
  const image = new Image(); image.src = '/test-fixtures/barcode-can.jpg'; await image.decode();
  const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
  canvas.getContext('2d')!.drawImage(image, 0, 0);
  return canvas;
}
