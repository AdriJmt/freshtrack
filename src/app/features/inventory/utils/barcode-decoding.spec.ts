import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { barcodeFixture } from './barcode-fixture.spec-helper';

describe('Décodage réel du code-barres', () => {
  it('lit les pixels d’un EAN-13 sans simuler le résultat du lecteur', () => {
    const reader = new BrowserMultiFormatReader(new Map<DecodeHintType, unknown>([
      [DecodeHintType.TRY_HARDER, true],
      [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13]],
    ]));
    expect(reader.decodeFromCanvas(barcodeFixture()).getText()).toBe('3017620422003');
  });
});
