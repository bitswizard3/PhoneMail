import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('phonemail_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept responses for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('phonemail_token');
      localStorage.removeItem('phonemail_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (phone: string, password: string) =>
    api.post('/auth/register', { phone, password, method: 'web' }),
  login: (phone: string, password: string) =>
    api.post('/auth/login', { phone, password }),
  sendOTP: (phone: string) =>
    api.post('/auth/send-otp', { phone, method: 'web' }),
  verifyOTP: (phone: string, code: string) =>
    api.post('/auth/verify-otp', { phone, code }),
  getMe: () => api.get('/auth/me'),
};

// Emails
export const emailAPI = {
  getEmails: (folder = 'inbox', filter = 'all', page = 1) =>
    api.get(`/emails?folder=${folder}&filter=${filter}&page=${page}`),
  getConversations: () =>
    api.get('/emails/conversations'),
  getConversation: (id: string) =>
    api.get(`/emails/conversation/${id}`),
  getEmail: (id: string) =>
    api.get(`/emails/${id}`),
  sendEmail: (data: { to: string[]; cc?: string[]; bcc?: string[]; subject: string; body: string; replyToEmailId?: string }) =>
    api.post('/emails/send', data),
  updateEmail: (id: string, data: { isRead?: boolean; isFavorite?: boolean; isSpam?: boolean; isTrash?: boolean }) =>
    api.patch(`/emails/${id}`, data),
  markAsRead: (id: string) =>
    api.put(`/emails/${id}/read`),
  deleteEmail: (id: string) =>
    api.delete(`/emails/${id}`),
};

// Settings
export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data: { displayName?: string; language?: string; profilePicture?: string }) =>
    api.put('/settings', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/settings/password', { currentPassword, newPassword }),
  createAlias: (aliasName: string, displayName?: string) =>
    api.post('/settings/aliases', { aliasName, displayName }),
  deleteAlias: (id: string) =>
    api.delete(`/settings/aliases/${id}`),
};

export default api;
