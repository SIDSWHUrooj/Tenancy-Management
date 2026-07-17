import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChequeService } from 'src/app/services/cheque.service';
import { PropertyService } from 'src/app/services/property.service';
import { UnitService } from 'src/app/services/unit.service';
import { InvoiceService } from 'src/app/services/invoice.service';
import { ReceiptService } from 'src/app/services/receipt.service';

export interface ConsoleChequeVM {
  headerId: number;
  detailId: number;
  receiptNo: string;
  chequeNo: string;
  bank: string;
  customerId: string;
  customerName: string;
  propertyId: string;
  propertyName: string;
  unitId: string;
  unitName: string;
  amount: number;
  chequeDate: string;
  status: string;
  bounceReason?: string;
  newStatus?: string;
  showStatusDropdown?: boolean;
}

@Component({
  selector: 'app-console-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './console-management.component.html',
  styleUrls: ['./console-management.component.scss']
})
export default class ConsoleManagementComponent implements OnInit {
  isLoading = false;
  isSaving = false;

  allCheques: ConsoleChequeVM[] = [];
  filteredCheques: ConsoleChequeVM[] = [];

  // Filter fields
  filterReceiptNo = '';
  filterCustomerId = '';
  filterPropertyId = '';
  filterUnitId = '';
  filterBankName = '';
  filterUnitName = '';
  filterBank = '';
  filterChequeNo = '';
  filterStatus = '';

  statusOptions = ['Pending', 'Realized', 'Bounce', 'On Hold', 'Exchange'];

  // Custom Dropdown State
  showBankDropdown = false;
  showStatusDropdown = false;

  // Pagination and Global Search
  currentPage = 1;
  pageSize = 10;
  globalSearch = '';

