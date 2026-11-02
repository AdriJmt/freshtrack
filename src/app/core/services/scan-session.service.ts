import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ProductDto, StorageDto } from '../api/models';

export interface ScanSession { id: string; token: string; expiresAt: string; }
export interface ScanSessionStatus { expiresAt: string; connected: boolean; addedProducts: number; }

@Injectable({ providedIn: 'root' })
export class ScanSessionService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/scan-sessions`;

  create() { return this.http.post<ScanSession>(this.url, {}, { withCredentials: true }); }
  status(id: string) { return this.http.get<ScanSessionStatus>(`${this.url}/${id}`, { withCredentials: true }); }
  revoke(id: string) { return this.http.delete<void>(`${this.url}/${id}`, { withCredentials: true }); }
  storages(token: string) {
    return this.http.get<StorageDto[]>(`${this.url}/mobile/storages`, { headers: { 'X-Scan-Token': token } });
  }
  mobileStatus(token: string) {
    return this.http.get<ScanSessionStatus>(`${this.url}/mobile/status`, { headers: { 'X-Scan-Token': token } });
  }
  add(token: string, storageId: string, product: ProductDto) {
    return this.http.post<void>(`${this.url}/mobile/storages/${encodeURIComponent(storageId)}/products`, product,
      { headers: { 'X-Scan-Token': token } });
  }
}
