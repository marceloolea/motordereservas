import { api } from './client';

export const authApi = {
  login: (email, password) =>
    api.post('/api/auth/login', { email, password }, { auth: false }),

  register: (payload) =>
    api.post('/api/auth/register', payload, { auth: false }),

  me: () => api.get('/api/auth/profile'),
};
