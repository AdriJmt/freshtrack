import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ProductDto, ProductLookupDto } from '../api/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly apiUrl = `${environment.apiUrl}/storages`;
  private readonly productLookupUrl = `${environment.apiUrl}/products/lookup`;

  constructor(private readonly http: HttpClient) {}

  getProductsFromStorage(storageId: string): Observable<ProductDto[]> {
    return this.http.get<ProductDto[]>(`${this.apiUrl}/${storageId}/products`, {
      withCredentials: true,
    });
  }

  createProducts(storageId: string, products: ProductDto[]): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/${storageId}/products`,
      products,
      { withCredentials: true },
    );
  }

  updateProduct(
    storageId: string,
    productId: string,
    product: ProductDto,
  ): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/${storageId}/products/${productId}`,
      product,
      { withCredentials: true },
    );
  }

  deleteProduct(storageId: string, productId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${storageId}/products/${productId}`,
      { withCredentials: true },
    );
  }

  consumeProduct(storageId: string, productId: string, quantity: number): Observable<ProductDto> {
    return this.http.post<ProductDto>(`${this.apiUrl}/${storageId}/products/${productId}/consume`, { quantity }, { withCredentials: true });
  }

  lookupByBarcode(barcode: string): Observable<ProductLookupDto> {
    return this.http.get<ProductLookupDto>(
      `${this.productLookupUrl}/${encodeURIComponent(barcode)}`,
      { withCredentials: true },
    );
  }
}
