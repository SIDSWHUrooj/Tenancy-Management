import { Component, OnInit, HostListener, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { RentalDetailsTabComponent }     from './tabs/rental-details-tab/rental-details-tab.component';
import { ReceiptDetailsTabComponent }    from './tabs/receipt-details-tab/receipt-details-tab.component';
import { SettlementDetailsTabComponent } from './tabs/settlement-details-tab/settlement-details-tab.component';
import { CheckItem } from './utils/receipt-calculation';
import { TyAttachment } from '../../../models/attachment.model';
import { InvoiceService } from '../../../services/invoice.service';
import { ReceiptService } from '../../../services/receipt.service';
import { DocumentNumberService } from '../../../services/document-number.service';
import { ChequeService } from '../../../services/cheque.service';
import { ChequeRequest } from '../../../models/cheque.model';
import { ReceiptRequest } from '../../../models/receipt.model';
import {
  Invoice,
  InvoiceRequest,
  InvoiceDetail,
  InvoiceTax,
} from '../../../models/invoice.model';
import { FinalSettlementService } from '../../../services/final-settlement.service';
import { FinalSettlement, FinalSettlementRequest, FinalSettlementCreditNoteRequest } from '../../../models/final-settlement.model';
import { ContractService } from '../../../services/contract.service';
import { CreateContractRequest } from '../../../models/contract.model';
import { PropertyService } from '../../../services/property.service';
import { Property } from '../../../models/property.model';
import { UnitService } from '../../../services/unit.service';
import { Unit } from '../../../models/unit.model';

export type ReceiptTab    = 'rental' | 'receipt' | 'settlement';
export type InvoiceType   = 'New' | 'Renewal';
export type ReceiptStatus = 'Draft' | 'Posted' | 'Cancelled';

export interface AdditionalCharge {
  id: string;
  cause: string;
  amount: number;
  taxGroup: 'Standard VAT' | 'Zero Rated' | 'Out of Scope';
  taxRate: number;
  taxAmount: number;
  total: number;
  description: string;
  referenceNo?: string;
}
export interface ReceiptAttachment {
  id:         string;
  name:       string;
  size:       number;
  type:       string;
  file:       File;
  uploadedAt: string;
}

export interface InvoiceForm {
  invoiceId:              number | null;
  checksSource:           'backend' | 'auto' | 'manual';

  // ── Workflow state flags ─────────────────────────────────────
  /** True once Rental Details have been saved & posted via /invoices/{id}/post */
  rentalPosted:           boolean;
  /** True once Receipt Details have been saved & posted via /receipts/{id}/post */
  receiptPosted:          boolean;
  /** Backend ID of the TYReceipt record linked to this invoice */
  receiptId:              number | null;
  /** Status of the receipt record ('Draft' | 'Posted' | 'Cancelled') */
  receiptStatus:          ReceiptStatus;

  /** Backend ID of the TYFinalSettlement record linked to this invoice/receipt */
  settlementId:           number | null;

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

  contractId?:            number;
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

  additionalCharges: AdditionalCharge[];


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
  
  adminFeeReference:      string;
  depositReference:       string;
  penaltyReference:       string;

  leaveDate:              string;
  earlyTermination:       boolean;
  settlementStatus:       string;
  settlementNumber:       string;

  recurringDays:          number;
  recurringAmount:        number;
  daysConsumed:           number;
  rentCollected:          number;
  securityDepositCollected: number;
  rentForDaysConsumed:    number;
  rentForUnutilizedDays:  number;
  creditNotes:            any[];
  
  // New Settlement Calcs
  totalContractDays:      number;
  remainingDays:          number;
  dailyRent:              number;
  rentRefund:             number;
  securityDepositRefund:  number;
  grandRefund:            number;
  isSettlementCalculated: boolean;
}

@Component({
  selector: 'app-invoice-entry',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RentalDetailsTabComponent,
    ReceiptDetailsTabComponent,
    SettlementDetailsTabComponent,
  ],
  templateUrl: './invoice-entry.component.html',
  styleUrls: ['./invoice-entry.component.scss'],
})
export class InvoiceEntryComponent implements OnInit {
  activeTab: ReceiptTab = 'rental';
  form: InvoiceForm = this.buildEmptyForm();

  showTypeModal        = false;
  invoiceSetupComplete = false;
  modalInvoiceType: InvoiceType = 'New';
  modalPreviousInvoiceNumber    = '';
  invoiceLookupMode: 'main' | 'previous' = 'main';

  invoiceTypes: InvoiceType[] = ['New', 'Renewal'];

  isSaving  = false;
  isLoading = false;

  // ── Invoice lookup state (legacy modal) ─────────────────────
  showInvoiceLookup    = false;
  invoiceResults: Invoice[] = [];
  invoiceLookupLoading = false;

  showPropertyLookup = false;
  propertiesList: Property[] = [];
  filteredProperties: Property[] = [];
  propertyModalFilter = '';

  // ── Unit Lookup ──────────────────────────────────────────────
  showUnitLookup = false;
  unitsList: Unit[] = [];
  filteredUnits: Unit[] = [];
  unitModalFilter = '';

  // ── Invoice search dropdown state ───────────────────────────
  invoiceSearchQuery          = '';
  showInvoiceDropdown         = false;
  invoiceDropdownLoading      = false;
  filteredInvoiceDropdown: Invoice[] = [];
  private allInvoicesCache: Invoice[]  = [];
  private invoicesCacheLoaded          = false;

  // ── Invoice lookup modal filter state ───────────────────────
  invoiceModalFilter       = '';
  filteredInvoiceResults: Invoice[] = [];

