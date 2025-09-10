export interface PurchaseOrderProduct {
  id?: number;
  productId?: number;
  productName?: string;
  product?: {
    id: number;
    name: string;
  };
  quantity: number;
  expectedPallets: string;
  price: number;
}

export interface Pallet {
  id?: number;
  palletName: string;
  quantity: number;
  maximumCapacity: number;
  status: string;
  manufacturingDate: string;
  expiryDate: string;
  supplierName: string;
  productId?: number;
  productName?: string;
  product?: {
    id: number;
    name: string;
  };
  purchaseOrderId?: number;
}

export interface PurchaseOrder {
  id?: number;
  supplierName: string;
  userId?: string;
  expectedArrivalTime: string;
  totalPrice: number;
  status: "Pending" | "Processing" | "Ready to Ship" | "Shipping" | "QQ CHECK" | "Complete";
  products: PurchaseOrderProduct[];
  pallets: Pallet[];
  createdAt?: string;
  createdBy?: string;
  notes?: string;
}

export type PurchaseOrderStatus = "Pending" | "Processing" | "Ready to Ship" | "Shipping" | "QQ CHECK" | "Complete" | "Rejected";

// Enhanced interfaces for Supply Manager features
export interface SupplierInfo {
  id: string;
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  leadTimeDays?: number;
  minimumOrderValue?: number;
  rating?: number;
  isActive: boolean;
}