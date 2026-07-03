import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiResponse, Receipt, ReceiptRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class ReceiptService {

  private readonly BASE = 'https://tenancyapi.siddev.online/api/ty/receipts';

  constructor(private http: HttpClient, private auth: AuthService) {}

  // ── GET /api/ty/receipts ─────────────────────────────────────────────
  getAll(): Observable<ApiResponse<Receipt[]>> {
    return this.http.get<ApiResponse<Receipt[]>>(this.BASE, {
      headers: this.auth.authHeaders()
    });
  }

  // ── GET /api/ty/receipts/{id} ────────────────────────────────────────
  getById(id: number): Observable<ApiResponse<Receipt>> {
    return this.http.get<ApiResponse<Receipt>>(`${this.BASE}/${id}`, {
      headers: this.auth.authHeaders()
    });
  }

  // ── POST /api/ty/receipts ────────────────────────────────────────────
  create(body: ReceiptRequest): Observable<ApiResponse<Receipt>> {
    return this.http.post<ApiResponse<Receipt>>(this.BASE, body, {
      headers: this.auth.authHeaders()
    });
  }

  // ── PUT /api/ty/receipts/{id} ────────────────────────────────────────
  update(id: number, body: ReceiptRequest): Observable<ApiResponse<Receipt>> {
    return this.http.put<ApiResponse<Receipt>>(`${this.BASE}/${id}`, body, {
      headers: this.auth.authHeaders()
    });
  }

  // ── DELETE /api/ty/receipts/{id} ─────────────────────────────────────
  delete(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.BASE}/${id}`, {
      headers: this.auth.authHeaders()
    });
  }

  // ── POST /api/ty/receipts/{id}/post ──────────────────────────────────
  post(id: number): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.BASE}/${id}/post`, {}, {
      headers: this.auth.authHeaders()
    });
  }

  // ── POST /api/ty/receipts/{id}/cancel ────────────────────────────────
  cancel(id: number): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.BASE}/${id}/cancel`, {}, {
      headers: this.auth.authHeaders()
    });
  }
}
