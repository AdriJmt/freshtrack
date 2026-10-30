import { Component } from '@angular/core';
import { DashboardStatsComponent } from '../../components/dashboard-stats/dashboard-stats.component';
import { StorageWidgetComponent } from '../../components/storage-widget/storage-widget.component';
import { ExpiringWidgetComponent } from '../../components/expiring-widget/expiring-widget.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    DashboardStatsComponent,
    StorageWidgetComponent,
    ExpiringWidgetComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  constructor() {}
}
