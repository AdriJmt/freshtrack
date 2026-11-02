import { Component, input, output } from '@angular/core';
import { ScanSessionState } from '../../types/scan-session-state.type';

@Component({
  selector: 'app-scan-session-state',
  templateUrl: './scan-session-state.component.html',
  styleUrl: './scan-session-state.component.scss',
})
export class ScanSessionStateComponent {
  readonly kind = input<ScanSessionState>('finished');
  readonly description = input('');
  readonly retry = output<void>();
}
