import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrandLogoComponent } from '../../../../shared/ui/brand-logo/brand-logo.component';

type AuthBrandVariant = 'login' | 'register';

@Component({
  selector: 'app-auth-brand-panel',
  standalone: true,
  imports: [RouterLink, BrandLogoComponent],
  templateUrl: './auth-brand-panel.component.html',
  styleUrl: './auth-brand-panel.component.scss',
})
export class AuthBrandPanelComponent {
  variant = input<AuthBrandVariant>('login');

  get content() {
    if (this.variant() === 'register') {
      return {
        title: 'Une meilleure gestion commence ici.',
        description:
          'Créez votre espace FreshTrack pour suivre vos aliments, anticiper les dates importantes et limiter le gaspillage.',
        features: [
          'Centralisez vos aliments',
          'Anticipez les dates de péremption',
          'Réduisez le gaspillage alimentaire',
        ],
      };
    }

    return {
      title: 'Vos aliments. Toujours à temps.',
      description:
        'Gardez un œil sur vos dates de péremption, retrouvez vos produits en un instant et évitez de jeter ce qui peut encore être consommé.',
      features: [
        'Un suivi simple de vos aliments',
        'Les dates importantes en un coup d’œil',
        'Moins de gaspillage au quotidien',
      ],
    };
  }
}
