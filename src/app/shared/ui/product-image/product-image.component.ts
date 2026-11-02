import { AfterViewInit, Component, ElementRef, inject, input, OnChanges, OnDestroy, signal } from '@angular/core';
import { ProductService } from '../../../core/services/product.service';
import { firstValueFrom, timeout } from 'rxjs';

const images = new Map<string, Promise<string | null>>();
@Component({ selector: 'app-product-image', templateUrl: './product-image.component.html', styleUrl: './product-image.component.scss' })
export class ProductImageComponent implements AfterViewInit, OnChanges, OnDestroy {
  readonly barcode = input<string | undefined>();
  readonly name = input('Produit');
  readonly source = input<string | undefined>();
  readonly url = signal<string | null>(null);
  readonly loading = signal(false);
  private readonly service = inject(ProductService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;
  private visible = false;
  private destroyed = false;
  private request = 0;
  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { this.visible = true; this.observer?.disconnect(); void this.load(); }
    }, { rootMargin: '120px' });
    this.observer.observe(this.host.nativeElement);
  }
  ngOnChanges(): void { this.request++; this.url.set(null); if (this.visible) void this.load(); }
  private async load(): Promise<void> {
    const request = ++this.request;
    this.loading.set(false);
    const barcode = this.barcode();
    if (this.source()) { this.url.set(this.safeImage(this.source()!)); return; }
    if (!barcode) return;
    this.loading.set(true);
    if (!images.has(barcode)) {
      images.set(barcode, firstValueFrom(this.service.lookupByBarcode(barcode).pipe(timeout(8000)))
        .then(product => product.imageUrl ?? null).catch(() => { images.delete(barcode); return null; }));
    }
    const image = await images.get(barcode)!;
    if (!this.destroyed && request === this.request) { this.url.set(image ? this.safeImage(image) : null); this.loading.set(false); }
  }
  private safeImage(url: string): string | null {
    try {
      const parsed = new URL(url);
      const fromOpenFoodFacts = parsed.hostname === 'images.openfoodfacts.org' || parsed.hostname.endsWith('.openfoodfacts.org');
      return parsed.protocol === 'https:' && fromOpenFoodFacts && !parsed.username && !parsed.password ? parsed.href : null;
    } catch { return null; }
  }
  failed(): void { this.url.set(null); }
  ngOnDestroy(): void { this.destroyed = true; this.observer?.disconnect(); }
}
