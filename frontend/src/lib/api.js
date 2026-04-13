// lib/api.js
'use client';

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 100000, // ✅ FIX: Global timeout — prevents hung requests accumulating in memory
});

// ✅ FIX: Track in-flight refresh promise to prevent multiple simultaneous refresh calls
let refreshPromise = null;

// ✅ FIX: Safe localStorage helper — prevents SSR crashes and swallows quota errors
const safeStorage = {
  get: (key) => {
    if (typeof window === 'undefined') return null;
    try { return localStorage.getItem(key); }
    catch { return null; }
  },
  set: (key, value) => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(key, value); }
    catch (e) { console.error(`Storage write failed for ${key}:`, e); }
  },
  remove: (...keys) => {
    if (typeof window === 'undefined') return;
    try { keys.forEach(k => localStorage.removeItem(k)); }
    catch (e) { console.error('Storage remove failed:', e); }
  },
};

// Request interceptor — attach access token
api.interceptors.request.use(
  (config) => {
    const token = safeStorage.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 with single shared refresh promise
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ✅ FIX: Only retry once, and only for 401s that aren't the refresh endpoint itself
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/token/refresh/')
    ) {
      originalRequest._retry = true;

      try {
        // ✅ FIX: Share a single refresh promise across all concurrent 401s
        // Without this, 3 simultaneous expired requests each trigger their own refresh
        if (!refreshPromise) {
          refreshPromise = (async () => {
            const refreshToken = safeStorage.get('refresh_token');
            if (!refreshToken) throw new Error('No refresh token available');

            const response = await axios.post(
              `${API_URL}/auth/token/refresh/`,
              { refresh: refreshToken },
              { timeout: 10000 }
            );

            const { access } = response.data;
            safeStorage.set('access_token', access);
            return access;
          })();
        }

        const newAccessToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        // ✅ FIX: Clear tokens and redirect only after refresh definitively fails
        safeStorage.remove('access_token', 'refresh_token', 'user');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        // ✅ FIX: Always clear the shared promise so next expiry triggers a fresh refresh
        refreshPromise = null;
      }
    }

    return Promise.reject(error);
  }
);

export default api;