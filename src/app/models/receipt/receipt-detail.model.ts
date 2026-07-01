export interface ReceiptDetail {
  createdBy: string;
  createdDate: string;
  updatedBy: string;
  updatedDate: string;
  isDeleted: boolean;
  deletedBy: string;
  deletedDate: string;

  id: number;
  receiptId: number;

  lineNo: number;
  bank: string;
  receiptDate: string;
  checkNo: string;
  checkDate: string;
  paymentCode: string;
  customerBank: string;
  amount: number;
  comments: string;

  // receipt?: Receipt;
}