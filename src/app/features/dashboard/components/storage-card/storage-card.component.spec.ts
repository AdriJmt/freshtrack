import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StorageCardComponent } from './storage-card.component';

describe('StorageCardComponent', () => {
  let component: StorageCardComponent;
  let fixture: ComponentFixture<StorageCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StorageCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StorageCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
