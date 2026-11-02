import { Component, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../../../core/auth.service';
import { InventoryStore } from '../../../inventory/services/inventory-store.service';
import { StorageEditor } from '../../services/storage-editor.service';
import { ContentSkeletonComponent } from '../../../../shared/ui/content-skeleton/content-skeleton.component';
import { ProductAddModalComponent } from '../../components/product-add-modal/product-add-modal.component';
import { DashboardStatsComponent } from '../../components/dashboard-stats/dashboard-stats.component';
import { ExpiringWidgetComponent } from '../../components/expiring-widget/expiring-widget.component';
import { StorageWidgetComponent } from '../../components/storage-widget/storage-widget.component';
import { StorageFormModalComponent } from '../../components/storage-form-modal/storage-form-modal.component';
import { ConfirmDeleteModalComponent } from '../../components/confirm-delete-modal/confirm-delete-modal.component';
@Component({
  selector: 'app-dashboard',
  providers: [StorageEditor],
  imports: [
    ContentSkeletonComponent,
    ProductAddModalComponent,
    DashboardStatsComponent,
    ExpiringWidgetComponent,
    StorageWidgetComponent,
    StorageFormModalComponent,
    ConfirmDeleteModalComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  readonly inventory = inject(InventoryStore);
  readonly editor = inject(StorageEditor);
  readonly user = inject(AuthService).currentUser;
  readonly adding = signal(false);
  ngOnInit(): void {
    void this.inventory.load();
  }
}
