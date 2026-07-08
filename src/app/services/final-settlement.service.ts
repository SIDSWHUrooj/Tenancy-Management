import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiResponse, FinalSettlement, FinalSettlementRequest } from '../models/index';
import { TyAttachment } from '../models/attachment.model';

@Injectable({ providedIn: 'root' })
export class FinalSettlementService {

  private readonly BASE = 'https://tenancyapi.siddev.online/api/ty/final-settlements';

  constructor(private http: HttpClient, private auth: AuthService) {}

  getAll(): Observable<ApiResponse<FinalSettlement[]>> {
    return this.http.get<ApiResponse<FinalSettlement[]>>(this.BASE, {
      headers: this.auth.authHeaders()
    });
  }

  getById(id: number): Observable<ApiResponse<FinalSettlement>> {
    return this.http.get<ApiResponse<FinalSettlement>>(`${this.BASE}/${id}`, {
      headers: this.auth.authHeaders()
    });
  }

  create(body: FinalSettlementRequest): Observable<ApiResponse<FinalSettlement>> {
    return this.http.post<ApiResponse<FinalSettlement>>(this.BASE, body, {
      headers: this.auth.authHeaders()
    });
  }

  update(id: number, body: FinalSettlementRequest): Observable<ApiResponse<FinalSettlement>> {
    return this.http.put<ApiResponse<FinalSettlement>>(`${this.BASE}/${id}`, body, {
      headers: this.auth.authHeaders()
    });
  }

  delete(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.BASE}/${id}`, {
      headers: this.auth.authHeaders()
    });
  }

  postAR(id: number): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.BASE}/${id}/post-ar`, {}, {
      headers: this.auth.authHeaders()
    });
  }

  postCashWorks(id: number): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.BASE}/${id}/post-cashworks`, {}, {
      headers: this.auth.authHeaders()
    });
  }

  invoice(id: number): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.BASE}/${id}/invoice`, {}, {
      headers: this.auth.authHeaders()
    });
  }

  vacant(id: number): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.BASE}/${id}/vacant`, {}, {
      headers: this.auth.authHeaders()
    });
  }

  uploadAttachment(id: number, file: File, remarks?: string): Observable<ApiResponse<TyAttachment>> {
    const formData = new FormData();
    formData.append('file', file);
    
    let params = new HttpParams();
    if (remarks) {
      params = params.set('remarks', remarks);
    }

    // Don't set Content-Type header manually when sending FormData, HttpClient handles it (including boundary)
    // We only pass authorization header. But wait, auth.authHeaders() adds 'Content-Type': 'application/json'
    // I need to be careful to not override the Content-Type header.
    // The authHeaders method in auth.service.ts usually sets application/json.
    // Let's create custom headers for multipart
    const headers = this.auth.authHeaders().delete('Content-Type');

    return this.http.post<ApiResponse<TyAttachment>>(`${this.BASE}/${id}/attachments`, formData, {
      headers: headers,
      params: params
    });
  }
}
