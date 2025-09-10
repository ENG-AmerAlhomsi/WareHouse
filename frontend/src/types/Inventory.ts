import { Position } from './warehouse';

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id?: number;
  name: string;
  description: string;
  weight: number;
  quantityInStock: number;
  unitPrice: number;
  batchNumber: string;
  category: Category;
  imageUrl: string;
}

export interface Pallet {
  id?: number;
  palletName: string;
  quantity: number;
  maximumCapacity: number;
  manufacturingDate: Date;
  expiryDate: Date;
  supplierName: string;
  status: "stored" | "shipping" | "processing" | "Ready to Ship" | "Ready to Store" | "damaged";
  position: Position;
  product: Product;
}