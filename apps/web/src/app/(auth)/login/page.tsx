'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass-card';
import { NeonButton } from '@/components/ui/neon-button';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(form.email, form.password);
      router.push('/events');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Invalid credentials');
    }
  };

  return (
    <div className="relative z-10 w-full max-w-md">
      <div className="text-center mb-8">
        <div className="font-orbitron font-black text-2xl mb-2">
          <span className="neon-text">BS</span><span>SH</span>
        </div>
        <p className="text-white/40 text-sm">Sign in to your account</p>
      </div>

      <GlassCard accent="red" className="p-8">
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-xs text-white/50 uppercase tracking-widest mb-1.5">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full bg-surface-700 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-neon-red/60 transition-colors"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-white/50 uppercase tracking-widest mb-1.5">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full bg-surface-700 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-neon-red/60 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-neon-red text-xs">{error}</p>}

          <NeonButton type="submit" disabled={isLoading} size="md" className="w-full">
            {isLoading ? 'Signing in...' : 'Sign In'}
          </NeonButton>
        </form>

        <p className="text-center text-white/30 text-sm mt-6">
          No account?{' '}
          <Link href="/register" className="text-neon-red hover:underline">
            Register
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
