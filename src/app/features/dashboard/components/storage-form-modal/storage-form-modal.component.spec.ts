import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StorageFormModalComponent } from './storage-form-modal.component';

describe('StorageFormModalComponent', () => {
  let component: StorageFormModalComponent;
  let fixture: ComponentFixture<StorageFormModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StorageFormModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StorageFormModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
