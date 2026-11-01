import {
  Component,
  ElementRef,
  EventEmitter,
  Output,
  QueryList,
  ViewChildren,
} from '@angular/core';

@Component({
  selector: 'app-otp-input',
  standalone: true,
  templateUrl: './otp-input.component.html',
  styleUrl: './otp-input.component.scss',
})
export class OtpInputComponent {
  @Output() codeChange = new EventEmitter<string>();

  @ViewChildren('otpInput')
  private otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  readonly length = 6;
  digits: string[] = Array(this.length).fill('');

  onInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');

    if (value.length > 1) {
      this.setCode(value);
      return;
    }

    this.digits[index] = value.slice(-1);
    input.value = this.digits[index];

    this.emitCode();

    if (value && index < this.length - 1) {
      this.focusInput(index + 1);
    }
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.digits[index] && index > 0) {
      this.focusInput(index - 1);
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusInput(index - 1);
    }

    if (event.key === 'ArrowRight' && index < this.length - 1) {
      event.preventDefault();
      this.focusInput(index + 1);
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();

    const pastedCode = event.clipboardData?.getData('text').replace(/\D/g, '');

    if (pastedCode) {
      this.setCode(pastedCode);
    }
  }

  private setCode(value: string): void {
    const code = value.slice(0, this.length);

    this.digits = Array.from(
      { length: this.length },
      (_, index) => code[index] ?? '',
    );

    this.emitCode();

    const nextIndex = Math.min(code.length, this.length - 1);
    this.focusInput(nextIndex);
  }

  private emitCode(): void {
    this.codeChange.emit(this.digits.join(''));
  }

  private focusInput(index: number): void {
    this.otpInputs.get(index)?.nativeElement.focus();
  }

  reset(): void {
    this.digits = new Array(this.length).fill('');
    this.emitCode();
    this.focusInput(0);
  }
}