  constructor(
    private invoiceService: InvoiceService,
    private receiptService: ReceiptService,
    private documentNumberService: DocumentNumberService,
    private chequeService: ChequeService,
    private finalSettlementService: FinalSettlementService,
    private contractService: ContractService,
    private propertyService: PropertyService,
    private unitService: UnitService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private elRef: ElementRef,
  ) {}
  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.loadInvoice(+idParam);
      this.loadProperties();
      this.loadUnits();
      return;
    }

    this.loadProperties();
    this.loadUnits();

    const today = new Date().toISOString().substring(0, 10);
    this.form.receiptDate = today; // receipt numbering not mapped yet — stays local
    this.form.receiptNumber = 'RCP-' + Date.now();
    this.form.invoiceDate = today;

    this.fetchDocumentNumbers();

    this.openTypeModal();
  }

  setTab(tab: ReceiptTab): void { this.activeTab = tab; }

  // ── Close dropdown when clicking outside the component ──────────
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.showInvoiceDropdown = false;
    }
  }

  // ── Invoice Search Dropdown ──────────────────────────────────
  onInvoiceSearchFocus(): void {
    this.showInvoiceDropdown = true;
    if (!this.invoicesCacheLoaded) {
      this.loadInvoicesForDropdown();
    } else {
      this.filterInvoiceDropdown();
    }
  }

  onInvoiceSearchInput(): void {
    this.showInvoiceDropdown = true;
    if (!this.invoicesCacheLoaded) {
      this.loadInvoicesForDropdown();
    } else {
      this.filterInvoiceDropdown();
    }
  }

  private loadInvoicesForDropdown(): void {
    this.invoiceDropdownLoading = true;
    this.invoiceService.getAll().subscribe({
      next: (res) => {
        this.invoiceDropdownLoading = false;
        const data: any = res?.data;
        this.allInvoicesCache = Array.isArray(data)
          ? data
          : Array.isArray(data?.items) ? data.items : [];
        this.invoicesCacheLoaded = true;
        this.filterInvoiceDropdown();
        this.cdr.detectChanges();
      },
      error: () => {
        this.invoiceDropdownLoading = false;
        this.filteredInvoiceDropdown = [];
        this.cdr.detectChanges();
      },
    });
  }

  private filterInvoiceDropdown(): void {
    const q = (this.invoiceSearchQuery || '').toLowerCase().trim();
    this.filteredInvoiceDropdown = q
      ? this.allInvoicesCache.filter(inv =>
          (inv.invoiceNumber || '').toLowerCase().includes(q) ||
          (inv.customerName  || '').toLowerCase().includes(q) ||
          (inv.propertyName  || '').toLowerCase().includes(q)
        )
      : this.allInvoicesCache.slice(0, 50);
  }

  clearInvoiceSearch(): void {
    this.invoiceSearchQuery  = '';
    this.showInvoiceDropdown = false;
  }

  selectInvoiceFromDropdown(invoice: Invoice): void {
    this.invoiceSearchQuery  = invoice.invoiceNumber;
    this.showInvoiceDropdown = false;
    this.loadInvoice(invoice.id);
  }

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
      this.loadRenewalDetailsByInvoiceNumber();
    }
  }

  // ── Invoice Lookup ───────────────────────────────────────────
  openInvoiceLookup(mode: 'main' | 'previous' = 'main'): void {
    this.invoiceLookupMode    = mode;
    this.showInvoiceLookup    = true;
    this.invoiceLookupLoading = true;
    this.invoiceResults       = [];
    this.filteredInvoiceResults = [];
    this.invoiceModalFilter   = '';

    this.invoiceService.getAll().subscribe({
      next: (res) => {
        this.invoiceLookupLoading = false;

        if (!res || res.success === false) {
          alert(res?.message || 'Failed to load invoices.');
          this.cdr.detectChanges();
          return;
        }

        // Handle both "data: Invoice[]" and "data: { items: Invoice[] }" shapes
        const data: any = res.data;
        this.invoiceResults = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : [];

        this.filteredInvoiceResults = this.invoiceResults;

        if (this.invoiceResults.length === 0) {
          console.warn('Invoice lookup returned no rows. Raw response:', res);
        }

        // Force the table to render immediately — no Ctrl+S needed.
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.invoiceLookupLoading = false;
        console.error('Invoice lookup failed:', err);
        alert(err?.error?.message || 'Failed to load invoices. Check console for details.');
        this.cdr.detectChanges();
      },
    });
  }
  closeInvoiceLookup(): void {
    this.showInvoiceLookup  = false;
    this.invoiceModalFilter = '';
    this.filteredInvoiceResults = [];
  }

  filterModalInvoices(): void {
    const q = (this.invoiceModalFilter || '').toLowerCase().trim();
    this.filteredInvoiceResults = q
      ? this.invoiceResults.filter(inv =>
          (inv.invoiceNumber || '').toLowerCase().includes(q) ||
          (inv.customerName  || '').toLowerCase().includes(q) ||
          (inv.propertyName  || '').toLowerCase().includes(q)
        )
      : this.invoiceResults;
  }

  selectInvoiceFromLookup(invoice: Invoice): void {
    if (this.invoiceLookupMode === 'previous') {
        this.form.previousInvoiceNumber = invoice.invoiceNumber;
        this.modalPreviousInvoiceNumber = invoice.invoiceNumber;
        this.showInvoiceLookup = false;
        
        // Only auto-load if we are NOT in the type modal. 
        // If in the type modal, the 'Proceed' button will handle loading.
        if (!this.showTypeModal) {
          this.loadRenewalDetailsByInvoiceNumber();
        }
    } else {
        this.showInvoiceLookup = false;
        this.loadInvoice(invoice.id);
    }
  }



  loadRenewalDetailsByInvoiceNumber(): void {
    if (!this.form.previousInvoiceNumber) {
      alert('Please enter a Previous Invoice Number to fetch details.');
      return;
    }

    this.invoiceService.getAll().subscribe({
      next: (res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data as any).items || [];
        const match = data.find((inv: any) => inv.invoiceNumber === this.form.previousInvoiceNumber);
        if (match) {
          // Fetch full invoice details
          this.invoiceService.getById(match.id).subscribe({
            next: (fullRes) => {
              if (fullRes.success && fullRes.data) {
                const oldInvoice = fullRes.data;
                
                const findAmount = (type: string) => {
                  const t = type.toLowerCase();
                  return oldInvoice.details?.find((d: any) => (d.serviceType || '').toLowerCase() === t)?.amount ?? 0;
                };

                // Copy over static details but keep it as a NEW renewal draft
                this.form.customer = oldInvoice.customer || '';
                this.form.customerName = oldInvoice.customerName || '';
                this.form.landlordCode = oldInvoice.landlordCode || '';
                this.form.landlordName = oldInvoice.landlordName || '';
                this.form.propertyId = oldInvoice.propertyId || '';
                this.form.propertyName = oldInvoice.propertyName || '';
                this.form.unitNo = oldInvoice.unitNo || '';
                this.form.purposeOfLease = oldInvoice.purposeOfLease || 'Residential';
                this.form.multipleInvoices = oldInvoice.multipleUnits || false;
                this.form.contractNumber = oldInvoice.contractNo || '';
                this.form.ejariNumber = oldInvoice.ejariNumber || '';

                // Copy over financial amounts from old invoice
                this.form.rentAmount = findAmount('rent');
                this.form.depositAmount = findAmount('security deposit');
                this.form.adminFeeAmount = findAmount('admin fee');

                // Ensure it stays as a Renewal draft!
                this.form.invoiceType = 'Renewal';
                this.form.status = 'Draft';
                
                // Clear dates so they have to pick new ones
                this.form.periodFrom = '';
                this.form.periodTo = '';
                this.form.gracePeriodStart = '';
                this.form.gracePeriodEnd = '';
                
                // Copy over contract date if it exists
                this.form.contractDate = oldInvoice.contractDate ? this.toDateInput(oldInvoice.contractDate) : '';
                
                // Recalculate everything with the new amounts
                this.recalculateFormTotals();
                
                alert('Successfully loaded customer and property details from previous invoice! Please select the new dates and rent for this renewal.');
                this.cdr.detectChanges();
              }
            }
          });
        } else {
          alert(`Invoice ${this.form.previousInvoiceNumber} not found.`);
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

  loadProperties(): void {
    this.propertyService.getAll().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.propertiesList = res.data;
        }
      },
      error: (err) => console.error('Failed to load properties', err)
    });
  }

  onPropertyChange(): void {
    const selected = this.propertiesList.find(p => p.propertyId === this.form.propertyId);
    if (selected) {
      this.form.propertyName = selected.propertyName;
    }
  }

  openPropertyLookup(): void {
    this.showPropertyLookup = true;
    this.propertyModalFilter = '';
    this.filteredProperties = [...this.propertiesList];
  }

  closePropertyLookup(): void {
    this.showPropertyLookup = false;
  }

  filterModalProperties(): void {
    const q = (this.propertyModalFilter || '').toLowerCase().trim();
    this.filteredProperties = q
      ? this.propertiesList.filter(p => 
          (p.propertyId || '').toLowerCase().includes(q) ||
          (p.propertyName || '').toLowerCase().includes(q)
        )
      : [...this.propertiesList];
  }

  selectPropertyFromLookup(prop: Property): void {
    this.form.propertyId = prop.propertyId;
    this.form.propertyName = prop.propertyName;
    this.closePropertyLookup();
  }

  // ── Unit Lookup Logic ──────────────────────────────────────────
  loadUnits(): void {
    this.unitService.getAll().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.unitsList = res.data;
        }
      },
      error: (err) => console.error('Failed to load units:', err)
    });
  }

  openUnitLookup(): void {
    this.showUnitLookup = true;
    this.unitModalFilter = '';
    // If a property is selected, maybe filter by it immediately?
    if (this.form.propertyId) {
      this.filteredUnits = this.unitsList.filter(u => u.propertyId === this.form.propertyId);
    } else {
      this.filteredUnits = [...this.unitsList];
    }
  }

  closeUnitLookup(): void {
    this.showUnitLookup = false;
  }

  filterModalUnits(): void {
    const q = this.unitModalFilter.toLowerCase();
    let baseList = this.unitsList;
    if (this.form.propertyId) {
      baseList = baseList.filter(u => u.propertyId === this.form.propertyId);
    }
    
    if (!q) {
      this.filteredUnits = [...baseList];
      return;
    }
    this.filteredUnits = baseList.filter(u =>
      (u.unitId || '').toLowerCase().includes(q) ||
      (u.unitNo || '').toLowerCase().includes(q) ||
      (u.unitPurpose || '').toLowerCase().includes(q)
    );
  }

  selectUnitFromLookup(unit: Unit): void {
    this.form.unitNo = unit.unitNo || unit.unitId || '';
    // Map unitPurpose to Purpose of Lease
    // Make sure it matches one of the dropdown options if possible, or just set it
    const purposeMap: any = {
      'commercial': 'Commercial',
      'residential': 'Residential',
      'office': 'Office',
      'warehouse': 'Warehouse'
    };
    if (unit.unitPurpose) {
      const mapped = purposeMap[unit.unitPurpose.toLowerCase()];
      if (mapped) {
        this.form.purposeOfLease = mapped;
      } else {
        this.form.purposeOfLease = unit.unitPurpose;
      }
    }
    this.closeUnitLookup();
  }
  onPeriodFromChange(newDate: string): void {
    if (!newDate) return;
    const fromDate = new Date(newDate);
    if (isNaN(fromDate.getTime())) return;
    
    // Add 1 year and subtract 1 day to match a typical 1-year contract period
    fromDate.setFullYear(fromDate.getFullYear() + 1);
    fromDate.setDate(fromDate.getDate() - 1);
    
    // Format as YYYY-MM-DD
    const yyyy = fromDate.getFullYear();
    const mm = String(fromDate.getMonth() + 1).padStart(2, '0');
    const dd = String(fromDate.getDate()).padStart(2, '0');
    this.form.periodTo = `${yyyy}-${mm}-${dd}`;
  }


  resetReceipt(): void {
    const today = new Date().toISOString().substring(0, 10);
    this.form               = this.buildEmptyForm();
    this.form.receiptNumber = 'RCP-' + Date.now();
    this.form.receiptDate   = today;
    this.form.invoiceDate   = today;

    this.fetchDocumentNumbers();

    this.activeTab            = 'rental';
    this.invoiceSetupComplete = false;
    this.openTypeModal();
  }

  private fetchDocumentNumbers(): void {
    // Receipt
    this.documentNumberService.getNext('Receipt').subscribe({
      next: (res) => { if (res.success && res.data) this.form.receiptNumber = res.data.number; }
    });
    // Settlement
    this.documentNumberService.getNext('Settlement').subscribe({
      next: (res) => { if (res.success && res.data) this.form.settlementNumber = res.data.number; }
    });
    // Contract
    this.documentNumberService.getNext('Contract').subscribe({
      next: (res) => { if (res.success && res.data) this.form.contractNumber = res.data.number; }
    });
  }

  // ── Legacy guards (kept for any remaining usages) ───────────
  canSaveDraft(): boolean { return this.form.status === 'Draft'; }
  canPost():      boolean { return this.form.status === 'Draft'; }
  canPrint():     boolean { return this.form.status === 'Posted' || this.form.status === 'Cancelled'; }
  canCancel():    boolean { return this.form.status === 'Draft'  || this.form.status === 'Posted'; }
  isLocked():     boolean { return this.form.status === 'Posted' || this.form.status === 'Cancelled'; }

  // ── Rental Details guards ────────────────────────────────────
  canSaveRentalDraft():  boolean { return !this.form.rentalPosted && !this.isSaving; }
  canPostRental():       boolean { return !this.form.rentalPosted && !this.isSaving; }
  canCancelRental():     boolean { return this.form.rentalPosted && !this.form.receiptPosted && !!this.form.invoiceId && !this.isSaving; }
  canPrintRental():      boolean { return this.form.rentalPosted; }
  isRentalLocked():      boolean { return this.form.rentalPosted; }

  // ── Receipt Details guards ───────────────────────────────────
  canSaveReceiptDraft(): boolean { return this.form.rentalPosted && !this.form.receiptPosted && !this.isSaving; }
  canPostReceipt():      boolean { return this.form.rentalPosted && !this.form.receiptPosted && !this.isSaving; }
  canCancelReceipt():    boolean { return this.form.receiptPosted && !!this.form.receiptId && !this.isSaving; }
  canPrintReceiptDoc():  boolean { return this.form.receiptPosted; }
  isReceiptLocked():     boolean { return this.form.receiptPosted; }
  isSettlementUnlocked(): boolean { return this.form.receiptPosted; }

  // ── Rental Details actions ───────────────────────────────────
  saveRentalDraft(): void {
    if (!this.canSaveRentalDraft()) { alert('Rental details cannot be saved as draft.'); return; }
    const payload = this.mapFormToInvoiceRequest();
    if (!payload) return;
    this.isSaving = true;
    console.log('[saveRentalDraft] Sending payload:', JSON.stringify(payload, null, 2));
    const req$ = this.form.invoiceId
      ? this.invoiceService.update(this.form.invoiceId, payload)
      : this.invoiceService.create(payload);
    req$.subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success && res.data) {
          this.form = { ...this.form, invoiceId: res.data.id, status: 'Draft' };
          this.syncCheques();
          alert('Rental details saved as draft.');
        } else {
          alert(res.message || 'Failed to save rental details.');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSaving = false;
        console.error('[saveRentalDraft] Full error:', err);
        const apiErr = err?.error;
        const msg = apiErr?.errors
          ? Object.values(apiErr.errors).flat().join('\n')
          : apiErr?.message || apiErr?.title || err?.message;
        alert('Save failed: ' + (msg || 'Unknown error. Check browser console for details.'));
        this.cdr.detectChanges();
      },
    });
  }

  postRental(): void {
    if (!this.canPostRental()) { alert('Rental details have already been posted.'); return; }
    if (!this.validateBeforePost()) return;
    this.isSaving = true;

    if (!this.form.invoiceNumber) {
      this.documentNumberService.getNext('Invoice').subscribe({
        next: (res) => {
          this.form.invoiceNumber = (res.success && res.data) ? res.data.number : 'INV-' + Date.now();
          this._doPostRental();
        },
        error: () => {
          this.form.invoiceNumber = 'INV-' + Date.now();
          this._doPostRental();
        }
      });
    } else {
      this._doPostRental();
    }
  }

  private _doPostRental(): void {
    const payload = this.mapFormToInvoiceRequest();
    if (!payload) { this.isSaving = false; return; }
    console.log('[postRental] Sending payload:', JSON.stringify(payload, null, 2));
    const save$ = this.form.invoiceId
      ? this.invoiceService.update(this.form.invoiceId, payload)
      : this.invoiceService.create(payload);
    save$.subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.form = { ...this.form, invoiceId: res.data.id };
          this.syncCheques();
          this.invoiceService.post(res.data.id).subscribe({
            next: (postRes) => {
              this.isSaving = false;
              if (postRes.success) {
                this.form = { ...this.form, status: 'Posted', rentalPosted: true };
                alert('Rental details posted successfully. You can now fill in Receipt Details.');
              } else {
                alert(postRes.message || 'Failed to post rental details.');
              }
              this.cdr.detectChanges();
            },
            error: (err) => {
              this.isSaving = false;
              console.error('[postRental] Post call failed:', err);
              const apiErr = err?.error;
              const msg = apiErr?.errors
                ? Object.values(apiErr.errors).flat().join('\n')
                : apiErr?.message || apiErr?.title || err?.message;
              alert('Post failed: ' + (msg || 'Unknown error. Check browser console.'));
              this.cdr.detectChanges();
            },
          });
        } else {
          this.isSaving = false;
          alert(res.message || 'Failed to save rental details before posting.');
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error('[postRental] Save call failed:', err);
        const apiErr = err?.error;
        const msg = apiErr?.errors
          ? Object.values(apiErr.errors).flat().join('\n')
          : apiErr?.message || apiErr?.title || err?.message;
        alert('Save failed: ' + (msg || 'Unknown error. Check browser console.'));
        this.cdr.detectChanges();
      },
    });
  }

  cancelRental(): void {
    if (!this.canCancelRental()) { alert('Rental details cannot be cancelled at this stage.'); return; }
    if (!confirm('Cancel this rental invoice? This will reverse the posting.')) return;
    this.isSaving = true;
    this.invoiceService.cancel(this.form.invoiceId!).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success) {
          this.form = { ...this.form, status: 'Cancelled', rentalPosted: false };
          alert('Rental invoice cancelled.');
        } else {
          alert(res.message || 'Failed to cancel rental invoice.');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSaving = false;
        alert(err?.error?.message || 'Failed to cancel rental invoice.');
        this.cdr.detectChanges();
      },
    });
  }

  printRental(): void { window.print(); }

  // ── Receipt Details actions ──────────────────────────────────
