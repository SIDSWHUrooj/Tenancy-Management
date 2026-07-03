// GET /api/ty/document-numbers      — Response data[]
// POST/PUT /api/ty/document-numbers — Response data
export interface DocumentNumber {
  id: number;
  documentName: string;
  length: number;
  prefix: string;
  nextNumber: number;
  documentType: string;
  isActive: boolean;
  createdBy: string;
  createdDate: string;
  updatedBy: string;
  updatedDate: string;
  isDeleted: boolean;
}

// GET /api/ty/document-numbers/next/{documentType} — Response data
export interface NextDocumentNumber {
  documentType: string;
  number: string;
}
