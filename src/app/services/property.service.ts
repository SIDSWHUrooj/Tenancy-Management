import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiResponse, Property } from '../models';

@Injectable({ providedIn: 'root' })
export class PropertyService {

  private readonly BASE = 'https://tenancyapi.siddev.online/api/ty/properties';

  constructor(private http: HttpClient, private auth: AuthService) {}

  // GET /api/ty/properties
  getAll(): Observable<ApiResponse<Property[]>> {
    return this.http.get<ApiResponse<Property[]>>(this.BASE, {
      headers: this.auth.authHeaders()
    });
  }

  // GET /api/ty/properties/{id}
  getById(id: number): Observable<ApiResponse<Property>> {
    return this.http.get<ApiResponse<Property>>(`${this.BASE}/${id}`, {
      headers: this.auth.authHeaders()
    });
  }

  // POST /api/ty/properties
  create(body: Partial<Property>): Observable<ApiResponse<Property>> {
    return this.http.post<ApiResponse<Property>>(this.BASE, body, {
      headers: this.auth.authHeaders()
    });
  }

  // PUT /api/ty/properties/{id}
  update(id: number, body: Partial<Property>): Observable<ApiResponse<Property>> {
    return this.http.put<ApiResponse<Property>>(`${this.BASE}/${id}`, body, {
      headers: this.auth.authHeaders()
    });
  }

  // DELETE /api/ty/properties/{id}
  delete(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.BASE}/${id}`, {
      headers: this.auth.authHeaders()
    });
  }
}
