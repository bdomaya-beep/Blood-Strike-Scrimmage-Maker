'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

export function AuthInitializer() {
  const { fetchMe, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token && !isAuthenticated) {
      fetchMe().catch(() => {
        // Auth failed, token expired or invalid
      });
    }
  }, []);

  return null;
}
