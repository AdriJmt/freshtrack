import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ExpiryDateReaderComponent } from './expiry-date-reader.component';
import { ScanFeedbackService } from '../../services/scan-feedback.service';

describe('Confirmation de la date lue', () => {
  it('garde le spinner entre deux analyses et le retire quand une date est proposée', () => {
    TestBed.configureTestingModule({ imports: [ExpiryDateReaderComponent], providers: [
      { provide: ScanFeedbackService, useValue: { beep: jasmine.createSpy('beep') } },
    ] });
    const fixture = TestBed.createComponent(ExpiryDateReaderComponent);
    const reader = fixture.componentInstance;
    spyOn(reader, 'ngAfterViewInit').and.stub();
    reader.ready.set(true); reader.analyzing.set(true); fixture.detectChanges();
    const spinner = fixture.nativeElement.querySelector('.date-scanner__spinner');
    expect(spinner).toBeTruthy();
    reader.analyzing.set(false); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.date-scanner__spinner')).toBe(spinner);
    expect(fixture.nativeElement.querySelector('.date-scanner').getAttribute('aria-busy')).toBe('true');
    reader.candidateDate.set('2027-03-12'); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.date-scanner__spinner')).toBeNull();
    expect(fixture.nativeElement.querySelector('.date-scanner').getAttribute('aria-busy')).toBe('false');
    fixture.destroy();
  });
  it('affiche et transmet exactement la date confirmée', fakeAsync(() => {
    TestBed.configureTestingModule({ imports: [ExpiryDateReaderComponent], providers: [
      { provide: ScanFeedbackService, useValue: { beep: jasmine.createSpy('beep') } },
    ] });
    const fixture = TestBed.createComponent(ExpiryDateReaderComponent);
    const reader = fixture.componentInstance;
    // Prevent camera startup: this test covers confirmation and its displayed value.
    spyOn(reader, 'ngAfterViewInit').and.stub();
    const emit = jasmine.createSpy('date'); reader.dateDetected.subscribe(emit);
    reader.candidateDate.set('2027-03-12'); fixture.detectChanges();
    expect(emit).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('12/03/2027');
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    buttons.find(button => button.textContent?.includes('Utiliser cette date'))!.click();
    fixture.detectChanges(); tick(650);
    expect(emit).toHaveBeenCalledOnceWith('2027-03-12');
    expect(reader.detectedDate()).toBe('2027-03-12');
    expect(fixture.nativeElement.textContent).toContain('12/03/2027');
    fixture.destroy();
  }));
});
