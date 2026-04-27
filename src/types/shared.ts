export interface Supplier {
  id: number;
  code: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Land {
  id: number;
  code: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface TicketItem {
  id: number;
  ticket_id: number;
  product_id: number;
  quantity: string;
  unit_price: string;
  line_total: string;
  source_row_number: number | null;
  product?: Product;
}

export interface Ticket {
  id: number;
  code: string;
  supplier_id: number;
  land_id: number;
  ticket_date: string;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  land?: Land;
  items?: TicketItem[];
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}
