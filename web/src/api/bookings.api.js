import { api } from './client';

export const bookingsApi = {
  listMine: (params) =>
    api.get('/api/bookings/me', { query: params }),

  getById: (id) => api.get(`/api/bookings/${id}`),

  create: (payload) => api.post('/api/bookings', payload),

  confirm: (id) => api.patch(`/api/bookings/${id}/confirm`),

  cancel: (id, reason) =>
    api.patch(`/api/bookings/${id}/cancel`, reason ? { reason } : {}),

  complete: (id) => api.patch(`/api/bookings/${id}/complete`),
};
