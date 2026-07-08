import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';
import { ApiResponse } from '../models/common.model';
import { ChequeHeader, ChequeRequest } from '../models/cheque.model';

@Injectable({ providedIn: 'root' })
export class ChequeService {
  private baseUrl = 'https://tenancyapi.siddev.online/api/ty/cheques';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getAll(): Observable<ApiResponse<ChequeHeader[]>> {
    return this.http.get<ApiResponse<ChequeHeader[]>>(this.baseUrl, {
      headers: this.authService.authHeaders(),
    });
  }

  getById(id: number): Observable<ApiResponse<ChequeHeader>> {
    return this.http.get<ApiResponse<ChequeHeader>>(`${this.baseUrl}/${id}`, {
      headers: this.authService.authHeaders(),
    });
  }

  create(payload: ChequeRequest): Observable<ApiResponse<ChequeHeader>> {
    return this.http.post<ApiResponse<ChequeHeader>>(this.baseUrl, payload, {
      headers: this.authService.authHeaders(),
    });
  }

  update(id: number, payload: ChequeRequest): Observable<ApiResponse<ChequeHeader>> {
    return this.http.put<ApiResponse<ChequeHeader>>(`${this.baseUrl}/${id}`, payload, {
      headers: this.authService.authHeaders(),
    });
  }

  markCleared(id: number): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/${id}/mark-cleared`, null, {
      headers: this.authService.authHeaders(),
    });
  }

  markBounced(id: number, reason: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(
      `${this.baseUrl}/${id}/mark-bounced?reason=${encodeURIComponent(reason)}`,
      null,
      { headers: this.authService.authHeaders() },
    );
  }

  uploadAttachment(id: number, file: File, remarks: string): Observable<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/${id}/attachments?remarks=${encodeURIComponent(remarks)}`,
      formData,
      { headers: this.authService.authHeaders() },
    );
  }

  /**
   * The list endpoint has no server-side filter (no query params), so we
   * fetch everything and filter client-side by invoice number. If your
   * cheque count per tenant stays small this is fine; ask the backend team
   * for a `?invoiceNumber=` param later if the table grows.
   */
  getByInvoiceNumber(invoiceNumber: string): Observable<ApiResponse<ChequeHeader[]>> {
    return this.getAll().pipe(
      map((res) => {
        if (res.success && res.data) {
          return { ...res, data: res.data.filter((c) => c.invoiceNumber === invoiceNumber) };
        }
        return res;
      }),
    );
  }
}