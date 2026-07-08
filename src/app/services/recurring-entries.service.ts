import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'; // adjust path
import { AuthService } from '../services/auth.service'; // adjust path
import { RecurringHeaderDto } from '../models/recurring-entry.model';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class RecurringEntriesService {

  private baseUrl = 'https://tenancyapi.siddev.online/api/ty/recurring-entries';

  constructor(private http: HttpClient, private authService: AuthService) {}

  // GET /api/ty/recurring-entries?year=&month=
  getEntries(year: number, month: number): Observable<ApiResponse<RecurringHeaderDto[]>> {
    const params = new HttpParams()
      .set('year', year.toString())
      .set('month', month.toString());

    return this.http.get<ApiResponse<RecurringHeaderDto[]>>(this.baseUrl, {
      headers: this.authService.authHeaders(),
      params
    });
  }

  // POST /api/ty/recurring-entries/generate
  generateEntries(year: number, month: number): Observable<ApiResponse<RecurringHeaderDto>> {
    return this.http.post<ApiResponse<RecurringHeaderDto>>(
      `${this.baseUrl}/generate`,
      { year, month },
      { headers: this.authService.authHeaders() }
    );
  }

  // POST /api/ty/recurring-entries/process
  processEntries(detailIds: number[]): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(
      `${this.baseUrl}/process`,
      { detailIds },
      { headers: this.authService.authHeaders() }
    );
  }

  // POST /api/ty/recurring-entries/{id}/create-invoices
  createInvoices(headerId: number): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(
      `${this.baseUrl}/${headerId}/create-invoices`,
      {},
      { headers: this.authService.authHeaders() }
    );
  }
}