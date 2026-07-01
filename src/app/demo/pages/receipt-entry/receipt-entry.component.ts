import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { RentalDetailsTabComponent }    from './tabs/rental-details-tab/rental-details-tab.component';
import { ReceiptDetailsTabComponent }   from './tabs/receipt-details-tab/receipt-details-tab.component';
import { SettlementDetailsTabComponent } from './tabs/settlement-details-tab/settlement-details-tab.component';
import { CheckItem } from './utils/receipt-calculation';

export type ReceiptTab    = 'rental' | 'receipt' | 'settlement';
export type InvoiceType   = 'New' | 'Renewal';
export type ReceiptStatus = 'Draft' | 'Posted' | 'Cancelled';

export interface ReceiptAttachment {
  id:         string;
  name:       string;
  size:       number;
  type:       string;
  file:       File;
  uploadedAt: string;
}

export interface ReceiptForm {
  receiptNumber:          string;
  receiptDate:            string;
  customer:               string;
  customerName:           string;
  landlordCode:           string;
  landlordName:           string;
  propertyId:             string;
  propertyName:           string;
  unitNo:                 string;
  invoiceNumber:          string;
  invoiceDate:            string;
  invoiceType:            InvoiceType;
  previousInvoiceNumber:  string;
  purposeOfLease:         string;
  multipleInvoices:       boolean;
  periodFrom:             string;
  periodTo:               string;
  status:                 ReceiptStatus;

  contractNumber:         string;
  contractDate:           string;
  documentNumber:         string;
  ejariNumber:            string;

  gracePeriodStart:       string;
  gracePeriodEnd:         string;

  // ── Rental Details ─────────────────────────────────────────
  annualRent:             number;
  rentAmount:             number;
  rentTaxGroup:           string;
  rentTaxRate:            number;
  rentTaxAmount:          number;
  rentTotal:              number;

  depositAmount:          number;
  depositTaxGroup:        string;
  depositTaxRate:         number;
  depositTaxAmount:       number;
  depositTotal:           number;

  adminFeeAmount:         number;
  adminFeeTaxGroup:       string;
  adminFeeTaxRate:        number;
  adminFeeTaxAmount:      number;
  adminFeeTotal:          number;

  // ── Additional / Penalty Charge ────────────────────────────
  penaltyCause:           string;
  penaltyApplyTax:        boolean;
  penaltyAmount:          number;
  penaltyTaxGroup:        string;
  penaltyTaxRate:         number;
  penaltyTaxAmount:       number;
  penaltyTotal:           number;

  // ── Totals (from Rental Details tab) ───────────────────────
  subTotal:               number;
  taxTotal:               number;
  invoiceTotal:           number;
  lastReceiptTotal:       number;
  receiptTotal:           number;
  balanceAmount:          number;

  /** Grand total = Admin Fee + Deposit + Additional + Cheque sum */
  grandTotal:             number;

  // ── Receipt Details ────────────────────────────────────────
  detailsBank:            string;
  numberOfChecks:         number;
  checks:                 CheckItem[];
  attachments:            ReceiptAttachment[];

  // ── Settlement ─────────────────────────────────────────────
  leaveDate:              string;
  earlyTermination:       boolean;
  settlementStatus:       'Fully Paid' | 'Partially Paid' | 'Outstanding' | '';
}

@Component({
  selector: 'app-receipt-entry',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RentalDetailsTabComponent,
    ReceiptDetailsTabComponent,
    SettlementDetailsTabComponent,
  ],
  templateUrl: './receipt-entry.component.html',
  styleUrls: ['./receipt-entry.component.scss'],
})
export class ReceiptEntryComponent implements OnInit {
  activeTab: ReceiptTab = 'rental';
  form: ReceiptForm = this.buildEmptyForm();

  showTypeModal        = false;
  invoiceSetupComplete = false;
  modalInvoiceType: InvoiceType = 'New';
  modalPreviousInvoiceNumber    = '';

  invoiceTypes: InvoiceType[] = ['New', 'Renewal'];

  ngOnInit(): void {
    const today = new Date().toISOString().substring(0, 10);
    this.form.receiptNumber  = 'RCP-' + Date.now();
    this.form.invoiceNumber  = this.generateInvoiceNumber('New');
    this.form.invoiceDate    = today;
    this.form.receiptDate    = today;
    this.openTypeModal();
  }

