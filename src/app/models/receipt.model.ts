// ── Detail line ───────────────────────────────────────────────────────

export interface ReceiptDetail {
  id?: number;
  receiptId?: number;
  lineNo: number;
  bank: string;
  receiptDate: string;
  checkNo: string;
  checkDate: string;
  paymentCode: string;
  customerBank: string;
  amount: number;
  comments: string;
  createdBy?: string;
  createdDate?: string;
  updatedBy?: string;
  updatedDate?: string;
  isDeleted?: boolean;
}

// ── GET /api/ty/receipts
// ── GET /api/ty/receipts/{id} — Response data

export interface Receipt {
  id: number;
  receiptNumber: string;
  customer: string;
  customerName: string;
  landlordCode: string;
  landlordName: string;
  propertyId: string;
  unitNo: string;
  invoiceNumber: string;
  multipleInvoices: boolean;
  periodFrom: string;
  periodTo: string;
  invoiceTotal: number;
  status: string;           // 'Draft' | 'Posted' | 'Cancelled'
  receiptDate: string;
  lastReceiptTotal: number;
  balanceAmount: number;
  receiptTotal: number;
  details: ReceiptDetail[];
  createdBy: string;
  createdDate: string;
  updatedBy: string;
  updatedDate: string;
  isDeleted: boolean;
}

// ── POST /api/ty/receipts
// ── PUT  /api/ty/receipts/{id} — Request body

export interface ReceiptRequest {
  receiptNumber?: string;
  customer: string;
  customerName: string;
  landlordCode: string;
  landlordName: string;
  propertyId: string;
  unitNo: string;
  invoiceNumber: string;
  multipleInvoices: boolean;
  periodFrom: string;
  periodTo: string;
  invoiceTotal: number;
  receiptDate: string;
  lastReceiptTotal: number;
  balanceAmount: number;
  receiptTotal: number;
  details: ReceiptDetail[];
}
