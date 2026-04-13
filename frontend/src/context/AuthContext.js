'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { auth } from '@/lib/auth';

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState(null);

  const mounted = useRef(true);
  const abortControllerRef = useRef(null);
  const timeoutRef = useRef(null);

  // ✅ FIX: saveUserToStorage defined outside render cycle via ref — no stale closure
  const saveUserToStorage = useCallback((userData) => {
    if (typeof window === 'undefined') return;
    try {
      if (userData) {
        // ✅ FIX: Only store minimal fields to reduce memory footprint
        const safeUser = {
          id: userData.id,
          email: userData.email,
          name: userData.name,
        };
        localStorage.setItem('user', JSON.stringify(safeUser));
      } else {
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
      }
      setStorageError(null);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      setStorageError('Storage quota exceeded');
      // Fallback to sessionStorage
      try {
        if (userData) {
          sessionStorage.setItem('user', JSON.stringify(userData));
        }
      } catch (sessionError) {
        console.error('SessionStorage also failed:', sessionError);
      }
    }
  }, []); // ✅ No dependencies — stable reference, no stale closures

  // ✅ FIX: debounce defined in useMemo so it's created once and properly tracks saveUserToStorage
  const debouncedSave = useMemo(() => {
    let timer;
    return (userData) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        saveUserToStorage(userData);
      }, 1000);
    };
  }, [saveUserToStorage]); // ✅ Recreated only if saveUserToStorage changes (it won't)

  // ✅ FIX: All side effects inside useEffect — no module-level listeners or intervals
  useEffect(() => {
    mounted.current = true;

    const loadUser = async () => {
      // ✅ FIX: Fresh AbortController per load attempt
      abortControllerRef.current = new AbortController();

      try {
        const storedUser = auth.getCurrentUser?.() ?? null;

        if (!storedUser) {
          setUser(null);
          return;
        }

        // ✅ FIX: Timeout cleans itself up properly
        timeoutRef.current = setTimeout(() => {
          console.warn('Validation timeout — using cached user');
          if (mounted.current) {
            setUser(storedUser);
            setIsLoading(false);
          }
        }, 5000);

        const isValid = await auth.validateToken?.({
          signal: abortControllerRef.current.signal,
        });

        clearTimeout(timeoutRef.current);

        if (!mounted.current) return;

        if (isValid) {
          setUser(storedUser);
          debouncedSave(storedUser);
        } else {
          setUser(null);
          debouncedSave(null);
          await auth.logout?.();
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          // Request was intentionally cancelled — do nothing
          return;
        }
        console.error('Validation error:', error);
        // ✅ FIX: On network error, keep existing cached user rather than logging out
        const fallbackUser = auth.getCurrentUser?.() ?? null;
        if (mounted.current) {
          setUser(fallbackUser);
        }
      } finally {
        clearTimeout(timeoutRef.current);
        if (mounted.current) {
          setIsLoading(false);
        }
      }
    };

    loadUser();

    // ✅ FIX: Cleanup runs on unmount — aborts in-flight requests, clears timers
    return () => {
      mounted.current = false;
      abortControllerRef.current?.abort();
      clearTimeout(timeoutRef.current);
    };
  }, []); // ✅ Empty deps — runs once on mount only

  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    try {
      const data = await auth.login(credentials);
      if (mounted.current) {
        setUser(data.user);
        debouncedSave(data.user);
      }
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      if (mounted.current) {
        setIsLoading(false);
      }
    }
  }, [debouncedSave]);

  const register = useCallback(async (userData) => {
    setIsLoading(true);
    try {
      const data = await auth.register(userData);
      if (mounted.current) {
        setUser(data.user);
        debouncedSave(data.user);
      }
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      if (mounted.current) {
        setIsLoading(false);
      }
    }
  }, [debouncedSave]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await auth.logout?.();
      if (mounted.current) {
        setUser(null);
        // ✅ FIX: Immediate clear on logout — don't debounce, user must be gone now
        saveUserToStorage(null);
        sessionStorage.removeItem('auth_token');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      if (mounted.current) {
        setIsLoading(false);
      }
    }
  }, [saveUserToStorage]); // ✅ Uses direct save, not debounced

  const updateUser = useCallback((updatedUser) => {
    if (mounted.current) {
      setUser(updatedUser);
      debouncedSave(updatedUser);
    }
  }, [debouncedSave]);

  // ✅ FIX: useMemo on context value prevents unnecessary re-renders of all consumers
  const contextValue = useMemo(() => ({
    user,
    isLoading,
    storageError,
    login,
    register,
    logout,
    updateUser,
  }), [user, isLoading, storageError, login, register, logout, updateUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};