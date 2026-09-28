import axios from 'axios';

/**
 * Auto-detect API URL based on current browser location.
 * This solves the problem where a hardcoded IP in .env fails on
 * different networks (MacBook, phone, different WiFi, etc.)
 * 
 * Logic:
 * - If VITE_API_URL is set and NOT a specific LAN IP, use it.
 * - Otherwise, dynamically construct the API URL using the browser's
 *   current hostname (works for localhost AND LAN IP access).
 */
const getApiUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // If env URL is set and is a proper external URL (not a LAN IP), use it
  if (envUrl && !envUrl.match(/^https?:\/\/192\.168\./)) {
    return envUrl;
  }
  
  // Auto-detect: use whatever hostname the browser is currently on
  // If you're on localhost:5173, API is localhost:4000
  // If you're on 192.168.x.x:5173, API is 192.168.x.x:4000
  const currentHost = window.location.hostname;
  const apiPort = 4000;
  const protocol = window.location.protocol;
  
  return `${protocol}//${currentHost}:${apiPort}/api`;
};

const API_URL = getApiUrl();

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
  initiateCall: (phone: string, baseUrl: string) =>
    api.post('/voice/initiate-call', { phone, baseUrl }),
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
