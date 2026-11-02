import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { StorageDto } from '../../../core/api/models';
import { StorageService } from '../../../core/services/storage.service';
import { InventoryStore } from '../../inventory/services/inventory-store.service';

/** A separate instance per page owns only storage editing and its dialog state. */
@Injectable()
export class StorageEditor {
  private readonly api = inject(StorageService);
  private readonly inventory = inject(InventoryStore);
  readonly selected = signal<StorageDto | null>(null);
  readonly mode = signal<'form' | 'delete' | null>(null);
  readonly busy = signal(false);
  readonly error = signal('');
  open(storage: StorageDto, mode: 'form' | 'delete' = 'form'): void {
    this.selected.set(storage);
    this.error.set('');
    this.mode.set(mode);
  }
  close(): void {
    if (!this.busy()) {
      this.mode.set(null);
      this.selected.set(null);
      this.error.set('');
    }
  }
  async save(data: Pick<StorageDto, 'name' | 'type'>): Promise<void> {
    await this.perform(async () => {
      const id = this.selected()?.id;
      if (id) await firstValueFrom(this.api.updateStorage({ ...data, id }));
      else await firstValueFrom(this.api.createStorage(data));
    });
  }
  async delete(): Promise<void> {
    const id = this.selected()?.id;
    if (id)
      await this.perform(() =>
        firstValueFrom(
          this.api.deleteStorage(id, {
            mode: 'DELETE_PRODUCTS',
            productDestinations: {},
          }),
        ),
      );
  }
  private async perform(action: () => Promise<unknown>): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await action();
      this.mode.set(null);
      this.selected.set(null);
      await this.inventory.load(true);
    } catch {
      this.error.set(
        'L’opération a échoué. Vos informations sont conservées, vous pouvez réessayer.',
      );
    } finally {
      this.busy.set(false);
    }
  }
}