  get paginatedCheques() {
    let result = this.filteredCheques;
    if (this.globalSearch) {
      const term = this.globalSearch.toLowerCase();
      result = result.filter(c => 
        (c.receiptNo && c.receiptNo.toLowerCase().includes(term)) ||
        (c.chequeNo && c.chequeNo.toLowerCase().includes(term)) ||
        (c.bank && c.bank.toLowerCase().includes(term)) ||
        (c.customerId && c.customerId.toLowerCase().includes(term)) ||
        (c.customerName && c.customerName.toLowerCase().includes(term)) ||
        (c.propertyId && c.propertyId.toLowerCase().includes(term)) ||
        (c.unitId && c.unitId.toLowerCase().includes(term)) ||
        (c.status && c.status.toLowerCase().includes(term)) ||
        (c.amount && c.amount.toString().includes(term)) ||
        (c.chequeDate && c.chequeDate.toLowerCase().includes(term))
      );
    }
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return result.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages() {
    let result = this.filteredCheques;
    if (this.globalSearch) {
      const term = this.globalSearch.toLowerCase();
      result = result.filter(c => 
        (c.receiptNo && c.receiptNo.toLowerCase().includes(term)) ||
        (c.chequeNo && c.chequeNo.toLowerCase().includes(term)) ||
        (c.bank && c.bank.toLowerCase().includes(term)) ||
        (c.customerId && c.customerId.toLowerCase().includes(term)) ||
        (c.customerName && c.customerName.toLowerCase().includes(term)) ||
        (c.propertyId && c.propertyId.toLowerCase().includes(term)) ||
        (c.unitId && c.unitId.toLowerCase().includes(term)) ||
        (c.status && c.status.toLowerCase().includes(term)) ||
        (c.amount && c.amount.toString().includes(term)) ||
        (c.chequeDate && c.chequeDate.toLowerCase().includes(term))
      );
    }
    return Math.ceil(result.length / this.pageSize) || 1;
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPagesArray() {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  onGlobalSearchChange() {
    this.currentPage = 1;
  }

  getStatusClasses(status: string): string {
    const s = status?.toLowerCase() || '';
    if (s === 'realized' || s === 'cleared') return 'bg-success bg-opacity-10 text-success border-success';
    if (s === 'bounce' || s === 'exchange') return 'bg-danger bg-opacity-10 text-danger border-danger';
    if (s === 'on hold' || s === 'pending' || s === 'posted') return 'bg-warning bg-opacity-10 text-warning border-warning';
    // Default to purple theme
    return 'text-primary border-primary bg-primary bg-opacity-10';
  }

  toggleBankDropdown() {
    this.showBankDropdown = !this.showBankDropdown;
    this.paginatedCheques.forEach(c => c.showStatusDropdown = false);
  }

  selectBank(bank: string) {
    this.filterBankName = bank;
    this.showBankDropdown = false;
    this.applyFilters();
  }

  isAnyRowDropdownOpen(): boolean {
    return this.paginatedCheques.some(c => c.showStatusDropdown);
  }

  closeAllDropdowns() {
    this.showBankDropdown = false;
    this.paginatedCheques.forEach(c => c.showStatusDropdown = false);
  }

  toggleRowDropdown(cheque: any, event: Event) {
    event.stopPropagation();
    this.paginatedCheques.forEach(c => {
      if (c !== cheque) c.showStatusDropdown = false;
    });
    cheque.showStatusDropdown = !cheque.showStatusDropdown;
    this.showBankDropdown = false;
  }

  selectRowStatus(cheque: any, status: string, event: Event) {
    event.stopPropagation();
    cheque.newStatus = status;
    cheque.showStatusDropdown = false;
  }


  // Lookups
  showReceiptLookup = false;
  showCustomerLookup = false;
  showPropertyLookup = false;
  showUnitLookup = false;

  uniqueReceipts: any[] = [];
  uniqueCustomers: any[] = [];
  uniqueProperties: any[] = [];
  uniqueUnits: any[] = [];
  uniqueBanks: string[] = [];

  filteredModalReceipts: any[] = [];
  filteredModalCustomers: any[] = [];
  filteredModalProperties: any[] = [];
  filteredModalUnits: any[] = [];

  receiptModalFilter = '';
  customerModalFilter = '';
  propertyModalFilter = '';
  unitModalFilter = '';

  // Exchange fields
  newChequeNo: string = '';
  newBankName: string = '';
  newChequeDate: string = '';
  newAmount: number = 0;

  constructor(
    private chequeService: ChequeService,
    private invoiceService: InvoiceService,
    private receiptService: ReceiptService,
    private propertyService: PropertyService,
    private unitService: UnitService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    
    // Fetch all cheques
    this.chequeService.getAll().subscribe({
      next: (chequeRes) => {
        if (chequeRes.success && chequeRes.data) {
          const headers = chequeRes.data;
          
          // Fetch invoices to map data
          this.invoiceService.getAll().subscribe({
            next: (invoiceRes) => {
              const invoices = (invoiceRes.success && invoiceRes.data) 
                ? (Array.isArray(invoiceRes.data) ? invoiceRes.data : (invoiceRes.data as any).items || []) 
                : [];

              // Fetch receipts to map receiptNo
              this.receiptService.getAll().subscribe({
                next: (receiptRes) => {
                  const receipts = (receiptRes.success && receiptRes.data)
                    ? (Array.isArray(receiptRes.data) ? receiptRes.data : (receiptRes.data as any).items || [])
                    : [];
                  
                  this.allCheques = [];

                  for (const header of headers) {
                    const inv = invoices.find((i: any) => i.invoiceNumber === header.invoiceNumber);
                    const rec = receipts.find((r: any) => r.invoiceNumber === header.invoiceNumber);

                    for (const detail of header.details) {
                      const status = detail.chequeStatus || 'Posted';
                      // Do not show cheques that are already resolved in the pending grid
                      const normStatus = status.trim().toLowerCase();
                      if (normStatus === 'realized' || normStatus === 'realised' || normStatus === 'cleared' || normStatus === 'clear' || normStatus === 'bounce' || normStatus === 'bounced' || normStatus === 'exchange') {
                        continue;
                      }

                      this.allCheques.push({
                        headerId: header.id || 0,
                        detailId: detail.id || 0,
                        receiptNo: rec ? rec.receiptNumber : '',
                        chequeNo: detail.chequeNo,
                        bank: detail.bankName,
                        customerId: header.customerCode,
                        customerName: inv ? inv.customerName : '',
                        propertyId: inv ? inv.propertyId : '',
                        propertyName: inv ? inv.propertyName : '',
                        unitId: inv ? inv.unitNo : '',
                        unitName: inv ? inv.unitNo : '', // using unitNo as unitName fallback
                        amount: detail.chequeAmount,
                        chequeDate: detail.chequeDate,
                        status: status,
                        bounceReason: detail.bounceReason || ''
                      });
                    }
                  }

                  // Load external lists for lookups
                  this.uniqueReceipts = receipts.map((r: any) => ({ receiptNo: r.receiptNumber }));
                  
                  const cMap = new Map<string, any>();
                  invoices.forEach((i: any) => {
                    const cId = i.customerCode || i.customerId || i.customer;
                    if (cId && !cMap.has(cId)) {
                      cMap.set(cId, { id: cId, name: i.customerName });
                    }
                  });
                  this.uniqueCustomers = Array.from(cMap.values());

                  const bSet = new Set<string>();
                  this.allCheques.forEach(c => {
                    if (c.bank) bSet.add(c.bank);
                  });
                  this.uniqueBanks = Array.from(bSet).sort();

                  this.propertyService.getAll().subscribe(res => {
                    if (res.success && res.data) {
                      const data = Array.isArray(res.data) ? res.data : (res.data as any).items || [];
                      this.uniqueProperties = data.map((p: any) => ({ id: p.propertyCode, name: p.propertyName }));
                    }
                  });

                  this.unitService.getAll().subscribe(res => {
                    if (res.success && res.data) {
                      const data = Array.isArray(res.data) ? res.data : (res.data as any).items || [];
                      this.uniqueUnits = data.map((u: any) => ({ id: u.unitNo, name: u.unitNo }));
                    }
                  });

                  this.applyFilters();
                  this.isLoading = false;
                  this.cdr.detectChanges();
                },
                error: () => { this.isLoading = false; }
              });
            },
            error: () => { this.isLoading = false; }
          });
        } else {
          this.isLoading = false;
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredCheques = this.allCheques.filter(c => {
      const matchReceipt = c.receiptNo.toLowerCase().includes(this.filterReceiptNo.toLowerCase());
      const matchCustomer = c.customerId.toLowerCase().includes(this.filterCustomerId.toLowerCase());
      const matchProperty = c.propertyId.toLowerCase().includes(this.filterPropertyId.toLowerCase());
      const matchUnit = c.unitId.toLowerCase().includes(this.filterUnitId.toLowerCase());
      const matchBank = this.filterBankName ? c.bank === this.filterBankName : true;
      const matchStatus = !this.filterStatus || c.status?.toLowerCase() === this.filterStatus.toLowerCase();
      const matchChequeNo = !this.filterChequeNo || c.chequeNo?.toLowerCase().includes(this.filterChequeNo.toLowerCase());

      return matchReceipt && matchCustomer && matchProperty && matchUnit && matchBank && matchStatus && matchChequeNo;
    });
    this.currentPage = 1;
  }

  resetFilters(): void {
    this.filterReceiptNo = '';
    this.filterCustomerId = '';
    this.filterPropertyId = '';
    this.filterUnitId = '';
    this.filterUnitName = '';
    this.filterBankName = '';
    this.filterBank = '';
    this.filterChequeNo = '';
    this.filterStatus = '';
    this.globalSearch = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  clearFilterField(field: string): void {
    if (field === 'Receipt') this.filterReceiptNo = '';
    if (field === 'Customer') this.filterCustomerId = '';
    if (field === 'Property') this.filterPropertyId = '';
    if (field === 'Unit') this.filterUnitId = '';
    this.applyFilters();
  }

  // --- Lookup Logic ---
  // The unique lists are now populated directly from the API responses in loadData()


  // Receipt Lookup
  openReceiptLookup(): void {
    this.receiptModalFilter = '';
    this.filterModalReceipts();
    this.showReceiptLookup = true;
  }
  closeReceiptLookup(): void { this.showReceiptLookup = false; }
  filterModalReceipts(): void {
    const q = this.receiptModalFilter.toLowerCase();
    this.filteredModalReceipts = this.uniqueReceipts.filter(r => (r.receiptNo || '').toLowerCase().includes(q));
  }
  selectReceiptFromLookup(r: any): void {
    const cheque = this.allCheques.find(c => c.receiptNo === r.receiptNo);
    if (cheque) {
      this.filterReceiptNo = cheque.receiptNo || '';
      this.filterCustomerId = cheque.customerId || '';
      this.filterPropertyId = cheque.propertyId || '';
      this.filterUnitId = cheque.unitId || '';
      this.filterUnitName = cheque.unitName || '';
    }
    this.closeReceiptLookup();
    this.applyFilters();
  }

  // Customer Lookup
  openCustomerLookup(): void {
    this.customerModalFilter = '';
    this.filterModalCustomers();
    this.showCustomerLookup = true;
  }
  closeCustomerLookup(): void { this.showCustomerLookup = false; }
  filterModalCustomers(): void {
    const q = this.customerModalFilter.toLowerCase();
    this.filteredModalCustomers = this.uniqueCustomers.filter(c => 
      (c.id || '').toLowerCase().includes(q) || (c.name || '').toLowerCase().includes(q)
    );
  }
  selectCustomerFromLookup(c: any): void {
    const cheque = this.allCheques.find(ch => ch.customerId === c.id);
    if (cheque) {
      this.filterCustomerId = cheque.customerId || '';
      this.filterReceiptNo = cheque.receiptNo || '';
      this.filterPropertyId = cheque.propertyId || '';
      this.filterUnitId = cheque.unitId || '';
      this.filterUnitName = cheque.unitName || '';
    }
    this.closeCustomerLookup();
    this.applyFilters();
  }

  // Property Lookup
  openPropertyLookup(): void {
    this.propertyModalFilter = '';
    this.filterModalProperties();
    this.showPropertyLookup = true;
  }
  closePropertyLookup(): void { this.showPropertyLookup = false; }
  filterModalProperties(): void {
    const q = this.propertyModalFilter.toLowerCase();
    this.filteredModalProperties = this.uniqueProperties.filter(p => 
      (p.id || '').toLowerCase().includes(q) || (p.name || '').toLowerCase().includes(q)
    );
  }
  selectPropertyFromLookup(p: any): void {
    const cheque = this.allCheques.find(ch => ch.propertyId === p.id);
    if (cheque) {
      this.filterPropertyId = cheque.propertyId || '';
      this.filterReceiptNo = cheque.receiptNo || '';
      this.filterCustomerId = cheque.customerId || '';
      this.filterUnitId = cheque.unitId || '';
      this.filterUnitName = cheque.unitName || '';
    }
    this.closePropertyLookup();
    this.applyFilters();
  }

  // Unit Lookup
  openUnitLookup(): void {
    this.unitModalFilter = '';
    this.filterModalUnits();
    this.showUnitLookup = true;
  }
  closeUnitLookup(): void { this.showUnitLookup = false; }
  filterModalUnits(): void {
    const q = this.unitModalFilter.toLowerCase();
    this.filteredModalUnits = this.uniqueUnits.filter(u => 
      (u.id || '').toLowerCase().includes(q) || (u.name || '').toLowerCase().includes(q)
    );
  }
  selectUnitFromLookup(u: any): void {
    const cheque = this.allCheques.find(ch => ch.unitId === u.id);
    if (cheque) {
      this.filterUnitId = cheque.unitId || '';
      this.filterUnitName = cheque.unitName || '';
      this.filterReceiptNo = cheque.receiptNo || '';
      this.filterCustomerId = cheque.customerId || '';
      this.filterPropertyId = cheque.propertyId || '';
    }
    this.closeUnitLookup();
    this.applyFilters();
  }

  bulkUpdate(): void {
    const dirtyCheques = this.allCheques.filter(c => c.newStatus && c.newStatus !== c.status);
    if (dirtyCheques.length === 0) return;

    this.isSaving = true;
    let completedCount = 0;
    
    dirtyCheques.forEach(c => {
      // Logic for each status based on ChequeService
      if (c.newStatus === 'Realized' || c.newStatus === 'Cleared') {
        this.chequeService.markCleared(c.headerId).subscribe({
          next: () => {
            this.handleSuccessfulUpdate(c);
            this.checkCompletion(++completedCount, dirtyCheques.length);
          },
          error: () => this.checkCompletion(++completedCount, dirtyCheques.length)
        });
      } else if (c.newStatus === 'Bounce') {
        // Since we don't have a prompt for bounce reason in bulk update, we send a generic reason or empty
        this.chequeService.markBounced(c.headerId, 'Bounced during bulk update').subscribe({
          next: () => {
            this.handleSuccessfulUpdate(c);
            this.checkCompletion(++completedCount, dirtyCheques.length);
          },
          error: () => this.checkCompletion(++completedCount, dirtyCheques.length)
        });
      } else {
        // Fallback or Exchange logic. For now, since Exchange doesn't have a dedicated endpoint yet, 
        // we might just update local state or skip. The user said: "the exchange option is not in api for now so we will implement the functionality of it as it is". 
        // I'll just update local state.
        c.status = c.newStatus!;
        c.newStatus = undefined;
        this.checkCompletion(++completedCount, dirtyCheques.length);
      }
    });
  }

  private handleSuccessfulUpdate(c: ConsoleChequeVM): void {
    c.status = c.newStatus!;
    c.newStatus = undefined;
    if (c.status === 'Bounce' || c.status === 'Realized' || c.status === 'Cleared') {
      this.removeChequeFromTable(c.detailId);
    }
  }

  private checkCompletion(count: number, total: number): void {
    if (count === total) {
      this.isSaving = false;
      this.applyFilters();
      this.cdr.detectChanges();
    }
  }

  private removeChequeFromTable(detailId: number): void {
    this.allCheques = this.allCheques.filter(c => c.detailId !== detailId);
    this.applyFilters();
  }

}
