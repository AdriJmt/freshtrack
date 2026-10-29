import { Component } from '@angular/core';
import { AuthBrandPanelComponent } from '../../components/auth-brand-panel/auth-brand-panel.component';
import { RegisterFormComponent } from '../../components/register-form/register-form.component';

@Component({
  selector: 'app-register',
  imports: [RegisterFormComponent, AuthBrandPanelComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {}