  setTab(tab: ReceiptTab): void {
    this.activeTab = tab;
  }

  openTypeModal(): void {
    this.showTypeModal                 = true;
    this.modalInvoiceType              = this.form.invoiceType;
    this.modalPreviousInvoiceNumber    = this.form.previousInvoiceNumber;
  }

  confirmInvoiceType(): void {
    if (this.modalInvoiceType === 'Renewal' && !this.modalPreviousInvoiceNumber.trim()) {
      alert('Please enter the previous invoice number for renewal.');
      return;
    }

    this.form.invoiceType           = this.modalInvoiceType;
    this.form.previousInvoiceNumber = this.modalInvoiceType === 'Renewal'
      ? this.modalPreviousInvoiceNumber.trim()
      : '';
    this.form.invoiceNumber         = this.generateInvoiceNumber(this.form.invoiceType);

    if (this.form.invoiceType === 'Renewal') {
      this.populateRenewalFromPreviousInvoice();
    }

    this.showTypeModal        = false;
    this.invoiceSetupComplete = true;
  }

  openInvoiceLookup():  void { console.log('Open invoice lookup'); }
  openCustomerLookup(): void { console.log('Open customer lookup'); }
  openLandlordLookup(): void { console.log('Open landlord lookup'); }
  openPropertyLookup(): void { console.log('Open property lookup'); }

  resetReceipt(): void {
    const today = new Date().toISOString().substring(0, 10);
    this.form               = this.buildEmptyForm();
    this.form.receiptNumber = 'RCP-' + Date.now();
    this.form.receiptDate   = today;
    this.form.invoiceDate   = today;
    this.form.invoiceNumber = this.generateInvoiceNumber('New');
    this.activeTab          = 'rental';
    this.invoiceSetupComplete = false;
    this.openTypeModal();
  }

  canSaveDraft(): boolean { return this.form.status === 'Draft'; }
  canPost():      boolean { return this.form.status === 'Draft'; }
  canPrint():     boolean { return this.form.status === 'Posted' || this.form.status === 'Cancelled'; }
  canCancel():    boolean { return this.form.status === 'Draft'  || this.form.status === 'Posted'; }
  isLocked():     boolean { return this.form.status === 'Posted' || this.form.status === 'Cancelled'; }

  saveDraft(): void {
    if (!this.canSaveDraft()) { alert('This receipt can no longer be saved as draft.'); return; }
    this.form.status = 'Draft';
    console.log('Saving as DRAFT:', this.form);
  }

  postReceipt(): void {
    if (!this.canPost()) { alert('This receipt has already been finalized.'); return; }
    if (!this.validateBeforePost()) return;
    this.form.status = 'Posted';
    console.log('POSTING receipt:', this.form);
  }

  cancelReceipt(): void {
    if (!this.canCancel()) { alert('This receipt cannot be cancelled.'); return; }
    const confirmed = window.confirm(
      'Cancelling will reverse this receipt and restore the invoice outstanding amount. Continue?'
    );
    if (!confirmed) return;
    const wasPosted = this.form.status === 'Posted';
    this.form.status = 'Cancelled';
    console.log('CANCELLING receipt. Was posted:', wasPosted, this.form);
  }

  printReceipt(): void { window.print(); }

  // ── Validation ─────────────────────────────────────────────
  requiredFields: string[] = [];

  isRequired(field: keyof ReceiptForm): boolean {
    return this.requiredFields.includes(field as string);
  }

  validateRequiredFields(): boolean {
    this.requiredFields = [];

    const fields: (keyof ReceiptForm)[] = [
      'customer', 'customerName',
      'propertyId', 'propertyName', 'unitNo',
      'contractNumber', 'contractDate',
      'annualRent',
      'gracePeriodStart', 'gracePeriodEnd',
      'periodFrom', 'periodTo',
    ];

    fields.forEach(field => {
      const value = this.form[field];
      if (value === null || value === undefined || value === '' || value === 0) {
        this.requiredFields.push(field as string);
      }
    });

    if (this.requiredFields.length > 0) {
      alert('Please fill all required fields.');
      return false;
    }
    return true;
  }

