import { remainingQuantity } from '../utils/product-quantity';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ProductDto, StorageDto } from '../../../core/api/models';
import { ProductService } from '../../../core/services/product.service';
import { StorageService } from '../../../core/services/storage.service';
import { StorageSummary } from '../types/storage-summary';
import { expiryInfo } from '../utils/product-expiry';

/** One inventory snapshot feeds pages, counts and storage previews. */
@Injectable()
export class InventoryStore {
  private readonly storageApi = inject(StorageService);
  private readonly productApi = inject(ProductService);
  readonly storages = signal<StorageDto[]>([]);
  readonly products = signal<ProductDto[]>([]);
  readonly activeProducts = computed(() => this.products().filter(product => remainingQuantity(product) > 0));
  readonly loading = signal(false);
  readonly error = signal('');
  private pending?: Promise<void>;
  private loadedAt = 0;

  readonly storageNames = computed(
    () =>
      new Map(
        this.storages().map((storage) => [
          storage.id,
          storage.name ?? 'Sans nom',
        ]),
      ),
  );
  readonly summaries = computed(() => {
    const result = new Map<string, StorageSummary>();
    for (const storage of this.storages()) {
      const products = this.products().filter(
        (product) => product.storageId === storage.id && remainingQuantity(product) > 0,
      );
      result.set(storage.id!, {
        references: products.length,
        quantity: products.reduce(
          (sum, product) => sum + remainingQuantity(product),
          0,
        ),
        urgent: products.filter((product) =>
          ['expired', 'soon'].includes(expiryInfo(product.expiryDate).status),
        ).length,
        preview: products.slice(0, 3),
      });
    }
    return result;
  });

  load(force = false): Promise<void> {
    if (!force && !this.error() && Date.now() - this.loadedAt < 30000)
      return Promise.resolve();
    return (this.pending ??= this.fetch().finally(
      () => (this.pending = undefined),
    ));
  }

  private async fetch(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const storages = await firstValueFrom(this.storageApi.getAllStorages());
      const lists = await Promise.all(
        storages
          .filter((storage) => storage.id)
          .map((storage) =>
            firstValueFrom(this.productApi.getProductsFromStorage(storage.id!)),
          ),
      );
      // Publish together so statistics never describe a partially loaded inventory.
      this.storages.set(storages);
      this.products.set(lists.flat());
      this.loadedAt = Date.now();
    } catch {
      this.error.set(
        'Impossible de charger votre inventaire. Vérifiez votre connexion puis réessayez.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
