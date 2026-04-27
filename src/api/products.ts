/**
 * Products API functions — intended to be used as queryFn / mutationFn
 * with TanStack Query (useQuery / useMutation) in page components.
 */
import type { Product } from '@/types/shared';
import api from './client';

export interface ProductInput {
  code: string;
  name: string;
}

export const productsApi = {
  getAll: () => api.get<{ data: Product[] }>('/products').then((r) => r.data.data),
  create: (data: ProductInput) =>
    api.post<{ data: Product }>('/products', data).then((r) => r.data.data),
  update: (id: number, data: Partial<ProductInput>) =>
    api.put<{ data: Product }>(`/products/${id}`, data).then((r) => r.data.data),
  remove: (id: number) => api.delete(`/products/${id}`),
};
