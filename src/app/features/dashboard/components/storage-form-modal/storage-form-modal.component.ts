import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { Component, input, output, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { StorageDto } from '../../../../core/api/models';

export interface StorageFormData {
  name: string;
  type: NonNullable<StorageDto['type']>;
}

@Component({
  selector: 'app-storage-form-modal',
  imports: [ModalComponent, FormsModule],
  templateUrl: './storage-form-modal.component.html',
  styleUrl: './storage-form-modal.component.scss',
})
export class StorageFormModalComponent {
  readonly storage = input<StorageDto | null>(null);
  readonly saving = input(false);
  readonly errorMessage = input<string | null>(null);
  readonly initialType = input<NonNullable<StorageDto['type']>>('FRIDGE');

  readonly save = output<StorageFormData>();
  readonly cancel = output<void>();

  readonly name = signal('');
  readonly type = signal<NonNullable<StorageDto['type']>>('FRIDGE');

  constructor() {
    effect(() => {
      const storage = this.storage();

      this.name.set(storage?.name ?? '');
      this.type.set(storage?.type ?? this.initialType());
    });
  }

  submit(): void {
    const name = this.name().trim();

    if (!name || this.saving()) return;

    this.save.emit({
      name,
      type: this.type(),
    });
  }
}
