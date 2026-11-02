import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AccountDto, ChangePasswordDto } from '../api/models';
import { AuthService } from '../auth.service';
import { environment } from '../../../environments/environment';
@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly url = `${environment.apiUrl}/account`;
  get(): Promise<AccountDto> {
    return firstValueFrom(this.http.get<AccountDto>(this.url));
  }
  async update(displayName: string): Promise<AccountDto> {
    const account = await firstValueFrom(
      this.http.put<AccountDto>(
        this.url,
        { displayName },
        { withCredentials: true },
      ),
    );
    this.auth.updateProfile(account);
    return account;
  }
  changePassword(request: ChangePasswordDto): Promise<void> {
    return firstValueFrom(
      this.http.put<void>(`${this.url}/password`, request, {
        withCredentials: true,
      }),
    );
  }
}
