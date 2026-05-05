'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { GlassCard } from '@/components/ui/glass-card';
import { Users, CalendarDays, Megaphone, CheckSquare, Loader } from 'lucide-react';
import Link from 'next/link';

interface Stats {
  users: number;
  events: number;
  announcements: number;
  openRoleRequests: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, eventsRes, announcementsRes, rolesRes] = await Promise.allSettled([
          apiClient.get('/auth/admin/users?page=1&limit=1'),
          apiClient.get('/events?page=1&limit=1'),
          apiClient.get('/announcements?page=1&limit=1'),
          apiClient.get('/auth/admin/role-requests?status=open'),
        ]);

        setStats({
          users: (usersRes as any).value?.data?.meta?.total ?? 0,
          events: (eventsRes as any).value?.data?.meta?.total ?? 0,
          announcements: (announcementsRes as any).value?.data?.meta?.total ?? 0,
          openRoleRequests: Array.isArray((rolesRes as any).value?.data) ? (rolesRes as any).value.data.length : 0,
        });
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const TILES = [
    { label: 'Total Users', icon: Users, value: stats?.users, href: '/admin/users', color: 'blue' as const },
    { label: 'Events', icon: CalendarDays, value: stats?.events, href: '/admin/events', color: 'green' as const },
    { label: 'Announcements', icon: Megaphone, value: stats?.announcements, href: '/admin/announcements', color: 'red' as const },
    { label: 'Pending Role Requests', icon: CheckSquare, value: stats?.openRoleRequests, href: '/admin/roles', color: 'red' as const },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-orbitron text-2xl font-bold text-white mb-1">Admin Dashboard</h1>
        <p className="text-white/50 text-sm">Overview of the Blood Strike Scrim Hub platform</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader className="w-8 h-8 animate-spin text-neon-red" /></div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {TILES.map((tile) => (
            <Link key={tile.href} href={tile.href}>
              <GlassCard accent={tile.color} className="p-5 hover:border-white/20 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <tile.icon className="w-5 h-5 text-white/50" />
                </div>
                <div className="font-orbitron text-3xl font-bold text-white mb-1">
                  {tile.value ?? '—'}
                </div>
                <div className="text-xs text-white/50">{tile.label}</div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-5">
          <h2 className="font-orbitron font-semibold text-white mb-4 text-sm uppercase tracking-widest">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: 'Create Announcement', href: '/admin/announcements?new=1' },
              { label: 'Create Event', href: '/admin/events?new=1' },
              { label: 'Create User Account', href: '/admin/users?new=1' },
              { label: 'Review Role Requests', href: '/admin/roles' },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="block px-4 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                → {a.label}
              </Link>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="font-orbitron font-semibold text-white mb-4 text-sm uppercase tracking-widest">Role Capabilities</h2>
          <div className="space-y-2 text-sm">
            {[
              { role: 'super_admin', desc: 'Full access — manage everything' },
              { role: 'organizer', desc: 'Create & manage events' },
              { role: 'clan_leader', desc: 'Create & manage own clan' },
              { role: 'clan_moderator', desc: 'Moderate clan members' },
              { role: 'player', desc: 'Join scrims, clans, events (default)' },
              { role: 'spectator', desc: 'View-only access' },
            ].map((r) => (
              <div key={r.role} className="flex gap-2">
                <span className="font-mono text-neon-red/80 w-32 shrink-0">{r.role}</span>
                <span className="text-white/50">{r.desc}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
