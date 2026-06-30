import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CheckItem } from '../../utils/receipt-calculation';
@Component({
  selector: 'app-check-grid',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './check-grid.component.html',
  styleUrls: ['./check-grid.component.scss']
})
export class CheckGridComponent {
  @Input() checks: CheckItem[] = [];
  @Output() checksChange = new EventEmitter<CheckItem[]>();
  @Output() totalAmountChange = new EventEmitter<number>();
  addRow(): void {
    const nextLineNo = this.checks.length + 1;
    const today = new Date().toISOString().substring(0, 10);
    this.checks.push({
      lineNo: nextLineNo,
      checkNo: `CHK-${String(Math.floor(100000 + Math.random() * 900000))}`,
      checkDate: today,
      amount: 0,
      remarks: `Check ${nextLineNo}`
    });
    this.onGridUpdated();
  }
  removeRow(index: number): void {
    this.checks.splice(index, 1);
    // Re-index lines
    this.checks.forEach((item, idx) => {
      item.lineNo = idx + 1;
    });
    this.onGridUpdated();
  }
  onAmountChanged(): void {
    this.onGridUpdated();
  }
  onGridUpdated(): void {
    this.checksChange.emit(this.checks);
    const sum = this.checks.reduce((acc, item) => acc + (item.amount || 0), 0);
    this.totalAmountChange.emit(Math.round(sum * 100) / 100);
  }
}
