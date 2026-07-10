import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type TaxGroup = 'Standard VAT' | 'Zero Rated' | 'Out of Scope';

export interface AdditionalCharge {
  id: string;
  cause: string;
  amount: number;
  taxGroup: TaxGroup;
  taxRate: number;
  taxAmount: number;
  total: number;
  description: string;
}

@Component({
  selector: 'app-rental-details-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rental-details-tab.component.html',
  styleUrls: ['./rental-details-tab.component.scss'],
})
export class RentalDetailsTabComponent {
  @Input() form: any;

  @Input() isLocked   = false;
  @Input() isSaving   = false;
  @Input() canSaveDraft = true;
  @Input() canPost    = true;
  @Input() canCancel  = false;
  @Input() canPrint   = false;

  @Output() saveRentalDraft = new EventEmitter<void>();
  @Output() postRental      = new EventEmitter<void>();
  @Output() cancelRental    = new EventEmitter<void>();
  @Output() printRental     = new EventEmitter<void>();
  @Output() generateContract = new EventEmitter<void>();

  // Dropdown options for Additional Charges
  readonly additionalChargeCauses: string[] = [
    'Penalty', 'Utility', 'Miscellaneous','Other Charges'
  ];

  isTaxRateLocked(taxGroup: TaxGroup): boolean {
    return taxGroup === 'Out of Scope' || taxGroup === 'Zero Rated';
  }

  private resolveTaxRate(taxGroup: TaxGroup, currentRate: number): number {
    if (this.isTaxRateLocked(taxGroup)) return 0;
    return currentRate === null || currentRate === undefined ? 5 : currentRate;
  }

  // ── Rent ─────────────────────────────────────────────────────
  calculateRent(): void {
    this.form.annualRent = this.form.rentAmount || 0;
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

  // ── Additional Charges (dynamic rows) ─────────────────────────
  private newChargeId(): string {
    return 'chg_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  }

  addAdditionalCharge(): void {
    if (!this.form.additionalCharges) this.form.additionalCharges = [];
    this.form.additionalCharges = [
      ...this.form.additionalCharges,
      {
        id: this.newChargeId(),
        cause: '',
        amount: 0,
        taxGroup: 'Standard VAT',
        taxRate: 5,
        taxAmount: 0,
        total: 0,
        description: '',
      } as AdditionalCharge,
    ];
  }

  removeAdditionalCharge(id: string): void {
    this.form.additionalCharges = this.form.additionalCharges.filter(
      (c: AdditionalCharge) => c.id !== id
    );
    this.recalculateTotals();
  }

  calculateChargeRow(charge: AdditionalCharge): void {
    charge.taxRate   = this.resolveTaxRate(charge.taxGroup, charge.taxRate);
    const rate        = charge.taxRate || 0;
    charge.taxAmount  = this.round((charge.amount || 0) * rate / 100);
    charge.total      = this.round((charge.amount || 0) + charge.taxAmount);
    this.recalculateTotals();
  }

  get additionalChargesBaseTotal(): number {
    return this.round(
      (this.form.additionalCharges || []).reduce(
        (sum: number, c: AdditionalCharge) => sum + (c.amount || 0), 0
      )
    );
  }

  get additionalChargesTaxTotal(): number {
    return this.round(
      (this.form.additionalCharges || []).reduce(
        (sum: number, c: AdditionalCharge) => sum + (c.taxAmount || 0), 0
      )
    );
  }

  get additionalChargesGrandTotal(): number {
    return this.round(this.additionalChargesBaseTotal + this.additionalChargesTaxTotal);
  }

  // ── Recalculate Subtotal / Tax Total / Invoice Total ───────────
  private recalculateTotals(): void {
    const chargesBase = this.additionalChargesBaseTotal;
    const chargesTax  = this.additionalChargesTaxTotal;

    const baseAmounts =
      (this.form.rentAmount || 0) +
      (this.form.depositAmount || 0) +
      (this.form.adminFeeAmount || 0) +
      chargesBase;

    const taxAmounts =
      (this.form.rentTaxAmount || 0) +
      (this.form.depositTaxAmount || 0) +
      (this.form.adminFeeTaxAmount || 0) +
      chargesTax;

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