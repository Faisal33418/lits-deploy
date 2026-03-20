import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Profile API
export const profileAPI = {
  getMe: () => api.get('/profile/me'),
  setup: (data) => api.post('/profile/setup', data),
};

// Discover API
export const discoverAPI = {
  getUsers: (verifiedOnly = false) => api.get(`/discover?verified_only=${verifiedOnly}`),
  swipe: (data) => api.post('/swipe', data),
};

// Matches API
export const matchesAPI = {
  getMatches: () => api.get('/matches'),
  getMessages: (matchId) => api.get(`/messages/${matchId}`),
  sendMessage: (data) => api.post('/messages', data),
};

// Notifications API
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (notificationId) => api.post('/notifications/read', { notification_id: notificationId }),
  markAllRead: () => api.post('/notifications/read-all'),
  checkLayoverMatches: () => api.get('/layovers/check-matches'),
};

// Schedule API
export const scheduleAPI = {
  save: (schedules) => api.post('/schedule', schedules),
};

// Calendar Permissions API
export const calendarAPI = {
  getPermissions: () => api.get('/calendar/permissions'),
  grantAccess: (matchUserId) => api.post('/calendar/grant-access', { match_user_id: matchUserId }),
  revokeAccess: (matchUserId) => api.post('/calendar/revoke-access', { match_user_id: matchUserId }),
};

// Verification API
export const verificationAPI = {
  getStatus: () => api.get('/verification/status'),
  upload: (formData) => api.post('/verification/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// AI API
export const aiAPI = {
  getCompatibility: (userId) => api.get(`/ai/compatibility/${userId}`),
  refreshCompatibility: (userId) => api.post(`/ai/refresh-compatibility/${userId}`),
  getProfileInsights: () => api.get('/ai/profile-insights'),
};

// Subscription API
export const subscriptionAPI = {
  getPricing: () => api.get('/subscription/pricing'),
  getStatus: () => api.get('/subscription/status'),
};

export default api;
