import type { Land } from '@/types/shared';
import api from './client';

export interface LandInput {
  code: string;
  name: string;
}

export const landsApi = {
  getAll: () => api.get<{ data: Land[] }>('/lands').then((r) => r.data.data),
  create: (data: LandInput) =>
    api.post<{ data: Land }>('/lands', data).then((r) => r.data.data),
  update: (id: number, data: Partial<LandInput>) =>
    api.put<{ data: Land }>(`/lands/${id}`, data).then((r) => r.data.data),
  remove: (id: number) => api.delete(`/lands/${id}`),
};
