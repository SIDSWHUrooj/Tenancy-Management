import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { calculateSettlementStatus } from '../../utils/receipt-calculation';

@Component({
  selector: 'app-settlement-details-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settlement-details-tab.component.html',
  styleUrls: ['./settlement-details-tab.component.scss'],
})
export class SettlementDetailsTabComponent implements OnChanges {
  // Single shared form object — same reference as parent + other tabs
  @Input() form: any;

  ngOnChanges(changes: SimpleChanges): void {
    // Recalculate whenever the parent patches form (e.g. invoice loaded)
    if (changes['form'] && this.form) {
      this.recalculate();
    }
  }

  // ── Called when Early Termination toggle changes ──────────────
 onEarlyTerminationChange(): void {

  if (!this.form.earlyTermination) {
    // Reset when disabled
    this.form.toDate = this.form.periodToDate;
  }

  this.recalculate();
}
onToDateChange(): void {

  if (!this.form.toDate || !this.form.periodToDate) {
    return;
  }

  const selected = new Date(this.form.toDate);
  const periodEnd = new Date(this.form.periodToDate);

  if (selected > periodEnd) {
    this.form.toDate = this.form.periodToDate;
  }

  this.recalculate();
}

  // ── Derive settlement status from current financials ──────────
  recalculate(): void {
    const result = calculateSettlementStatus(
      this.form.invoiceTotal,
      this.form.lastReceiptTotal,
      this.form.receiptTotal
    );
    this.form.balanceAmount = result.balanceAmount;
    this.form.settlementStatus = result.status;
  }
}