private mapFormToReceiptRequest(): ReceiptRequest {
    const bank = this.form.detailsBank || '';
    const details: any[] = [];
    let lineNo = 1;

    // 1. Admin Fee
    if (this.form.adminFeeTotal > 0) {
      details.push({
        lineNo:       lineNo++,
        bank:         bank,
        receiptDate:  this.toIsoRequired(this.form.receiptDate),
        checkNo:      this.form.adminFeeReference || 'REF-ADM',
        checkDate:    this.toIsoRequired(this.form.periodFrom),
        paymentCode:  'CHQ', // Default or allow custom later
        customerBank: bank,
        amount:       this.form.adminFeeTotal,
        comments:     'Administration Fee',
      });
    }

    // 2. Security Deposit
    if (this.form.depositTotal > 0) {
      details.push({
        lineNo:       lineNo++,
        bank:         bank,
        receiptDate:  this.toIsoRequired(this.form.receiptDate),
        checkNo:      this.form.depositReference || 'REF-DEP',
        checkDate:    this.toIsoRequired(this.form.periodFrom),
        paymentCode:  'CHQ',
        customerBank: bank,
        amount:       this.form.depositTotal,
        comments:     'Security Deposit',
      });
    }

    // 3. Additional Charges
    if (this.form.additionalCharges?.length) {
      this.form.additionalCharges.forEach(ac => {
        if (ac.total > 0) {
          details.push({
            lineNo:       lineNo++,
            bank:         bank,
            receiptDate:  this.toIsoRequired(this.form.receiptDate),
            checkNo:      ac.referenceNo || `REF-ADD-${lineNo}`,
            checkDate:    this.toIsoRequired(this.form.periodTo),
            paymentCode:  'CHQ',
            customerBank: bank,
            amount:       ac.total,
            comments:     `Additional Charge – ${ac.cause}`,
          });
        }
      });
    }

    // 4. Rent Cheques
    this.form.checks.forEach((c: CheckItem) => {
      details.push({
        lineNo:       lineNo++,
        bank:         c.bank || bank,
        receiptDate:  this.toIsoRequired(this.form.receiptDate),
        checkNo:      c.checkNo  || '',
        checkDate:    this.toIsoRequired(c.checkDate),
        paymentCode:  'CHQ',
        customerBank: c.bank || bank,
        amount:       c.amount  || 0,
        comments:     c.remarks || '',
      });
    });

    // Compute the total from the same details array being sent,
    // so it can never drift from what the backend calculates.
    const computedReceiptTotal = Math.round(
      details.reduce((sum, d) => sum + (+d.amount || 0), 0) * 100
    ) / 100;

    return {
      customer:         this.form.customer         || '',
      customerName:     this.form.customerName     || '',
      landlordCode:     this.form.landlordCode     || '',
      landlordName:     this.form.landlordName     || '',
      propertyId:       this.form.propertyId       || '',
      unitNo:           this.form.unitNo           || '',
      invoiceNumber:    this.form.invoiceNumber    || '',
      multipleInvoices: this.form.multipleInvoices,
      periodFrom:       this.toIsoRequired(this.form.periodFrom),
      periodTo:         this.toIsoRequired(this.form.periodTo),
      invoiceTotal:     this.form.invoiceTotal     || 0,
      receiptDate:      this.toIsoRequired(this.form.receiptDate),
      lastReceiptTotal: this.form.lastReceiptTotal || 0,
      balanceAmount:    this.form.balanceAmount    || 0,
      receiptTotal:     computedReceiptTotal,   // ✅ guaranteed to match details
      details,
    };
}

  saveReceiptDraft(): void {
    if (!this.canSaveReceiptDraft()) { alert('Post Rental Details first before saving a receipt.'); return; }
    const payload = this.mapFormToReceiptRequest();
    this.isSaving = true;
    const req$ = this.form.receiptId
      ? this.receiptService.update(this.form.receiptId, payload)
      : this.receiptService.create(payload);
    req$.subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success && res.data) {
          this.form = { ...this.form, receiptId: res.data.id, receiptStatus: 'Draft' };
          this.syncCheques();
          alert('Receipt saved as draft.');
        } else {
          alert(res.message || 'Failed to save receipt.');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSaving = false;
        const msg = err?.error?.errors ? Object.values(err.error.errors).flat().join('\n') : err?.error?.message;
        alert(msg || 'Failed to save receipt.');
        this.cdr.detectChanges();
      },
    });
  }

  postReceiptAction(): void {
    if (!this.canPostReceipt()) { alert('Post Rental Details first, or receipt has already been posted.'); return; }
    const payload = this.mapFormToReceiptRequest();
    this.isSaving = true;
    const save$ = this.form.receiptId
      ? this.receiptService.update(this.form.receiptId, payload)
      : this.receiptService.create(payload);
    save$.subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.form = { ...this.form, receiptId: res.data.id };
          this.syncCheques();
          this.receiptService.post(res.data.id).subscribe({
            next: (postRes) => {
              this.isSaving = false;
              if (postRes.success) {
                this.form = { ...this.form, receiptStatus: 'Posted', receiptPosted: true };
                alert('Receipt posted successfully. You can now view Settlement Details.');
              } else {
                alert(postRes.message || 'Failed to post receipt.');
              }
              this.cdr.detectChanges();
            },
            error: (err) => {
              this.isSaving = false;
              const msg = err?.error?.errors ? Object.values(err.error.errors).flat().join('\n') : err?.error?.message || err?.error?.title;
              alert(msg || 'Failed to post receipt.');
              this.cdr.detectChanges();
            },
          });
        } else {
          this.isSaving = false;
          alert(res.message || 'Failed to save receipt before posting.');
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.isSaving = false;
        const msg = err?.error?.errors ? Object.values(err.error.errors).flat().join('\n') : err?.error?.message;
        alert(msg || 'Failed to save receipt.');
        this.cdr.detectChanges();
      },
    });
  }

  cancelReceiptAction(): void {
    if (!this.canCancelReceipt()) { alert('Receipt cannot be cancelled at this stage.'); return; }
    if (!confirm('Cancel this receipt? This will reverse the receipt posting.')) return;
    this.isSaving = true;
    this.receiptService.cancel(this.form.receiptId!).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success) {
          this.form = { ...this.form, receiptStatus: 'Cancelled', receiptPosted: false };
          alert('Receipt cancelled.');
        } else {
          alert(res.message || 'Failed to cancel receipt.');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSaving = false;
        alert(err?.error?.message || 'Failed to cancel receipt.');
        this.cdr.detectChanges();
      },
    });
  }

  printReceiptDoc(): void { window.print(); }

  // ── Load Invoice ─────────────────────────────────────────────
  loadInvoice(id: number): void {
    this.isLoading = true;
    this.invoiceService.getById(id).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.applyInvoiceToForm(res.data);
          this.invoiceSetupComplete = true;
          this.cdr.detectChanges(); 
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

  // private applyInvoiceToForm(invoice: Invoice): void {
  //   this.form.invoiceId       = invoice.id;
  //   this.form.invoiceNumber   = invoice.invoiceNumber;
  //   this.form.invoiceDate     = this.toDateInput(invoice.invoiceDate);
  //   this.form.invoiceType     = (invoice.invoiceType?.toLowerCase() === 'renewal') ? 'Renewal' : 'New';

  //   this.form.customer        = invoice.customer;
  //   this.form.customerName    = invoice.customerName;
  //   this.form.landlordCode    = invoice.landlordCode;
  //   this.form.landlordName    = invoice.landlordName;
  //   this.form.propertyId      = invoice.propertyId;
  //   this.form.propertyName    = invoice.propertyName;
  //   this.form.unitNo          = invoice.unitNo;
  //   this.form.purposeOfLease  = invoice.purposeOfLease;
  //   this.form.multipleInvoices = invoice.multipleUnits;

  //   this.form.periodFrom      = this.toDateInput(invoice.periodFrom);
  //   this.form.periodTo        = this.toDateInput(invoice.periodTo);

  //   this.form.contractNumber  = invoice.contractNo;
  //   this.form.contractDate    = this.toDateInput(invoice.contractDate);
  //   this.form.documentNumber  = invoice.documentNumber;
  //   this.form.ejariNumber     = invoice.ejariNumber;

  //   this.form.gracePeriodStart = this.toDateInput(invoice.gracePeriodStartDate);
  //   this.form.gracePeriodEnd   = this.toDateInput(invoice.gracePeriodEndDate);

  //   this.form.annualRent       = invoice.annualRent;

  //   // Case-insensitive lookup so 'Rent', 'rent', 'RENT' all resolve correctly.
  //   const findAmount = (type: string) => {
  //     const t = type.toLowerCase();
  //     return invoice.details?.find(d => (d.serviceType || '').toLowerCase() === t)?.amount ?? 0;
  //   };

  //   this.form.rentAmount     = findAmount('Rent');
  //   this.form.depositAmount  = invoice.securityDeposit || findAmount('Deposit');
  //   this.form.adminFeeAmount = findAmount('AdminFee');
  //   this.form.penaltyAmount  = findAmount('Penalty');

  //   // ── Load actual tax data from invoice.taxes[] ─────────────────
  //   // This is critical: the invoice was saved with specific tax groups/rates;
  //   // we must restore them exactly so that rentTotal, adminFeeTotal etc.
  //   // match what the API computed — otherwise the posting validation fails.
  //   const findTax = (baseAmount: number) =>
  //     invoice.taxes?.find(t => Math.abs(t.taxBase - baseAmount) < 0.01);

  //   const round = (v: number) => Math.round((v || 0) * 100) / 100;

  //   // Rent tax
  //   const rentTax = findTax(this.form.rentAmount);
  //   if (rentTax) {
  //     this.form.rentTaxGroup  = rentTax.taxGroup  || 'Standard VAT';
  //     this.form.rentTaxAmount = round(rentTax.taxAmount);
  //     this.form.rentTaxRate   = this.form.rentAmount > 0
  //       ? round(this.form.rentTaxAmount / this.form.rentAmount * 100)
  //       : 0;
  //   } else {
  //     // Fallback: compute at default rate
  //     this.form.rentTaxRate   = this.form.rentTaxGroup === 'Zero Rated' || this.form.rentTaxGroup === 'Out of Scope' ? 0 : (this.form.rentTaxRate || 5);
  //     this.form.rentTaxAmount = round(this.form.rentAmount * this.form.rentTaxRate / 100);
  //   }
  //   this.form.rentTotal = round(this.form.rentAmount + this.form.rentTaxAmount);

  //   // Deposit tax
  //   const depTax = findTax(this.form.depositAmount);
  //   if (depTax) {
  //     this.form.depositTaxGroup  = depTax.taxGroup  || 'Zero Rated';
  //     this.form.depositTaxAmount = round(depTax.taxAmount);
  //     this.form.depositTaxRate   = this.form.depositAmount > 0
  //       ? round(this.form.depositTaxAmount / this.form.depositAmount * 100)
  //       : 0;
  //   } else {
  //     this.form.depositTaxRate   = this.form.depositTaxGroup === 'Zero Rated' || this.form.depositTaxGroup === 'Out of Scope' ? 0 : (this.form.depositTaxRate || 0);
  //     this.form.depositTaxAmount = round(this.form.depositAmount * this.form.depositTaxRate / 100);
  //   }
  //   this.form.depositTotal = round(this.form.depositAmount + this.form.depositTaxAmount);

  //   // Admin fee tax
  //   const adminTax = findTax(this.form.adminFeeAmount);
  //   if (adminTax) {
  //     this.form.adminFeeTaxGroup  = adminTax.taxGroup  || 'Standard VAT';
  //     this.form.adminFeeTaxAmount = round(adminTax.taxAmount);
  //     this.form.adminFeeTaxRate   = this.form.adminFeeAmount > 0
  //       ? round(this.form.adminFeeTaxAmount / this.form.adminFeeAmount * 100)
  //       : 0;
  //   } else {
  //     this.form.adminFeeTaxRate   = this.form.adminFeeTaxGroup === 'Zero Rated' || this.form.adminFeeTaxGroup === 'Out of Scope' ? 0 : (this.form.adminFeeTaxRate || 5);
  //     this.form.adminFeeTaxAmount = round(this.form.adminFeeAmount * this.form.adminFeeTaxRate / 100);
  //   }
  //   this.form.adminFeeTotal = round(this.form.adminFeeAmount + this.form.adminFeeTaxAmount);

  //   // Penalty tax (only if cause is set)
  //   if (this.form.penaltyAmount > 0 && this.form.penaltyCause) {
  //     const penTax = findTax(this.form.penaltyAmount);
  //     if (penTax) {
  //       this.form.penaltyTaxGroup  = penTax.taxGroup  || 'Standard VAT';
  //       this.form.penaltyTaxAmount = round(penTax.taxAmount);
  //       this.form.penaltyTaxRate   = this.form.penaltyAmount > 0
  //         ? round(this.form.penaltyTaxAmount / this.form.penaltyAmount * 100)
  //         : 0;
  //       this.form.penaltyApplyTax  = this.form.penaltyTaxAmount > 0;
  //     } else {
  //       this.form.penaltyTaxAmount = 0;
  //       this.form.penaltyApplyTax  = false;
  //     }
  //     this.form.penaltyTotal = round(this.form.penaltyAmount + this.form.penaltyTaxAmount);
  //   }

  //   // ── Use the API's authoritative totals (computed server-side) ─
  //   this.form.subTotal     = round(invoice.documentAmount);
  //   this.form.taxTotal     = round(invoice.taxAmount);
  //   this.form.invoiceTotal = round(invoice.documentTotal);
  //   this.form.balanceAmount = round(invoice.outstandingAmount);

  //   this.form.status          = 'Draft';
  //   this.invoiceSearchQuery   = invoice.invoiceNumber;  // keep search field in sync

  //   // Flush form values to the view immediately 
  //   this.cdr.detectChanges();

  //   this.loadChequesForInvoice(invoice.invoiceNumber);

  //   // Extra safety: schedule a second flush after the current event loop so that
  //   // child components that were just rendered pick up all the updated bindings.
  //   setTimeout(() => this.cdr.detectChanges(), 0);
  // }
private applyInvoiceToForm(invoice: Invoice): void {
  if (this.invoiceLookupMode === 'previous') {
    this.modalPreviousInvoiceNumber = invoice.invoiceNumber;
    this.closeInvoiceLookup();
    return;
  }

  const round = (v: number) => Math.round((v || 0) * 100) / 100;
  const findAmount = (type: string) => {
    const t = type.toLowerCase();
    return invoice.details?.find(d => (d.serviceType || '').toLowerCase() === t)?.amount ?? 0;
  };
  const remainingTaxes = [...(invoice.taxes || [])];
  const findTax = (baseAmount: number) => {
    const idx = remainingTaxes.findIndex(t => Math.abs(t.taxBase - baseAmount) < 0.01);
    if (idx === -1) return undefined;
    const match = remainingTaxes[idx];
    remainingTaxes.splice(idx, 1); // remove so it can't be matched again
    return match;
  };
  // Build everything into a local draft first...
  const draft: InvoiceForm = { ...this.form };

  draft.invoiceId   = invoice.id;
  draft.invoiceNumber = invoice.invoiceNumber;
  draft.invoiceDate = this.toDateInput(invoice.invoiceDate);
  draft.invoiceType = (invoice.invoiceType?.toLowerCase() === 'renewal') ? 'Renewal' : 'New';

  draft.customer      = invoice.customer;
  draft.customerName  = invoice.customerName;
  draft.landlordCode  = invoice.landlordCode;
  draft.landlordName  = invoice.landlordName;
  draft.propertyId    = invoice.propertyId;
  draft.propertyName  = invoice.propertyName;
  draft.unitNo        = invoice.unitNo;
  draft.purposeOfLease = invoice.purposeOfLease;
  draft.multipleInvoices = invoice.multipleUnits;

  draft.periodFrom = this.toDateInput(invoice.periodFrom);
  draft.periodTo   = this.toDateInput(invoice.periodTo);
  draft.leaveDate  = draft.periodTo; // default leaveDate to periodTo

  draft.contractNumber = invoice.contractNo;
  draft.contractDate   = this.toDateInput(invoice.contractDate);
  draft.documentNumber = invoice.documentNumber;
  draft.ejariNumber    = invoice.ejariNumber;

  draft.gracePeriodStart = this.toDateInput(invoice.gracePeriodStartDate);
  draft.gracePeriodEnd   = this.toDateInput(invoice.gracePeriodEndDate);

  draft.annualRent  = invoice.annualRent;
  draft.rentAmount     = findAmount('Rent');
  draft.depositAmount  = invoice.securityDeposit || findAmount('Deposit');
  draft.adminFeeAmount = findAmount('AdminFee');

  // Rent tax
  const rentTax = findTax(draft.rentAmount);
  if (rentTax) {
    draft.rentTaxGroup  = rentTax.taxGroup || 'Standard VAT';
    draft.rentTaxAmount = round(rentTax.taxAmount);
    draft.rentTaxRate   = draft.rentAmount > 0 ? round(draft.rentTaxAmount / draft.rentAmount * 100) : 0;
  } else {
    draft.rentTaxRate   = (draft.rentTaxGroup === 'Zero Rated' || draft.rentTaxGroup === 'Out of Scope') ? 0 : (draft.rentTaxRate || 5);
    draft.rentTaxAmount = round(draft.rentAmount * draft.rentTaxRate / 100);
  }
  draft.rentTotal = round(draft.rentAmount + draft.rentTaxAmount);

  // Deposit tax
  const depTax = findTax(draft.depositAmount);
  if (depTax) {
    draft.depositTaxGroup  = depTax.taxGroup || 'Zero Rated';
    draft.depositTaxAmount = round(depTax.taxAmount);
    draft.depositTaxRate   = draft.depositAmount > 0 ? round(draft.depositTaxAmount / draft.depositAmount * 100) : 0;
  } else {
    draft.depositTaxRate   = (draft.depositTaxGroup === 'Zero Rated' || draft.depositTaxGroup === 'Out of Scope') ? 0 : (draft.depositTaxRate || 0);
    draft.depositTaxAmount = round(draft.depositAmount * draft.depositTaxRate / 100);
  }
  draft.depositTotal = round(draft.depositAmount + draft.depositTaxAmount);

  // Admin fee tax
  const adminTax = findTax(draft.adminFeeAmount);
  if (adminTax) {
    draft.adminFeeTaxGroup  = adminTax.taxGroup || 'Standard VAT';
    draft.adminFeeTaxAmount = round(adminTax.taxAmount);
    draft.adminFeeTaxRate   = draft.adminFeeAmount > 0 ? round(draft.adminFeeTaxAmount / draft.adminFeeAmount * 100) : 0;
  } else {
    draft.adminFeeTaxRate   = (draft.adminFeeTaxGroup === 'Zero Rated' || draft.adminFeeTaxGroup === 'Out of Scope') ? 0 : (draft.adminFeeTaxRate || 5);
    draft.adminFeeTaxAmount = round(draft.adminFeeAmount * draft.adminFeeTaxRate / 100);
  }
  draft.adminFeeTotal = round(draft.adminFeeAmount + draft.adminFeeTaxAmount);

  // ── Additional Charges (multiple rows) ────────────────────────
// Pull every detail line that represents an additional charge —
// anything that isn't Rent / Deposit / AdminFee counts as one.
const additionalChargeDetails = (invoice.details || []).filter(d => {
  const t = (d.serviceType || '').toLowerCase();
  return t === 'penalty' || t === 'additionalcharge';
});

draft.additionalCharges = additionalChargeDetails.map((d, idx): AdditionalCharge => {
  const amount = d.amount || 0;
  const matchedTax = findTax(amount); // consumes from remainingTaxes so it can't be reused

  const taxGroup  = (matchedTax?.taxGroup as any) || 'Standard VAT';
  const taxAmount = matchedTax ? round(matchedTax.taxAmount) : 0;
  const taxRate   = amount > 0 ? round(taxAmount / amount * 100) : 0;

  return {
    id:          'chg_' + Date.now() + '_' + idx,
    cause:       (d.description && d.description !== 'Additional Charge') ? d.description : '',
    amount,
    taxGroup,
    taxRate,
    taxAmount,
    total:       round(amount + taxAmount),
    description: '', // free-text note field — not stored on TYINVD today
  };
});
  draft.subTotal      = round(invoice.documentAmount);
  draft.taxTotal      = round(invoice.taxAmount);
  draft.invoiceTotal  = round(invoice.documentTotal);
  draft.balanceAmount = round(invoice.outstandingAmount);
  draft.status       = this.normalizeStatus(invoice.status);
  // Set rentalPosted flag: if the invoice is Posted or Cancelled, rental is locked
  draft.rentalPosted = (draft.status === 'Posted' || draft.status === 'Cancelled');
  // receiptPosted will be resolved after we load the linked receipt below
  draft.receiptPosted  = false;
  draft.receiptId      = null;
  draft.receiptStatus  = 'Draft';

  // 🔑 Single reassignment — new reference, Angular re-renders everything immediately.
  this.form = draft;
  this.invoiceSearchQuery = invoice.invoiceNumber;

  this.loadChequesForInvoice(invoice.invoiceNumber);

  // If rental is posted, auto-load the linked receipt to check if it is also posted
  if (draft.rentalPosted) {
    this.loadReceiptForInvoice(invoice.invoiceNumber);
  }
}
private normalizeStatus(status: string | undefined | null): ReceiptStatus {
  const s = (status || '').toLowerCase();
  if (s === 'posted') return 'Posted';
  if (s === 'cancelled' || s === 'canceled') return 'Cancelled';
  return 'Draft';
}

/** Load any receipt linked to this invoice number and apply posted state */
private loadReceiptForInvoice(invoiceNumber: string): void {
  this.receiptService.getAll().subscribe({
    next: (res) => {
      const data: any = res?.data;
      const receipts: any[] = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      const linked = receipts.find((r: any) =>
        (r.invoiceNumber || '').toLowerCase() === invoiceNumber.toLowerCase()
      );
      if (linked) {
        const rStatus = this.normalizeStatus(linked.status);
        this.form = {
          ...this.form,
          receiptId:     linked.id,
          receiptStatus: rStatus,
          receiptPosted: rStatus === 'Posted',
          // Restore receipt financials from loaded record
          receiptDate:      this.toDateInput(linked.receiptDate),
          lastReceiptTotal: linked.lastReceiptTotal || 0,
          receiptTotal:     linked.receiptTotal || 0,
          balanceAmount:    linked.balanceAmount || 0,
          numberOfChecks:   linked.details?.length || 0,
          checks: (linked.details || []).map((d: any, i: number) => ({
            lineNo:    i + 1,
            checkNo:   d.checkNo,
            checkDate: this.toDateInput(d.checkDate),
            amount:    d.amount,
            remarks:   d.comments || '',
            bank:      d.bank,
            rowType:   'check' as const,
          })),
          checksSource: 'backend',
        };
        this.cdr.detectChanges();
        
        if (rStatus === 'Posted') {
          this.loadSettlementForInvoice(this.form.contractNumber);
        }
      }
    },
    error: (err) => console.warn('Could not auto-load receipt for invoice:', err),
  });
}

/** Load any settlement linked to this contract number */
private loadSettlementForInvoice(contractNumber: string): void {
  if (!contractNumber) return;
  this.finalSettlementService.getAll().subscribe({
    next: (res) => {
      const data: any = res?.data;
      const settlements: FinalSettlement[] = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      const linked = settlements.find(s => 
        (s.contractNo || '').toLowerCase() === contractNumber.toLowerCase()
      );
      if (linked) {
        this.form = {
          ...this.form,
          settlementId: linked.id || null,
          settlementStatus: this.normalizeStatus(linked.status),
          settlementNumber: linked.settlementNumber || '',
          leaveDate: this.toDateInput(linked.leavingDate || '') || this.form.periodTo,
          earlyTermination: linked.earlyTermination || false,
          recurringDays: linked.recurringDays || 0,
          recurringAmount: linked.recurringAmount || 0,
          daysConsumed: linked.daysConsumed || 0,
          rentCollected: linked.rentCollected || 0,
          securityDepositCollected: linked.securityDepositCollected || 0,
          rentForDaysConsumed: linked.rentForDaysConsumed || 0,
          rentForUnutilizedDays: linked.rentForUnutilizedDays || 0,
          creditNotes: (linked.creditNotes || []).map((cn: any) => ({
            serviceType: cn.serviceType || '',
            amount: cn.amount || 0,
            remarks: cn.remarks || ''
          }))
        };
        this.cdr.detectChanges();
      }
    },
    error: (err: any) => console.warn('Could not auto-load settlement:', err)
  });
}
  /**
   * Recomputes all tax amounts and totals from the current form base amounts.
   * Mirrors the logic in RentalDetailsTabComponent so we can call it after
   * loading an invoice from the API (where only base amounts are provided).
   */
  private recalculateFormTotals(): void {
    const round = (v: number) => Math.round((v || 0) * 100) / 100;
    const taxRate = (group: string, rate: number) =>
      (group === 'Zero Rated' || group === 'Out of Scope') ? 0 : (rate || 5);

    // Rent
    this.form.rentTaxRate    = taxRate(this.form.rentTaxGroup, this.form.rentTaxRate);
    this.form.rentTaxAmount  = round(this.form.rentAmount * this.form.rentTaxRate / 100);
    this.form.rentTotal      = round(this.form.rentAmount + this.form.rentTaxAmount);

    // Security Deposit
    this.form.depositTaxRate   = taxRate(this.form.depositTaxGroup, this.form.depositTaxRate);
    this.form.depositTaxAmount = round(this.form.depositAmount * this.form.depositTaxRate / 100);
    this.form.depositTotal     = round(this.form.depositAmount + this.form.depositTaxAmount);

    // Admin Fee
    this.form.adminFeeTaxRate   = taxRate(this.form.adminFeeTaxGroup, this.form.adminFeeTaxRate);
    this.form.adminFeeTaxAmount = round(this.form.adminFeeAmount * this.form.adminFeeTaxRate / 100);
    this.form.adminFeeTotal     = round(this.form.adminFeeAmount + this.form.adminFeeTaxAmount);

    // Additional Charges (dynamic array)
if (this.form.additionalCharges?.length) {
  this.form.additionalCharges.forEach((charge: AdditionalCharge) => {
    charge.taxRate   = taxRate(charge.taxGroup, charge.taxRate);
    charge.taxAmount = round((charge.amount || 0) * charge.taxRate / 100);
    charge.total     = round((charge.amount || 0) + charge.taxAmount);
  });
}

    // Recompute subtotals from the freshly derived amounts so the Rental Details
    // summary boxes are correct immediately (not relying on the API values
    // that are assigned afterwards and which may differ from computed totals).
    const baseAmounts =
      (this.form.rentAmount      || 0) +
      (this.form.depositAmount   || 0) +
      (this.form.adminFeeAmount  || 0) +
      (this.form.additionalCharges?.reduce((sum, charge) => sum + (charge.total || 0), 0) || 0);
    const taxAmounts =
      (this.form.rentTaxAmount      || 0) +
      (this.form.depositTaxAmount   || 0) +
      (this.form.adminFeeTaxAmount  || 0) +
      (this.form.additionalCharges?.reduce((sum, charge) => sum + (charge.taxAmount || 0), 0) || 0);

    this.form.subTotal     = round(baseAmounts);
    this.form.taxTotal     = round(taxAmounts);
    this.form.invoiceTotal = round(this.form.subTotal + this.form.taxTotal);
  }
  // LOAD CHEQUES FOR INVOICE
  // private loadChequesForInvoice(invoiceNumber: string): void {
  //   this.chequeService.getByInvoiceNumber(invoiceNumber).subscribe({
  //     next: (res) => {
  //       if (res.success && res.data && res.data.length > 0) {
  //         const mapped: CheckItem[] = res.data.flatMap((header: any) =>
  //           header.details.map((d: any, idx: number) => ({
  //             lineNo:    idx + 1,
  //             checkNo:   d.chequeNo,
  //             checkDate: this.toDateInput(d.chequeDate),
  //             amount:    d.chequeAmount,
  //             remarks:   d.remarks ?? '',
  //             bank:      d.bankName,
  //             rowType:   'check' as const,
  //           }))
  //         );

  //         this.form.checks         = mapped;
  //         this.form.numberOfChecks = mapped.length;
  //         if (mapped[0]?.bank) {
  //           this.form.detailsBank = mapped[0].bank;
  //         }
  //         // Tell the details tab this batch came from the backend so it
  //         // doesn't immediately regenerate and overwrite it.
  //         this.form.checksSource = 'backend';
  //       } else {
  //         this.form.checks       = [];
  //         this.form.checksSource = 'auto';
  //       }
  //       // Force Angular to re-render the check-grid immediately.
  //       this.cdr.detectChanges();
  //     },
  //     error: (err) => {
  //       console.error('Failed to load cheques for invoice:', err);
  //       this.form.checksSource = 'auto';
  //       this.cdr.detectChanges();
  //     },
  //   });
  // }
  private loadChequesForInvoice(invoiceNumber: string): void {
  this.chequeService.getByInvoiceNumber(invoiceNumber).subscribe({
    next: (res) => {
      if (res.success && res.data && res.data.length > 0) {
        const mapped: CheckItem[] = res.data.flatMap((header: any) =>
          header.details.map((d: any, idx: number) => ({
            lineNo:    idx + 1,
            checkNo:   d.chequeNo,
            checkDate: this.toDateInput(d.chequeDate),
            amount:    d.chequeAmount,
            remarks:   d.remarks ?? '',
            bank:      d.bankName,
            rowType:   'check' as const,
          }))
        );

        // 🔑 Reassign the whole form object (new reference) instead of
        // mutating individual properties — this is what makes Angular
        // reliably re-render the child tab components immediately,
        // without needing a focus/click on some other field first.
        this.form = {
          ...this.form,
          checks:         mapped,
          numberOfChecks: mapped.length,
          detailsBank:    mapped[0]?.bank || this.form.detailsBank,
          checksSource:   'backend',
        };
      } else {
        this.form = {
          ...this.form,
          checks:         [],
          numberOfChecks: 0,
          checksSource:   'auto',
        };
      }
    },
    error: (err) => {
      console.error('Failed to load cheques for invoice:', err);
      this.form = { ...this.form, checksSource: 'auto' };
    },
  });
}
// syncCheques(): void {
private async syncCheques(): Promise<void> {
  if (!this.form.checks?.length) return;

  for (const check of this.form.checks as any[]) {
    const payload: ChequeRequest = {
      customerCode: this.form.customer,
      contractNo: this.form.contractNumber,
      invoiceNumber: this.form.invoiceNumber,
      bankName: check.bankName || this.form.detailsBank,
      chequeNo: check.checkNo,
      chequeDate: this.toIsoRequired(check.checkDate),
      chequeAmount: check.amount,
      remarks: '',
    };

    try {
      if (check.chequeHeaderId) {
        await this.chequeService.update(check.chequeHeaderId, payload).toPromise();
      } else {
        const res = await this.chequeService.create(payload).toPromise();
        if (res?.success && res?.data) {
          check.chequeHeaderId = res.data.id;
          check.id = res.data.details?.[0]?.id;
        }
      }
    } catch (err) {
      console.error('Cheque sync failed for cheque:', check.checkNo, err);
      alert(`Failed to save cheque ${check.checkNo}. Please try saving again.`);
    }
  }
}

  // ── Save Draft ───────────────────────────────────────────────
  // saveDraft(): void {
  //   if (!this.canSaveDraft()) { alert('This receipt can no longer be saved as draft.'); return; }

  //   const payload = this.mapFormToInvoiceRequest();
  //   if (!payload) return;

  //   this.isSaving = true;

  //   const request$ = this.form.invoiceId
  //     ? this.invoiceService.update(this.form.invoiceId, payload)
  //     : this.invoiceService.create(payload);

  //   request$.subscribe({
  //     next: (res) => {
  //       this.isSaving = false;
  //       if (res.success && res.data) {
          
  //         this.form = { ...this.form, invoiceId: res.data.id, status: 'Draft' };
  //         this.syncCheques();          // NEW

  //         console.log('Invoice saved as DRAFT:', res.data);
  //       } else {
  //         alert(res.message || 'Failed to save invoice.');
  //       }
  //     },
  //     error: (err) => {
  //       this.isSaving = false;
  //       console.error('Save invoice failed:', err);
  //       const apiMsg = err?.error?.errors
  //         ? Object.values(err.error.errors).flat().join('\n')
  //         : err?.error?.message;
  //       alert(apiMsg || 'Failed to save invoice. Please check the amounts and try again.');
  //     },
  //   });
  // }

  // // ── Post ─────────────────────────────────────────────────────
  // postReceipt(): void {
  //   if (!this.canPost()) { alert('This receipt has already been finalized.'); return; }
  //   if (!this.validateBeforePost()) return;

  //   if (!this.form.invoiceId) {
  //     const payload = this.mapFormToInvoiceRequest();
  //     if (!payload) return;

  //     this.isSaving = true;
  //     this.invoiceService.create(payload).subscribe({
  //       next: (res) => {
  //         this.isSaving = false;
  //         if (res.success && res.data) {
  //           this.form.invoiceId = res.data.id;
  //           this.doPost(this.form.invoiceId);
  //                 this.syncCheques();          // NEW

  //         } else {
  //           alert(res.message || 'Failed to create invoice before posting.');
  //         }
  //       },
  //       error: (err) => {
  //         this.isSaving = false;
  //         console.error('Create before post failed:', err);
  //         alert('Failed to save invoice before posting.');
  //       },
  //     });
  //     return;
  //   }

  //   this.doPost(this.form.invoiceId);
  // }

  // private doPost(id: number): void {
  //   this.isSaving = true;
  //   this.invoiceService.post(id).subscribe({
  //     next: (res) => {
  //       this.isSaving = false;
  //       if (res.success) {
  //         this.form.status = 'Posted';
  //         console.log('Invoice POSTED:', res.data);
  //       } else {
  //         alert(res.message || 'Failed to post invoice.');
  //       }
  //     },
  //     error: (err) => {
  //       this.isSaving = false;
  //       console.error('Post invoice failed:', err);
  //       alert('Failed to post invoice. Please try again.');
  //     },
  //   });
  // }

  // // ── Cancel ───────────────────────────────────────────────────
  // cancelReceipt(): void {
  //   if (!this.canCancel()) { alert('This receipt cannot be cancelled.'); return; }
  //   if (!this.form.invoiceId) { alert('This invoice has not been saved yet.'); return; }

  //   const confirmed = window.confirm(
  //     'Cancelling will reverse this invoice and restore the outstanding amount. Continue?'
  //   );
  //   if (!confirmed) return;

  //   this.isSaving = true;
  //   this.invoiceService.cancel(this.form.invoiceId).subscribe({
  //     next: (res) => {
  //       this.isSaving = false;
  //       if (res.success) {
  //         this.form.status = 'Cancelled';
  //         console.log('Invoice CANCELLED:', res.data);
  //       } else {
  //         alert(res.message || 'Failed to cancel invoice.');
  //       }
  //     },
  //     error: (err) => {
  //       this.isSaving = false;
  //       console.error('Cancel invoice failed:', err);
  //       alert('Failed to cancel invoice. Please try again.');
  //     },
  //   });
  // }
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
        this.form = { ...this.form, invoiceId: res.data.id, status: 'Draft' };
        this.syncCheques();
        console.log('Invoice saved as DRAFT:', res.data);
      } else {
        alert(res.message || 'Failed to save invoice.');
      }
      this.cdr.detectChanges();
    },
    error: (err) => {
      this.isSaving = false;
      console.error('Save invoice failed:', err);
      const apiMsg = err?.error?.errors
        ? Object.values(err.error.errors).flat().join('\n')
        : err?.error?.message;
      alert(apiMsg || 'Failed to save invoice. Please check the amounts and try again.');
      this.cdr.detectChanges();
    },
  });
}

