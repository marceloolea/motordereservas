import { api } from './client';

export const availabilityApi = {
  listSchedules: () => api.get('/api/availability/schedules/me'),

  createSchedule: (payload) =>
    api.post('/api/availability/schedules', payload),

  updateSchedule: (id, payload) =>
    api.put(`/api/availability/schedules/${id}`, payload),

  deleteSchedule: (id) =>
    api.delete(`/api/availability/schedules/${id}`),

  listExceptions: () => api.get('/api/availability/exceptions/me'),

  createException: (payload) =>
    api.post('/api/availability/exceptions', payload),

  deleteException: (id) =>
    api.delete(`/api/availability/exceptions/${id}`),

  getSlots: (userId, from, to) =>
    api.get(`/api/availability/${userId}/slots`, {
      query: { from, to },
      auth: false,
    }),
};
