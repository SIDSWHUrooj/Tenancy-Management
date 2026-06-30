import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface RecurringDetail {
  id: number;
  invoiceNumber: string;
  customer: string;
  customerName: string;
  unitNo: string;
  serviceType: string;
  description: string;
  noOfDays: number;
  amount: number;
  processed: boolean;
}

export interface RecurringBatch {
  id: number;
  year: number;
  month: number;
  status: 'Generated' | 'Processed' | 'Cancelled';
  createdDate: string;
  updatedDate: string;
}

@Component({
  selector: 'app-recurring-entries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recurring-entries.component.html',
  styleUrls: ['./recurring-entries.component.scss']
})
export class RecurringEntriesComponent implements OnInit {

  // Period Selection Lists
  years: number[] = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];
  months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  // Filters State
  selectedYear: number = 2026;
  selectedMonth: number = 6;
  searchQuery: string = '';
  showProcessed: boolean = true;

  // Batch Summary Data (Readonly after load)
  currentBatch: RecurringBatch | null = null;

  // Grid Data
  allDetails: RecurringDetail[] = [];
  filteredDetails: RecurringDetail[] = [];
  selectedDetailIds: Set<number> = new Set<number>();

  // Database of Mock Batches and Details for different periods
  private mockDatabase: { [key: string]: { batch: RecurringBatch, details: RecurringDetail[] } } = {
    '2026-6': {
      batch: {
        id: 35,
        year: 2026,
        month: 6,
        status: 'Generated',
        createdDate: '30-Jun-2026',
        updatedDate: '30-Jun-2026'
      },
      details: [
        { id: 1, invoiceNumber: 'INV001', customer: 'C001', customerName: 'Ali Ahmed', unitNo: 'A101', serviceType: 'Rent', description: 'Monthly Rent', noOfDays: 30, amount: 2500, processed: true },
        { id: 2, invoiceNumber: 'INV002', customer: 'C002', customerName: 'Sara', unitNo: 'B201', serviceType: 'Parking', description: 'Parking Fee', noOfDays: 30, amount: 200, processed: true },
        { id: 3, invoiceNumber: '-----', customer: 'C003', customerName: 'Ahmad', unitNo: 'C102', serviceType: 'Rent', description: 'Monthly Rent', noOfDays: 30, amount: 1800, processed: false },
        { id: 4, invoiceNumber: '-----', customer: 'C004', customerName: 'Mariam Ali', unitNo: 'D204', serviceType: 'Maintenance', description: 'Building Maintenance', noOfDays: 30, amount: 450, processed: false },
        { id: 5, invoiceNumber: '-----', customer: 'C005', customerName: 'John Smith', unitNo: 'A102', serviceType: 'Rent', description: 'Monthly Rent', noOfDays: 30, amount: 3200, processed: false }
      ]
    },
    '2026-5': {
      batch: {
        id: 31,
        year: 2026,
        month: 5,
        status: 'Processed',
        createdDate: '31-May-2026',
        updatedDate: '31-May-2026'
      },
      details: [
        { id: 11, invoiceNumber: 'INV-MAY-01', customer: 'C001', customerName: 'Ali Ahmed', unitNo: 'A101', serviceType: 'Rent', description: 'Monthly Rent', noOfDays: 31, amount: 2500, processed: true },
        { id: 12, invoiceNumber: 'INV-MAY-02', customer: 'C002', customerName: 'Sara', unitNo: 'B201', serviceType: 'Parking', description: 'Parking Fee', noOfDays: 31, amount: 200, processed: true },
        { id: 13, invoiceNumber: 'INV-MAY-03', customer: 'C003', customerName: 'Ahmad', unitNo: 'C102', serviceType: 'Rent', description: 'Monthly Rent', noOfDays: 31, amount: 1800, processed: true }
      ]
    }
  };

  ngOnInit(): void {
    // Load initial data on startup
    this.loadEntries();
  }

  // 1. Generate Entries Action
  generateEntries(): void {
    if (!this.selectedYear || !this.selectedMonth) {
      alert('Please select both Year and Month.');
      return;
    }

    console.log('POST /api/ty/recurring-entries/generate', {
      year: this.selectedYear,
      month: this.selectedMonth
    });

    const key = `${this.selectedYear}-${this.selectedMonth}`;
    const formattedMonthName = this.months.find(m => m.value === +this.selectedMonth)?.label || '';
    
    // Simulate generation by adding new data to the mock db if not present
    if (!this.mockDatabase[key]) {
      const generatedId = Math.floor(Math.random() * 80) + 40;
      const today = new Date();
      const formattedDate = `${today.getDate()}-${formattedMonthName.substring(0, 3)}-${today.getFullYear()}`;

      this.mockDatabase[key] = {
        batch: {
          id: generatedId,
          year: +this.selectedYear,
          month: +this.selectedMonth,
          status: 'Generated',
          createdDate: formattedDate,
          updatedDate: formattedDate
        },
        details: [
          { id: Math.floor(Math.random() * 1000) + 100, invoiceNumber: '-----', customer: 'C101', customerName: 'Zubair Khan', unitNo: 'U302', serviceType: 'Rent', description: 'Monthly Rent', noOfDays: 30, amount: 2100, processed: false },
          { id: Math.floor(Math.random() * 1000) + 100, invoiceNumber: '-----', customer: 'C102', customerName: 'Fatima Omar', unitNo: 'U110', serviceType: 'Maintenance', description: 'AC Repair Service', noOfDays: 30, amount: 350, processed: false }
        ]
      };
    } else {
      // If it exists, reset the statuses to 'Generated' / unprocessed to simulate regenerating
      this.mockDatabase[key].batch.status = 'Generated';
      this.mockDatabase[key].details.forEach(d => {
        d.processed = false;
        d.invoiceNumber = '-----';
      });
    }

    this.loadEntries();
    alert(`Successfully generated recurring entries for ${formattedMonthName} ${this.selectedYear}!`);
  }

  // 2. Load Entries Action
  loadEntries(): void {
    console.log(`GET /api/ty/recurring-entries?year=${this.selectedYear}&month=${this.selectedMonth}`);
    const key = `${this.selectedYear}-${this.selectedMonth}`;
    
    if (this.mockDatabase[key]) {
      const dbEntry = this.mockDatabase[key];
      // Clone batch and details to simulate API response retrieval
      this.currentBatch = { ...dbEntry.batch };
      this.allDetails = dbEntry.details.map(d => ({ ...d }));
    } else {
      this.currentBatch = null;
      this.allDetails = [];
    }

    this.selectedDetailIds.clear();
    this.applyFilters();
  }

  // 3. Process Selected Rows Action
  processSelected(): void {
    if (this.selectedDetailIds.size === 0) {
      alert('Please check at least one row to process.');
      return;
    }

    const idsToProcess = Array.from(this.selectedDetailIds);
    console.log('POST /api/ty/recurring-entries/process', {
      detailIds: idsToProcess
    });

    const key = `${this.selectedYear}-${this.selectedMonth}`;
    if (this.mockDatabase[key]) {
      const details = this.mockDatabase[key].details;
      
      // Update each matching row in database to processed
      details.forEach(item => {
        if (idsToProcess.includes(item.id) && !item.processed) {
          item.processed = true;
          item.invoiceNumber = 'INV-' + Math.floor(100000 + Math.random() * 900000);
        }
      });

      // Update batch status if all rows are now processed
      const allProcessed = details.every(d => d.processed);
      if (allProcessed) {
        this.mockDatabase[key].batch.status = 'Processed';
      }
    }

    // Reload grid
    this.loadEntries();
    alert(`Successfully processed ${idsToProcess.length} recurring entries!`);
  }

  // 4. Create Invoices Action
  createInvoices(): void {
    if (!this.currentBatch) {
      alert('No recurring batch loaded.');
      return;
    }

    if (this.currentBatch.status !== 'Processed') {
      alert('Cannot create invoices. Batch status must be Processed first.');
      return;
    }

    console.log(`POST /api/ty/recurring-entries/${this.currentBatch.id}/create-invoices`);
    
    alert(`Successfully created lease invoices for Batch ID ${this.currentBatch.id}!`);
  }

  // 5. Refresh Grid Action
  refreshGrid(): void {
    this.loadEntries();
    console.log('Grid refreshed.');
  }

  // Row Selection Helpers
  toggleSelectAll(event: any): void {
    const checked = event.target.checked;
    if (checked) {
      this.filteredDetails.forEach(d => {
        if (!d.processed) {
          this.selectedDetailIds.add(d.id);
        }
      });
    } else {
      this.selectedDetailIds.clear();
    }
  }

  isAllSelected(): boolean {
    const unProcessedFiltered = this.filteredDetails.filter(d => !d.processed);
    if (unProcessedFiltered.length === 0) return false;
    return unProcessedFiltered.every(d => this.selectedDetailIds.has(d.id));
  }

  toggleRowSelection(id: number): void {
    if (this.selectedDetailIds.has(id)) {
      this.selectedDetailIds.delete(id);
    } else {
      this.selectedDetailIds.add(id);
    }
  }

  isRowSelected(id: number): boolean {
    return this.selectedDetailIds.has(id);
  }

  // Search and Processed Toggle Filters
  applyFilters(): void {
    let list = this.allDetails;

    // Filter by processed checkbox
    if (!this.showProcessed) {
      list = list.filter(d => !d.processed);
    }

    // Filter by text search query
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(d => 
        (d.invoiceNumber && d.invoiceNumber.toLowerCase().includes(q)) ||
        (d.customer && d.customer.toLowerCase().includes(q)) ||
        (d.customerName && d.customerName.toLowerCase().includes(q)) ||
        (d.unitNo && d.unitNo.toLowerCase().includes(q)) ||
        (d.description && d.description.toLowerCase().includes(q))
      );
    }

    this.filteredDetails = list;
  }

  // Get status badge class according to the theme
  getBatchStatusClass(status: string): string {
    switch (status) {
      case 'Generated':
        return 'status-generated';
      case 'Processed':
        return 'status-processed';
      case 'Cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  // Can Create Invoice Validation
  canCreateInvoices(): boolean {
    return !!this.currentBatch && this.currentBatch.status === 'Processed';
  }
}
