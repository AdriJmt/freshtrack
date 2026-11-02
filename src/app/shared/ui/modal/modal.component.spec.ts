import { TestBed } from '@angular/core/testing';
import { ModalComponent } from './modal.component';
describe('Modale générique', () => {
  it('ouvre un vrai dialogue modal, bloque la fermeture occupée et restaure le défilement', () => {
    TestBed.configureTestingModule({ imports: [ModalComponent] });
    const trigger = document.createElement('button'); document.body.append(trigger); trigger.focus();
    const previous = document.body.style.overflow;
    const fixture = TestBed.createComponent(ModalComponent); fixture.componentRef.setInput('title', 'Modifier le produit'); fixture.detectChanges();
    const closed = jasmine.createSpy('closed'); fixture.componentInstance.closed.subscribe(closed);
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    expect(dialog.open).toBeTrue(); expect(dialog.matches(':modal')).toBeTrue();
    fixture.componentRef.setInput('busy', true); fixture.detectChanges();
    const cancel = new Event('cancel', { cancelable: true }); dialog.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBeTrue(); expect(closed).not.toHaveBeenCalled();
    fixture.componentRef.setInput('busy', false); fixture.detectChanges(); dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(closed).toHaveBeenCalledTimes(1);
    fixture.destroy(); expect(document.body.style.overflow).toBe(previous);
    expect(document.activeElement).toBe(trigger); trigger.remove();
  });
});
