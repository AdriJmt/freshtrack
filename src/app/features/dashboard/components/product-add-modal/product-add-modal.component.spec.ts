import { provideAppTesting } from '../../../../../testing/test-providers';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductAddModalComponent } from './product-add-modal.component';

describe('ProductAddModalComponent', () => {
  let component: ProductAddModalComponent;
  let fixture: ComponentFixture<ProductAddModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: provideAppTesting(),
      imports: [ProductAddModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductAddModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('storages', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
