import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { ProductService } from '../../../../core/services/product.service';
import { StorageService } from '../../../../core/services/storage.service';

import {
  CreateProduct,
  Product,
  UpdateProduct,
} from '../../../../core/models/product.model';
import { Storage } from '../../../../core/models/storage.model';

import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ConfirmDeleteModalComponent } from '../../components/confirm-delete-modal/confirm-delete-modal.component';
import {
  ProductAddModalComponent,
} from '../../components/product-add-modal/product-add-modal.component';
import { ManualProductSubmission } from '../../components/manual-product-form/manual-product-form.component';

type ExpiryFilter = 'all' | 'expired' | 'soon' | 'normal';
type ExpiryTypeFilter = 'all' | 'DLC' | 'DDM';

@Component({
  selector: 'app-products',
  imports: [
    ProductCardComponent,
    ConfirmDeleteModalComponent,
    ProductAddModalComponent,
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly storageService = inject(StorageService);

  readonly products = signal<Product[]>([]);
  readonly storages = signal<Storage[]>([]);

  readonly storageNames = computed(
    () => new Map(this.storages().map((storage) => [storage.id, storage.name])),
  );

  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);

  readonly errorMessage = signal<string | null>(null);

  readonly isFormModalOpen = signal(false);
  readonly isDeleteModalOpen = signal(false);

  readonly selectedProduct = signal<Product | null>(null);

  readonly searchTerm = signal('');
  readonly selectedStorageId = signal('all');
  readonly selectedExpiryType = signal<ExpiryTypeFilter>('all');
  readonly selectedExpiryFilter = signal<ExpiryFilter>('all');

  ngOnInit(): void {
    void this.loadData();
  }

  readonly filteredProducts = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const storageId = this.selectedStorageId();
    const expiryType = this.selectedExpiryType();
    const expiryFilter = this.selectedExpiryFilter();

    return this.products().filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(search);

      const matchesStorage =
        storageId === 'all' || product.storage_id === storageId;

      const matchesExpiryType =
        expiryType === 'all' || product.expiry_type === expiryType;

      const matchesExpiry =
        expiryFilter === 'all' ||
        this.getExpiryStatus(product.expiry_date) === expiryFilter;

      return (
        matchesSearch && matchesStorage && matchesExpiryType && matchesExpiry
      );
    });
  });

  async loadData(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const [products, storages] = await Promise.all([
        this.productService.getAll(),
        this.storageService.getAll(),
      ]);

      this.products.set(products);
      this.storages.set(storages);
    } catch (error) {
      console.error('Erreur lors du chargement des produits :', error);
      this.errorMessage.set('Impossible de charger les produits.');
    } finally {
      this.isLoading.set(false);
    }
  }

  openEditModal(product: Product): void {
    this.selectedProduct.set(product);
    this.errorMessage.set(null);
    this.isFormModalOpen.set(true);
  }

  closeFormModal(): void {
    if (this.isSaving()) {
      return;
    }

    this.isFormModalOpen.set(false);
    this.selectedProduct.set(null);
  }

  async saveProduct(
    data: CreateProduct & { storage_id: string },
  ): Promise<void> {
    if (this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      const selected = this.selectedProduct();

      if (selected) {
        const changes: UpdateProduct = {
          name: data.name,
          barcode: data.barcode,
          storage_id: data.storage_id,
          expiry_date: data.expiry_date,
          expiry_type: data.expiry_type,
          package_size: data.package_size,
          package_unit: data.package_unit,
        };

        const updated = await this.productService.update(selected.id, changes);

        this.products.update((current) =>
          current.map((product) =>
            product.id === updated.id ? updated : product,
          ),
        );
      } else {
        const { storage_id, ...productData } = data;

        const created = await this.productService.createMany(storage_id, [
          productData,
        ]);

        this.products.update((current) => [...current, ...created]);
      }

      this.isFormModalOpen.set(false);
      this.selectedProduct.set(null);
    } catch (error) {
      console.error('Erreur lors de l’enregistrement du produit :', error);
      this.errorMessage.set(
        'Impossible d’enregistrer ce produit. Vérifiez les informations saisies.',
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  openDeleteModal(product: Product): void {
    this.selectedProduct.set(product);
    this.errorMessage.set(null);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.isDeleteModalOpen.set(false);
    this.selectedProduct.set(null);
  }

  async confirmDelete(): Promise<void> {
    const product = this.selectedProduct();

    if (!product || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);
    this.errorMessage.set(null);

    try {
      await this.productService.delete(product.id);

      this.products.update((current) =>
        current.filter((item) => item.id !== product.id),
      );

      this.isDeleteModalOpen.set(false);
      this.selectedProduct.set(null);
    } catch (error) {
      console.error('Erreur lors de la suppression du produit :', error);
      this.errorMessage.set('Impossible de supprimer ce produit.');
    } finally {
      this.isDeleting.set(false);
    }
  }

  private getExpiryStatus(expiryDate: string): ExpiryFilter {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(`${expiryDate}T00:00:00`);

    const difference = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (difference < 0) return 'expired';
    if (difference <= 3) return 'soon';

    return 'normal';
  }

  readonly isAddModalOpen = signal(false);

  openAddModal(): void {
    this.isAddModalOpen.set(true);
  }

  closeAddModal(): void {
    this.isAddModalOpen.set(false);
  }

 
}
