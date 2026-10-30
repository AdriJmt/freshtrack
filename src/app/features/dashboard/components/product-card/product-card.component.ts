import { Component, input, output, signal } from '@angular/core';

import { Product } from '../../../../core/models/product.model';

@Component({
  selector: 'app-product-card',
  imports: [],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  readonly product = input.required<Product>();
  readonly storageName = input.required<string>();

  readonly edit = output<Product>();
  readonly delete = output<Product>();

  readonly isMenuOpen = signal(false);

  get expiryStatus(): 'expired' | 'soon' | 'normal' {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiryDate = new Date(`${this.product().expiry_date}T00:00:00`);
    const difference = Math.ceil(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (difference < 0) {
      return 'expired';
    }

    if (difference <= 3) {
      return 'soon';
    }

    return 'normal';
  }

  get expiryLabel(): string {
    const date = new Date(`${this.product().expiry_date}T00:00:00`);

    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  toggleMenu(): void {
    this.isMenuOpen.update((open) => !open);
  }

  editProduct(): void {
    this.isMenuOpen.set(false);
    this.edit.emit(this.product());
  }

  deleteProduct(): void {
    this.isMenuOpen.set(false);
    this.delete.emit(this.product());
  }
}
