import type { Supplier } from '@/types/shared';
import api from './client';

export interface SupplierInput {
  code: string;
  name: string;
}

export const suppliersApi = {
  getAll: () => api.get<{ data: Supplier[] }>('/suppliers').then((r) => r.data.data),
  create: (data: SupplierInput) =>
    api.post<{ data: Supplier }>('/suppliers', data).then((r) => r.data.data),
  update: (id: number, data: Partial<SupplierInput>) =>
    api.put<{ data: Supplier }>(`/suppliers/${id}`, data).then((r) => r.data.data),
  remove: (id: number) => api.delete(`/suppliers/${id}`),
};
