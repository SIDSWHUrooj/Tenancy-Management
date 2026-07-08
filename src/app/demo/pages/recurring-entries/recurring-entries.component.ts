import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecurringEntriesService } from '../../../services/recurring-entries.service' ;
import { RecurringDetail, RecurringHeaderDto } from'../../../models/recurring-entry.model';

@Component({
  selector: 'app-recurring-entries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recurring-entries.component.html',
  styleUrls: ['./recurring-entries.component.scss']
})
export class RecurringEntriesComponent implements OnInit {

  years: number[] = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];
  months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  selectedYear: number = 2026;
  selectedMonth: number = 6;
  searchQuery: string = '';

  allDetails: RecurringDetail[] = [];
  filteredDetails: RecurringDetail[] = [];
  processedDetails: RecurringDetail[] = [];
  showHistoryModal: boolean = false;
  processingIds: Set<number> = new Set<number>();
  isLoading: boolean = false;

  constructor(private recurringService: RecurringEntriesService) {}

  ngOnInit(): void {
    this.loadEntries();
  }

  // GET /api/ty/recurring-entries?year=&month=
 // POST generate -> then GET /api/ty/recurring-entries?year=&month=
loadEntries(): void {
  this.isLoading = true;

  this.recurringService.generateEntries(+this.selectedYear, +this.selectedMonth).subscribe({
    next: () => this.fetchEntries(),
    error: (err) => {
      console.warn('Generate call failed (likely already generated for this period) — fetching existing entries anyway', err);
      this.fetchEntries(); // always attempt to load, regardless of generate outcome
    }
  });
}

private fetchEntries(): void {
  this.recurringService.getEntries(this.selectedYear, this.selectedMonth).subscribe({
    next: (res) => {
      if (res.success && res.data) {
        this.mapHeadersToGrid(res.data);
      } else {
        this.allDetails = [];
        this.processedDetails = [];
      }
      this.applyFilters();
      this.isLoading = false;
    },
    error: (err) => {
      console.error('Failed to load recurring entries', err);
      this.isLoading = false;
    }
  });
}

  private mapHeadersToGrid(headers: RecurringHeaderDto[]): void {
    const allRows: RecurringDetail[] = [];

    headers.forEach(header => {
      (header.details || []).forEach(d => {
        allRows.push({
          id: d.id,
          headerId: d.headerId ?? header.id,
          invoiceNumber: d.invoiceNumber,
          customer: d.customer,
          customerName: d.customerName,
          unitNo: d.unitNo,
          noOfDays: d.noOfDays,
          amount: d.amount,
          processed: d.process
        });
      });
    });

    this.allDetails = allRows.filter(d => !d.processed);
    this.processedDetails = allRows.filter(d => d.processed);
  }

  refreshGrid(): void {
    this.loadEntries();
  }

  // POST /api/ty/recurring-entries/process -> then create-invoices for that header
  processEntry(item: RecurringDetail): void {
    if (item.processed || this.processingIds.has(item.id)) {
      return;
    }

    this.processingIds.add(item.id);

    this.recurringService.processEntries([item.id]).subscribe({
      next: (res) => {
        if (res.success) {
          this.recurringService.createInvoices(item.headerId).subscribe({
            next: () => {
              this.processingIds.delete(item.id);
              this.loadEntries(); // refresh from server for real invoice numbers/status
            },
            error: (err) => {
              console.error('Invoice creation failed', err);
              this.processingIds.delete(item.id);
              this.loadEntries();
            }
          });
        } else {
          this.processingIds.delete(item.id);
        }
      },
      error: (err) => {
        console.error('Processing failed', err);
        this.processingIds.delete(item.id);
      }
    });
  }

  isProcessing(id: number): boolean {
    return this.processingIds.has(id);
  }

  applyFilters(): void {
    let list = this.allDetails;

    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(d =>
        (d.invoiceNumber && d.invoiceNumber.toLowerCase().includes(q)) ||
        (d.customer && d.customer.toLowerCase().includes(q)) ||
        (d.customerName && d.customerName.toLowerCase().includes(q)) ||
        (d.unitNo && d.unitNo.toLowerCase().includes(q))
      );
    }

    this.filteredDetails = list;
  }

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