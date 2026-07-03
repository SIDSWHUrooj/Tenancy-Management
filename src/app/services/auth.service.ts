import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import {
  ApiResponse,
  LoginRequest,
  LoginResponse
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly BASE_URL = 'https://tenancyapi.siddev.online';

  private readonly TOKEN_KEY = 'ty_access_token';
  private readonly REFRESH_KEY = 'ty_refresh_token';

  constructor(private http: HttpClient) { }

  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponse>> {

    return this.http.post<ApiResponse<LoginResponse>>(
      `${this.BASE_URL}/api/auth/login`,
      credentials
    ).pipe(

      tap(response => {

        if (response.success) {

          localStorage.setItem(
            this.TOKEN_KEY,
            response.data.accessToken
          );

          localStorage.setItem(
            this.REFRESH_KEY,
            response.data.refreshToken
          );

        }

      })

    );

  }

  refreshToken(): Observable<ApiResponse<LoginResponse>> {

    return this.http.post<ApiResponse<LoginResponse>>(
      `${this.BASE_URL}/api/auth/refresh-token`,
      {
        refreshToken: this.getRefreshToken()
      }
    ).pipe(

      tap(response => {

        if (response.success) {

          localStorage.setItem(
            this.TOKEN_KEY,
            response.data.accessToken
          );

          localStorage.setItem(
            this.REFRESH_KEY,
            response.data.refreshToken
          );

        }

      })

    );

  }

  logout(): Observable<any> {

    return this.http.post(
      `${this.BASE_URL}/api/auth/logout`,
      {},
      {
        headers: this.authHeaders()
      }
    ).pipe(

      tap(() => {

        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_KEY);

      })

    );

  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  authHeaders(): HttpHeaders {

    return new HttpHeaders({

      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.getToken()}`

    });

  }

}