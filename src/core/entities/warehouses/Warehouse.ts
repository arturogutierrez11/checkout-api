export interface Warehouse {
  id: string;
  slug: string;
  name: string;
  addressStreet: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZipcode: string | null;
  addressPhone: string | null;
  addressEmail: string | null;
  zipnovaOriginId: number;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWarehouseData {
  slug: string;
  name: string;
  addressStreet?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressZipcode?: string | null;
  addressPhone?: string | null;
  addressEmail?: string | null;
  zipnovaOriginId: number;
  priority?: number;
}
