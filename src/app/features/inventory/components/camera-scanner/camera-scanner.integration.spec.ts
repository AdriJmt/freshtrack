import { TestBed } from '@angular/core/testing';
import { CameraScannerComponent } from './camera-scanner.component';
import { ScanFeedbackService } from '../../services/scan-feedback.service';
import { barcodeFixture, realBarcodePhoto } from '../../utils/barcode-fixture.spec-helper';

// Exercise getUserMedia → video → captured pixels → decoder → component event.
// No simulated decoding results or manual invocation of the component's output.
describe('Lecture complète depuis un flux vidéo', () => {
  it('lit la photo réelle verticale depuis le flux vidéo et confirme le bon code', async () => {
    const photo = await realBarcodePhoto();
    const canvas = document.createElement('canvas'); canvas.width = 1920; canvas.height = 1440;
    const context = canvas.getContext('2d')!;
    context.drawImage(photo, 0, 0, canvas.width, canvas.height);
    const stream = canvas.captureStream(15);
    const repaint = setInterval(() => context.drawImage(photo, 0, 0, canvas.width, canvas.height), 60);
    spyOn(navigator.mediaDevices, 'getUserMedia').and.resolveTo(stream);
    const beep = jasmine.createSpy('beep');
    await TestBed.configureTestingModule({ imports: [CameraScannerComponent], providers: [
      { provide: ScanFeedbackService, useValue: { enable: () => Promise.resolve(), beep } },
    ] }).compileComponents();
    const fixture = TestBed.createComponent(CameraScannerComponent);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const detected = new Promise<string>((resolve, reject) => {
        fixture.componentInstance.barcodeDetected.subscribe(resolve);
        timer = setTimeout(() => reject(new Error('Photo réelle non lue dans le flux vidéo')), 12000);
      });
      fixture.detectChanges();
      expect(await detected).toBe('5014379007237');
      expect(beep).toHaveBeenCalledTimes(1);
    } finally {
      clearTimeout(timer); clearInterval(repaint); fixture.destroy(); stream.getTracks().forEach(track => track.stop());
    }
  }, 16000);
  it('lit un EAN-13 dans la caméra et transmet son code au formulaire', async () => {
    const source = barcodeFixture('5014379007237');
    const videoCanvas = document.createElement('canvas');
    videoCanvas.width = source.width; videoCanvas.height = source.height;
    const context = videoCanvas.getContext('2d')!;
    context.drawImage(source, 0, 0);
    const stream = videoCanvas.captureStream(15);
    const repaint = setInterval(() => context.drawImage(source, 0, 0), 60);
    spyOn(navigator.mediaDevices, 'getUserMedia').and.resolveTo(stream);
    const beep = jasmine.createSpy('beep');
    await TestBed.configureTestingModule({ imports: [CameraScannerComponent], providers: [
      { provide: ScanFeedbackService, useValue: { enable: () => Promise.resolve(), beep } },
    ] }).compileComponents();
    const fixture = TestBed.createComponent(CameraScannerComponent);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const detected = new Promise<string>((resolve, reject) => {
        fixture.componentInstance.barcodeDetected.subscribe(resolve);
        timer = setTimeout(() => reject(new Error(`Aucun code lu dans le flux vidéo : ${fixture.componentInstance.errorMessage()}`)), 4000);
      });
      fixture.detectChanges();
      expect(await detected).toBe('5014379007237');
      expect(beep).toHaveBeenCalledTimes(1);
      expect(stream.getVideoTracks()[0].readyState).toBe('ended');
    } finally {
      clearTimeout(timer); clearInterval(repaint); fixture.destroy(); stream.getTracks().forEach(track => track.stop());
    }
  }, 12000);
});
