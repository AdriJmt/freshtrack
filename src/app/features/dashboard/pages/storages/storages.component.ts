import { Component, inject, OnInit } from '@angular/core';
import { InventoryStore } from '../../../inventory/services/inventory-store.service';
import { StorageEditor } from '../../services/storage-editor.service';
import { ContentSkeletonComponent } from '../../../../shared/ui/content-skeleton/content-skeleton.component';
import { StorageCardComponent } from '../../components/storage-card/storage-card.component';
import { StorageFormModalComponent } from '../../components/storage-form-modal/storage-form-modal.component';
import { ConfirmDeleteModalComponent } from '../../components/confirm-delete-modal/confirm-delete-modal.component';
@Component({
  selector: 'app-storages',
  providers: [StorageEditor],
  imports: [
    ContentSkeletonComponent,
    StorageCardComponent,
    StorageFormModalComponent,
    ConfirmDeleteModalComponent,
  ],
  templateUrl: './storages.component.html',
  styleUrl: './storages.component.scss',
})
export class StoragesComponent implements OnInit {
  readonly inventory = inject(InventoryStore);
  readonly editor = inject(StorageEditor);
  ngOnInit(): void {
    void this.inventory.load();
  }
}
