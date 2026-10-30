import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-delete-modal',
  imports: [],
  templateUrl: './confirm-delete-modal.component.html',
  styleUrl: './confirm-delete-modal.component.scss',
})
export class ConfirmDeleteModalComponent {
  readonly itemName = input.required<string>();
  readonly deleting = input(false);
  readonly errorMessage = input<string | null>(null);

  readonly confirm = output<void>();
  readonly cancel = output<void>();
}
