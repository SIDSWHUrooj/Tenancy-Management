import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiResponse, DocumentNumber, NextDocumentNumber } from '../models/index';

@Injectable({ providedIn: 'root' })
export class DocumentNumberService {

  private readonly BASE = 'https://tenancyapi.siddev.online/api/ty/document-numbers';

  constructor(private http: HttpClient, private auth: AuthService) {}

  // GET /api/ty/document-numbers
  getAll(): Observable<ApiResponse<DocumentNumber[]>> {
    return this.http.get<ApiResponse<DocumentNumber[]>>(this.BASE, {
      headers: this.auth.authHeaders()
    });
  }

  // GET /api/ty/document-numbers/next/{documentType}
  // e.g., documentType = 'Receipt' | 'Invoice'
  getNext(documentType: string): Observable<ApiResponse<NextDocumentNumber>> {
    return this.http.get<ApiResponse<NextDocumentNumber>>(
      `${this.BASE}/next/${documentType}`,
      { headers: this.auth.authHeaders() }
    );
  }

  // POST /api/ty/document-numbers
  create(body: Partial<DocumentNumber>): Observable<ApiResponse<DocumentNumber>> {
    return this.http.post<ApiResponse<DocumentNumber>>(this.BASE, body, {
      headers: this.auth.authHeaders()
    });
  }

  // PUT /api/ty/document-numbers/{id}
  update(id: number, body: Partial<DocumentNumber>): Observable<ApiResponse<DocumentNumber>> {
    return this.http.put<ApiResponse<DocumentNumber>>(`${this.BASE}/${id}`, body, {
      headers: this.auth.authHeaders()
    });
  }
}
