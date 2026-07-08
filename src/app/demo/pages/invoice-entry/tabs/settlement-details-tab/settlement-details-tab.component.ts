import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { calculateSettlementStatus } from '../../utils/receipt-calculation';

@Component({
  selector: 'app-settlement-details-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settlement-details-tab.component.html',
  styleUrls: ['./settlement-details-tab.component.scss'],
})
export class SettlementDetailsTabComponent implements OnChanges {
  // Single shared form object — same reference as parent + other tabs
  @Input() form: any;
  /** True once Receipt Details have been posted; enables editing this tab */
  @Input() receiptPosted = false;

  @Output() cancel          = new EventEmitter<void>();
  @Output() saveDraft       = new EventEmitter<void>();
  @Output() post            = new EventEmitter<void>();
  @Output() generateInvoice = new EventEmitter<void>();
  @Output() postAR          = new EventEmitter<void>();
  @Output() postCashWorks   = new EventEmitter<void>();
  @Output() markVacant      = new EventEmitter<void>();
  @Output() uploadFile      = new EventEmitter<{file: File, remarks: string}>();

  newAttachmentRemark = '';
  selectedFile: File | null = null;
  
  readonly serviceTypes: string[] = [
    'Penalty', 'Utility', 'Miscellaneous','Other Charges'
  ];

  ngOnChanges(changes: SimpleChanges): void {
    // Recalculate whenever the parent patches form (e.g. invoice loaded)
    if (changes['form'] && this.form) {
      if (!this.form.creditNotes) {
        this.form.creditNotes = [];
      }
      if (!this.form.attachments) {
        this.form.attachments = [];
      }
      this.recalculate();
    }
  }

  // ── Called when Early Termination toggle changes ──────────────
  onEarlyTerminationChange(): void {
    if (!this.form.earlyTermination) {
      // Reset when disabled
      this.form.leaveDate = this.form.periodTo;
    }
    this.recalculate();
  }

  onToDateChange(): void {
    if (!this.form.leaveDate || !this.form.periodTo) {
      return;
    }

    const selected = new Date(this.form.leaveDate);
    const periodEnd = new Date(this.form.periodTo);

    if (selected > periodEnd) {
      this.form.leaveDate = this.form.periodTo;
    }

    this.recalculate();
  }

  // ── Derive settlement status from current financials ──────────
  recalculate(): void {
    const result = calculateSettlementStatus(
      this.form.invoiceTotal,
      this.form.lastReceiptTotal,
      this.form.receiptTotal
    );
    this.form.balanceAmount = result.balanceAmount;
    // We maintain settlementStatus from the API, only calculating balance here for now
  }

  // ── Credit Notes ──────────────────────────────────────────────
  addCreditNote(): void {
    if (!this.form.creditNotes) {
      this.form.creditNotes = [];
    }
    this.form.creditNotes.push({
      serviceType: '',
      amount: 0,
      remarks: ''
    });
  }

  removeCreditNote(index: number): void {
    this.form.creditNotes.splice(index, 1);
  }

  // ── Attachments ───────────────────────────────────────────────
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  uploadAttachment(): void {
    if (this.selectedFile) {
      this.uploadFile.emit({ file: this.selectedFile, remarks: this.newAttachmentRemark });
      this.selectedFile = null;
      this.newAttachmentRemark = '';
      
      // Reset the file input visually by resetting its value if needed
    } else {
      alert('Please select a file to upload.');
    }
  }

  removeAttachment(index: number): void {
    this.form.attachments.splice(index, 1);
  }

  // ── Actions ───────────────────────────────────────────────────
  cancelSettlement(): void {
    if (confirm('Are you sure you want to cancel the settlement changes?')) {
      this.cancel.emit();
    }
  }

  saveSettlementDraft(): void {
    this.saveDraft.emit();
  }

  postSettlement(): void {
    if (confirm('Are you sure you want to post the settlement?')) {
      this.post.emit();
    }
  }

  generateInvoiceAction(): void {
    this.generateInvoice.emit();
  }

  postARAction(): void {
    this.postAR.emit();
  }

  postCashWorksAction(): void {
    this.postCashWorks.emit();
  }

  markVacantAction(): void {
    this.markVacant.emit();
  }

  printSettlement(): void {
    window.print();
  }
}