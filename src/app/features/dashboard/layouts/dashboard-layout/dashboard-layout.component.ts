import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DashboardNavbarComponent } from '../../components/dashboard-navbar/dashboard-navbar.component';

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, DashboardNavbarComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.scss',
})
export class DashboardLayoutComponent {}
