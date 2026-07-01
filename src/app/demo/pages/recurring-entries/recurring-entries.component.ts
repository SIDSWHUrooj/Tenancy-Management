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
  processedOn?: string;
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

  // Grid Data - pending only is ever shown in the main grid
  allDetails: RecurringDetail[] = [];
  filteredDetails: RecurringDetail[] = [];

  // History Modal State - processed entries for the selected period
  processedDetails: RecurringDetail[] = [];
  showHistoryModal: boolean = false;

  // Row-level processing state (disables the button while "in flight")
  processingIds: Set<number> = new Set<number>();

  // Mock database of recurring details per Year-Month period
  private mockDatabase: { [key: string]: RecurringDetail[] } = {
    '2026-6': [
      { id: 1, invoiceNumber: 'INV001', customer: 'C001', customerName: 'Ali Ahmed', unitNo: 'A101', serviceType: 'Rent', description: 'Monthly Rent', noOfDays: 30, amount: 2500, processed: true, processedOn: '30-Jun-2026' },
      { id: 2, invoiceNumber: 'INV002', customer: 'C002', customerName: 'Sara', unitNo: 'B201', serviceType: 'Parking', description: 'Parking Fee', noOfDays: 30, amount: 200, processed: true, processedOn: '30-Jun-2026' },
      { id: 3, invoiceNumber: '-----', customer: 'C003', customerName: 'Ahmad', unitNo: 'C102', serviceType: 'Rent', description: 'Monthly Rent', noOfDays: 30, amount: 1800, processed: false },
      { id: 4, invoiceNumber: '-----', customer: 'C004', customerName: 'Mariam Ali', unitNo: 'D204', serviceType: 'Maintenance', description: 'Building Maintenance', noOfDays: 30, amount: 450, processed: false },
      { id: 5, invoiceNumber: '-----', customer: 'C005', customerName: 'John Smith', unitNo: 'A102', serviceType: 'Rent', description: 'Monthly Rent', noOfDays: 30, amount: 3200, processed: false }
    ],
    '2026-5': [
      { id: 11, invoiceNumber: 'INV-MAY-01', customer: 'C001', customerName: 'Ali Ahmed', unitNo: 'A101', serviceType: 'Rent', description: 'Monthly Rent', noOfDays: 31, amount: 2500, processed: true, processedOn: '31-May-2026' },
      { id: 12, invoiceNumber: 'INV-MAY-02', customer: 'C002', customerName: 'Sara', unitNo: 'B201', serviceType: 'Parking', description: 'Parking Fee', noOfDays: 31, amount: 200, processed: true, processedOn: '31-May-2026' },
      { id: 13, invoiceNumber: 'INV-MAY-03', customer: 'C003', customerName: 'Ahmad', unitNo: 'C102', serviceType: 'Rent', description: 'Monthly Rent', noOfDays: 31, amount: 1800, processed: true, processedOn: '31-May-2026' }
    ]
  };

  ngOnInit(): void {
    this.loadEntries();
  }

  // 1. Load Entries Action - pulls the period's data and splits pending/processed
  loadEntries(): void {
    console.log(`GET /api/ty/recurring-entries?year=${this.selectedYear}&month=${this.selectedMonth}`);
    const key = `${this.selectedYear}-${this.selectedMonth}`;
    const dbEntries = this.mockDatabase[key] || [];

    // Clone to simulate API response retrieval
    const cloned = dbEntries.map(d => ({ ...d }));
    this.allDetails = cloned.filter(d => !d.processed);
    this.processedDetails = cloned.filter(d => d.processed);

    this.processingIds.clear();
    this.applyFilters();
  }

  // 2. Refresh Grid Action
  refreshGrid(): void {
    this.loadEntries();
    console.log('Grid refreshed.');
  }

  // 3. Process a single row - creates the invoice and removes it from the pending grid
  processEntry(item: RecurringDetail): void {
    if (item.processed || this.processingIds.has(item.id)) {
      return;
    }

    this.processingIds.add(item.id);

    console.log('POST /api/ty/recurring-entries/process', { detailId: item.id });

    const key = `${this.selectedYear}-${this.selectedMonth}`;
    const dbEntries = this.mockDatabase[key];
    const dbItem = dbEntries?.find(d => d.id === item.id);

    if (dbItem) {
      const today = new Date();
      const monthLabel = this.months.find(m => m.value === +this.selectedMonth)?.label.substring(0, 3) || '';
      dbItem.processed = true;
      dbItem.invoiceNumber = 'INV-' + Math.floor(100000 + Math.random() * 900000);
      dbItem.processedOn = `${today.getDate()}-${monthLabel}-${today.getFullYear()}`;
    }

    // Remove from pending lists (grid only ever shows pending entries)
    this.allDetails = this.allDetails.filter(d => d.id !== item.id);
    this.filteredDetails = this.filteredDetails.filter(d => d.id !== item.id);

    if (dbItem) {
      this.processedDetails = [...this.processedDetails, { ...dbItem }];
    }

    this.processingIds.delete(item.id);
  }

  isProcessing(id: number): boolean {
    return this.processingIds.has(id);
  }

  // Search filter - grid always shows pending only
  applyFilters(): void {
    let list = this.allDetails;

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

  // History Modal Controls
  openHistory(): void {
    this.showHistoryModal = true;
  }

  closeHistory(): void {
    this.showHistoryModal = false;
  }

  get selectedMonthLabel(): string {
    return this.months.find(m => m.value === +this.selectedMonth)?.label || '';
  }
}