// ── Post ─────────────────────────────────────────────────────
postReceipt(): void {
  if (!this.canPost()) { alert('This receipt has already been finalized.'); return; }
  if (!this.validateBeforePost()) return;

  if (!this.form.invoiceNumber) {
    this.documentNumberService.getNext('Invoice').subscribe({
      next: (res) => {
        this.form.invoiceNumber = (res.success && res.data) ? res.data.number : 'INV-' + Date.now();
        this._doPostReceipt();
      },
      error: () => {
        this.form.invoiceNumber = 'INV-' + Date.now();
        this._doPostReceipt();
      }
    });
  } else {
    this._doPostReceipt();
  }
}

private _doPostReceipt(): void {
  if (!this.form.invoiceId) {
    const payload = this.mapFormToInvoiceRequest();
    if (!payload) return;

    this.isSaving = true;
    this.invoiceService.create(payload).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success && res.data) {
          this.form = { ...this.form, invoiceId: res.data.id };
          this.syncCheques();
          this.doPost(this.form.invoiceId!);
        } else {
          alert(res.message || 'Failed to create invoice before posting.');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Create before post failed:', err);
        alert('Failed to save invoice before posting.');
        this.cdr.detectChanges();
      },
    });
    return;
  }

  this.doPost(this.form.invoiceId);
}

