export interface ContractDetail {
  id?: number;
  contractId?: number;
  serviceType?: string;
  amount?: number;
  dueDate?: string;
  contract?: string;
  createdBy?: string;
  createdDate?: string;
  updatedBy?: string;
  updatedDate?: string;
  isDeleted?: boolean;
  deletedBy?: string;
  deletedDate?: string;
}

export interface Contract {
  id: number;
  contractNo: string;
  contractDate: string;
  customerCode: string;
  customerName: string;
  propertyId: string;
  unitNo: string;
  leaseStartDate: string;
  leaseEndDate: string;
  annualRent: number;
  securityDeposit: number;
  paymentTerms: string;
  chequeDetails: string;
  status: string;
  notWillingToContinue: boolean;
  notWillingDate?: string;
  expectedLeavingDate?: string;
  remarks: string;
  details?: ContractDetail[];
  
  createdBy?: string;
  createdDate?: string;
  updatedBy?: string;
  updatedDate?: string;
  isDeleted?: boolean;
  deletedBy?: string;
  deletedDate?: string;
}

export interface CreateContractRequest {
  contractNo: string;
  contractDate: string;
  customerCode: string;
  customerName: string;
  propertyId: string;
  unitNo: string;
  leaseStartDate: string;
  leaseEndDate: string;
  annualRent: number;
  securityDeposit: number;
  paymentTerms: string;
  chequeDetails: string;
  remarks: string;
}
