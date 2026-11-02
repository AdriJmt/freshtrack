import { provideAppTesting } from '../../../../../testing/test-providers';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpiringWidgetComponent } from './expiring-widget.component';

describe('ExpiringWidgetComponent', () => {
  let component: ExpiringWidgetComponent;
  let fixture: ComponentFixture<ExpiringWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: provideAppTesting(),
      imports: [ExpiringWidgetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpiringWidgetComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('products', []);
    fixture.componentRef.setInput('storageNames', new Map());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
