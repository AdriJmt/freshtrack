import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { StorageDto, StorageDeletionDto } from '../api/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly apiUrl = `${environment.apiUrl}/storages`;

  constructor(private readonly http: HttpClient) {}

  getAllStorages(): Observable<StorageDto[]> {
    return this.http.get<StorageDto[]>(this.apiUrl, {
      withCredentials: true,
    });
  }

  createStorage(storage: StorageDto): Observable<StorageDto> {
    return this.http.post<StorageDto>(this.apiUrl, storage, {
      withCredentials: true,
    });
  }

  updateStorage(storage: StorageDto): Observable<void> {
    return this.http.put<void>(this.apiUrl, storage, {
      withCredentials: true,
    });
  }

  deleteStorage(
    storageId: string,
    deletion: StorageDeletionDto,
  ): Observable<void> {
    return this.http.request<void>('DELETE', `${this.apiUrl}/${storageId}`, {
      body: deletion,
      withCredentials: true,
    });
  }
}
