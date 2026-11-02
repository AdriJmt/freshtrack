import { TestBed } from '@angular/core/testing';
import { BarcodeDecoderService } from './barcode-decoder.service';
import { barcodeFixture, realBarcodePhoto } from '../utils/barcode-fixture.spec-helper';

function setup(): BarcodeDecoderService {
  TestBed.configureTestingModule({});
  return TestBed.inject(BarcodeDecoderService);
}

describe('Décodage des images caméra', () => {
  it('lit la photo réelle de la canette sans découper le code vertical', async () => {
    const decoder = setup();
    expect((await decoder.read(await realBarcodePhoto()))?.getText()).toBe('5014379007237');
  });
  it('lit la photo réelle lorsque le code vertical dépasse la hauteur du guide horizontal', async () => {
    const decoder = setup();
    expect((await decoder.read(await realBarcodePhoto(), { left: 6, top: 28, width: 88, height: 44 }))?.getText()).toBe('5014379007237');
  });
  it('ne choisit pas arbitrairement entre deux produits visibles', async () => {
    const decoder = setup(), canvas = document.createElement('canvas');
    canvas.width = 960; canvas.height = 720;
    const context = canvas.getContext('2d')!;
    context.fillStyle = 'white'; context.fillRect(0, 0, 960, 720);
    context.drawImage(barcodeFixture('5014379007237'), 0, 0, 960, 720, 0, -160, 960, 720);
    context.drawImage(barcodeFixture(), 0, 280, 960, 160, 0, 460, 960, 160);
    expect(await decoder.read(canvas)).toBeNull();
  });
  it('lit exactement le code 5014379007237 signalé sur iPhone', async () => {
    const decoder = setup();
    const image = barcodeFixture('5014379007237');
    expect((await decoder.read(image, { left: 6, top: 28, width: 88, height: 44 }))?.getText()).toBe('5014379007237');
  });
  it('lit un code court incliné comme lors des petits mouvements du téléphone', async () => {
    const decoder = setup(), source = barcodeFixture(), canvas = document.createElement('canvas');
    canvas.width = 960; canvas.height = 720;
    const context = canvas.getContext('2d')!;
    context.fillStyle = 'white'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.translate(480, 360); context.rotate(18 * Math.PI / 180);
    // Thin printed bars: no horizontal scan line crosses the complete tilted barcode.
    context.drawImage(source, 0, 280, 960, 160, -480, -22, 960, 44);
    expect((await decoder.read(canvas))?.getText()).toBe('3017620422003');
  });
  it('ne sélectionne pas un code situé en dehors du cadre de visée', async () => {
    const decoder = setup();
    expect(await decoder.read(barcodeFixture(), { left: 0, top: 0, width: 100, height: 20 })).toBeNull();
  });
  it('lit un code vertical sans détecteur natif', async () => {
    const decoder = setup();
    const source = barcodeFixture(), rotated = document.createElement('canvas');
    rotated.width = source.height; rotated.height = source.width;
    const context = rotated.getContext('2d')!;
    context.translate(rotated.width, 0); context.rotate(Math.PI / 2); context.drawImage(source, 0, 0);
    expect((await decoder.read(rotated))?.getText()).toBe('3017620422003');
  });
  it('lit un code clair sur fond sombre', async () => {
    const decoder = setup(), canvas = barcodeFixture(), context = canvas.getContext('2d')!;
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < pixels.data.length; i += 4) {
      pixels.data[i] = 255 - pixels.data[i]; pixels.data[i + 1] = 255 - pixels.data[i + 1]; pixels.data[i + 2] = 255 - pixels.data[i + 2];
    }
    context.putImageData(pixels, 0, 0);
    expect((await decoder.read(canvas))?.getText()).toBe('3017620422003');
  });
  it('préserve les détails d’un petit code dans un flux haute définition', async () => {
    const decoder = setup(), source = barcodeFixture(), canvas = document.createElement('canvas');
    canvas.width = 2560; canvas.height = 1440;
    const context = canvas.getContext('2d')!;
    context.fillStyle = 'white'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = false;
    context.drawImage(source, 1040, 540, 480, 360);
    expect((await decoder.read(canvas))?.getText()).toBe('3017620422003');
  });
});
