// lib/useauth.js
'use client';

import api from './api';

// ✅ FIX: Cache is plain data only — no functions, no promises stored long-term
const authCache = {
  user: null,
  accessToken: null,
  refreshToken: null,
  lastValidation: 0,
};

// Cache TTL (5 minutes)
const VALIDATION_CACHE_TTL = 5 * 60 * 1000;

// ✅ FIX: Safe localStorage helper defined once, used everywhere
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

// ✅ FIX: initializeCache reads from storage into the plain cache object
// Called explicitly — never at module scope
const initializeCache = () => {
  try {
    const userStr = safeStorage.get('user');
    authCache.user = userStr ? JSON.parse(userStr) : null;
    authCache.accessToken = safeStorage.get('access_token');
    authCache.refreshToken = safeStorage.get('refresh_token');
  } catch (error) {
    console.error('Failed to initialize auth cache:', error);
    clearCache();
  }
};

// ✅ FIX: Mutates fields in-place — no object spread that creates new references
// Old references to authCache still point to the same object, just updated fields
const clearCache = () => {
  authCache.user = null;
  authCache.accessToken = null;
  authCache.refreshToken = null;
  authCache.lastValidation = 0;
};

// ✅ FIX: Single validation promise ref — not stored on cache object
// Storing it on cache caused it to keep entire request/response chains alive
let ongoingValidation = null;

export const auth = {
  // ✅ Called once from AuthProvider useEffect — not at module load time
  init: () => {
    if (typeof window === 'undefined') return;
    initializeCache();
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login/', credentials);
    const data = response.data;

    // ✅ FIX: Update fields in-place — avoids spreading and creating orphaned references
    authCache.user = data.user;
    authCache.accessToken = data.access;
    authCache.refreshToken = data.refresh;
    authCache.lastValidation = Date.now();

    safeStorage.set('access_token', data.access);
    safeStorage.set('refresh_token', data.refresh);
    safeStorage.set('user', JSON.stringify(data.user));

    return data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register/', userData);
    const data = response.data;

    authCache.user = data.user;
    authCache.accessToken = data.access;
    authCache.refreshToken = data.refresh;
    authCache.lastValidation = Date.now();

    safeStorage.set('access_token', data.access);
    safeStorage.set('refresh_token', data.refresh);
    safeStorage.set('user', JSON.stringify(data.user));

    return data;
  },

  logout: async () => {
    const refreshToken = authCache.refreshToken;

    // ✅ FIX: Clear cache and storage immediately — don't wait for server response
    clearCache();
    safeStorage.remove('access_token', 'refresh_token', 'user');

    // ✅ FIX: Cancel any in-flight validation — nullify so GC can collect the promise
    ongoingValidation = null;

    // Fire-and-forget server logout — failure is acceptable
    if (refreshToken) {
      api.post('/auth/logout/', { refresh: refreshToken }).catch(() => {});
    }
  },

  getCurrentUser: () => {
    // ✅ FIX: Lazy init — if cache is empty but storage has data, hydrate first
    if (!authCache.user && typeof window !== 'undefined') {
      initializeCache();
    }
    return authCache.user;
  },

  isAuthenticated: () => {
    if (!authCache.accessToken && typeof window !== 'undefined') {
      authCache.accessToken = safeStorage.get('access_token');
    }
    return !!authCache.accessToken;
  },

  validateToken: async (options = {}) => {
    const { signal, force = false } = options;

    // ✅ FIX: Return shared promise if validation already in progress
    // Prevents multiple concurrent validations from stacking up
    if (ongoingValidation) {
      return ongoingValidation;
    }

    // ✅ FIX: Respect TTL cache — skip network call if recently validated
    const now = Date.now();
    if (!force && authCache.lastValidation && (now - authCache.lastValidation) < VALIDATION_CACHE_TTL) {
      return true;
    }

    if (!authCache.accessToken) return false;

    // ✅ FIX: Store promise reference so concurrent callers share it
    ongoingValidation = (async () => {
      try {
        const response = await api.get('/auth/validate-token/', {
          signal,
          timeout: 10000,
        });

        const isValid = response.data?.valid ?? false;

        if (isValid) {
          authCache.lastValidation = Date.now();
        } else {
          await auth.logout();
        }

        return isValid;
      } catch (error) {
        // Request was cancelled — don't treat as invalid
        if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
          return true;
        }

        // Network error — assume token is still valid, avoid false logouts
        if (!error.response) {
          console.warn('Token validation network error — assuming valid');
          return true;
        }

        // 401 means token is definitively invalid
        if (error.response.status === 401) {
          await auth.logout();
          return false;
        }

        // Any other server error — don't punish the user
        return true;
      } finally {
        // ✅ FIX: Always release the promise ref so it can be GC'd
        ongoingValidation = null;
      }
    })();

    return ongoingValidation;
  },

  getToken: () => authCache.accessToken,

  updateUser: (userData) => {
    if (!authCache.user) return null;
    // ✅ FIX: Mutate in-place — spread only the user object, not the whole cache
    Object.assign(authCache.user, userData);
    safeStorage.set('user', JSON.stringify(authCache.user));
    return authCache.user;
  },
};