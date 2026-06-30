import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-rental-details-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rental-details-tab.component.html',
  styleUrls: ['./rental-details-tab.component.scss'],
})
export class RentalDetailsTabComponent {
  @Input() form: any;

  // ── Rent ─────────────────────────────────────────────────────
  calculateRent(): void {
    const rate = this.form.rentTaxRate || 0;
    this.form.rentTaxAmount = this.round(this.form.rentAmount * rate / 100);
    this.form.rentTotal     = this.round(this.form.rentAmount + this.form.rentTaxAmount);
    this.recalculateTotals();
  }

  // ── Security Deposit ──────────────────────────────────────────
  calculateDeposit(): void {
    const rate = this.form.depositTaxRate || 0;
    this.form.depositTaxAmount = this.round(this.form.depositAmount * rate / 100);
    this.form.depositTotal     = this.round(this.form.depositAmount + this.form.depositTaxAmount);
    this.recalculateTotals();
  }

  // ── Administration Fee ────────────────────────────────────────
  calculateAdminFee(): void {
    const rate = this.form.adminFeeTaxRate || 0;
    this.form.adminFeeTaxAmount = this.round(this.form.adminFeeAmount * rate / 100);
    this.form.adminFeeTotal     = this.round(this.form.adminFeeAmount + this.form.adminFeeTaxAmount);
    this.recalculateTotals();
  }

  // ── Recalculate invoice total + balance ───────────────────────
  private recalculateTotals(): void {
    this.form.invoiceTotal  = this.round(
      this.form.rentTotal + this.form.depositTotal + this.form.adminFeeTotal
    );
    this.form.balanceAmount = Math.max(
      0,
      this.round(this.form.invoiceTotal - this.form.lastReceiptTotal - this.form.receiptTotal)
    );
  }

  private round(val: number): number {
    return Math.round(val * 100) / 100;
  }
}