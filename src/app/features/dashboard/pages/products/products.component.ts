import { ConsumeProductModalComponent } from '../../../inventory/components/consume-product-modal/consume-product-modal.component';
import { remainingQuantity } from '../../../inventory/utils/product-quantity';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { ProductDto } from '../../../../core/api/models';
import { ProductService } from '../../../../core/services/product.service';
import { InventoryStore } from '../../../inventory/services/inventory-store.service';
import { expiryInfo } from '../../../inventory/utils/product-expiry';
import { SelectComponent } from '../../../../shared/ui/select/select.component';
import {
  storageSelectOptions,
  EXPIRY_FILTER_OPTIONS,
} from '../../../../shared/ui/select/select-options';
import { ContentSkeletonComponent } from '../../../../shared/ui/content-skeleton/content-skeleton.component';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductFormModalComponent } from '../../components/product-form-modal/product-form-modal.component';
import { ConfirmDeleteModalComponent } from '../../components/confirm-delete-modal/confirm-delete-modal.component';
import { ProductAddModalComponent } from '../../components/product-add-modal/product-add-modal.component';
import { ManualProductSubmission } from '../../../inventory/types/product-form';

@Component({
  selector: 'app-products',
  imports: [
    RouterLink,
    ConsumeProductModalComponent,
    SelectComponent,
    ContentSkeletonComponent,
    ProductCardComponent,
    ProductFormModalComponent,
    ConfirmDeleteModalComponent,
    ProductAddModalComponent,
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent implements OnInit {
  readonly inventory = inject(InventoryStore);
  private readonly api = inject(ProductService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly search = signal('');
  readonly storageId = signal('all');
  readonly expiry = signal('all');
  readonly adding = signal(false);
  readonly selected = signal<ProductDto | null>(null);
  readonly mode = signal<'edit' | 'delete' | 'consume' | null>(null);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly storageOptions = computed(() =>
    storageSelectOptions(this.inventory.storages(), true),
  );
  readonly expiryOptions = EXPIRY_FILTER_OPTIONS;
  readonly selectedStorage = computed(() =>
    this.inventory
      .storages()
      .find((storage) => storage.id === this.storageId()),
  );
  readonly filtered = computed(() => {
    const search = this.search().trim().toLocaleLowerCase('fr');
    return this.inventory
      .products()
      .filter(
        (product) =>
          (!search ||
            `${product.name ?? ''} ${product.barcode ?? ''}`
              .toLocaleLowerCase('fr')
              .includes(search)) &&
          (this.storageId() === 'all' ||
            product.storageId === this.storageId()) &&
          (this.expiry() === 'consumed' ? (product.consumedQuantity ?? 0) > 0 : remainingQuantity(product) > 0 && (this.expiry() === 'all' || expiryInfo(product.expiryDate).status === this.expiry())),
      )
      .sort((a, b) =>
        (a.expiryDate ?? '9999').localeCompare(b.expiryDate ?? '9999'),
      );
  });
  readonly quantity = computed(() =>
    this.filtered().reduce((sum, product) => sum + (this.expiry() === 'consumed' ? product.consumedQuantity ?? 0 : remainingQuantity(product)), 0),
  );

  ngOnInit(): void {
    // URL filters make statistics and storage cards directly navigable and shareable.
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.storageId.set(params.get('stockage') || 'all');
        const expiry = params.get('etat') ?? 'all';
        this.expiry.set(
          ['soon', 'expired', 'normal', 'consumed'].includes(expiry) ? expiry : 'all',
        );
        this.search.set(params.get('recherche') ?? '');
      });
    void this.inventory.load();
  }
  filter(key: 'stockage' | 'etat', value: string): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [key]: value === 'all' ? null : value },
      queryParamsHandling: 'merge',
    });
  }
  reset(): void {
    this.search.set('');
    void this.router.navigate(['/produits']);
  }
  open(product: ProductDto, mode: 'edit' | 'delete' | 'consume'): void {
    this.selected.set(product);
    this.mode.set(mode);
    this.error.set('');
  }
  close(): void {
    if (!this.busy()) {
      this.mode.set(null);
      this.selected.set(null);
      this.error.set('');
    }
  }
  async save(data: ManualProductSubmission): Promise<void> {
    const product = this.selected(),
      values = data.products[0];
    if (!product?.id || !product.storageId || !values) return;
    const updated = { ...product, ...values, quantity: (values.quantity ?? 1) + (product.consumedQuantity ?? 0) };
    await this.perform(async () => {
      await firstValueFrom(
        this.api.updateProduct(product.storageId!, product.id!, updated),
      );
      this.inventory.products.update((products) =>
        products.map((item) => (item.id === product.id ? updated : item)),
      );
    });
  }
  async consume(quantity: number): Promise<void> {
    const product = this.selected();
    if (!product?.id || !product.storageId) return;
    await this.perform(async () => {
      const updated = await firstValueFrom(this.api.consumeProduct(product.storageId!, product.id!, quantity));
      this.inventory.products.update(products => products.map(item => item.id === product.id ? updated : item));
    });
  }
  async delete(): Promise<void> {
    const product = this.selected();
    if (!product?.id || !product.storageId) return;
    await this.perform(async () => {
      await firstValueFrom(
        this.api.deleteProduct(product.storageId!, product.id!),
      );
      this.inventory.products.update((products) =>
        products.filter((item) => item.id !== product.id),
      );
    });
  }
  private async perform(action: () => Promise<void>): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await action();
      this.mode.set(null);
      this.selected.set(null);
    } catch {
      this.error.set(
        'L’enregistrement a échoué. Vos informations sont conservées, réessayez.',
      );
    } finally {
      this.busy.set(false);
    }
  }
}