  private validateBeforePost(): boolean {
    if (!this.validateRequiredFields()) return false;

    if (!this.form.invoiceNumber) {
      alert('Please enter an invoice number before posting.');
      return false;
    }

    if (this.form.invoiceType === 'Renewal' && !this.form.previousInvoiceNumber) {
      alert('Please enter the previous invoice number before posting a renewal.');
      return false;
    }

    // ── Grand total must not exceed invoice total ─────────────
    if (this.form.grandTotal > this.form.invoiceTotal + 0.005) {
      alert(
        `Grand Total (AED ${this.form.grandTotal.toFixed(2)}) exceeds ` +
        `Invoice Total (AED ${this.form.invoiceTotal.toFixed(2)}). ` +
        `Please adjust the cheque amounts before posting.`
      );
      return false;
    }

    // ── Cheque amounts must sum to receipt total ──────────────
    if (this.form.numberOfChecks > 0) {
      const sumChecks = this.form.checks.reduce((s, c) => s + (+c.amount || 0), 0);
      const diff      = Math.abs(sumChecks - this.form.receiptTotal);
      if (diff > 0.01) {
        alert(
          `Cheque total (${sumChecks.toFixed(2)}) does not match ` +
          `Receipt Total (${this.form.receiptTotal.toFixed(2)}).`
        );
        return false;
      }
    }

    return true;
  }

  // ── Helpers ────────────────────────────────────────────────
  private generateInvoiceNumber(type: InvoiceType): string {
    const prefix = type === 'Renewal' ? 'INV-RNW-' : 'INV-';
    return prefix + Math.floor(100000 + Math.random() * 900000);
  }

  private populateRenewalFromPreviousInvoice(): void {
    this.form.customer     = 'C00002';
    this.form.customerName = 'Delta Auto Spare Parts';
    this.form.propertyId   = 'P1001';
    this.form.propertyName = 'Gargash Al Nasr Building';
    this.form.unitNo       = 'B-1204';
    this.form.purposeOfLease = 'Commercial';
  }

  private buildEmptyForm(): ReceiptForm {
    return {
      receiptNumber:          '',
      receiptDate:            '',
      customer:               '',
      customerName:           '',
      landlordCode:           '',
      landlordName:           '',
      propertyId:             '',
      propertyName:           '',
      unitNo:                 '',
      invoiceNumber:          '',
      invoiceDate:            '',
      invoiceType:            'New',
      previousInvoiceNumber:  '',
      purposeOfLease:         'Commercial',
      multipleInvoices:       false,
      periodFrom:             '',
      periodTo:               '',
      status:                 'Draft',

      gracePeriodStart:       '',
      gracePeriodEnd:         '',

      contractNumber:         '',
      contractDate:           '',
      documentNumber:         '',
      ejariNumber:            '',

      annualRent:             0,
      rentAmount:             0,
      rentTaxGroup:           'Standard VAT',
      rentTaxRate:            5,
      rentTaxAmount:          0,
      rentTotal:              0,

      depositAmount:          0,
      depositTaxGroup:        'Zero Rated',
      depositTaxRate:         0,
      depositTaxAmount:       0,
      depositTotal:           0,

      adminFeeAmount:         0,
      adminFeeTaxGroup:       'Standard VAT',
      adminFeeTaxRate:        5,
      adminFeeTaxAmount:      0,
      adminFeeTotal:          0,

      // Additional / Penalty
      penaltyCause:           '',
      penaltyApplyTax:        false,
      penaltyAmount:          0,
      penaltyTaxGroup:        'Standard VAT',
      penaltyTaxRate:         5,
      penaltyTaxAmount:       0,
      penaltyTotal:           0,

      subTotal:               0,
      taxTotal:               0,
      invoiceTotal:           0,
      lastReceiptTotal:       0,
      receiptTotal:           0,
      balanceAmount:          0,
      grandTotal:             0,

      detailsBank:            '',
      numberOfChecks:         0,
      checks:                 [],
      attachments:            [],

      leaveDate:              '',
      earlyTermination:       false,
      settlementStatus:       '',
    };
  }
}