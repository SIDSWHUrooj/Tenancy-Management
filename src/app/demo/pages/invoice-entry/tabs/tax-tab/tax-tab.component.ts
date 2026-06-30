import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tax-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tax-tab.component.html',
  styleUrls: ['./tax-tab.component.scss']
})
export class TaxTabComponent {

  taxes = [
    {
      id: 1,
      name: 'VAT',
      percentage: 5,
      selected: true
    },
    {
      id: 2,
      name: 'Municipality Tax',
      percentage: 10,
      selected: false
    },
    {
      id: 3,
      name: 'Service Tax',
      percentage: 3,
      selected: false
    }
  ];

  documentAmount = 25000;

  get totalTaxAmount(): number {

    return this.taxes
      .filter(x => x.selected)
      .reduce(
        (sum, tax) =>
          sum + ((this.documentAmount * tax.percentage) / 100),
        0
      );
  }

}