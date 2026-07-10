// ── GET /api/ty/units
// ── GET /api/ty/units/{id}
// ── GET /api/ty/units/by-property/{propertyId} — Response data[]

export interface Unit {
  id: number;
  unitId?: string;
  propertyKey?: number;
  propertyId?: string;
  unitNo?: string;
  block?: string;
  floor?: string;
  unitType?: string;
  taxAuthority?: string;
  unitPurpose?: string;
  unitDescription?: string;
  unitSize?: number;
  unitDewaPremiseNo?: string;
  unitDefaultAmount?: number;
  unitAcCharge?: number;
  unitElectricalCharge?: number;
  otherServiceCharge?: number;
  others?: string;
  deposit?: number;
  targetRent?: number;
  actualRent?: number;
  proposedAmount?: number;
  unitView?: string;
  parkingNumber?: string;
  maintenanceDeposit?: number;
  annualRentMin?: number;
  annualRentMax?: number;
  status?: string;
  remarks?: string;
  property?: string;
  createdBy?: string;
  createdDate?: string;
  updatedBy?: string;
  updatedDate?: string;
  isDeleted?: boolean;
  deletedBy?: string;
  deletedDate?: string;
}

export interface UnitRequest extends Partial<Unit> {}
