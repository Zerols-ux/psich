'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '@psich/types';
import { auth, setAccessToken } from './api';

interface AuthContextValue {
  user: User | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; name: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  /**
   * Trigger a refresh against the existing `psy_refresh` cookie and load
   * the user. Used by `/auth/google/callback` to pick up the session the API
   * minted during the OAuth dance.
   */
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthContextValue['status']>('loading');
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    (async () => {
      try {
        const session = await auth.refresh();
        setAccessToken(session.accessToken);
        setUser(session.user);
        setStatus('authenticated');
      } catch {
        setAccessToken(null);
        setUser(null);
        setStatus('unauthenticated');
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const session = await auth.login({ email, password });
    setAccessToken(session.accessToken);
    setUser(session.user);
    setStatus('authenticated');
  }, []);

  const register = useCallback(async (input: { email: string; name: string; password: string }) => {
    const session = await auth.register(input);
    setAccessToken(session.accessToken);
    setUser(session.user);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    try {
      await auth.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const session = await auth.refresh();
      setAccessToken(session.accessToken);
      setUser(session.user);
      setStatus('authenticated');
      return true;
    } catch {
      setAccessToken(null);
      setUser(null);
      setStatus('unauthenticated');
      return false;
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, register, logout, refreshSession }),
    [user, status, login, register, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
