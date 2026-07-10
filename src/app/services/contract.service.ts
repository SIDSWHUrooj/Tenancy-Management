import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Contract, CreateContractRequest } from '../models/contract.model';
import { AuthService } from './auth.service';
import { ApiResponse } from '../models/common.model';

@Injectable({
  providedIn: 'root'
})
export class ContractService {
  private readonly BASE_URL = 'https://tenancyapi.siddev.online';
  private apiUrl = `${this.BASE_URL}/api/ty/contracts`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getAll(): Observable<ApiResponse<Contract[]>> {
    return this.http.get<ApiResponse<Contract[]>>(this.apiUrl, {
      headers: this.authService.authHeaders()
    });
  }

  getById(id: number): Observable<ApiResponse<Contract>> {
    return this.http.get<ApiResponse<Contract>>(`${this.apiUrl}/${id}`, {
      headers: this.authService.authHeaders()
    });
  }

  create(data: CreateContractRequest): Observable<ApiResponse<Contract>> {
    return this.http.post<ApiResponse<Contract>>(this.apiUrl, data, {
      headers: this.authService.authHeaders()
    });
  }

  update(id: number, data: CreateContractRequest): Observable<ApiResponse<Contract>> {
    return this.http.put<ApiResponse<Contract>>(`${this.apiUrl}/${id}`, data, {
      headers: this.authService.authHeaders()
    });
  }

  markNotWilling(id: number, data: { notWillingDate: string; expectedLeavingDate: string; remarks: string }): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/${id}/mark-not-willing`, data, {
      headers: this.authService.authHeaders()
    });
  }

  renew(id: number, data: { newLeaseStartDate: string; newLeaseEndDate: string; annualRent: number; remarks: string }): Observable<ApiResponse<Contract>> {
    return this.http.post<ApiResponse<Contract>>(`${this.apiUrl}/${id}/renew`, data, {
      headers: this.authService.authHeaders()
    });
  }

  print(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/print`, {}, {
      headers: this.authService.authHeaders(),
      responseType: 'blob'
    });
  }

  uploadAttachment(id: number, file: File, remarks: string = ''): Observable<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);

    let params = new HttpParams();
    if (remarks) {
      params = params.set('remarks', remarks);
    }

    // For multipart/form-data, don't set Content-Type header so the browser sets it with boundary
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`
    });

    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/attachments`, formData, {
      headers: headers,
      params: params
    });
  }
}
