import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { InventoryStore } from '../app/features/inventory/services/inventory-store.service';

@Component({ template: '' })
class EmptyTestPage {}

/** Common framework dependencies; HTTP requests stay inside the test backend. */
export function provideAppTesting() {
  return [provideHttpClient(), provideHttpClientTesting(), provideRouter([{ path: '**', component: EmptyTestPage }]), InventoryStore];
}
