import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectComponent } from './select.component';

describe('Sélecteur personnalisé', () => {
  let fixture: ComponentFixture<SelectComponent>;
  let component: SelectComponent;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SelectComponent] }).compileComponents();
    fixture = TestBed.createComponent(SelectComponent); component = fixture.componentInstance;
    fixture.componentRef.setInput('label', 'Lieu de stockage');
    fixture.componentRef.setInput('options', [{ value: 'fridge', label: 'Frigo', description: 'Au frais' }, { value: 'disabled', label: 'Indisponible', disabled: true }, { value: 'cupboard', label: 'Placard' }]);
    fixture.componentRef.setInput('value', 'fridge'); fixture.detectChanges();
  });
  afterEach(() => fixture.destroy());
  it('affiche les options personnalisées et leur description', () => {
    component.open(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="listbox"]:popover-open')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Au frais');
    expect(fixture.nativeElement.querySelector('select')).toBeNull();
  });
  it('ignore une option désactivée au clavier et valide par Entrée', () => {
    const changed = jasmine.createSpy('value'); component.value.subscribe(changed);
    component.open();
    component.keydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    component.keydown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(component.value()).toBe('cupboard'); expect(changed).toHaveBeenCalledWith('cupboard');
    expect(component.opened()).toBeFalse();
  });
  it('ferme par Échap sans modifier la sélection', () => {
    component.open(); component.keydown(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(component.value()).toBe('fridge'); expect(component.opened()).toBeFalse();
  });
  it('ne peut pas ouvrir un contrôle désactivé', () => {
    fixture.componentRef.setInput('disabled', true); fixture.detectChanges(); component.open();
    expect(component.opened()).toBeFalse();
  });
});
