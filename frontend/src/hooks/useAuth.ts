// src/hooks/useAuth.ts
import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';

export function useAuth() {
  const { user, isAuthenticated, accessToken, refreshToken, setAuth, logout: storeLogout } = useAuthStore();

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    setAuth(data.user, data.accessToken, data.refreshToken);
    return data.user;
  }, [setAuth]);

  const register = useCallback(async (params: {
    name: string; email: string; password: string; orgName?: string;
  }) => {
    const data = await authApi.register(params);
    setAuth(data.user, data.accessToken, data.refreshToken);
    return data.user;
  }, [setAuth]);

  const logout = useCallback(async () => {
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch { /* ignore */ }
    storeLogout();
  }, [refreshToken, storeLogout]);

  return { user, isAuthenticated, accessToken, login, register, logout };
}
