import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StorageDto } from '../../../../core/api/models';
import { StorageSummary } from '../../../inventory/types/storage-summary';
import { StorageCardComponent } from '../storage-card/storage-card.component';
@Component({
  selector: 'app-storage-widget',
  imports: [RouterLink, StorageCardComponent],
  templateUrl: './storage-widget.component.html',
  styleUrl: './storage-widget.component.scss',
})
export class StorageWidgetComponent {
  readonly storages = input.required<StorageDto[]>();
  readonly summaries = input.required<Map<string, StorageSummary>>();
  readonly addStorage = output<NonNullable<StorageDto['type']>>();
  readonly editStorage = output<StorageDto>();
  readonly deleteStorage = output<StorageDto>();
}
