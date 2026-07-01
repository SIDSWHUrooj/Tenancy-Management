import { ReceiptLine } from './receipt-line.model';

export interface ReceiptRequest {
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
  receiptDate: string;
  lastReceiptTotal: number;
  balanceAmount: number;
  receiptTotal: number;
  details: ReceiptLine[];
}   