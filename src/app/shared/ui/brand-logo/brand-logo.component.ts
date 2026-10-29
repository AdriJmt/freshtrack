import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-brand-logo',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './brand-logo.component.html',
  styleUrl: './brand-logo.component.scss',
})
export class BrandLogoComponent {
  readonly variant = input<'default' | 'light'>('default');
}
