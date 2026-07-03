// ── GET /api/ty/recurring-entries — Response (batch header)

export interface RecurringEntryHeader {
  id: number;
  year: number;
  month: number;
  status: string;     // 'Generated' | 'Processed' | 'Cancelled'
  createdDate: string;
  updatedDate: string;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
}

// ── GET /api/ty/recurring-entries — Response (detail rows)

export interface RecurringEntryDetail {
  id: number;
  headerId: number;
  invoiceNumber: string;
  customer: string;
  customerName: string;
  unitNo: string;
  serviceType: string;
  description: string;
  noOfDays: number;
  amount: number;
  processed: boolean;
}

// ── POST /api/ty/recurring-entries/generate — Request

export interface RecurringGenerateRequest {
  year: number;
  month: number;
}

// ── POST /api/ty/recurring-entries/process — Request

export interface RecurringProcessRequest {
  detailIds: number[];
}
