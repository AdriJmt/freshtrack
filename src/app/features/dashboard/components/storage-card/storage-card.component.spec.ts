import { provideAppTesting } from '../../../../../testing/test-providers';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StorageCardComponent } from './storage-card.component';

describe('StorageCardComponent', () => {
  let component: StorageCardComponent;
  let fixture: ComponentFixture<StorageCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: provideAppTesting(),
      imports: [StorageCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StorageCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('storage', { id: 'fridge', name: 'Cuisine', type: 'FRIDGE' });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
