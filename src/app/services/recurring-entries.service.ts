import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiResponse, RecurringGenerateRequest, RecurringProcessRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class RecurringEntriesService {

  private readonly BASE = 'https://tenancyapi.siddev.online/api/ty/recurring-entries';

  constructor(private http: HttpClient, private auth: AuthService) {}

  // ── GET /api/ty/recurring-entries?year=&month= ───────────────────────
  getEntries(year: number, month: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.BASE}?year=${year}&month=${month}`,
      { headers: this.auth.authHeaders() }
    );
  }

  // ── POST /api/ty/recurring-entries/generate ──────────────────────────
  generate(body: RecurringGenerateRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.BASE}/generate`,
      body,
      { headers: this.auth.authHeaders() }
    );
  }

  // ── POST /api/ty/recurring-entries/process ───────────────────────────
  process(body: RecurringProcessRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.BASE}/process`,
      body,
      { headers: this.auth.authHeaders() }
    );
  }

  // ── POST /api/ty/recurring-entries/{id}/create-invoices ──────────────
  createInvoices(headerId: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.BASE}/${headerId}/create-invoices`,
      {},
      { headers: this.auth.authHeaders() }
    );
  }
}
