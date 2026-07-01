import { Receipt } from './receipt.model';

export interface ReceiptListResponse {
  success: boolean;
  message: string;
  data: Receipt[];
}