import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-totals-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './totals-tab.component.html',
  styleUrls: ['./totals-tab.component.scss']
})
export class TotalsTabComponent {

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
}
