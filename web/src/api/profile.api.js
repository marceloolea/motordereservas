import { api } from './client';

export const profileApi = {
  me: () => api.get('/api/profiles/me'),

  upsert: (payload) => api.put('/api/profiles', payload),

  list: (params) => api.get('/api/profiles', { query: params, auth: false }),

  getById: (id) => api.get(`/api/profiles/${id}`, { auth: false }),
};
