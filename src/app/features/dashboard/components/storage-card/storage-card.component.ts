import { Component, input, output, signal } from '@angular/core';

import { Storage } from '../../../../core/models/storage.model';

@Component({
  selector: 'app-storage-card',
  imports: [],
  templateUrl: './storage-card.component.html',
  styleUrl: './storage-card.component.scss',
})
export class StorageCardComponent {
  readonly storage = input.required<Storage>();

  readonly edit = output<Storage>();
  readonly delete = output<Storage>();

  readonly isMenuOpen = signal(false);

  toggleMenu(): void {
    this.isMenuOpen.update((open) => !open);
  }

  editStorage(): void {
    this.isMenuOpen.set(false);
    this.edit.emit(this.storage());
  }

  deleteStorage(): void {
    this.isMenuOpen.set(false);
    this.delete.emit(this.storage());
  }
}
