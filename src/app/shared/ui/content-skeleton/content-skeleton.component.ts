import { Component, computed, input } from '@angular/core';
@Component({ selector: 'app-content-skeleton', templateUrl: './content-skeleton.component.html', styleUrl: './content-skeleton.component.scss' })
export class ContentSkeletonComponent {
  readonly label = input('Chargement du contenu');
  readonly count = input(3);
  readonly variant = input<'cards' | 'products' | 'storages' | 'stats' | 'account'>('products');
  readonly columns = input<'auto' | 'single'>('auto');
  readonly items = computed(() => Array.from({ length: this.count() }, (_, index) => index));
}
