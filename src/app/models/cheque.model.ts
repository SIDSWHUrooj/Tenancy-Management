export interface ChequeDetail {
  id?: number;
  chequeHeaderId?: number;
  bankName: string;
  chequeNo: string;
  chequeDate: string;
  chequeAmount: number;
  chequeStatus?: string;
  bounceDate?: string | null;
  bounceReason?: string | null;
  remarks?: string;
  header?: string;
}

export interface ChequeHeader {
  id?: number;
  chequeId?: string;
  customerCode: string;
  contractNo: string;
  invoiceNumber: string;
  details: ChequeDetail[];
}

export interface ChequeRequest {
  id?: number;
  chequeId?: string;
  customerCode: string;
  contractNo: string;
  invoiceNumber: string;
  details: ChequeDetailRequest[];
}

export interface ChequeDetailRequest {
  id?: number;
  chequeHeaderId?: number;
  bankName: string;
  chequeNo: string;
  chequeDate: string;
  chequeAmount: number;
  chequeStatus?: string;
  remarks?: string;
}