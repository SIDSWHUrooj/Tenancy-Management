// ── GET /api/ty/properties
// ── GET /api/ty/properties/{id} — Response data

export interface Property {
  id: number;
  propertyId: string;
  propertyName: string;
  address: string;
  city: string;
  country: string;
  status: string;
  createdBy: string;
  createdDate: string;
  updatedBy: string;
  updatedDate: string;
  isDeleted: boolean;
}

// ── POST /api/ty/properties
// ── PUT  /api/ty/properties/{id} — Request body

export interface PropertyRequest {
  propertyId: string;
  propertyName: string;
  address: string;
  city: string;
  country: string;
  status: string;
}
