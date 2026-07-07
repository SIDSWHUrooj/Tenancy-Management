import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-receipt-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './receipt-summary.component.html',
  styleUrls: ['./receipt-summary.component.scss']
})
export class ReceiptSummaryComponent {
  @Input() invoiceTotal: number = 0;
  @Input() lastReceiptTotal: number = 0;
  @Input() receiptTotal: number = 0;
  @Input() balanceAmount: number = 0;
  @Input() status: string = 'Outstanding';
  getStatusBadgeClass(): string {
    switch (this.status) {
      case 'Fully Paid':
        return 'status-green';
      case 'Partially Paid':
        return 'status-yellow';
      case 'Outstanding':
      default:
        return 'status-red';
    }
  }
}
