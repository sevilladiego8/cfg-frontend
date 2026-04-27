import type { WeeklyPaymentsResponse } from '@/types/shared';
import api from './client';

export const paymentsApi = {
  getWeekly: (year: number, week: number) =>
    api
      .get<WeeklyPaymentsResponse>('/payments/weekly', { params: { year, week } })
      .then((r) => r.data),
};
