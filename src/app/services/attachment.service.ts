import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiResponse, TyAttachment } from '../models/index';

@Injectable({ providedIn: 'root' })
export class AttachmentService {

  private readonly BASE = 'https://tenancyapi.siddev.online/api/ty/attachments';

  constructor(private http: HttpClient, private auth: AuthService) {}

  // POST /api/ty/attachments/upload  (multipart/form-data)
  upload(
    file: File,
    moduleCode: string,
    documentType: string,
    documentId: string,
    remarks: string = ''
  ): Observable<ApiResponse<TyAttachment>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('moduleCode', moduleCode);
    formData.append('documentType', documentType);
    formData.append('documentId', documentId);
    formData.append('remarks', remarks);

    // NOTE: Do NOT set Content-Type manually for multipart/form-data;
    // the browser sets it automatically including the boundary.
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.auth.getToken() ?? ''}`
    });

    return this.http.post<ApiResponse<TyAttachment>>(`${this.BASE}/upload`, formData, { headers });
  }

  // GET /api/ty/attachments/{moduleCode}/{documentId}
  getByDocument(moduleCode: string, documentId: string): Observable<ApiResponse<TyAttachment[]>> {
    return this.http.get<ApiResponse<TyAttachment[]>>(
      `${this.BASE}/${moduleCode}/${documentId}`,
      { headers: this.auth.authHeaders() }
    );
  }

  // DELETE /api/ty/attachments/{id}
  delete(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.BASE}/${id}`, {
      headers: this.auth.authHeaders()
    });
  }

  // POST /api/ty/invoices/{id}/attachments
  uploadToInvoice(invoiceId: number, file: File, remarks: string = ''): Observable<ApiResponse<TyAttachment>> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `https://tenancyapi.siddev.online/api/ty/invoices/${invoiceId}/attachments?remarks=${encodeURIComponent(remarks)}`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.auth.getToken() ?? ''}`
    });

    return this.http.post<ApiResponse<TyAttachment>>(url, formData, { headers });
  }

  // POST /api/ty/receipts/{id}/attachments
  uploadToReceipt(receiptId: number, file: File, remarks: string = ''): Observable<ApiResponse<TyAttachment>> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `https://tenancyapi.siddev.online/api/ty/receipts/${receiptId}/attachments?remarks=${encodeURIComponent(remarks)}`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.auth.getToken() ?? ''}`
    });

    return this.http.post<ApiResponse<TyAttachment>>(url, formData, { headers });
  }

  // Helper: human-readable file size
  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  }
}
