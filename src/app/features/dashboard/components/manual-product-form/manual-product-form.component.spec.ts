import { provideAppTesting } from '../../../../../testing/test-providers';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManualProductFormComponent } from './manual-product-form.component';

describe('ManualProductFormComponent', () => {
  let component: ManualProductFormComponent;
  let fixture: ComponentFixture<ManualProductFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: provideAppTesting(),
      imports: [ManualProductFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManualProductFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('storages', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
