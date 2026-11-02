import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BarcodeFormat, Result } from '@zxing/library';
import { CameraScannerComponent } from './camera-scanner.component';
import { ScanFeedbackService } from '../../services/scan-feedback.service';
import { BarcodeDecoderService } from '../../services/barcode-decoder.service';

const code = () => new Result('3017620422003', new Uint8Array(), 0, [], BarcodeFormat.EAN_13);

describe('Confirmation du scan vidéo', () => {
  let component: CameraScannerComponent;
  let fixture: ComponentFixture<CameraScannerComponent>;
  let resolveFrame: (result: Result | null) => void;
  let stop: jasmine.Spy;
  let feedback: { enable: jasmine.Spy; beep: jasmine.Spy };

  beforeEach(async () => {
    stop = jasmine.createSpy('stop');
    feedback = { enable: jasmine.createSpy('enable').and.resolveTo(), beep: jasmine.createSpy('beep') };
    const stream = new MediaStream();
    spyOn(stream, 'getTracks').and.returnValue([{ stop } as unknown as MediaStreamTrack]);
    spyOn(navigator.mediaDevices, 'getUserMedia').and.resolveTo(stream);
    spyOn(HTMLVideoElement.prototype, 'play').and.resolveTo();
    const decoder = { initialize: jasmine.createSpy('initialize').and.resolveTo(), read: jasmine.createSpy('read').and.callFake(() => new Promise<Result | null>(resolve => { resolveFrame = resolve; })) };
    await TestBed.configureTestingModule({ imports: [CameraScannerComponent], providers: [
      { provide: ScanFeedbackService, useValue: feedback }, { provide: BarcodeDecoderService, useValue: decoder },
    ] }).compileComponents();
    fixture = TestBed.createComponent(CameraScannerComponent); component = fixture.componentInstance;
    fixture.detectChanges();
    const video = component.videoElement().nativeElement;
    Object.defineProperties(video, { readyState: { value: 4 }, videoWidth: { value: 960 }, videoHeight: { value: 720 } });
    // The video is simulated here; the separate integration test decodes real video pixels.
    spyOn(CanvasRenderingContext2D.prototype, 'drawImage').and.stub();
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 180));
  });
  async function matchingFrames(): Promise<void> {
    for (let index = 0; index < 3; index++) {
      resolveFrame(code()); await Promise.resolve(); await Promise.resolve();
      if (index < 2) await new Promise(resolve => setTimeout(resolve, 380));
    }
  }
  afterEach(() => fixture.destroy());

  it('confirme le code, émet le bip et libère la caméra', async () => {
    const emitted = jasmine.createSpy('barcode'); component.barcodeDetected.subscribe(emitted);
    await matchingFrames(); fixture.detectChanges();
    fixture.componentRef.setInput('analyzing', true); fixture.detectChanges();
    expect(emitted).toHaveBeenCalledOnceWith('3017620422003');
    expect(feedback.beep).toHaveBeenCalledTimes(1); expect(stop).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.camera-scanner__target--detected')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Analyse du produit');
  });
  it('ne transmet pas un code lu sur une seule image', async () => {
    const emitted = jasmine.createSpy('barcode'); component.barcodeDetected.subscribe(emitted);
    resolveFrame(code()); await Promise.resolve(); await Promise.resolve();
    expect(emitted).not.toHaveBeenCalled(); expect(feedback.beep).not.toHaveBeenCalled();
    expect(component.readingStatus()).toContain('plusieurs images');
  });
  it('affiche une erreur si le moteur ne se charge pas au lieu de boucler sans résultat', async () => {
    const decoder = TestBed.inject(BarcodeDecoderService);
    (decoder.initialize as jasmine.Spy).and.rejectWith(new Error('Le moteur de lecture n’a pas pu être chargé.'));
    await component.start(); fixture.detectChanges();
    expect(component.errorMessage()).toContain('moteur de lecture');
    expect(component.starting()).toBeFalse();
    expect(stop).toHaveBeenCalled();
  });
  it('ne fait pas clignoter un spinner entre les images analysées', () => {
    component.starting.set(false); component.decoding.set(true); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.camera-scanner__spinner')).toBeNull();
    expect(fixture.nativeElement.querySelector('.camera-scanner__active')).toBeTruthy();
    component.decoding.set(false); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.camera-scanner__spinner')).toBeNull();
    expect(fixture.nativeElement.querySelector('.camera-scanner__active')).toBeTruthy();
  });
  it('ne confirme pas un code illisible', async () => {
    resolveFrame(null); await Promise.resolve(); fixture.detectChanges();
    expect(feedback.beep).not.toHaveBeenCalled(); expect(component.detectedCode()).toBe('');
  });
  it('transmet le code même si le son et l’arrêt de la caméra échouent', async () => {
    const emitted = jasmine.createSpy('barcode'); component.barcodeDetected.subscribe(emitted);
    feedback.beep.and.throwError('Audio indisponible'); stop.and.throwError('Déjà arrêtée');
    await matchingFrames();
    expect(emitted).toHaveBeenCalledOnceWith('3017620422003');
  });
  it('libère la caméra à la fermeture et ignore un résultat tardif', async () => {
    const emitted = jasmine.createSpy('barcode'); component.barcodeDetected.subscribe(emitted);
    fixture.destroy(); resolveFrame(code()); await Promise.resolve(); await Promise.resolve();
    expect(stop).toHaveBeenCalled(); expect(emitted).not.toHaveBeenCalled();
  });
});
