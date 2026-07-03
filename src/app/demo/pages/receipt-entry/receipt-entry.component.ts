import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { RentalDetailsTabComponent }     from './tabs/rental-details-tab/rental-details-tab.component';
import { ReceiptDetailsTabComponent }    from './tabs/receipt-details-tab/receipt-details-tab.component';
import { SettlementDetailsTabComponent } from './tabs/settlement-details-tab/settlement-details-tab.component';
import { CheckItem } from './utils/receipt-calculation';
import { TyAttachment } from '../../../models/attachment.model';
import { InvoiceService } from '../../../services/invoice.service';
import { DocumentNumberService } from '../../../services/document-number.service';
import {
  Invoice,
  InvoiceRequest,
  InvoiceDetail,
  InvoiceTax,
} from '../../../models/invoice.model';

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
  invoiceId:              number | null;

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

  penaltyCause:           string;
  penaltyApplyTax:        boolean;
  penaltyAmount:          number;
  penaltyTaxGroup:        string;
  penaltyTaxRate:         number;
  penaltyTaxAmount:       number;
  penaltyTotal:           number;

  subTotal:               number;
  taxTotal:               number;
  invoiceTotal:           number;
  lastReceiptTotal:       number;
  receiptTotal:           number;
  balanceAmount:          number;
  grandTotal:             number;

  detailsBank:            string;
  numberOfChecks:         number;
  checks:                 CheckItem[];
  attachments:            TyAttachment[];

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

  isSaving  = false;
  isLoading = false;

  // ── Invoice lookup state ────────────────────────────────────
  showInvoiceLookup = false;
  invoiceResults: Invoice[] = [];
  invoiceLookupLoading = false;

  constructor(
    private invoiceService: InvoiceService,
    private documentNumberService: DocumentNumberService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.loadInvoice(+idParam);
      return;
    }

    const today = new Date().toISOString().substring(0, 10);
    this.form.receiptDate = today; // receipt numbering not mapped yet — stays local
    this.form.receiptNumber = 'RCP-' + Date.now();
    this.form.invoiceDate = today;

    this.documentNumberService.getNext('Invoice').subscribe({
  next: (res) => {
    if (res.success && res.data) {
      this.form.invoiceNumber = res.data.number;
    } else {
      this.form.invoiceNumber = 'INV-' + Date.now();
    }
  },
  error: (err) => {
    console.error('Failed to fetch invoice number:', err);
    this.form.invoiceNumber = 'INV-' + Date.now();
  },
    });

    this.openTypeModal();
  }

  setTab(tab: ReceiptTab): void { this.activeTab = tab; }

  openTypeModal(): void {
    this.showTypeModal              = true;
    this.modalInvoiceType           = this.form.invoiceType;
    this.modalPreviousInvoiceNumber = this.form.previousInvoiceNumber;
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

    this.showTypeModal        = false;
    this.invoiceSetupComplete = true;

    if (this.form.invoiceType === 'Renewal' && this.form.previousInvoiceNumber) {
      this.loadPreviousInvoiceByNumber(this.form.previousInvoiceNumber);
    }
  }

  // ── Invoice Lookup ───────────────────────────────────────────
  openInvoiceLookup(): void {
    this.showInvoiceLookup = true;
    this.invoiceLookupLoading = true;
    this.invoiceService.getAll().subscribe({
      next: (res) => {
        this.invoiceLookupLoading = false;
        if (res.success) {
          this.invoiceResults = res.data;
        } else {
          alert(res.message || 'Failed to load invoices.');
        }
      },
      error: (err) => {
        this.invoiceLookupLoading = false;
        console.error('Invoice lookup failed:', err);
        alert('Failed to load invoices.');
      },
    });
  }

  closeInvoiceLookup(): void {
    this.showInvoiceLookup = false;
  }

  selectInvoiceFromLookup(invoice: Invoice): void {
    this.showInvoiceLookup = false;
    this.loadInvoice(invoice.id);
  }

  private loadPreviousInvoiceByNumber(invoiceNumber: string): void {
    this.invoiceService.getAll().subscribe({
      next: (res) => {
        const match = res.data.find((inv: any) => inv.invoiceNumber === invoiceNumber);
        if (match) {
          this.loadInvoice(match.id);
        } else {
          alert(`Invoice ${invoiceNumber} not found.`);
        }
      },
      error: (err) => {
        console.error('Invoice search failed:', err);
        alert('Failed to search for the previous invoice.');
      },
    });
  }

  openCustomerLookup(): void {
    console.warn('No customer lookup API; select an invoice instead.');
  }

  openLandlordLookup(): void {
    console.warn('No landlord lookup API; select an invoice instead.');
  }

  openPropertyLookup(): void {
    console.log('Property lookup — will be mapped in a later step.');
  }

  resetReceipt(): void {
    const today = new Date().toISOString().substring(0, 10);
    this.form               = this.buildEmptyForm();
    this.form.receiptNumber = 'RCP-' + Date.now();
    this.form.receiptDate   = today;
    this.form.invoiceDate   = today;

    this.documentNumberService.getNext('Invoice').subscribe({
  next: (res) => {
    if (res.success && res.data) {
      this.form.invoiceNumber = res.data.number;
    } else {
      this.form.invoiceNumber = 'INV-' + Date.now();
    }
  },
  error: () => this.form.invoiceNumber = 'INV-' + Date.now(),
});

    this.activeTab            = 'rental';
    this.invoiceSetupComplete = false;
    this.openTypeModal();
  }

  canSaveDraft(): boolean { return this.form.status === 'Draft'; }
  canPost():      boolean { return this.form.status === 'Draft'; }
  canPrint():     boolean { return this.form.status === 'Posted' || this.form.status === 'Cancelled'; }
  canCancel():    boolean { return this.form.status === 'Draft'  || this.form.status === 'Posted'; }
  isLocked():     boolean { return this.form.status === 'Posted' || this.form.status === 'Cancelled'; }

  // ── Load Invoice ─────────────────────────────────────────────
  loadInvoice(id: number): void {
    this.isLoading = true;
    this.invoiceService.getById(id).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.applyInvoiceToForm(res.data);
          this.invoiceSetupComplete = true;
        } else {
          alert(res.message || 'Failed to load invoice.');
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Load invoice failed:', err);
        alert('Failed to load invoice.');
      },
    });
  }

  private applyInvoiceToForm(invoice: Invoice): void {
    this.form.invoiceId       = invoice.id;
    this.form.invoiceNumber   = invoice.invoiceNumber;
    this.form.invoiceDate     = this.toDateInput(invoice.invoiceDate);
    this.form.invoiceType     = (invoice.invoiceType?.toLowerCase() === 'renewal') ? 'Renewal' : 'New';

    this.form.customer        = invoice.customer;
    this.form.customerName    = invoice.customerName;
    this.form.landlordCode    = invoice.landlordCode;
    this.form.landlordName    = invoice.landlordName;
    this.form.propertyId      = invoice.propertyId;
    this.form.propertyName    = invoice.propertyName;
    this.form.unitNo          = invoice.unitNo;
    this.form.purposeOfLease  = invoice.purposeOfLease;
    this.form.multipleInvoices = invoice.multipleUnits;

    this.form.periodFrom      = this.toDateInput(invoice.periodFrom);
    this.form.periodTo        = this.toDateInput(invoice.periodTo);

    this.form.contractNumber  = invoice.contractNo;
    this.form.contractDate    = this.toDateInput(invoice.contractDate);
    this.form.documentNumber  = invoice.documentNumber;
    this.form.ejariNumber     = invoice.ejariNumber;

    this.form.gracePeriodStart = this.toDateInput(invoice.gracePeriodStartDate);
    this.form.gracePeriodEnd   = this.toDateInput(invoice.gracePeriodEndDate);

    this.form.annualRent      = invoice.annualRent;

    const findAmount = (type: string) =>
      invoice.details?.find(d => d.serviceType === type)?.amount ?? 0;

    this.form.rentAmount      = findAmount('Rent');
    this.form.depositAmount   = invoice.securityDeposit || findAmount('Deposit');
    this.form.adminFeeAmount  = findAmount('AdminFee');
    this.form.penaltyAmount   = findAmount('Penalty');

    this.form.subTotal        = invoice.documentAmount;
    this.form.taxTotal        = invoice.taxAmount;
    this.form.invoiceTotal    = invoice.documentTotal;
    this.form.balanceAmount   = invoice.outstandingAmount;

    this.form.status = 'Draft';
  }

  // ── Save Draft ───────────────────────────────────────────────
  saveDraft(): void {
    if (!this.canSaveDraft()) { alert('This receipt can no longer be saved as draft.'); return; }

    const payload = this.mapFormToInvoiceRequest();
    if (!payload) return;

    this.isSaving = true;

    const request$ = this.form.invoiceId
      ? this.invoiceService.update(this.form.invoiceId, payload)
      : this.invoiceService.create(payload);

    request$.subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success && res.data) {
          this.form.invoiceId = res.data.id;
          this.form.status    = 'Draft';
          console.log('Invoice saved as DRAFT:', res.data);
        } else {
          alert(res.message || 'Failed to save invoice.');
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Save invoice failed:', err);
        const apiMsg = err?.error?.errors
          ? Object.values(err.error.errors).flat().join('\n')
          : err?.error?.message;
        alert(apiMsg || 'Failed to save invoice. Please check the amounts and try again.');
      },
    });
  }

  // ── Post ─────────────────────────────────────────────────────
  postReceipt(): void {
    if (!this.canPost()) { alert('This receipt has already been finalized.'); return; }
    if (!this.validateBeforePost()) return;

    if (!this.form.invoiceId) {
      const payload = this.mapFormToInvoiceRequest();
      if (!payload) return;

      this.isSaving = true;
      this.invoiceService.create(payload).subscribe({
        next: (res) => {
          this.isSaving = false;
          if (res.success && res.data) {
            this.form.invoiceId = res.data.id;
            this.doPost(this.form.invoiceId);
          } else {
            alert(res.message || 'Failed to create invoice before posting.');
          }
        },
        error: (err) => {
          this.isSaving = false;
          console.error('Create before post failed:', err);
          alert('Failed to save invoice before posting.');
        },
      });
      return;
    }

    this.doPost(this.form.invoiceId);
  }

  private doPost(id: number): void {
    this.isSaving = true;
    this.invoiceService.post(id).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success) {
          this.form.status = 'Posted';
          console.log('Invoice POSTED:', res.data);
        } else {
          alert(res.message || 'Failed to post invoice.');
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Post invoice failed:', err);
        alert('Failed to post invoice. Please try again.');
      },
    });
  }

  // ── Cancel ───────────────────────────────────────────────────
  cancelReceipt(): void {
    if (!this.canCancel()) { alert('This receipt cannot be cancelled.'); return; }
    if (!this.form.invoiceId) { alert('This invoice has not been saved yet.'); return; }

    const confirmed = window.confirm(
      'Cancelling will reverse this invoice and restore the outstanding amount. Continue?'
    );
    if (!confirmed) return;

    this.isSaving = true;
    this.invoiceService.cancel(this.form.invoiceId).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success) {
          this.form.status = 'Cancelled';
          console.log('Invoice CANCELLED:', res.data);
        } else {
          alert(res.message || 'Failed to cancel invoice.');
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Cancel invoice failed:', err);
        alert('Failed to cancel invoice. Please try again.');
      },
    });
  }

  printReceipt(): void { window.print(); }

  // ── Validation ─────────────────────────────────────────────
  requiredFields: string[] = [];

  isRequired(field: keyof ReceiptForm): boolean {
    return this.requiredFields.includes(field as string);
  }

  validateRequiredFields(): boolean {
    this.requiredFields = [];

    // NOTE: 'annualRent' intentionally excluded — its input is commented
    // out in the template and it's populated automatically via invoice
    // lookup instead. Keeping it here would make validation impossible
    // to pass on a fresh 'New' invoice.
    const fields: (keyof ReceiptForm)[] = [
      'customer', 'customerName',
      'propertyId', 'propertyName', 'unitNo',
      'contractNumber', 'contractDate',
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

    if (this.form.grandTotal > this.form.invoiceTotal + 0.005) {
      alert(
        `Grand Total (AED ${this.form.grandTotal.toFixed(2)}) exceeds ` +
        `Invoice Total (AED ${this.form.invoiceTotal.toFixed(2)}). ` +
        `Please adjust the cheque amounts before posting.`
      );
      return false;
    }

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

  // ── DTO Mapper: ReceiptForm → InvoiceRequest ──────────────────
  private mapFormToInvoiceRequest(): InvoiceRequest | null {
    const details: InvoiceDetail[] = [];
    let lineNo = 1;

    if (this.form.rentAmount > 0) {
      details.push({
        lineNo: lineNo++, unitNo: this.form.unitNo, serviceType: 'Rent',
        description: 'Annual Rent', amount: this.form.rentAmount, remarks: '',
      });
    }
    if (this.form.depositAmount > 0) {
      details.push({
        lineNo: lineNo++, unitNo: this.form.unitNo, serviceType: 'Deposit',
        description: 'Security Deposit', amount: this.form.depositAmount, remarks: '',
      });
    }
    if (this.form.adminFeeAmount > 0) {
      details.push({
        lineNo: lineNo++, unitNo: this.form.unitNo, serviceType: 'AdminFee',
        description: 'Administration Fee', amount: this.form.adminFeeAmount, remarks: '',
      });
    }
    if (this.form.penaltyAmount > 0) {
      details.push({
        lineNo: lineNo++, unitNo: this.form.unitNo, serviceType: 'Penalty',
        description: this.form.penaltyCause || 'Additional Charge', amount: this.form.penaltyAmount, remarks: '',
      });
    }

    if (details.length === 0) {
      alert('Please enter at least one charge amount (Rent, Deposit, Admin Fee, or Penalty) greater than 0.');
      return null;
    }

    const taxes: InvoiceTax[] = [];
    if (this.form.rentTaxAmount > 0) {
      taxes.push({
        taxGroup: this.form.rentTaxGroup, calculateTax: this.form.rentTaxRate > 0,
        taxAuthority: 'FTA', customerTaxClass: 'Standard',
        taxBase: this.form.rentAmount, taxAmount: this.form.rentTaxAmount,
      });
    }
    if (this.form.depositTaxAmount > 0) {
      taxes.push({
        taxGroup: this.form.depositTaxGroup, calculateTax: this.form.depositTaxRate > 0,
        taxAuthority: 'FTA', customerTaxClass: 'Standard',
        taxBase: this.form.depositAmount, taxAmount: this.form.depositTaxAmount,
      });
    }
    if (this.form.adminFeeTaxAmount > 0) {
      taxes.push({
        taxGroup: this.form.adminFeeTaxGroup, calculateTax: this.form.adminFeeTaxRate > 0,
        taxAuthority: 'FTA', customerTaxClass: 'Standard',
        taxBase: this.form.adminFeeAmount, taxAmount: this.form.adminFeeTaxAmount,
      });
    }
    if (this.form.penaltyTaxAmount > 0) {
      taxes.push({
        taxGroup: this.form.penaltyTaxGroup, calculateTax: this.form.penaltyTaxRate > 0,
        taxAuthority: 'FTA', customerTaxClass: 'Standard',
        taxBase: this.form.penaltyAmount, taxAmount: this.form.penaltyTaxAmount,
      });
    }

    return {
      invoiceNumber:        this.form.invoiceNumber,
      invoiceType:          this.form.invoiceType.toLowerCase(),
      invoiceDate:          this.toIso(this.form.invoiceDate),
      customer:             this.form.customer,
      customerName:         this.form.customerName,
      landlordCode:         this.form.landlordCode,
      landlordName:         this.form.landlordName,
      propertyId:           this.form.propertyId,
      propertyName:         this.form.propertyName,
      purposeOfLease:       this.form.purposeOfLease,
      buildingStatus:       '',
      unitNo:               this.form.unitNo,
      multipleUnits:        this.form.multipleInvoices,
      periodFrom:           this.toIso(this.form.periodFrom),
      periodTo:             this.toIso(this.form.periodTo),
      leaseType:            this.form.purposeOfLease,
      securityDeposit:      this.form.depositAmount,
      annualRent:           this.form.annualRent,
      gracePeriodStartDate: this.toIso(this.form.gracePeriodStart),
      gracePeriodEndDate:   this.toIso(this.form.gracePeriodEnd),
      contractNo:           this.form.contractNumber,
      contractDate:         this.toIso(this.form.contractDate),
      documentNumber:       this.form.documentNumber,
      ejariNumber:          this.form.ejariNumber,
      comments:             '',
      details,
      taxes,
    };
  }

  // ── Date helpers ─────────────────────────────────────────────
  private toIso(dateStr: string): string {
    if (!dateStr) return new Date().toISOString();
    return new Date(dateStr).toISOString();
  }

  private toDateInput(isoStr: string): string {
    if (!isoStr) return '';
    return isoStr.substring(0, 10);
  }

  // ── buildEmptyForm ────────────────────────────────────────────
  private buildEmptyForm(): ReceiptForm {
    return {
      invoiceId:              null,

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