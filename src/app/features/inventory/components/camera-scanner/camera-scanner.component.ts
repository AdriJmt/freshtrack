import { captureDateFrame } from '../../utils/date-frame';
import { BarcodeConsensus, retailBarcode } from '../../utils/barcode-validation';
import { AfterViewInit, Component, ElementRef, OnDestroy, NgZone, inject, input, output, signal, viewChild } from '@angular/core';
import { Result } from '@zxing/library';

import { BarcodeDecoderService } from '../../services/barcode-decoder.service';
import { dateFrameRegion } from '../../utils/date-scan';
import { ScanFeedbackService } from '../../services/scan-feedback.service';

@Component({
  selector: 'app-camera-scanner',
  templateUrl: './camera-scanner.component.html',
  styleUrl: './camera-scanner.component.scss',
})
export class CameraScannerComponent implements AfterViewInit, OnDestroy {
  private readonly zone = inject(NgZone);
  readonly feedback = inject(ScanFeedbackService);
  readonly analyzing = input(false);
  readonly detectedCode = signal('');
  readonly frame = signal({ left: 6, top: 28, width: 88, height: 44 });
  readonly barcodeDetected = output<string>();
  readonly videoElement = viewChild.required<ElementRef<HTMLVideoElement>>('video');
  readonly errorMessage = signal('');
  readonly starting = signal(false);
  readonly readerVersion = 'color-v7';
  readonly cameraName = signal('Caméra');
  readonly framesAnalyzed = signal(0);
  readonly decoding = signal(false);
  readonly videoSize = signal('En attente du flux');
  readonly readingPhoto = signal(false);
  readonly secureContext = window.isSecureContext;
  private readonly decoder = inject(BarcodeDecoderService);
  private stream?: MediaStream;
  private timer?: ReturnType<typeof setTimeout>;
  private reading = false;
  private consecutiveErrors = 0;
  readonly readingStatus = signal('Centrez le code-barres, horizontal ou vertical');
  private destroyed = false;
  private detected = false;
  private consensus = new BarcodeConsensus();

  ngAfterViewInit(): void { void this.feedback.enable(); void this.start(); }

