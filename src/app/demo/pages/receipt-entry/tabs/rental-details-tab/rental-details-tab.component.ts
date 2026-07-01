import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type TaxGroup = 'Standard VAT' | 'Zero Rated' | 'Out of Scope';

@Component({
  selector: 'app-rental-details-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rental-details-tab.component.html',
  styleUrls: ['./rental-details-tab.component.scss'],
})
export class RentalDetailsTabComponent {
  @Input() form: any;

  // Causes available for the Penalty / Other Charges card
  readonly penaltyCauses: string[] = ['Utility Charges', 'Penalty', 'Miscellaneous'];

  // ── Shared tax-group helper ─────────────────────────────────
  // Out of Scope / Zero Rated => rate is forced to 0 and locked.
  // Standard VAT => rate field is editable by the user.
  isTaxRateLocked(taxGroup: TaxGroup): boolean {
    return taxGroup === 'Out of Scope' || taxGroup === 'Zero Rated';
  }

  private resolveTaxRate(taxGroup: TaxGroup, currentRate: number): number {
    if (this.isTaxRateLocked(taxGroup)) {
      return 0;
    }
    // If coming back to Standard VAT from a locked state with no rate set, default to 5%.
    return currentRate || 5;
  }

  // ── Rent ─────────────────────────────────────────────────────
  calculateRent(): void {
    this.form.rentTaxRate = this.resolveTaxRate(this.form.rentTaxGroup, this.form.rentTaxRate);
    const rate = this.form.rentTaxRate || 0;
    this.form.rentTaxAmount = this.round(this.form.rentAmount * rate / 100);
    this.form.rentTotal     = this.round(this.form.rentAmount + this.form.rentTaxAmount);
    this.recalculateTotals();
  }

  // ── Security Deposit ──────────────────────────────────────────
  calculateDeposit(): void {
    this.form.depositTaxRate = this.resolveTaxRate(this.form.depositTaxGroup, this.form.depositTaxRate);
    const rate = this.form.depositTaxRate || 0;
    this.form.depositTaxAmount = this.round(this.form.depositAmount * rate / 100);
    this.form.depositTotal     = this.round(this.form.depositAmount + this.form.depositTaxAmount);
    this.recalculateTotals();
  }

  // ── Administration Fee ────────────────────────────────────────
  calculateAdminFee(): void {
    this.form.adminFeeTaxRate = this.resolveTaxRate(this.form.adminFeeTaxGroup, this.form.adminFeeTaxRate);
    const rate = this.form.adminFeeTaxRate || 0;
    this.form.adminFeeTaxAmount = this.round(this.form.adminFeeAmount * rate / 100);
    this.form.adminFeeTotal     = this.round(this.form.adminFeeAmount + this.form.adminFeeTaxAmount);
    this.recalculateTotals();
  }

  // ── Penalty / Other Charges ────────────────────────────────────
  // Called when the user selects a cause (Utility / Penalty / Miscellaneous).
  onPenaltyCauseChange(): void {
    if (!this.form.penaltyCause) {
      // No cause selected: reset everything for this block.
      this.form.penaltyAmount     = 0;
      this.form.penaltyApplyTax   = false;
      this.form.penaltyTaxGroup   = 'Standard VAT';
      this.form.penaltyTaxRate    = 0;
      this.form.penaltyTaxAmount  = 0;
      this.form.penaltyTotal      = 0;
    }
    this.calculatePenalty();
  }

  // Called when the "Apply Tax" toggle changes.
  onPenaltyApplyTaxChange(): void {
    if (!this.form.penaltyApplyTax) {
      this.form.penaltyTaxAmount = 0;
    } else if (!this.form.penaltyTaxGroup) {
      this.form.penaltyTaxGroup = 'Standard VAT';
    }
    this.calculatePenalty();
  }

  calculatePenalty(): void {
    if (!this.form.penaltyCause) {
      this.form.penaltyTotal = 0;
      this.recalculateTotals();
      return;
    }

    if (this.form.penaltyApplyTax) {
      this.form.penaltyTaxRate = this.resolveTaxRate(this.form.penaltyTaxGroup, this.form.penaltyTaxRate);
      const rate = this.form.penaltyTaxRate || 0;
      this.form.penaltyTaxAmount = this.round(this.form.penaltyAmount * rate / 100);
    } else {
      this.form.penaltyTaxAmount = 0;
    }

    this.form.penaltyTotal = this.round(this.form.penaltyAmount + this.form.penaltyTaxAmount);
    this.recalculateTotals();
  }

  // ── Recalculate Subtotal / Tax Total / Invoice Total ───────────
  private recalculateTotals(): void {
    const baseAmounts =
      (this.form.rentAmount || 0) +
      (this.form.depositAmount || 0) +
      (this.form.adminFeeAmount || 0) +
      (this.form.penaltyAmount || 0);

    const taxAmounts =
      (this.form.rentTaxAmount || 0) +
      (this.form.depositTaxAmount || 0) +
      (this.form.adminFeeTaxAmount || 0) +
      (this.form.penaltyTaxAmount || 0);

    this.form.subTotal     = this.round(baseAmounts);
    this.form.taxTotal     = this.round(taxAmounts);
    this.form.invoiceTotal = this.round(this.form.subTotal + this.form.taxTotal);

    this.form.balanceAmount = Math.max(
      0,
      this.round(this.form.invoiceTotal - (this.form.lastReceiptTotal || 0) - (this.form.receiptTotal || 0))
    );
  }

  private round(val: number): number {
    return Math.round((val || 0) * 100) / 100;
  }
}