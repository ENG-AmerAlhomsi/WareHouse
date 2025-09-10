import { Order } from './order';

export interface Area {
  id?: number;
  areaName: string;
}

export interface Row {
  id?: number;
  rowName: string;
  area: Area;
}

export interface Bay {
  id?: number;
  bayName: string;
  row_sy: Row;
}

export interface Position {
  id?: number;
  positionName: string;
  level: number;
  isEmpty: boolean;
  isNew?: boolean;
  bay: Bay;
}



export interface Shipment {
  id?: number;
  shipmentName: string;
  fromName: string;
  toName: string;
  shippingEmployee: string;
  typeName: string;
  statusName: string;
  orders: Order[];
  createdAt?: string;
  lastModified?: string;
}
