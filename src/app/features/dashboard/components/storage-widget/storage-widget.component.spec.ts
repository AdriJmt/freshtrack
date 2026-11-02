import { provideAppTesting } from '../../../../../testing/test-providers';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StorageWidgetComponent } from './storage-widget.component';

describe('StorageWidgetComponent', () => {
  let component: StorageWidgetComponent;
  let fixture: ComponentFixture<StorageWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: provideAppTesting(),
      imports: [StorageWidgetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StorageWidgetComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('storages', []);
    fixture.componentRef.setInput('summaries', new Map());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
