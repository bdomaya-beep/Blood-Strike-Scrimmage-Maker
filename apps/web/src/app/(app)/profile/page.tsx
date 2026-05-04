'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <section className="max-w-3xl mx-auto px-6 py-14">
        <h1 className="font-orbitron text-3xl font-black mb-3">Profile</h1>
        <p className="text-white/60 mb-6">You need to sign in to view your profile.</p>
        <Link href="/login" className="inline-flex px-5 py-2.5 rounded-lg border border-white/15 text-white/80 hover:text-white hover:border-neon-red/50 transition-colors">
          Go to Login
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-3xl mx-auto px-6 py-14 space-y-4">
      <h1 className="font-orbitron text-3xl font-black">Profile</h1>
      <div className="glass-card p-6 space-y-2">
        <p className="text-white/80"><span className="text-white/50">Username:</span> {user?.username}</p>
        <p className="text-white/80"><span className="text-white/50">Display Name:</span> {user?.displayName}</p>
        <p className="text-white/80"><span className="text-white/50">Email:</span> {user?.email}</p>
        <p className="text-white/80"><span className="text-white/50">Region:</span> {user?.region ?? 'N/A'}</p>
      </div>
    </section>
  );
}
