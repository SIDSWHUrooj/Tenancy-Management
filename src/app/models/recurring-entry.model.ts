export interface RecurringDetailDto {
  id: number;
  headerId: number;
  process: boolean;
  invoiceNumber: string;
  customer: string;
  customerName: string;
  year: number;
  month: number;
  noOfDays: number;
  unitNo: string;
  serviceType: string;
  description: string;
  amount: number;
  header?: string;
}

export interface RecurringHeaderDto {
  id: number;
  year: number;
  month: number;
  status: string;
  details: RecurringDetailDto[];
}

// UI-facing shape used by the grid — keeps your template untouched
export interface RecurringDetail {
  id: number;
  headerId: number;
  invoiceNumber: string;
  customer: string;
  customerName: string;
  unitNo: string;
  noOfDays: number;
  amount: number;
  processed: boolean;
  processedOn?: string;
} 