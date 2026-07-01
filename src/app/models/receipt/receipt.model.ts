import { ReceiptDetail } from './receipt-detail.model';

export interface Receipt {
  createdBy: string;
  createdDate: string;
  updatedBy: string;
  updatedDate: string;
  isDeleted: boolean;
  deletedBy: string;
  deletedDate: string;

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
  status: string;
  receiptDate: string;
  lastReceiptTotal: number;
  balanceAmount: number;
  receiptTotal: number;

  details: ReceiptDetail[];
}