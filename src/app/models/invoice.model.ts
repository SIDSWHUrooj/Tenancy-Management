// ── Detail line ───────────────────────────────────────────────────────
// Used inside both Invoice (response) and InvoiceRequest (request)

export interface InvoiceDetail {
  id?: number;
  invoiceId?: number;
  lineNo: number;
  unitNo: string;
  serviceType: string;
  description: string;
  amount: number;     // NOTE: must be > 0.01 (API validation)
  remarks: string;
  createdBy?: string;
  createdDate?: string;
  updatedBy?: string;
  updatedDate?: string;
  isDeleted?: boolean;
}

// ── Tax line ──────────────────────────────────────────────────────────

export interface InvoiceTax {
  id?: number;
  invoiceId?: number;
  taxGroup: string;
  calculateTax: boolean;
  taxAuthority: string;
  customerTaxClass: string;
  taxBase: number;
  taxAmount: number;
  createdBy?: string;
  createdDate?: string;
  updatedBy?: string;
  updatedDate?: string;
  isDeleted?: boolean;
}

// ── GET /api/ty/invoices
// ── GET /api/ty/invoices/{id} — Response data

export interface Invoice {
  id: number;
  invoiceNumber: string;
  invoiceType: string;
  invoiceDate: string;
  customer: string;
  customerName: string;
  landlordCode: string;
  landlordName: string;
  propertyId: string;
  propertyName: string;
  purposeOfLease: string;
  status: string;             // 'Draft' | 'Posted' | 'Cancelled'
  buildingStatus: string;
  unitNo: string;
  multipleUnits: boolean;
  periodFrom: string;
  periodTo: string;
  leaseType: string;
  securityDeposit: number;
  annualRent: number;
  gracePeriodStartDate: string;
  gracePeriodEndDate: string;
  contractNo: string;
  contractDate: string;
  documentNumber: string;
  ejariNumber: string;
  comments: string;
  documentAmount: number;     // computed by API, read-only
  taxAmount: number;          // computed by API, read-only
  documentTotal: number;      // computed by API, read-only
  outstandingAmount: number;  // computed by API, read-only
  details: InvoiceDetail[];
  taxes: InvoiceTax[];
  createdBy: string;
  createdDate: string;
  updatedBy: string;
  updatedDate: string;
  isDeleted: boolean;
}

// ── POST /api/ty/invoices
// ── PUT  /api/ty/invoices/{id} — Request body

export interface InvoiceRequest {
  invoiceNumber: string;
  invoiceType: string;
  invoiceDate: string;
  customer: string;
  customerName: string;
  landlordCode: string;
  landlordName: string;
  propertyId: string;
  propertyName: string;
  purposeOfLease: string;
  buildingStatus: string;
  unitNo: string;
  multipleUnits: boolean;
  periodFrom: string;
  periodTo: string;
  leaseType: string;
  securityDeposit: number;
  annualRent: number;
  gracePeriodStartDate: string | null;  // optional — null when not provided
  gracePeriodEndDate:   string | null;  // optional — null when not provided
  contractNo: string;
  contractDate: string | null;          // optional — null when not provided
  documentNumber: string;
  ejariNumber: string;
  comments: string;
  details: InvoiceDetail[];
  taxes: InvoiceTax[];
}
