  import { Component, OnInit } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { FormsModule } from '@angular/forms';

  import { RentalDetailsTabComponent } from './tabs/rental-details-tab/rental-details-tab.component';
  import { ReceiptDetailsTabComponent } from './tabs/receipt-details-tab/receipt-details-tab.component';
  import { SettlementDetailsTabComponent } from './tabs/settlement-details-tab/settlement-details-tab.component';
  import { CheckItem } from './utils/receipt-calculation';

  export type ReceiptTab = 'rental' | 'receipt' | 'settlement';

  // 🔥 NEW: attachment model
  export interface ReceiptAttachment {
    id: string;
    name: string;
    size: number;
    type: string;
    file: File;       // kept in memory until uploaded to backend
    uploadedAt: string;
  }

  // 🔥 NEW: explicit workflow status type
  export type ReceiptStatus = 'Draft' | 'Posted' | 'Cancelled';

  export interface ReceiptForm {
    // ── Header ────────────────────────────────────────────────
    receiptNumber: string;
    receiptDate: string;
    customer: string;
    customerName: string;
    landlordCode: string;
    landlordName: string;
    propertyId: string;
    unitNo: string;
    invoiceNumber: string;
    multipleInvoices: boolean;
    periodFrom: string;
    periodTo: string;
    status: ReceiptStatus;          // 🔥 changed from string

    // ── Rental Details (Charge Table) ─────────────────────────
    annualRent: number;
    rentAmount: number;
    rentTaxGroup: string;
    rentTaxRate: number;
    rentTaxAmount: number;
    rentTotal: number;

    depositAmount: number;
    depositTaxGroup: string;
    depositTaxRate: number;
    depositTaxAmount: number;
    depositTotal: number;

    adminFeeAmount: number;
    adminFeeTaxGroup: string;
    adminFeeTaxRate: number;
    adminFeeTaxAmount: number;
    adminFeeTotal: number;

    otherDescription: string;
    otherAmount: number;
    otherTaxGroup: string;
    otherTaxRate: number;
    otherTaxAmount: number;
    otherTotal: number;

    // ── Financials ─────────────────────────────────────────────
    invoiceTotal: number;
    lastReceiptTotal: number;
    receiptTotal: number;
    balanceAmount: number;

    // ── Receipt Details ────────────────────────────────────────
    detailsBank: string;
    numberOfChecks: number;
    checks: CheckItem[];
    attachments: ReceiptAttachment[];   // 🔥 NEW

    // ── Settlement ───────────────────────────────────────────
    leaveDate: string;
    earlyTermination: boolean;
    settlementStatus: 'Fully Paid' | 'Partially Paid' | 'Outstanding' | '';
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

    ngOnInit(): void {
      this.form.receiptNumber = 'RCP-' + Date.now();
    }

    // ── Tab Navigation ───────────────────────────────────────────
    setTab(tab: ReceiptTab): void {
      this.activeTab = tab;
    }



    // ── Lookup Openers ─────────────────────────────────────────
    openInvoiceLookup(): void {
      console.log('Open invoice lookup');
    }
    openCustomerLookup(): void {
      console.log('Open customer lookup');
    }
    openLandlordLookup(): void {
      console.log('Open landlord lookup');
    }
    openPropertyLookup(): void {
      console.log('Open property lookup');
    }

    resetReceipt(): void {
      const newNumber = 'RCP-' + Date.now();
      this.form = this.buildEmptyForm();
      this.form.receiptNumber = newNumber;
      this.activeTab = 'rental';
    }
// 🔥 UPDATED: replaced single isLocked() with per-button rules
  canSaveDraft(): boolean {
    return this.form.status === 'Draft';
  }

  canPost(): boolean {
    return this.form.status === 'Draft';
  }

  canPrint(): boolean {
    // Printing only makes sense once the receipt is finalized in some way
    return this.form.status === 'Posted' || this.form.status === 'Cancelled';
  }

  canCancel(): boolean {
    return this.form.status === 'Draft' || this.form.status === 'Posted';
  }

  // kept for any other place in the code that still checks "is this editable at all"
  isLocked(): boolean {
    return this.form.status === 'Posted' || this.form.status === 'Cancelled';
  }
    // ── 🔥 NEW: Save Draft ──────────────────────────────────────
 saveDraft(): void {
    if (!this.canSaveDraft()) {
      alert('This receipt can no longer be saved as draft.');
      return;
    }
    this.form.status = 'Draft';
    console.log('Saving as DRAFT:', this.form);
  }

  postReceipt(): void {
    if (!this.canPost()) {
      alert('This receipt has already been finalized.');
      return;
    }
    if (!this.validateBeforePost()) return;

    this.form.status = 'Posted';
    console.log('POSTING receipt (final):', this.form);
  }

  cancelReceipt(): void {
    if (!this.canCancel()) {
      alert('This receipt cannot be cancelled.');
      return;
    }
    const confirmed = window.confirm(
      'Cancelling will reverse this receipt and restore the invoice outstanding amount. Continue?'
    );
    if (!confirmed) return;

    const wasPosted = this.form.status === 'Posted';
    this.form.status = 'Cancelled';
    console.log('CANCELLING receipt. Was posted before cancel:', wasPosted, this.form);
  }
    // ── 🔥 NEW: validation before posting ────────────────────────
    private validateBeforePost(): boolean {
      if (!this.form.invoiceNumber) {
        alert('Please select an invoice before posting.');
        return false;
      }

      if (this.form.numberOfChecks > 0) {
        const sumChecks = this.form.checks.reduce(
          (sum, c) => sum + (+c.amount || 0),
          0
        );
        const diff = Math.abs(sumChecks - this.form.receiptTotal);
        if (diff > 0.01) {
          alert(
            `Check total (${sumChecks.toFixed(2)}) does not match Receipt Total (${this.form.receiptTotal.toFixed(2)}).`
          );
          return false;
        }
      }

      return true;
    }

    // ── Print ────────────────────────────────────────────────────
    printReceipt(): void {
      window.print();
    }

    // ── helper to keep resetReceipt() / initial form in sync ─────
    private buildEmptyForm(): ReceiptForm {
      return {
        receiptNumber: '',
        receiptDate: '',
        customer: '',
        customerName: '',
        landlordCode: '',
        landlordName: '',
        propertyId: '',
        unitNo: '',
        invoiceNumber: '',
        multipleInvoices: false,
        periodFrom: '',
        periodTo: '',
        status: 'Draft', // 🔥 default is now Draft, not 'Entered'

        annualRent: 0,
        rentAmount: 0, rentTaxGroup: 'Standard VAT', rentTaxRate: 5, rentTaxAmount: 0, rentTotal: 0,
        depositAmount: 0, depositTaxGroup: 'Zero Rated', depositTaxRate: 0, depositTaxAmount: 0, depositTotal: 0,
        adminFeeAmount: 0, adminFeeTaxGroup: 'Standard VAT', adminFeeTaxRate: 5, adminFeeTaxAmount: 0, adminFeeTotal: 0,
        otherDescription: '', otherAmount: 0, otherTaxGroup: 'Out of Scope', otherTaxRate: 0, otherTaxAmount: 0, otherTotal: 0,

        invoiceTotal: 0,
        lastReceiptTotal: 0,
        receiptTotal: 0,
        balanceAmount: 0,

        detailsBank: '',
        numberOfChecks: 0,
        checks: [],
        attachments: [], // 🔥 NEW

        leaveDate: '',
        earlyTermination: false,
        settlementStatus: '',
      };
    }
  }