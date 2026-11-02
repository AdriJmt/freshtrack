import { AfterViewInit, Component, ElementRef, inject, OnDestroy, output, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import type { Worker } from 'tesseract.js';
import { findExpiryDates } from '../../utils/expiry-date';
import { prepareDateImage } from '../../utils/date-image';
import { DateScanConsensus, dateFrameRegion } from '../../utils/date-scan';
import { captureDateFrame } from '../../utils/date-frame';
import { ScanFeedbackService } from '../../services/scan-feedback.service';

@Component({
  selector: 'app-expiry-date-reader',
  imports: [DatePipe],
  templateUrl: './expiry-date-reader.component.html',
  styleUrl: './expiry-date-reader.component.scss',
})
export class ExpiryDateReaderComponent implements AfterViewInit, OnDestroy {
  private readonly feedback = inject(ScanFeedbackService);
  private readonly video = viewChild.required<ElementRef<HTMLVideoElement>>('video');
  readonly dateDetected = output<string>();
  readonly skip = output<void>();
  readonly ready = signal(false);
  readonly analyzing = signal(false);
  readonly candidateDate = signal('');
  readonly detectedDate = signal('');
  readonly errorMessage = signal('');
  readonly status = signal('Ouverture de la caméra…');
  readonly guide = { left: 8, top: 38, width: 84, height: 24 };
  private stream?: MediaStream;
  private worker?: Worker;
  private timer?: ReturnType<typeof setTimeout>;
  private destroyed = false;
  private starting = false;
  private busy = false;
  private misses = 0;
  private consensus = new DateScanConsensus();

  ngAfterViewInit(): void { void this.start(); }

  async start(): Promise<void> {
    if (this.destroyed || this.starting || this.worker || this.detectedDate()) return;
    this.starting = true;
    this.errorMessage.set('');
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        this.errorMessage.set('La caméra nécessite une connexion HTTPS reconnue par ce téléphone. Vous pouvez saisir la date manuellement.');
        return;
      }
      this.status.set('Ouverture de la caméra…');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: {
        facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 },
      } });
      if (this.destroyed) { stream.getTracks().forEach(track => track.stop()); return; }
      this.stream = stream;
      const video = this.video().nativeElement;
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.srcObject = stream;
      await video.play();
      if (this.destroyed) return;
      try {
        const track = stream.getVideoTracks()[0];
        const capabilities = track?.getCapabilities?.() as (MediaTrackCapabilities & { focusMode?: string[] }) | undefined;
        if (capabilities?.focusMode?.includes('continuous')) {
          const constraints: MediaTrackConstraints & { focusMode: string } = { focusMode: 'continuous' };
          void track.applyConstraints(constraints).catch(() => {});
        }
      } catch { /* Autofocus settings are optional. */ }
      this.status.set('Préparation du lecteur de date…');
      const { createWorker, OEM, PSM } = await import('tesseract.js');
      if (this.destroyed) return;
      const worker = await createWorker('fra+eng', OEM.LSTM_ONLY);
      if (this.destroyed) { await worker.terminate(); return; }
      this.worker = worker;
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT, preserve_interword_spaces: '1', user_defined_dpi: '300' });
      if (this.destroyed) return;
      this.ready.set(true);
      this.status.set('Placez la date imprimée dans le cadre.');
      void this.scanFrame();
    } catch (error) {
      if (this.destroyed) return;
      const name = error instanceof Error ? error.name : '';
      this.errorMessage.set(name === 'NotAllowedError'
        ? 'L’accès caméra est bloqué. Autorisez-le dans les réglages de ce site, ou saisissez la date.'
        : name === 'NotReadableError'
          ? 'La caméra est occupée. Fermez les autres applications et réessayez.'
          : 'Le lecteur de date n’a pas pu démarrer. Vérifiez la connexion, puis réessayez ou saisissez la date.');
      this.stop();
    } finally { this.starting = false; }
  }

  private async scanFrame(): Promise<void> {
    const worker = this.worker;
    if (this.destroyed || !worker || this.busy || this.detectedDate() || this.candidateDate()) return;
    const video = this.video().nativeElement;
    if (!video.videoWidth || !video.clientWidth || !video.clientHeight || video.readyState < 2) {
      this.timer = setTimeout(() => void this.scanFrame(), 300);
      return;
    }
    this.busy = true;
    this.analyzing.set(true);
    try {
      const region = dateFrameRegion(video.videoWidth, video.videoHeight, video.clientWidth, video.clientHeight, this.guide);
      const frame = await captureDateFrame(video, region, () => !this.destroyed && !this.detectedDate());
      if (!frame || this.destroyed || this.detectedDate()) return;
      // Keep successful date reads on the same fast path. Try heavier recovery only after misses.
      const binary = this.misses % 3 === 1;
      const rotateAuto = this.misses > 0 && this.misses % 3 === 0;
      const result = await worker.recognize(prepareDateImage(frame, region, binary), { rotateAuto });
      if (this.destroyed || this.detectedDate()) return;
      const dates = findExpiryDates(result.data.text);
      const date = this.consensus.observe(dates, result.data.confidence);
      this.misses = dates.length === 1 && result.data.confidence >= 45 ? 0 : this.misses + 1;
      // Only offer a date supported by repeated readings; never advance on OCR alone.
      this.candidateDate.set(date ?? '');
      this.status.set(this.candidateDate() ? 'Date lue · Vérifiez puis confirmez la date.'
        : dates.length > 1 ? 'Plusieurs dates visibles · Cadrez la date de péremption.'
          : this.consensus.candidate ? 'Date repérée · Vérification de la lecture…' : 'Recherche de la date dans le cadre…');
    } catch {
      if (!this.destroyed && !this.detectedDate()) this.status.set(this.candidateDate() ? 'Date lue · Vérifiez puis confirmez la date.' : 'Lecture en cours · Évitez les reflets sur la date.');
    } finally {
      this.busy = false;
      if (!this.destroyed) {
        this.analyzing.set(false);
        if (!this.detectedDate() && !this.candidateDate()) this.timer = setTimeout(() => void this.scanFrame(), 100);
      }
    }
  }

  retryDate(): void {
    if (this.destroyed || this.detectedDate() || this.busy) return;
    this.candidateDate.set('');
    this.consensus = new DateScanConsensus();
    this.misses = 0;
    this.status.set('Placez la date imprimée dans le cadre.');
    void this.scanFrame();
  }

  confirmDate(date: string): void {
    if (!date || this.destroyed || this.detectedDate()) return;
    this.candidateDate.set(date);
    this.detectedDate.set(date);
    this.status.set('Date détectée');
    try { this.feedback.beep(); } catch { /* Feedback cannot block confirmation. */ }
    this.stop();
    this.timer = setTimeout(() => { if (!this.destroyed) this.dateDetected.emit(date); }, 650);
  }

  private stop(): void {
    clearTimeout(this.timer);
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = undefined;
    const worker = this.worker;
    this.worker = undefined;
    void worker?.terminate().catch(() => {});
  }
  ngOnDestroy(): void { this.destroyed = true; this.stop(); }
}
