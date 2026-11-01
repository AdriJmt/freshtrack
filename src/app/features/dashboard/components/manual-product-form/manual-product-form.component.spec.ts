import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManualProductFormComponent } from './manual-product-form.component';

describe('ManualProductFormComponent', () => {
  let component: ManualProductFormComponent;
  let fixture: ComponentFixture<ManualProductFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManualProductFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManualProductFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
