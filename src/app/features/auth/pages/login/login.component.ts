import { Component } from '@angular/core';
import { AuthBrandPanelComponent } from '../../components/auth-brand-panel/auth-brand-panel.component';
import { LoginFormComponent } from '../../components/login-form/login-form.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [AuthBrandPanelComponent, LoginFormComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {}
