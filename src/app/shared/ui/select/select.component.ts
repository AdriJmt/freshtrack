import { Component, computed, ElementRef, HostListener, OnDestroy, input, model, signal, viewChild } from '@angular/core';
export interface SelectOption { value: string; label: string; description?: string; disabled?: boolean; }
let nextId = 0;
@Component({ selector: 'app-select', templateUrl: './select.component.html', styleUrl: './select.component.scss' })
export class SelectComponent implements OnDestroy {
  readonly options = input<SelectOption[]>([]);
  readonly value = model('');
  readonly label = input('Sélectionner');
  readonly placeholder = input('Sélectionner une option');
  readonly disabled = input(false);
  readonly controlId = input(`select-${++nextId}`);
  readonly panelId = `${this.controlId()}-options`;
  readonly opened = signal(false);
  readonly active = signal(-1);
  readonly selected = computed(() => this.options().find(option => option.value === this.value()));
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  private readonly onScroll = (event: Event) => {
    if (this.opened() && !this.panel().nativeElement.contains(event.target as Node)) this.close();
  };
  constructor() { document.addEventListener('scroll', this.onScroll, true); }
  ngOnDestroy(): void { document.removeEventListener('scroll', this.onScroll, true); }
  private search = '';
  private searchedAt = 0;

  toggle(): void { if (this.opened()) this.close(); else this.open(); }
  open(): void {
    if (this.disabled()) return;
    const trigger = this.trigger().nativeElement.getBoundingClientRect();
    const panel = this.panel().nativeElement;
    const below = window.innerHeight - trigger.bottom - 12;
    const above = trigger.top - 12;
    const up = below < 180 && above > below;
    panel.style.left = `${Math.min(trigger.left, window.innerWidth - trigger.width - 8)}px`;
    panel.style.width = `${trigger.width}px`;
    panel.style.maxHeight = `${Math.min(280, up ? above : below)}px`;
    panel.style.top = up ? 'auto' : `${trigger.bottom + 6}px`;
    panel.style.bottom = up ? `${window.innerHeight - trigger.top + 6}px` : 'auto';
    const selected = this.options().findIndex(option => option.value === this.value() && !option.disabled);
    this.active.set(selected >= 0 ? selected : this.options().findIndex(option => !option.disabled));
    panel.showPopover(); this.opened.set(true);
  }
  close(): void { this.panel().nativeElement.hidePopover(); this.opened.set(false); }
  onToggle(event: Event): void { this.opened.set((event as ToggleEvent).newState === 'open'); }
  choose(index: number): void {
    const option = this.options()[index];
    if (!option || option.disabled || this.disabled()) return;
    this.value.set(option.value); this.close(); this.trigger().nativeElement.focus();
  }
  keydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    if (event.key === 'Tab') { this.close(); return; }
    if (event.key === 'Escape') { this.close(); return; }
    if (['Enter', ' '].includes(event.key)) {
      event.preventDefault(); if (this.opened()) this.choose(this.active()); else this.open(); return;
    }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault(); if (!this.opened()) this.open();
      const enabled = this.options().map((option, index) => option.disabled ? -1 : index).filter(index => index >= 0);
      if (!enabled.length) return;
      const current = enabled.indexOf(this.active());
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? enabled.length - 1 :
        (current + (event.key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length;
      this.active.set(enabled[next]);
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
      event.preventDefault(); if (!this.opened()) this.open();
      this.search = (Date.now() - this.searchedAt < 650 ? this.search : '') + event.key.toLocaleLowerCase('fr');
      this.searchedAt = Date.now();
      const index = this.options().findIndex(option => !option.disabled && option.label.toLocaleLowerCase('fr').startsWith(this.search));
      if (index >= 0) this.active.set(index);
    }
    this.panel().nativeElement.querySelector(`#${this.panelId}-${this.active()}`)?.scrollIntoView({ block: 'nearest' });
  }
  @HostListener('window:resize') resize(): void { if (this.opened()) this.close(); }
}
