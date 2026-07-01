import { Component, DoCheck, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CheckGridComponent } from '../../shared/check-grid/check-grid.component';
import { CheckItem, distributeChecks, calculateSettlementStatus } from '../../utils/receipt-calculation';
import { ReceiptAttachment } from '../../receipt-entry.component';

@Component({
  selector: 'app-receipt-details-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, CheckGridComponent],
  templateUrl: './receipt-details-tab.component.html',
  styleUrls: ['./receipt-details-tab.component.scss']
})
export class ReceiptDetailsTabComponent implements DoCheck {
  @Input() form: any;

  banksList = [
    'Emirates NBD',
    'Abu Dhabi Commercial Bank (ADCB)',
    'Dubai Islamic Bank (DIB)',
    'First Abu Dhabi Bank (FAB)',
    'Mashreq Bank',
    'HSBC Middle East',
    'Standard Chartered'
  ];

  // Fixed dropdown per spec — no free-typed cheque counts allowed
  chequeCountOptions = [1, 2, 3, 4, 6, 12];

  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024;
  private readonly ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];

  // Watches the inputs that drive the auto-generated cheque schedule.
  // form is a mutable object passed by reference, so ngOnChanges alone
  // won't fire when nested fields (e.g. periodFrom set on another tab)
  // change — ngDoCheck picks those up and regenerates the schedule.
  private lastScheduleKey = '';

  ngDoCheck(): void {
    if (!this.form) return;
    const key = [
      this.form.periodFrom,
      this.form.periodTo,
      this.form.rentAmount,
      this.form.rentTaxAmount,
      this.form.numberOfChecks,
      this.form.detailsBank,
    ].join('|');

    if (key !== this.lastScheduleKey) {
      this.lastScheduleKey = key;
      this.regenerateChecks();
    }
  }

  /**
   * Rent amount, tax-inclusive. Cheques must divide up this figure — not the
   * bare rentAmount — so the schedule matches how Admin Fee / Deposit /
   * Penalty are already passed as "*Total" (tax-inclusive) values.
   *
   * Assumes `form.rentTaxAmount` holds the VAT/tax portion on rent. If your
   * form already tracks a combined tax-inclusive rent under a different
   * field name, point this getter at that field instead.
   */
  get rentTotalAmount(): number {
    const base = Number(this.form?.rentAmount) || 0;
    const tax = Number(this.form?.rentTaxAmount) || 0;
    return Math.round((base + tax) * 100) / 100;
  }

  private regenerateChecks(): void {
    const totalRent = this.rentTotalAmount;
    if (this.form.numberOfChecks > 0 && totalRent > 0) {
      this.form.checks = distributeChecks(
        totalRent,
        this.form.numberOfChecks,
        this.form.periodFrom,
        this.form.periodTo,
        this.form.detailsBank
      );
    } else {
      this.form.checks = [];
    }
  }

  onChecksUpdated(updatedChecks: CheckItem[]): void {
    this.form.checks = updatedChecks;
  }

  onChequeTotalChanged(_chequeSum: number): void {
    // Reserved for future use if the cheque-only subtotal needs surfacing elsewhere.
  }

  onGrandTotalChanged(scheduleTotal: number): void {
    this.form.grandTotal = scheduleTotal;
  }

  onReceiptTotalInput(): void {
    this.recalculateSettlement();
  }

  private recalculateSettlement(): void {
    const result = calculateSettlementStatus(
      this.form.invoiceTotal,
      this.form.lastReceiptTotal,
      this.form.receiptTotal
    );
    this.form.balanceAmount = result.balanceAmount;
    this.form.settlementStatus = result.status;
  }

  // ── Attachments (multiple, add/remove) ──────────────────────

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    Array.from(input.files).forEach((file) => {
      if (file.size > this.MAX_FILE_SIZE) {
        alert(`"${file.name}" exceeds the 5MB limit and was skipped.`);
        return;
      }
      if (!this.ALLOWED_TYPES.includes(file.type)) {
        alert(`"${file.name}" has an unsupported file type and was skipped.`);
        return;
      }

      const attachment: ReceiptAttachment = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        file,
        uploadedAt: new Date().toISOString(),
      };

      this.form.attachments = [...(this.form.attachments || []), attachment];
    });

    // Reset the input so the same file can be re-selected after removal
    input.value = '';
  }

  removeAttachment(id: string): void {
    this.form.attachments = (this.form.attachments || []).filter(
      (a: ReceiptAttachment) => a.id !== id
    );
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}