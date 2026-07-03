import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiResponse, Invoice, InvoiceRequest } from '../models/index';

@Injectable({ providedIn: 'root' })
export class InvoiceService {

  private readonly BASE = 'https://tenancyapi.siddev.online/api/ty/invoices';

  constructor(private http: HttpClient, private auth: AuthService) {}

  // GET /api/ty/invoices
  getAll(): Observable<ApiResponse<Invoice[]>> {
    return this.http.get<ApiResponse<Invoice[]>>(this.BASE, {
      headers: this.auth.authHeaders()
    });
  }

  // GET /api/ty/invoices/{id}
  getById(id: number): Observable<ApiResponse<Invoice>> {
    return this.http.get<ApiResponse<Invoice>>(`${this.BASE}/${id}`, {
      headers: this.auth.authHeaders()
    });
  }

  // POST /api/ty/invoices
  // NOTE: API requires Details[*].amount > 0.01
  create(body: InvoiceRequest): Observable<ApiResponse<Invoice>> {
    return this.http.post<ApiResponse<Invoice>>(this.BASE, body, {
      headers: this.auth.authHeaders()
    });
  }

  // PUT /api/ty/invoices/{id}
  update(id: number, body: InvoiceRequest): Observable<ApiResponse<Invoice>> {
    return this.http.put<ApiResponse<Invoice>>(`${this.BASE}/${id}`, body, {
      headers: this.auth.authHeaders()
    });
  }

  // DELETE /api/ty/invoices/{id}
  delete(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.BASE}/${id}`, {
      headers: this.auth.authHeaders()
    });
  }

  // POST /api/ty/invoices/{id}/post
  post(id: number): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.BASE}/${id}/post`, {}, {
      headers: this.auth.authHeaders()
    });
  }

  // POST /api/ty/invoices/{id}/cancel
  cancel(id: number): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.BASE}/${id}/cancel`, {}, {
      headers: this.auth.authHeaders()
    });
  }

  // POST /api/ty/invoices/{id}/print-contract
  printContract(id: number): Observable<Blob> {
    return this.http.post(`${this.BASE}/${id}/print-contract`, {}, {
      headers: this.auth.authHeaders(),
      responseType: 'blob'
    });
  }
}
