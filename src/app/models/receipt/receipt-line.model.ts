export interface ReceiptLine {
  lineNo: number;
  bank: string;
  receiptDate: string;
  checkNo: string;
  checkDate: string;
  paymentCode: string;
  customerBank: string;
  amount: number;
  comments: string;
}