import { dateFrameSharpness } from './date-frame';

describe('Sélection de la meilleure image pour la date', () => {
  it('préfère une image nette à une image floue', () => {
    const sharp = document.createElement('canvas'); sharp.width = 160; sharp.height = 80;
    const context = sharp.getContext('2d')!;
    context.fillStyle = 'white'; context.fillRect(0, 0, 160, 80);
    context.fillStyle = 'black';
    for (let x = 10; x < 150; x += 8) context.fillRect(x, 20, 4, 40);
    const blurred = document.createElement('canvas'); blurred.width = 160; blurred.height = 80;
    const blurredContext = blurred.getContext('2d')!;
    blurredContext.fillStyle = 'white'; blurredContext.fillRect(0, 0, 160, 80);
    blurredContext.filter = 'blur(3px)'; blurredContext.drawImage(sharp, 0, 0);
    expect(dateFrameSharpness(sharp)).toBeGreaterThan(dateFrameSharpness(blurred) * 2);
  });
});
