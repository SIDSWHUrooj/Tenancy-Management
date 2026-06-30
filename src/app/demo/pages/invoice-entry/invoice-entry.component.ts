import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { BuildingTabComponent } from './tabs/building-tab/building-tab.component';
import { TaxTabComponent } from './tabs/tax-tab/tax-tab.component';
import { TotalsTabComponent } from './tabs/totals-tab/totals-tab.component';

@Component({
  selector: 'app-invoice-entry',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BuildingTabComponent,
    TaxTabComponent,
    TotalsTabComponent
  ],
  templateUrl: './invoice-entry.component.html',
  styleUrls: ['./invoice-entry.component.scss']
})
export class InvoiceEntryComponent implements OnInit {

  activeTab = 'building';
  invoiceNo = 'INV-000001';
  invoiceDate = '';
  invoiceType = 'New';
  purposeOfLease = 'Commercial';

  customerId = '';
  customerName = '';
  propertyId = '';
  propertyName = '';

  // Pop-up Modal State
  showTypeModal = false; // Changed to false: Do NOT open automatically on page refresh/load
  modalInvoiceType = 'New';
  modalContractNo = '';
  modalPrevInvoiceNo = '';
  modalEjariNo = '';
  totals = {
    documentAmount: 25000,
    lastDocumentTotal: 5000,
    taxAmount: 1250,
    discountAmount: 0,
    contractNumber: 'CNT-2026-001',
    contractDate: '2026-06-23',
    documentNumber: 'DOC-2026-001',
    ejariNumber: '',
    comments: ''
  };

  get grandTotal(): number {
    return (
      this.totals.documentAmount +
      this.totals.lastDocumentTotal +
      this.totals.taxAmount -
      this.totals.discountAmount
    );
  }
  ngOnInit(): void {
    // Set default invoice date to today
    const today = new Date();
    this.invoiceDate = today.toISOString().substring(0, 10);
  }

  setTab(tab: string): void {
    this.activeTab = tab;
  }

  openInvoiceLookup(): void {
    console.log('Open Invoice Lookup');
    alert('Invoice lookup dialog opened (Simulated)');
  }

  openCustomerLookup(): void {
    console.log('Open Customer Lookup');
    this.customerId = 'C00024';
    this.customerName = 'Falcon Trading LLC';
    alert('Customer ID Prequery: Selected Falcon Trading LLC');
  }

  openPropertyLookup(): void {
    console.log('Open Property Lookup');
    this.propertyId = 'P2008';
    this.propertyName = 'Al Rostamani Tower B';
    alert('Property ID Prequery: Selected Al Rostamani Tower B');
  }

  // Opens the type modal pop-up manually (simulating click sidebar icon)
  openTypeModal(): void {
    this.showTypeModal = true;
    this.modalInvoiceType = this.invoiceType;
    this.modalContractNo = '';
    this.modalPrevInvoiceNo = '';
    this.modalEjariNo = '';
  }

  // Confirm selection in the type modal
  confirmInvoiceType(): void {
    this.invoiceType = this.modalInvoiceType;
    this.showTypeModal = false;

    console.log('User selected invoice type:', this.invoiceType);

    // Auto-fill fields according to selected option (MOCKED)
    if (this.invoiceType === 'Renewal') {
      this.invoiceNo = 'INV-RNW-0098';
      this.customerId = 'C00002';
      this.customerName = 'Delta Auto Spare Parts';
      this.propertyId = 'P1001';
      this.propertyName = 'Gargash Al Nasr Building';
      this.purposeOfLease = 'Commercial';
      alert(`Renewal Configured!\nPre-populated from Lease Contract: ${this.modalContractNo || 'CNT-2026-001'}`);
    } 
    else if (this.invoiceType === 'Additional') {
      this.invoiceNo = 'INV-ADD-0442';
      this.customerId = 'C00015';
      this.customerName = 'Emirates Catering Services';
      this.propertyId = 'P1055';
      this.propertyName = 'Industrial Warehouse City';
      this.purposeOfLease = 'Warehouse';
      alert(`Additional Invoice Configured!\nLinked to Previous Invoice: ${this.modalPrevInvoiceNo || 'INV-000001'}`);
    } 
    else if (this.invoiceType === 'Ejari') {
      this.invoiceNo = 'INV-EJR-0112';
      this.customerId = 'C00088';
      this.customerName = 'Apex Office Space Co';
      this.propertyId = 'P3004';
      this.propertyName = 'Business Bay Marina Plaza';
      this.purposeOfLease = 'Office';
      alert(`Ejari Invoice Configured!\nEjari Contract Reference: ${this.modalEjariNo || 'EJR-988223'}`);
    } 
    else {
      // "New" - resets/clears fields
      this.resetFields();
      alert('New Invoice Configured! Form initialized with clear fields.');
    }
  }

  // Resets the whole document
  resetInvoice(): void {
    if (confirm('Are you sure you want to refresh and clear the entire invoice document?')) {
      this.resetFields();
      this.showTypeModal = false; // Do NOT open modal automatically on reset either
      console.log('Invoice reset completed');
      alert('Invoice fields cleared.');
    }
  }

  private resetFields(): void {
    this.invoiceNo = 'INV-' + Math.floor(100000 + Math.random() * 900000);
    const today = new Date();
    this.invoiceDate = today.toISOString().substring(0, 10);
    this.invoiceType = 'New';
    this.purposeOfLease = 'Commercial';
    this.customerId = '';
    this.customerName = '';
    this.propertyId = '';
    this.propertyName = '';
    this.modalInvoiceType = 'New';
    this.modalContractNo = '';
    this.modalPrevInvoiceNo = '';
    this.modalEjariNo = '';
  }

  saveInvoice(): void {
    console.log('Saving entire invoice details...', {
      invoiceNo: this.invoiceNo,
      invoiceDate: this.invoiceDate,
      invoiceType: this.invoiceType,
      customerId: this.customerId,
      propertyId: this.propertyId
    });
    alert('Invoice saved successfully!');
  }

  printInvoice(): void {
    console.log('Printing Invoice...');
    window.print();
  }
}
