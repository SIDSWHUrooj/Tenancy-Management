export interface FinalSettlementDetail {
  createdBy?: string;
  createdDate?: string;
  updatedBy?: string;
  updatedDate?: string;
  isDeleted?: boolean;
  deletedBy?: string;
  deletedDate?: string;
  id?: number;
  settlementId?: number;
  documentNumber?: string;
  documentKind?: string;
  documentDate?: string;
  amount?: number;
  settlement?: string;
}

export interface FinalSettlementCreditNote {
  createdBy?: string;
  createdDate?: string;
  updatedBy?: string;
  updatedDate?: string;
  isDeleted?: boolean;
  deletedBy?: string;
  deletedDate?: string;
  id?: number;
  settlementId?: number;
  lineNo?: number;
  serviceType?: string;
  description?: string;
  amount?: number;
  remarks?: string;
  settlement?: string;
}

export interface FinalSettlement {
  createdBy?: string;
  createdDate?: string;
  updatedBy?: string;
  updatedDate?: string;
  isDeleted?: boolean;
  deletedBy?: string;
  deletedDate?: string;
  id?: number;
  settlementNumber?: string;
  contractNo?: string;
  customer?: string;
  customerName?: string;
  landlordCode?: string;
  landlordName?: string;
  propertyId?: string;
  propertyName?: string;
  postingDate?: string;
  recurringDays?: number;
  recurringAmount?: number;
  unitNo?: string;
  earlyTermination?: boolean;
  leavingDate?: string;
  daysConsumed?: number;
  status?: string;
  rentCollected?: number;
  securityDepositCollected?: number;
  rentForDaysConsumed?: number;
  rentForUnutilizedDays?: number;
  details?: FinalSettlementDetail[];
  creditNotes?: FinalSettlementCreditNote[];
}

export interface FinalSettlementRequest {
  settlementNumber?: string;
  contractNo?: string;
  customer?: string;
  customerName?: string;
  landlordCode?: string;
  landlordName?: string;
  propertyId?: string;
  propertyName?: string;
  postingDate?: string;
  recurringDays?: number;
  recurringAmount?: number;
  unitNo?: string;
  earlyTermination?: boolean;
  leavingDate?: string;
  daysConsumed?: number;
  rentCollected?: number;
  securityDepositCollected?: number;
  rentForDaysConsumed?: number;
  rentForUnutilizedDays?: number;
  creditNotes?: FinalSettlementCreditNoteRequest[];
}

export interface FinalSettlementCreditNoteRequest {
  lineNo?: number;
  serviceType?: string;
  description?: string;
  amount?: number;
  remarks?: string;
}
