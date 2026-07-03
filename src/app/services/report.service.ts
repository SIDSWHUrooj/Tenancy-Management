import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiResponse } from '../models/common.model';

@Injectable({ providedIn: 'root' })
export class ReportService {

  private readonly BASE = 'https://tenancyapi.siddev.online/api/ty/reports';

  constructor(private http: HttpClient, private auth: AuthService) {}

  // ── POST /api/ty/reports/print-invoice/{invoiceId} ───────────────────
  printInvoice(invoiceId: number): Observable<Blob> {
    return this.http.post(
      `${this.BASE}/print-invoice/${invoiceId}`,
      {},
      { headers: this.auth.authHeaders(), responseType: 'blob' }
    );
  }

  // ── POST /api/ty/reports/print-receipt/{receiptId} ───────────────────
  printReceipt(receiptId: number): Observable<Blob> {
    return this.http.post(
      `${this.BASE}/print-receipt/${receiptId}`,
      {},
      { headers: this.auth.authHeaders(), responseType: 'blob' }
    );
  }

  // ── POST /api/ty/reports/print-contract/{contractId} ─────────────────
  printContract(contractId: number): Observable<Blob> {
    return this.http.post(
      `${this.BASE}/print-contract/${contractId}`,
      {},
      { headers: this.auth.authHeaders(), responseType: 'blob' }
    );
  }

  // ── POST /api/ty/reports/print-final-settlement/{settlementId} ───────
  printFinalSettlement(settlementId: number): Observable<Blob> {
    return this.http.post(
      `${this.BASE}/print-final-settlement/${settlementId}`,
      {},
      { headers: this.auth.authHeaders(), responseType: 'blob' }
    );
  }

  // ── Helper: open a PDF blob in a new browser tab ─────────────────────
  openPdfInNewTab(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Revoke after a short delay to avoid memory leak
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  // ── Helper: trigger a file download from a blob ───────────────────────
  downloadPdf(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
}
