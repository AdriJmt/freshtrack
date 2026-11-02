import {
  AfterViewInit,
  Component,
  ElementRef,
  input,
  OnDestroy,
  output,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent implements AfterViewInit, OnDestroy {
  readonly title = input.required<string>();
  readonly description = input('');
  readonly wide = input(false);
  readonly busy = input(false);
  readonly closed = output<void>();
  private readonly dialog =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private previousOverflow = '';
  private previousFocus: HTMLElement | null = null;

  ngAfterViewInit(): void {
    this.previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    this.previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Native modal dialogs handle focus trapping, Escape and the inert background.
    this.dialog().nativeElement.showModal();
  }
  close(event?: Event): void {
    event?.preventDefault();
    if (!this.busy()) this.closed.emit();
  }
  backdrop(event: MouseEvent): void {
    if (event.target !== this.dialog().nativeElement) return;
    const bounds = this.dialog().nativeElement.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      this.close();
  }
  ngOnDestroy(): void {
    this.dialog().nativeElement.close();
    document.body.style.overflow = this.previousOverflow;
    if (this.previousFocus?.isConnected)
      this.previousFocus.focus({ preventScroll: true });
  }
}
