import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ CHANGE THIS to your computer's WiFi IP address
// Run 'ipconfig' in terminal to find your IPv4 address
// Both your phone and computer must be on the same WiFi network
const API_URL = 'http://192.168.31.237:4000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('phonemail_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('phonemail_token');
      await AsyncStorage.removeItem('phonemail_user');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  sendOTP: (phone: string, method = 'mobile') =>
    api.post('/auth/send-otp', { phone, method }),
  verifyOTP: (phone: string, code: string) =>
    api.post('/auth/verify-otp', { phone, code }),
  register: (phone: string, password: string) =>
    api.post('/auth/register', { phone, password, method: 'mobile' }),
  login: (phone: string, password: string) =>
    api.post('/auth/login', { phone, password }),
  getMe: () => api.get('/auth/me'),
};

export const emailAPI = {
  getEmails: (folder = 'inbox', filter = 'all', page = 1) =>
    api.get(`/emails?folder=${folder}&filter=${filter}&page=${page}`),
  getConversations: () => api.get('/emails/conversations'),
  getConversation: (id: string) => api.get(`/emails/conversation/${id}`),
  getEmail: (id: string) => api.get(`/emails/${id}`),
  sendEmail: (data: any) => api.post('/emails/send', data),
  updateEmail: (id: string, data: any) => api.patch(`/emails/${id}`, data),
  markAsRead: (id: string) => api.put(`/emails/${id}/read`),
  deleteEmail: (id: string) => api.delete(`/emails/${id}`),
};

export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data: any) => api.put('/settings', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/settings/password', { currentPassword, newPassword }),
  createAlias: (aliasName: string, displayName?: string) =>
    api.post('/settings/aliases', { aliasName, displayName }),
  deleteAlias: (id: string) => api.delete(`/settings/aliases/${id}`),
};

export default api;
