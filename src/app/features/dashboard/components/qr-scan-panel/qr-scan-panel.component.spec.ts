import { provideAppTesting } from '../../../../../testing/test-providers';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QrScanPanelComponent } from './qr-scan-panel.component';

describe('QrScanPanelComponent', () => {
  let component: QrScanPanelComponent;
  let fixture: ComponentFixture<QrScanPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: provideAppTesting(),
      imports: [QrScanPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QrScanPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
