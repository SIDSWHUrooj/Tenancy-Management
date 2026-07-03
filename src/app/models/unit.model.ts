// ── GET /api/ty/units
// ── GET /api/ty/units/{id}
// ── GET /api/ty/units/by-property/{propertyId} — Response data[]

export interface Unit {
  id: number;
  unitNo: string;
  propertyId: string;
  description: string;
  floor: string;
  status: string;
  annualRent: number;
  createdBy: string;
  createdDate: string;
  updatedBy: string;
  updatedDate: string;
  isDeleted: boolean;
}

// ── POST /api/ty/units
// ── PUT  /api/ty/units/{id} — Request body

export interface UnitRequest {
  unitNo: string;
  propertyId: string;
  description: string;
  floor: string;
  status: string;
  annualRent: number;
}