  async start(): Promise<void> {
    if (this.starting() || this.destroyed || this.detected) return;
    this.errorMessage.set('');
    if (!window.isSecureContext) {
      this.errorMessage.set('La caméra en direct est bloquée : ouvrez cette page en HTTPS avec un certificat reconnu par ce téléphone. Vous pouvez aussi photographier le code-barres ci-dessous.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      this.errorMessage.set('Ce navigateur ne propose pas la caméra en direct. Ouvrez la page dans Safari ou Chrome, ou photographiez le code-barres.');
      return;
    }
    this.framesAnalyzed.set(0);
    this.consensus = new BarcodeConsensus();
    this.starting.set(true);
    this.releaseCamera();
    try {
      this.readingStatus.set('Chargement du lecteur…');
      await this.decoder.initialize();
      if (this.destroyed) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: {
        facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 },
      } });
      if (this.destroyed) { stream.getTracks().forEach(track => track.stop()); return; }
      this.stream = stream;
      const video = this.videoElement().nativeElement;
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.srcObject = stream;
      await video.play();
      if (this.destroyed) { this.releaseCamera(); return; }
      const track = stream.getVideoTracks()[0];
      this.cameraName.set(track?.label || 'Caméra');
      const capabilities = track?.getCapabilities?.() as (MediaTrackCapabilities & { focusMode?: string[] }) | undefined;
      if (capabilities?.focusMode?.includes('continuous')) {
        const constraints: MediaTrackConstraints & { focusMode: string } = { focusMode: 'continuous' };
        void track.applyConstraints(constraints).catch(() => {});
      }
      this.consecutiveErrors = 0;
      this.readingStatus.set('Lecture active · Centrez le code-barres, horizontal ou vertical');
      this.zone.runOutsideAngular(() => void this.scanFrame());
    } catch (error) {
      const name = error instanceof Error ? error.name : '';
      const messages: Record<string, string> = {
        NotAllowedError: 'L’accès caméra a été refusé. Autorisez la caméra dans les réglages de ce site, puis réessayez. Si le navigateur signale un certificat non fiable, installez le certificat local sur ce téléphone.',
        NotFoundError: 'Aucune caméra détectée sur cet appareil. Photographiez le code-barres ou saisissez son numéro.',
        NotReadableError: 'La caméra est occupée ou indisponible. Fermez les autres applications qui l’utilisent, puis réessayez.',
        SecurityError: 'Le navigateur bloque la caméra. Vérifiez les autorisations du site et la confiance du certificat HTTPS.',
      };
      this.releaseCamera();
      if (!this.destroyed) this.errorMessage.set(messages[name] ?? (error instanceof Error ? error.message : 'La caméra n’a pas pu démarrer. Réessayez ou photographiez le code-barres.'));
    } finally { this.starting.set(false); }
  }

  private async scanFrame(): Promise<void> {
    if (this.destroyed || this.detected || this.analyzing()) return;
    if (this.reading || this.readingPhoto()) { this.scheduleFrame(); return; }
    const video = this.videoElement().nativeElement;
    if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) { this.scheduleFrame(); return; }
    this.reading = true;
    this.zone.run(() => {
      this.decoding.set(true);
      this.videoSize.set(`${video.videoWidth} × ${video.videoHeight}`);
    });
    try {
      const region = video.clientWidth && video.clientHeight
        ? dateFrameRegion(video.videoWidth, video.videoHeight, video.clientWidth, video.clientHeight, this.frame())
        : { left: 0, top: 0, width: 100, height: 100 };
      // Choose the sharpest of three nearby frames instead of requiring a steady hand.
      const canvas = await captureDateFrame(video, region, () => !this.destroyed && !this.detected && !this.analyzing());
      if (!canvas) return;
      const result = await this.decoder.read(canvas, region);
      if (this.destroyed || this.detected || this.analyzing()) return;
      this.consecutiveErrors = 0;
      this.zone.run(() => {
        this.framesAnalyzed.update(count => count + 1);
        this.readingStatus.set(this.framesAnalyzed() > 6
          ? 'Aucun code reconnu · Ajustez la distance pour rendre les barres nettes.'
          : 'Lecture active · Recherche du code-barres…');
      });
      const code = result ? retailBarcode(result.getText(), result.getBarcodeFormat()) : null;
      if (this.consensus.observe(code) && result) { this.zone.run(() => this.accept(result)); return; }
      if (code) this.zone.run(() => this.readingStatus.set('Code repéré · Vérification sur plusieurs images…'));
    } catch {
      if (this.destroyed) return;
      this.consecutiveErrors++;
      this.zone.run(() => this.readingStatus.set('Lecture en cours · Centrez le code-barres et évitez les reflets.'));
      if (this.consecutiveErrors >= 3) {
        this.zone.run(() => this.errorMessage.set('La lecture vidéo a été interrompue. Réessayez la caméra ou photographiez le code-barres.'));
        this.releaseCamera();
        return;
      }
    } finally { this.reading = false; if (!this.destroyed) this.zone.run(() => this.decoding.set(false)); }
    this.scheduleFrame();
  }

  private scheduleFrame(): void {
    if (!this.destroyed && !this.detected && this.stream) this.timer = setTimeout(() => void this.scanFrame(), 180);
  }

  async readPhoto(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || this.readingPhoto() || this.detected || this.analyzing()) return;
    this.readingPhoto.set(true);
    const url = URL.createObjectURL(file);
    try {
      const photo = new Image();
      photo.src = url;
      await photo.decode();
      const canvas = document.createElement('canvas');
      canvas.width = photo.naturalWidth; canvas.height = photo.naturalHeight;
      canvas.getContext('2d')?.drawImage(photo, 0, 0);
      const result = await this.decoder.read(canvas);
      if (!result) throw new Error('Code-barres illisible.');
      if (this.destroyed || this.detected) return;
      this.accept(result);
    } catch { this.errorMessage.set('Code-barres illisible sur la photo. Photographiez-le de plus près, bien éclairé, ou saisissez son numéro.'); }
    finally { URL.revokeObjectURL(url); this.readingPhoto.set(false); input.value = ''; }
  }

  private accept(result: Result): void {
    if (this.detected || this.destroyed) return;
    const code = retailBarcode(result.getText(), result.getBarcodeFormat());
    if (!code) return;
    this.detected = true;
    this.errorMessage.set('');
    this.detectedCode.set(code);
    try { this.feedback.beep(); } catch { /* Sound must not block the product. */ }
    this.releaseCamera();
    this.barcodeDetected.emit(code);
  }

  private releaseCamera(): void {
    clearTimeout(this.timer);
    this.stream?.getTracks().forEach(track => { try { track.stop(); } catch { /* Already stopped. */ } });
    this.stream = undefined;
  }

  ngOnDestroy(): void { this.destroyed = true; this.releaseCamera(); }
}
