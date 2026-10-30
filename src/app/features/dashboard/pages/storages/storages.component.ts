import { Component, OnInit, inject, signal } from '@angular/core';

import { StorageService } from '../../../../core/services/storage.service';
import { Storage, StorageType } from '../../../../core/models/storage.model';

import { StorageCardComponent } from '../../components/storage-card/storage-card.component';
import {
  StorageFormData,
  StorageFormModalComponent,
} from '../../components/storage-form-modal/storage-form-modal.component';
import { ConfirmDeleteModalComponent } from '../../components/confirm-delete-modal/confirm-delete-modal.component';

@Component({
  selector: 'app-storages',
  imports: [
    StorageCardComponent,
    StorageFormModalComponent,
    ConfirmDeleteModalComponent,
  ],
  templateUrl: './storages.component.html',
  styleUrl: './storages.component.scss',
})
export class StoragesComponent implements OnInit {
  private readonly storageService = inject(StorageService);

  readonly storages = signal<Storage[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly isFormModalOpen = signal(false);
  readonly isDeleteModalOpen = signal(false);

  readonly selectedStorage = signal<Storage | null>(null);
  readonly newStorageType = signal<StorageType>('fridge');

  ngOnInit(): void {
    void this.loadStorages();
  }

  async loadStorages(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      this.storages.set(await this.storageService.getAll());
    } catch (error) {
      console.error('Erreur lors du chargement des stockages :', error);
      this.errorMessage.set('Impossible de charger les stockages.');
    } finally {
      this.isLoading.set(false);
    }
  }

  openCreateModal(type: StorageType): void {
    this.selectedStorage.set(null);
    this.newStorageType.set(type);
    this.isFormModalOpen.set(true);
    this.errorMessage.set(null);
  }

  openEditModal(storage: Storage): void {
    this.selectedStorage.set(storage);
    this.isFormModalOpen.set(true);
    this.errorMessage.set(null);
  }

  closeFormModal(): void {
    if (this.isSaving()) {
      return;
    }

    this.isFormModalOpen.set(false);
    this.selectedStorage.set(null);
  }

  async saveStorage(data: StorageFormData): Promise<void> {
    if (this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      const selected = this.selectedStorage();

      if (selected?.id) {
        const updated = await this.storageService.update(selected.id, data);

        this.storages.update((current) =>
          current.map((storage) =>
            storage.id === updated.id ? updated : storage,
          ),
        );
      } else {
        const created = await this.storageService.create(data);

        this.storages.update((current) => [...current, created]);
      }

      this.isFormModalOpen.set(false);
      this.selectedStorage.set(null);
    } catch (error) {
      console.error('Erreur lors de l’enregistrement du stockage :', error);
      this.errorMessage.set(
        'Impossible d’enregistrer ce stockage. Vérifiez son nom et réessayez.',
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  openDeleteModal(storage: Storage): void {
    this.selectedStorage.set(storage);
    this.isDeleteModalOpen.set(true);
    this.errorMessage.set(null);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.isDeleteModalOpen.set(false);
    this.selectedStorage.set(null);
  }

  async confirmDelete(): Promise<void> {
    const storage = this.selectedStorage();

    if (!storage || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);
    this.errorMessage.set(null);

    try {
      await this.storageService.delete(storage.id);

      this.storages.update((current) =>
        current.filter((item) => item.id !== storage.id),
      );

      this.isDeleteModalOpen.set(false);
      this.selectedStorage.set(null);
    } catch (error) {
      console.error('Erreur lors de la suppression du stockage :', error);
      this.errorMessage.set(
        'Impossible de supprimer ce stockage. Vérifiez qu’il ne contient aucun produit.',
      );
    } finally {
      this.isDeleting.set(false);
    }
  }
}
