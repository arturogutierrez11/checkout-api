export interface Product {
  id: string;
  slug: string;
  sku: string;
  name: string;
  price: number;
  currency: string;
  stock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
