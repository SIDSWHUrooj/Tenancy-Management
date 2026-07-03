import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiResponse, Unit } from '../models';

@Injectable({ providedIn: 'root' })
export class UnitService {

  private readonly BASE = 'https://tenancyapi.siddev.online/api/ty/units';

  constructor(private http: HttpClient, private auth: AuthService) {}

  // GET /api/ty/units
  getAll(): Observable<ApiResponse<Unit[]>> {
    return this.http.get<ApiResponse<Unit[]>>(this.BASE, {
      headers: this.auth.authHeaders()
    });
  }

  // GET /api/ty/units/{id}
  getById(id: number): Observable<ApiResponse<Unit>> {
    return this.http.get<ApiResponse<Unit>>(`${this.BASE}/${id}`, {
      headers: this.auth.authHeaders()
    });
  }

  // GET /api/ty/units/by-property/{propertyId}
  // Key lookup used by Receipt/Invoice entry when property is selected
  getByProperty(propertyId: string): Observable<ApiResponse<Unit[]>> {
    return this.http.get<ApiResponse<Unit[]>>(
      `${this.BASE}/by-property/${propertyId}`,
      { headers: this.auth.authHeaders() }
    );
  }

  // POST /api/ty/units
  create(body: Partial<Unit>): Observable<ApiResponse<Unit>> {
    return this.http.post<ApiResponse<Unit>>(this.BASE, body, {
      headers: this.auth.authHeaders()
    });
  }

  // PUT /api/ty/units/{id}
  update(id: number, body: Partial<Unit>): Observable<ApiResponse<Unit>> {
    return this.http.put<ApiResponse<Unit>>(`${this.BASE}/${id}`, body, {
      headers: this.auth.authHeaders()
    });
  }

  // DELETE /api/ty/units/{id}
  delete(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.BASE}/${id}`, {
      headers: this.auth.authHeaders()
    });
  }
}
