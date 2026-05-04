import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/lib/api-client';

interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  region: string | null;
  roles: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    username: string;
    email: string;
    password: string;
    displayName?: string;
    region?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await apiClient.post('/auth/login', { email, password });
          localStorage.setItem('access_token', data.accessToken);
          localStorage.setItem('refresh_token', data.refreshToken);
          // Also set cookie for middleware
          document.cookie = `access_token=${data.accessToken}; path=/; max-age=900`;
          set({ user: data.user, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (payload) => {
        set({ isLoading: true });
        try {
          const registerPayload = {
            ...payload,
            displayName: payload.displayName?.trim() || payload.username,
          };
          const { data } = await apiClient.post('/auth/register', registerPayload);
          localStorage.setItem('access_token', data.accessToken);
          localStorage.setItem('refresh_token', data.refreshToken);
          // Also set cookie for middleware
          document.cookie = `access_token=${data.accessToken}; path=/; max-age=900`;
          set({ user: data.user, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        // Clear cookie
        document.cookie = 'access_token=; path=/; max-age=0';
        set({ user: null, isAuthenticated: false });
      },

      fetchMe: async () => {
        try {
          const { data } = await apiClient.get('/auth/me');
          set({ user: data, isAuthenticated: true });
        } catch {
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'bssh-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
