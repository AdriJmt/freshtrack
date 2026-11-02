import { Injectable, OnDestroy, signal } from '@angular/core';

type AudioNavigator = Navigator & { audioSession?: { type: string } };

@Injectable({ providedIn: 'root' })
export class ScanFeedbackService implements OnDestroy {
  readonly soundEnabled = signal(false);
  private context?: AudioContext;
  private media?: HTMLAudioElement;
  private sequence = 0;
  private destroyed = false;
  private readonly unlock = () => { void this.enable(); };

  constructor() {
    // Normal page interactions unlock audio; there is no sound setting or extra scan step.
    document.addEventListener('pointerdown', this.unlock, { passive: true });
    document.addEventListener('touchend', this.unlock, { passive: true });
    document.addEventListener('click', this.unlock, { passive: true });
    document.addEventListener('keydown', this.unlock);
  }

  async enable(): Promise<void> {
    if (this.destroyed) return;
    this.configureSession();
    this.prepareMedia();
    try {
      const context = this.getContext();
      // Prime synchronously within the gesture, including on WebKit.
      const silence = context.createBufferSource();
      silence.buffer = context.createBuffer(1, 1, context.sampleRate);
      silence.connect(context.destination);
      silence.onended = () => silence.disconnect();
      silence.start();
      if (context.state !== 'running') await context.resume();
      this.soundEnabled.set(context.state === 'running');
    } catch { /* HTML media playback remains available. */ }
  }

  beep(): void {
    if (this.destroyed) return;
    const sequence = ++this.sequence;
    const requestedAt = Date.now();
    this.configureSession();
    try {
      const media = this.prepareMedia();
      media.currentTime = 0;
      // A real audio element follows the iPhone media playback route, unlike an oscillator alone.
      void media.play().then(() => { if (!this.destroyed) this.soundEnabled.set(true); })
        .catch(() => this.playTone(sequence, requestedAt));
    } catch { void this.playTone(sequence, requestedAt); }
  }

  private configureSession(): void {
    try {
      const session = (navigator as AudioNavigator).audioSession;
      if (session) session.type = 'playback';
    } catch { /* The audio-session API is optional. */ }
  }

  private prepareMedia(): HTMLAudioElement {
    if (!this.media) {
      this.media = new Audio(new URL('audio/scan-beep.wav', document.baseURI).href);
      this.media.preload = 'auto';
      this.media.volume = .8;
      this.media.load();
    }
    return this.media;
  }

  private getContext(): AudioContext {
    if (!this.context || this.context.state === 'closed') this.context = new AudioContext({ latencyHint: 'interactive' });
    return this.context;
  }

  private async playTone(sequence: number, requestedAt: number): Promise<void> {
    if (this.destroyed || sequence !== this.sequence) return;
    try {
      const context = this.getContext();
      // Do not silently abandon a suspended context, as the previous implementation did.
      if (context.state !== 'running') await context.resume();
      if (this.destroyed || sequence !== this.sequence || Date.now() - requestedAt > 1000 || context.state !== 'running') return;
      const oscillator = context.createOscillator();
      const volume = context.createGain();
      const now = context.currentTime;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1800, now);
      volume.gain.setValueAtTime(0, now);
      volume.gain.linearRampToValueAtTime(.25, now + .006);
      volume.gain.setValueAtTime(.25, now + .11);
      volume.gain.linearRampToValueAtTime(0, now + .16);
      oscillator.connect(volume); volume.connect(context.destination);
      oscillator.onended = () => { oscillator.disconnect(); volume.disconnect(); };
      oscillator.start(now); oscillator.stop(now + .17);
      this.soundEnabled.set(true);
    } catch { this.soundEnabled.set(false); }
  }

  ngOnDestroy(): void {
    this.destroyed = true; this.sequence++;
    document.removeEventListener('pointerdown', this.unlock);
    document.removeEventListener('touchend', this.unlock);
    document.removeEventListener('click', this.unlock);
    document.removeEventListener('keydown', this.unlock);
    this.media?.pause();
    void this.context?.close().catch(() => {});
  }
}