// private doPost(id: number): void {
//   this.isSaving = true;
//   this.invoiceService.post(id).subscribe({
//     next: (res) => {
//       this.isSaving = false;
//       if (res.success) {
//         this.form = { ...this.form, status: 'Posted' };
//         console.log('Invoice POSTED:', res.data);
//       } else {
//         alert(res.message || 'Failed to post invoice.');
//       }
//       this.cdr.detectChanges();
//     },
//     error: (err) => {
//       this.isSaving = false;
//       console.error('Post invoice failed:', err);
//       alert('Failed to post invoice. Please try again.');
//       this.cdr.detectChanges();
//     },
//   });
// }
private doPost(id: number): void {
  this.isSaving = true;
  this.invoiceService.post(id).subscribe({
    next: (res) => {
      this.isSaving = false;
      if (res.success) {
        this.form = { ...this.form, status: 'Posted' };
        console.log('Invoice POSTED:', res.data);
      } else {
        alert(res.message || 'Failed to post invoice.');
      }
      this.cdr.detectChanges();
    },
    error: (err) => {
      this.isSaving = false;
      console.error('Post invoice failed:', err);
      const apiMsg = err?.error?.errors
        ? Object.values(err.error.errors).flat().join('\n')
        : err?.error?.message || err?.error?.title;
      alert(apiMsg || 'Failed to post invoice. Please try again.');
      this.cdr.detectChanges();
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
        this.form = { ...this.form, status: 'Cancelled' };
        console.log('Invoice CANCELLED:', res.data);
      } else {
        alert(res.message || 'Failed to cancel invoice.');
      }
      this.cdr.detectChanges();
    },
    error: (err) => {
      this.isSaving = false;
      console.error('Cancel invoice failed:', err);
      alert('Failed to cancel invoice. Please try again.');
      this.cdr.detectChanges();
    },
  });
}

  printReceipt(): void { window.print(); }

  // ── Validation ─────────────────────────────────────────────
  requiredFields: string[] = [];

  isRequired(field: keyof InvoiceForm): boolean {
    return this.requiredFields.includes(field as string);
  }

  validateRequiredFields(): boolean {
    this.requiredFields = [];

    // NOTE: 'annualRent' intentionally excluded — its input is commented
    // out in the template and it's populated automatically via invoice
    // lookup instead. Keeping it here would make validation impossible
    // to pass on a fresh 'New' invoice.
    const fields: (keyof InvoiceForm)[] = [
      'customer', 'customerName',
      'propertyId', 'propertyName', 'unitNo',
      'contractNumber', 'contractDate',
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

    // scheduleTotal = adminFeeTotal + depositTotal + penaltyTotal + chequeSum.
    // This must not exceed the full invoice total.
    if (this.form.grandTotal > this.form.invoiceTotal + 0.005) {
      alert(
        `Payment schedule total (AED ${this.form.grandTotal.toFixed(2)}) exceeds ` +
        `Invoice Total (AED ${this.form.invoiceTotal.toFixed(2)}). ` +
        `Please adjust the cheque amounts before posting.`
      );
      return false;
    }

    // Cheques only cover the rent portion of the invoice.
    // Validate that the sum of cheques matches rentTotal (not the full invoiceTotal).
    if (this.form.numberOfChecks > 0) {
      const sumChecks = this.form.checks.reduce((s: number, c: any) => s + (+c.amount || 0), 0);
      const expectedRentTotal = Math.round((this.form.rentTotal || 0) * 100) / 100;
      const roundedSum        = Math.round(sumChecks * 100) / 100;
      const diff              = Math.abs(roundedSum - expectedRentTotal);
      if (diff > 0.01 && expectedRentTotal > 0) {
        alert(
          `Cheque total (AED ${roundedSum.toFixed(2)}) does not match ` +
          `Rent Total (AED ${expectedRentTotal.toFixed(2)}). ` +
          `Please adjust the cheque amounts.`
        );
        return false;
      }
    }

    return true;
  }

  // ── DTO Mapper: InvoiceForm → InvoiceRequest ──────────────────
  private mapFormToInvoiceRequest(): InvoiceRequest | null {
  const details: InvoiceDetail[] = [];
  const taxes: InvoiceTax[] = [];
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

  // Additional Charges (multiple rows) — ONLY ONE COPY of this block
  (this.form.additionalCharges || []).forEach((charge: AdditionalCharge) => {
    if (charge.amount > 0) {
      details.push({
        lineNo: lineNo++,
        unitNo: this.form.unitNo,
        serviceType: 'AdditionalCharge',
        description: charge.cause || 'Additional Charge',
        amount: charge.amount,
        remarks: charge.description || '',
      });

      if (charge.taxAmount > 0) {
        taxes.push({
          taxGroup: charge.taxGroup,
          calculateTax: charge.taxRate > 0,
          taxAuthority: 'FTA',
          customerTaxClass: 'Standard',
          taxBase: charge.amount,
          taxAmount: charge.taxAmount,
        });
      }
    }
  });

  if (details.length === 0) {
    alert('Please enter at least one charge amount (Rent, Deposit, Admin Fee, or Additional Charge) greater than 0.');
    return null;
  }

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

  return {
    invoiceNumber:        this.form.invoiceNumber,
    invoiceType:          this.form.invoiceType.toLowerCase(),
    invoiceDate:          this.toIsoRequired(this.form.invoiceDate),
    customer:             this.form.customer,
    customerName:         this.form.customerName,
    landlordCode:         this.form.landlordCode  || '',
    landlordName:         this.form.landlordName  || '',
    propertyId:           this.form.propertyId,
    propertyName:         this.form.propertyName,
    purposeOfLease:       this.form.purposeOfLease,
    buildingStatus:       '',
    unitNo:               this.form.unitNo,
    multipleUnits:        this.form.multipleInvoices,
    periodFrom:           this.toIsoRequired(this.form.periodFrom),
    periodTo:             this.toIsoRequired(this.form.periodTo),
    leaseType:            this.form.purposeOfLease,
    securityDeposit:      this.form.depositAmount || 0,
    annualRent:           this.form.annualRent    || 0,
    gracePeriodStartDate: this.toIso(this.form.gracePeriodStart),
    gracePeriodEndDate:   this.toIso(this.form.gracePeriodEnd),
    contractNo:           this.form.contractNumber || '',
    contractDate:         this.toIso(this.form.contractDate),
    documentNumber:       this.form.documentNumber || '',
    ejariNumber:          this.form.ejariNumber    || '',
    comments:             '',
    details,
    taxes,
  };
}

  // ── Settlement Actions ────────────────────────────────────────

  createContract(): void {
    if (this.isSaving) return;
    this.isSaving = true;

    // Format cheques into string
    let chequeDetailsStr = '';
    if (this.form.checks && this.form.checks.length > 0) {
      const bankName = this.form.checks[0].bank || this.form.detailsBank || 'Unknown Bank';
      chequeDetailsStr = `${this.form.checks.length} cheques, Bank: ${bankName}`;
    }

    const payload: CreateContractRequest = {
      contractNo: this.form.contractNumber || '',
      contractDate: this.toIsoRequired(this.form.contractDate),
      customerCode: this.form.customer || '',
      customerName: this.form.customerName || '',
      propertyId: this.form.propertyId || '',
      unitNo: this.form.unitNo || '',
      leaseStartDate: this.toIsoRequired(this.form.periodFrom),
      leaseEndDate: this.toIsoRequired(this.form.periodTo),
      annualRent: this.form.rentTotal || 0,
      securityDeposit: this.form.depositAmount || 0,
      paymentTerms: '', // default to empty string as discussed
      chequeDetails: chequeDetailsStr,
      remarks: ''
    };

    this.contractService.create(payload).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success && res.data) {
          this.form.contractId = res.data.id;
          this.form.contractNumber = res.data.contractNo || '';
          alert('Contract created successfully! Generating PDF...');
          this.executePrint(res.data.id);
          this.cdr.detectChanges();
        } else {
          alert(res.message || 'Failed to create contract.');
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error('[createContract] Failed:', err);
        alert('Failed to create contract. Please try again.');
      }
    });
  }

  handleContractAction(): void {
    if (this.isSaving) return;
    
    if (this.form.contractId) {
      this.executePrint(this.form.contractId);
      return;
    }

    if (this.form.contractNumber) {
      this.isSaving = true;
      this.contractService.getAll().subscribe({
        next: (res) => {
          this.isSaving = false;
          const contracts = Array.isArray(res.data) ? res.data : (res.data as any).items || [];
          const match = contracts.find((c: any) => c.contractNo === this.form.contractNumber);
          if (match && match.id) {
            this.form.contractId = match.id;
            this.executePrint(match.id);
          } else {
            // It has a number but isn't on the server yet. Create it!
            this.createContract();
          }
        },
        error: () => {
          this.isSaving = false;
          alert('Failed to check contract status on server.');
        }
      });
    } else {
      this.createContract();
    }
  }

  private executePrint(contractId: number): void {
    this.contractService.print(contractId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Contract_${this.form.contractNumber || contractId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('[executePrint] Failed:', err);
        alert('Failed to generate contract PDF.');
      }
    });
  }

  private buildSettlementPayload(): FinalSettlementRequest {
    return {
      settlementNumber: this.form.settlementNumber,
      contractNo: this.form.contractNumber, // map contractNumber from InvoiceForm
      customer: this.form.customer,
      customerName: this.form.customerName,
      landlordCode: this.form.landlordCode,
      landlordName: this.form.landlordName,
      propertyId: this.form.propertyId,
      propertyName: this.form.propertyName,
      postingDate: this.toIsoRequired(new Date().toISOString()),
      recurringDays: this.form.recurringDays,
      recurringAmount: this.form.recurringAmount,
      unitNo: this.form.unitNo,
      earlyTermination: this.form.earlyTermination,
      leavingDate: this.toIso(this.form.leaveDate) || '',
      daysConsumed: this.form.daysConsumed,
      rentCollected: this.form.rentCollected,
      securityDepositCollected: this.form.securityDepositCollected,
      rentForDaysConsumed: this.form.rentForDaysConsumed,
      rentForUnutilizedDays: this.form.rentForUnutilizedDays,
      creditNotes: (this.form.creditNotes || []).map((cn: any, idx: number) => ({
        lineNo: idx + 1,
        serviceType: cn.serviceType,
        description: cn.remarks || '',
        amount: cn.amount,
        remarks: cn.remarks || ''
      }))
    };
  }

  calculateSettlement(): void {
    const start = new Date(this.form.periodFrom);
    const end = new Date(this.form.periodTo);
    const leave = new Date(this.form.leaveDate);

    // Default basic fallback
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || isNaN(leave.getTime())) {
      alert('Invalid dates for settlement calculation.');
      return;
    }

    // Days difference calculation
    const msPerDay = 1000 * 60 * 60 * 24;
    
    // (Period To - Period From) + 1
    const totalContractDays = Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1;
    
    // (Leaving Date - Period From) + 1
    const daysConsumed = Math.floor((leave.getTime() - start.getTime()) / msPerDay) + 1;

    const remainingDays = totalContractDays - daysConsumed;

    this.form.totalContractDays = totalContractDays;
    this.form.daysConsumed = daysConsumed;
    this.form.remainingDays = remainingDays;

    // Financials
    // Use rentAmount if it's set (e.g. from invoice), otherwise fall back to what was loaded from the DB
    this.form.rentCollected = this.form.rentAmount ? this.form.rentAmount : (this.form.rentCollected || 0);
    this.form.securityDepositCollected = this.form.depositAmount ? this.form.depositAmount : (this.form.securityDepositCollected || 0);
    
    const round2 = (val: number) => Math.round((val || 0) * 100) / 100;

    this.form.dailyRent = round2(totalContractDays > 0 ? (this.form.rentCollected / totalContractDays) : 0);
    this.form.rentForDaysConsumed = round2(daysConsumed * this.form.dailyRent);
    this.form.rentForUnutilizedDays = round2(remainingDays * this.form.dailyRent);
    
    this.form.rentRefund = this.form.rentForUnutilizedDays;
    this.form.securityDepositRefund = this.form.securityDepositCollected;

    // Early Termination Penalty (Credit Note Sync)
    if (this.form.earlyTermination) {
      if (!this.form.creditNotes) this.form.creditNotes = [];
      
      // Look for an existing auto-populated ET note to keep synchronized
      let etNote = this.form.creditNotes.find((n: any) => n.remarks === 'Early Termination Penalty');
      
      // If any amount is payable for the unutilized period, apply it as the early termination penalty
      const earlyTerminationPenalty = this.form.rentForUnutilizedDays > 0 ? this.form.rentForUnutilizedDays : 0;
      
      if (earlyTerminationPenalty > 0) {
        if (etNote) {
          etNote.amount = earlyTerminationPenalty;
        } else {
          this.form.creditNotes.push({
            serviceType: 'Utility',
            amount: earlyTerminationPenalty,
            remarks: 'Early Termination Penalty'
          });
        }
      } else if (etNote) {
        // Remove it if penalty is 0
        this.form.creditNotes = this.form.creditNotes.filter((n: any) => n.remarks !== 'Early Termination Penalty');
      }
    }

    // Recalculate totals including credit notes
    this.recalculateSettlementTotals();

    this.form.isSettlementCalculated = true;
  }

  recalculateSettlementTotals(): void {
    const totalCreditNotes = (this.form.creditNotes || []).reduce((sum, cn) => sum + (cn.amount || 0), 0);
    this.form.grandRefund = Math.round((this.form.rentRefund + this.form.securityDepositRefund - totalCreditNotes) * 100) / 100;
  }

  cancelSettlement(): void {
    // Reset to last loaded state or clear if no settlementId
    if (this.form.contractNumber) {
      this.loadSettlementForInvoice(this.form.contractNumber);
    }
  }

  saveSettlementDraft(): void {
    if (this.isSaving) return;
    this.isSaving = true;
     console.log('[saveSettlementDraft] BEFORE calc:', {
    rentAmount: this.form.rentAmount,
    depositAmount: this.form.depositAmount,
    rentCollected: this.form.rentCollected,
    securityDepositCollected: this.form.securityDepositCollected,
    invoiceId: this.form.invoiceId,
    contractNumber: this.form.contractNumber,
  });
      this.calculateSettlement();  
      console.log('[saveSettlementDraft] dates:', {
  periodFrom: this.form.periodFrom,
  periodTo: this.form.periodTo,
  leaveDate: this.form.leaveDate,
}); 
       console.log('[saveSettlementDraft] AFTER calc:', {
    totalContractDays: this.form.totalContractDays,
    daysConsumed: this.form.daysConsumed,
    dailyRent: this.form.dailyRent,
    rentCollected: this.form.rentCollected,
    securityDepositCollected: this.form.securityDepositCollected,
    rentForDaysConsumed: this.form.rentForDaysConsumed,
    rentForUnutilizedDays: this.form.rentForUnutilizedDays,
  });            // ← force fresh calc

    const payload = this.buildSettlementPayload();
      console.log('[saveSettlementDraft] PAYLOAD:', JSON.stringify(payload, null, 2));

    const req$ = this.form.settlementId
      ? this.finalSettlementService.update(this.form.settlementId, payload)
      : this.finalSettlementService.create(payload);

    req$.subscribe({
      next: (res: any) => {
        this.isSaving = false;
        this.form.settlementStatus = this.normalizeStatus(res.data?.status || 'Draft');
        this.form.settlementId = res.data?.id || null;
        alert('Settlement saved successfully.');
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isSaving = false;
        alert('Failed to save settlement draft.');
        console.error(err);
      }
    });
  }

  // postSettlement(): void {
  //   if (this.isSaving || !this.form.settlementId) return;
  //   this.isSaving = true;
  //    console.log('[postSettlement] BEFORE calc:', {
  //   rentAmount: this.form.rentAmount,
  //   depositAmount: this.form.depositAmount,
  //   periodFrom: this.form.periodFrom,
  //   periodTo: this.form.periodTo,
  //   leaveDate: this.form.leaveDate,
  // });
  //   this.calculateSettlement();               // ← force fresh calc

  //   const payload = this.buildSettlementPayload();
  //   this.finalSettlementService.update(this.form.settlementId, payload).subscribe({
  //     next: (res: any) => {
  //       this.isSaving = false;
  //       this.form.settlementStatus = 'Posted'; // Assuming API changes status or we assume it
  //       alert('Settlement posted successfully.');
  //       this.cdr.detectChanges();
  //     },
  //     error: (err: any) => {
  //       this.isSaving = false;
  //       alert('Failed to post settlement.');
  //       console.error(err);
  //     }
  //   });
  // }
