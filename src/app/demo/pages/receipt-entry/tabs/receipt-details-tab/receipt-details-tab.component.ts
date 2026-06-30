import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CheckGridComponent } from '../../shared/check-grid/check-grid.component';
import { CheckItem, distributeChecks, calculateSettlementStatus } from '../../utils/receipt-calculation';
import { ReceiptAttachment } from '../../receipt-entry.component'; // 🔥 NEW

@Component({
  selector: 'app-receipt-details-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, CheckGridComponent],
  templateUrl: './receipt-details-tab.component.html',
  styleUrls: ['./receipt-details-tab.component.scss']
})
export class ReceiptDetailsTabComponent {
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

  // 🔥 NEW: max file size (5MB) + allowed types
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024;
  private readonly ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];

  onChecksCountChange(): void {
    if (this.form.numberOfChecks > 0) {
      this.form.checks = distributeChecks(
        this.form.receiptTotal,
        this.form.numberOfChecks,
        this.form.receiptDate
      );
    } else {
      this.form.checks = [];
    }
    this.recalculateSettlement();
  }

  onChecksUpdated(updatedChecks: CheckItem[]): void {
    this.form.checks = updatedChecks;
    this.form.numberOfChecks = updatedChecks.length;
  }

  onReceiptTotalChanged(newTotal: number): void {
    this.form.receiptTotal = newTotal;
    this.recalculateSettlement();
  }

  onReceiptTotalInput(): void {
    this.onChecksCountChange();
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

  // ── 🔥 NEW: Attachment handling ──────────────────────────────

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

    // reset the input so the same file can be re-selected if removed
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