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

  selectedCheque: ConsoleChequeVM | null = null;
  processingStatus = '';
  bounceReason = '';

  statusOptions = ['Posted', 'Realized', 'Bounce', 'On Hold', 'Exchange'];

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

  selectCheque(cheque: ConsoleChequeVM): void {
    this.selectedCheque = cheque;
    this.processingStatus = cheque.status || 'Posted';
    this.bounceReason = cheque.bounceReason || '';
    
    // Reset exchange fields
    this.newChequeNo = '';
    this.newBankName = '';
    this.newChequeDate = '';
    this.newAmount = cheque.amount;
  }

  cancelProcessing(): void {
    this.selectedCheque = null;
  }

  private removeChequeFromTable(detailId: number): void {
    this.allCheques = this.allCheques.filter(c => c.detailId !== detailId);
    this.applyFilters();
    this.selectedCheque = null;
  }

  updateCheque(): void {
    if (!this.selectedCheque) return;

    if (this.processingStatus === 'Bounce' && !this.bounceReason.trim()) {
      alert('Bounce Reason is mandatory when status is Bounce.');
      return;
    }

    this.isSaving = true;
    const headerId = this.selectedCheque.headerId;
    const detailId = this.selectedCheque.detailId;

    if (this.processingStatus === 'Realized') {
      this.chequeService.markCleared(headerId).subscribe({
        next: (res) => {
          if (res.success) {
            alert('Cheque marked as Realized successfully.');
            this.removeChequeFromTable(detailId);
          } else {
            alert(res.message || 'Failed to update cheque.');
          }
          this.isSaving = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isSaving = false;
          console.error(err);
          alert('Error updating cheque.');
          this.cdr.detectChanges();
        }
      });
    } else if (this.processingStatus === 'Bounce') {
      this.chequeService.markBounced(headerId, this.bounceReason).subscribe({
        next: (res) => {
          if (res.success) {
            alert('Cheque marked as Bounced successfully.');
            this.removeChequeFromTable(detailId);
          } else {
            alert(res.message || 'Failed to update cheque.');
          }
          this.isSaving = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isSaving = false;
          console.error(err);
          alert('Error updating cheque.');
          this.cdr.detectChanges();
        }
      });
    } else if (this.processingStatus === 'Exchange') {
      if (!this.newChequeNo || !this.newBankName || !this.newChequeDate || !this.newAmount) {
        alert('Please fill out all new cheque details for the exchange.');
        this.isSaving = false;
        return;
      }

      // Create new cheque entry via API
      const newChequePayload: any = {
        customerCode: this.selectedCheque.customerId,
        contractNo: '', // we don't have contractNo readily available here, backend might handle it or we leave empty
        invoiceNumber: '', // usually backend links it, or we need to fetch invoice
        bankName: this.newBankName,
        chequeNo: this.newChequeNo,
        chequeDate: new Date(this.newChequeDate).toISOString(),
        chequeAmount: this.newAmount,
        remarks: 'Exchanged from ' + this.selectedCheque.chequeNo
      };

      // In cheque.model.ts, ChequeRequest requires 'details' array for creation
      const payloadWrapper = {
        customerCode: this.selectedCheque.customerId,
        contractNo: '', 
        invoiceNumber: '', 
        details: [newChequePayload]
      };

      this.chequeService.create(payloadWrapper).subscribe({
        next: (res) => {
          if (res.success) {
            alert('New exchange cheque created successfully.');
            // Remove old cheque from table since it has been exchanged
            this.removeChequeFromTable(detailId);
          } else {
            alert(res.message || 'Failed to create exchanged cheque.');
          }
          this.isSaving = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isSaving = false;
          console.error(err);
          alert('Error creating exchanged cheque.');
          this.cdr.detectChanges();
        }
      });

    } else {
      alert(`The backend API currently only supports changing status to 'Realized' or 'Bounce'. Updating to '${this.processingStatus}' is not supported by the database yet.`);
      this.isSaving = false;
    }
  }
}
