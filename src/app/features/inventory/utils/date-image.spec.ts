import { prepareDateImage } from './date-image';

describe('Préparation de la photo de date', () => {
  it('limite la zone OCR haute définition pour éviter un agrandissement coûteux sur mobile', () => {
    const source = document.createElement('canvas'); source.width = 3840; source.height = 2160;
    const context = source.getContext('2d')!;
    context.fillStyle = 'white'; context.fillRect(0, 0, source.width, source.height);
    context.fillStyle = 'black'; context.font = '80px sans-serif'; context.fillText('12/03/2027', 1000, 1100);
    const prepared = prepareDateImage(source, { left: 8, top: 38, width: 84, height: 24 }, false);
    expect(Math.max(prepared.width, prepared.height)).toBeLessThanOrEqual(1328);
  });
  it('ne conserve que la zone sélectionnée et ajoute une marge blanche', async () => {
    const source = document.createElement('canvas');
    source.width = 200; source.height = 100;
    const context = source.getContext('2d')!;
    context.fillStyle = 'white'; context.fillRect(0, 0, 200, 100);
    context.fillStyle = 'black'; context.fillRect(110, 20, 50, 50);
    const image = new Image(); image.src = source.toDataURL(); await image.decode();
    const prepared = prepareDateImage(image, { left: 0, top: 0, width: 50, height: 100 }, false);
    expect(prepared.width).toBe(348);
    expect(prepared.height).toBe(348);
    const pixels = prepared.getContext('2d')!.getImageData(0, 0, prepared.width, prepared.height).data;
    // Allow small colour differences introduced by browser canvas rendering.
    const average = Array.from(pixels).reduce((sum, value) => sum + value, 0) / pixels.length;
    expect(average).toBeGreaterThan(250);
    const withInk = prepareDateImage(image, { left: 50, top: 0, width: 50, height: 100 }, false);
    const inkPixels = withInk.getContext('2d')!.getImageData(0, 0, withInk.width, withInk.height).data;
    expect(Array.from(inkPixels).some(value => value < 30)).toBeTrue();
  });
});
