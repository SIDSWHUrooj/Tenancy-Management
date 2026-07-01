import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

import { Receipt } from '../models/receipt/receipt.model';
import { ReceiptResponse } from '../models/receipt/receipt-response.model';
import { ReceiptListResponse } from '../models/receipt/receipt-list-response.model';

@Injectable({
  providedIn: 'root'
})
export class ReceiptService {

  private api = `${environment.apiUrl}/api/Receipt`;

  constructor(private http: HttpClient) {}

  // GET ALL
  getAllReceipts(): Observable<ReceiptListResponse> {
    return this.http.get<ReceiptListResponse>(this.api);
  }

  // GET BY ID
  getReceipt(id: number): Observable<ReceiptResponse> {
    return this.http.get<ReceiptResponse>(`${this.api}/${id}`);
  }

  // CREATE
  createReceipt(data: any): Observable<ReceiptResponse> {
    return this.http.post<ReceiptResponse>(this.api, data);
  }

  // UPDATE
  updateReceipt(id: number, data: any): Observable<ReceiptResponse> {
    return this.http.put<ReceiptResponse>(
      `${this.api}/${id}`,
      data
    );
  }

  // DELETE
  deleteReceipt(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }

}