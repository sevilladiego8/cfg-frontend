/**
 * Ticket API functions — intended to be used as queryFn / mutationFn
 * with TanStack Query (useQuery / useMutation) in page components.
 * Supports paginated listing with optional supplier_id / land_id filters.
 */
import type { PaginatedResponse, Ticket } from '@/types/shared';
import api from './client';

export interface TicketItemInput {
  product_id: number;
  quantity: string;
  unit_price: string;
  line_total: string;
}

export interface TicketInput {
  code: string;
  supplier_id: number;
  land_id: number;
  ticket_date: string;
  items: TicketItemInput[];
}

export interface TicketFilters {
  page?: number;
  limit?: number;
  supplier_id?: number;
  land_id?: number;
}

export const ticketsApi = {
  getAll: (params: TicketFilters) =>
    api.get<PaginatedResponse<Ticket>>('/tickets', { params }).then((r) => r.data),
  getOne: (id: number) =>
    api.get<{ data: Ticket }>(`/tickets/${id}`).then((r) => r.data.data),
  create: (data: TicketInput) =>
    api.post<{ data: Ticket }>('/tickets', data).then((r) => r.data.data),
  update: (id: number, data: Partial<TicketInput>) =>
    api.put<{ data: Ticket }>(`/tickets/${id}`, data).then((r) => r.data.data),
  remove: (id: number) => api.delete(`/tickets/${id}`),
};
