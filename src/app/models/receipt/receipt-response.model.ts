import { Receipt } from './receipt.model';

export interface ReceiptResponse {
  success: boolean;
  message: string;
  data: Receipt;
}