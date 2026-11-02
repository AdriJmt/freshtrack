import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-delete-modal',
  imports: [ModalComponent],
  templateUrl: './confirm-delete-modal.component.html',
  styleUrl: './confirm-delete-modal.component.scss',
})
export class ConfirmDeleteModalComponent {
  readonly title = input('Supprimer ce produit ?');
  readonly description = input('Cette action est irréversible.');
  readonly itemName = input.required<string>();
  readonly deleting = input(false);
  readonly errorMessage = input<string | null>(null);

  readonly confirm = output<void>();
  readonly cancel = output<void>();
}
