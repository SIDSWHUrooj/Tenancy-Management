import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-building-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './building-tab.component.html',
  styleUrls: ['./building-tab.component.scss']
})
export class BuildingTabComponent {

  buildingForm = {
    unitNo: '',
    multipleUnits: false,
    status: 'Entered',
    buildingStatus: 'Available',

    periodFrom: '',
    periodTo: '',
    leaseType: 'New',

    purposeOfLease: 'Commercial',
    professionalFees: 0,
    securityDeposit: 0,

    annualRent: 0,
    gracePeriodStart: '',
    gracePeriodEnd: ''
  };

  invoiceItems = [
    {
      unitNo: 'A101',
      serviceType: 'Rent',
      description: 'Monthly Rent',
      amount: 25000,
      remarks: ''
    },
    {
      unitNo: 'A101',
      serviceType: 'Maintenance',
      description: 'Building Maintenance',
      amount: 3000,
      remarks: ''
    }
  ];

  uploadedFiles = [
    {
      name: 'LeaseAgreement.pdf',
      size: '2.4 MB'
    },
    {
      name: 'TenantPassport.jpg',
      size: '1.1 MB'
    }
  ];

  isDragging = false;

  get documentAmount(): number {
    return this.invoiceItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );
  }

  openUnitDialog(): void {
    console.log('Open Unit Search Dialog');
    alert('Unit search dialog triggered');
  }

  searchUnit(): void {
    this.openUnitDialog();
  }

  addRow(): void {
    this.invoiceItems.push({
      unitNo: '',
      serviceType: '',
      description: '',
      amount: 0,
      remarks: ''
    });
  }

  removeRow(index: number): void {
    if (this.invoiceItems.length > 0) {
      this.invoiceItems.splice(index, 1);
    }
  }

  removeFile(index: number): void {
    this.uploadedFiles.splice(index, 1);
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        this.uploadedFiles.push({
          name: file.name,
          size: this.formatBytes(file.size)
        });
      }
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    
    const files = event.dataTransfer?.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        this.uploadedFiles.push({
          name: file.name,
          size: this.formatBytes(file.size)
        });
      }
    }
  }

  private formatBytes(bytes: number, decimals = 1): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Entered':
        return 'status-green';
      case 'Pending':
        return 'status-yellow';
      case 'Approved':
        return 'status-red';
      default:
        return '';
    }
  }

  getBuildingStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Available':
        return 'status-green';
      case 'Reserved':
        return 'status-yellow';
      case 'Occupied':
        return 'status-red';
      default:
        return '';
    }
  }

  saveForm(): void {
    console.log('Saving building form data:', this.buildingForm);
    alert('Form saved successfully!');
  }

  deleteForm(): void {
    if (confirm('Are you sure you want to delete this building record?')) {
      console.log('Deleting building record');
      this.buildingForm = {
        unitNo: '',
        multipleUnits: false,
        status: 'Entered',
        buildingStatus: 'Available',
        periodFrom: '',
        periodTo: '',
        leaseType: 'New',
        purposeOfLease: 'Commercial',
        professionalFees: 0,
        securityDeposit: 0,
        annualRent: 0,
        gracePeriodStart: '',
        gracePeriodEnd: ''
      };
      this.invoiceItems = [];
      this.uploadedFiles = [];
      alert('Record cleared');
    }
  }

  printForm(): void {
    console.log('Printing building document...');
    window.print();
  }
}
