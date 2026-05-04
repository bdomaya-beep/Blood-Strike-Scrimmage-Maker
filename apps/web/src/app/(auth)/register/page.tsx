'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass-card';
import { NeonButton } from '@/components/ui/neon-button';
import { useAuthStore } from '@/stores/auth-store';

const REGIONS = ['NA', 'EU', 'SEA', 'SA', 'ME', 'AF', 'OCE'];

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [form, setForm] = useState({ username: '', email: '', password: '', region: '' });
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register({ ...form, displayName: form.username });
      router.push('/events');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Registration failed');
    }
  };

  const field = (name: keyof typeof form) => ({
    value: form[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [name]: e.target.value })),
  });

  return (
    <div className="relative z-10 w-full max-w-md">
      <div className="text-center mb-8">
        <div className="font-orbitron font-black text-2xl mb-2">
          <span className="neon-text">BS</span><span>SH</span>
        </div>
        <p className="text-white/40 text-sm">Create your account</p>
      </div>

      <GlassCard accent="red" className="p-8">
        <form onSubmit={submit} className="space-y-4">
          {[
            { label: 'Username', name: 'username' as const, type: 'text', autoComplete: 'username', placeholder: 'BloodKnight99' },
            { label: 'Email', name: 'email' as const, type: 'email', autoComplete: 'email', placeholder: 'you@example.com' },
            { label: 'Password', name: 'password' as const, type: 'password', autoComplete: 'new-password', placeholder: '••••••••' },
          ].map((f) => (
            <div key={f.name}>
              <label className="block text-xs text-white/50 uppercase tracking-widest mb-1.5">{f.label}</label>
              <input
                type={f.type}
                autoComplete={f.autoComplete}
                placeholder={f.placeholder}
                className="w-full bg-surface-700 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-neon-red/60 transition-colors"
                required
                {...field(f.name)}
              />
            </div>
          ))}

          <div>
            <label className="block text-xs text-white/50 uppercase tracking-widest mb-1.5">Region</label>
            <select
              className="w-full bg-surface-700 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-neon-red/60 transition-colors"
              {...field('region')}
            >
              <option value="">Select region</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-neon-red text-xs">{error}</p>}

          <NeonButton type="submit" disabled={isLoading} size="md" className="w-full mt-2">
            {isLoading ? 'Creating account...' : 'Create Account'}
          </NeonButton>
        </form>

        <p className="text-center text-white/30 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-neon-red hover:underline">
            Sign in
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
