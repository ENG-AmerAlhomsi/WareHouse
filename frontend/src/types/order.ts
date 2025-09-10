

export interface ShippingAddress {
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Order {
  id: string;
  customer: string;
  date: string;
  items: number;
  value: string;
  status: string;
  shipment: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products?: any[];
  shippingAddress?: ShippingAddress;
  payment?: {
    last4: string;
  };
  userId?: string;
} 