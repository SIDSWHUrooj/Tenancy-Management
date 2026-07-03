// POST /api/ty/attachments/upload         — Response data
// GET  /api/ty/attachments/{code}/{docId} — Response data[]
export interface TyAttachment {
  id: number;
  moduleCode: string;
  documentType: string;
  documentID: string;
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileExtension: string;
  fileSize: number;
  uploadedBy: string;
  uploadedDate: string;
  remarks: string;
  createdBy: string;
  createdDate: string;
  updatedBy: string;
  updatedDate: string;
  isDeleted: boolean;
  deletedBy: string;
  deletedDate: string;
}
