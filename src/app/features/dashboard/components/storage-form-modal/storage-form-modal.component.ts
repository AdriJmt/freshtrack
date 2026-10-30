import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Storage, StorageType } from '../../../../core/models/storage.model';

export interface StorageFormData {
  name: string;
  type: StorageType;
}

@Component({
  selector: 'app-storage-form-modal',
  imports: [FormsModule],
  templateUrl: './storage-form-modal.component.html',
  styleUrl: './storage-form-modal.component.scss',
})
export class StorageFormModalComponent {
  readonly storage = input<Storage | null>(null);
  readonly saving = input(false);
  readonly errorMessage = input<string | null>(null);

  readonly save = output<StorageFormData>();
  readonly cancel = output<void>();

  readonly name = signal('');
  readonly initialType = input<StorageType>('fridge');
  readonly type = signal<StorageType>('fridge');

  constructor() {}

  ngOnInit(): void {
    this.type.set(this.initialType());

    const storage = this.storage();

    if (storage) {
      this.name.set(storage.name);
      this.type.set(storage.type);
    }
  }

  submit(): void {
    const name = this.name().trim();

    if (!name || this.saving()) {
      return;
    }

    this.save.emit({
      name,
      type: this.type(),
    });
  }
}
