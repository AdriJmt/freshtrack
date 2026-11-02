import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StorageDto } from '../../../../core/api/models';
import { StorageSummary } from '../../../inventory/types/storage-summary';
@Component({
  selector: 'app-storage-card',
  imports: [RouterLink],
  templateUrl: './storage-card.component.html',
  styleUrl: './storage-card.component.scss',
})
export class StorageCardComponent {
  readonly storage = input.required<StorageDto>();
  readonly summary = input<StorageSummary>();
  readonly edit = output<StorageDto>();
  readonly delete = output<StorageDto>();
}