postSettlement(): void {
  if (this.isSaving || !this.form.settlementId) return;
  this.isSaving = true;
  console.log('[postSettlement] BEFORE calc:', {
    rentAmount: this.form.rentAmount,
    depositAmount: this.form.depositAmount,
    periodFrom: this.form.periodFrom,
    periodTo: this.form.periodTo,
    leaveDate: this.form.leaveDate,
  });

  this.calculateSettlement();

  console.log('[postSettlement] AFTER calc:', {
    totalContractDays: this.form.totalContractDays,
    daysConsumed: this.form.daysConsumed,
    dailyRent: this.form.dailyRent,
    rentCollected: this.form.rentCollected,
    securityDepositCollected: this.form.securityDepositCollected,
    rentForDaysConsumed: this.form.rentForDaysConsumed,
    rentForUnutilizedDays: this.form.rentForUnutilizedDays,
  });

  const payload = this.buildSettlementPayload();
  console.log('[postSettlement] PAYLOAD:', JSON.stringify(payload, null, 2));

  this.finalSettlementService.update(this.form.settlementId, payload).subscribe({
    next: (res: any) => {
      this.isSaving = false;
      this.form.settlementStatus = 'Posted';
      console.log('[postSettlement] RESPONSE:', JSON.stringify(res, null, 2));
      alert('Settlement posted successfully.');
      this.cdr.detectChanges();
    },
    error: (err: any) => {
      this.isSaving = false;
      alert('Failed to post settlement.');
      console.error(err);
    }
  });
}
  generateSettlementInvoice(): void {
    if (!this.form.settlementId) return;
    this.finalSettlementService.invoice(this.form.settlementId).subscribe({
      next: () => alert('Invoice generated successfully.'),
      error: (err: any) => alert('Failed to generate invoice: ' + err.message)
    });
  }

  postSettlementAR(): void {
    if (!this.form.settlementId) return;
    // TODO: AR API connected previously but removed per user request. Will be used later in future.
    /*
    this.finalSettlementService.postAR(this.form.settlementId).subscribe({
      next: () => alert('AR posted successfully.'),
      error: (err: any) => alert('Failed to post AR: ' + err.message)
    });
    */
    alert('AR API connection temporarily disabled for future use.');
  }

  postSettlementCashWorks(): void {
    if (!this.form.settlementId) return;
    this.finalSettlementService.postCashWorks(this.form.settlementId).subscribe({
      next: () => alert('CashWorks posted successfully.'),
      error: (err: any) => alert('Failed to post CashWorks: ' + err.message)
    });
  }

  markSettlementVacant(): void {
    if (!this.form.settlementId) return;
    this.finalSettlementService.vacant(this.form.settlementId).subscribe({
      next: () => alert('Marked vacant successfully.'),
      error: (err: any) => alert('Failed to mark vacant: ' + err.message)
    });
  }

  uploadSettlementAttachment(event: {file: File, remarks: string}): void {
    if (!this.form.settlementId) {
      alert('Please save the settlement draft first before uploading attachments.');
      return;
    }
    this.finalSettlementService.uploadAttachment(this.form.settlementId, event.file, event.remarks).subscribe({
      next: (res: any) => {
        if (!this.form.attachments) this.form.attachments = [];
        this.form.attachments.push({
          id: res.data.id || '',
          fileName: res.data.fileName || event.file.name,
          fileSize: res.data.fileSize || event.file.size,
          fileExtension: res.data.fileExtension || event.file.type,
          uploadedDate: res.data.uploadedDate || new Date().toISOString()
        } as TyAttachment);
        this.cdr.detectChanges();
        alert('Attachment uploaded successfully.');
      },
      error: (err: any) => alert('Failed to upload attachment: ' + err.message)
    });
  }

  // ── Date helpers ─────────────────────────────────────────────
  /**
   * Converts a date string to ISO 8601. Returns null (not today's date)
   * when the string is empty, so optional date fields are sent as null
   * rather than a meaningless default — which was causing DB save errors.
   */
  private toIso(dateStr: string | null | undefined): string | null {
    if (!dateStr || !dateStr.trim()) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  /** Same as toIso but falls back to today when empty (use only for required dates) */
  private toIsoRequired(dateStr: string | null | undefined): string {
    if (!dateStr || !dateStr.trim()) return new Date().toISOString();
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }

  private toDateInput(isoStr: string): string {
    if (!isoStr) return '';
    return isoStr.substring(0, 10);
  }

  // ── buildEmptyForm ────────────────────────────────────────────
  private buildEmptyForm(): InvoiceForm {
    return {
      invoiceId:              null,
      checksSource:           'auto',

      // Workflow state
      rentalPosted:           false,
      receiptPosted:          false,
      receiptId:              null,
      receiptStatus:          'Draft',
      settlementId:           null,

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

      additionalCharges: [],

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
      
      adminFeeReference:      '',
      depositReference:       '',
      penaltyReference:       '',

      leaveDate:              '',
      earlyTermination:       false,
      settlementStatus:       '',
      settlementNumber:       '',

      recurringDays:          0,
      recurringAmount:        0,
      daysConsumed:           0,
      rentCollected:          0,
      securityDepositCollected: 0,
      rentForDaysConsumed:    0,
      rentForUnutilizedDays:  0,
      creditNotes:            [],
      
      totalContractDays:      0,
      remainingDays:          0,
      dailyRent:              0,
      rentRefund:             0,
      securityDepositRefund:  0,
      grandRefund:            0,
      isSettlementCalculated: false,
    };
  }
}