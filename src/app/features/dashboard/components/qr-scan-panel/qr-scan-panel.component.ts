import { afterNextRender, Component, ElementRef, inject, OnDestroy, output, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { BrowserQRCodeSvgWriter } from '@zxing/browser';
import { firstValueFrom } from 'rxjs';
import { ScanSession, ScanSessionService } from '../../../../core/services/scan-session.service';

@Component({
  selector: 'app-qr-scan-panel',
  imports: [DatePipe],
  templateUrl: './qr-scan-panel.component.html',
  styleUrl: './qr-scan-panel.component.scss',
})
export class QrScanPanelComponent implements OnDestroy {
  private readonly service = inject(ScanSessionService);
  private readonly qr = viewChild.required<ElementRef<HTMLElement>>('qr');
  private session?: ScanSession;
  private poll?: ReturnType<typeof setTimeout>;
  private destroyed = false;
  readonly productsAdded = output<void>();
  readonly scanUrl = signal('');
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly connected = signal(false);
  readonly addedCount = signal(0);
  readonly expiresAt = signal('');

  constructor() { afterNextRender(() => void this.generate()); }

  async generate(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    this.errorMessage.set('');
    this.stop();
    this.scanUrl.set('');
    this.qr().nativeElement.replaceChildren();
    try {
      const session = await firstValueFrom(this.service.create());
      if (this.destroyed) { this.revoke(session.id); return; }
      this.session = session;
      const url = new URL('scan', document.baseURI);
      url.hash = new URLSearchParams({ token: session.token }).toString();
      this.scanUrl.set(url.href);
      this.expiresAt.set(session.expiresAt);
      this.connected.set(false);
      this.addedCount.set(0);
      const svg = new BrowserQRCodeSvgWriter().write(url.href, 0, 0);
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('width', '176');
      svg.setAttribute('height', '176');
      svg.setAttribute('shape-rendering', 'crispEdges');
      svg.style.display = 'block';
      this.qr().nativeElement.replaceChildren(svg);
      this.poll = setTimeout(() => void this.checkStatus(), 2000);
    } catch {
      this.stop();
      this.errorMessage.set('Impossible de créer la session de scan. Réessayez.');
    } finally { this.loading.set(false); }
  }

  private async checkStatus(): Promise<void> {
    const session = this.session;
    if (!session || this.destroyed) return;
    try {
      const status = await firstValueFrom(this.service.status(session.id));
      if (this.destroyed || this.session !== session) return;
      this.connected.set(status.connected);
      if (status.addedProducts > this.addedCount()) this.productsAdded.emit();
      this.addedCount.set(status.addedProducts);
      this.errorMessage.set('');
    } catch (error) {
      if (this.destroyed || this.session !== session) return;
      if (error instanceof HttpErrorResponse && [404, 410].includes(error.status)) {
        this.scanUrl.set('');
        this.qr().nativeElement.replaceChildren();
        this.errorMessage.set('Cette session a expiré. Générez un nouveau QR code.');
        this.stop();
        return;
      }
      this.errorMessage.set('Connexion au serveur interrompue. Nouvelle tentative en cours…');
    }
    if (!this.destroyed && this.session === session) this.poll = setTimeout(() => void this.checkStatus(), 2000);
  }

  private revoke(id: string): void { this.service.revoke(id).subscribe({ error: () => {} }); }
  private stop(): void {
    clearTimeout(this.poll);
    if (this.session) this.revoke(this.session.id);
    this.session = undefined;
  }
  ngOnDestroy(): void { this.destroyed = true; this.stop(); }
}
