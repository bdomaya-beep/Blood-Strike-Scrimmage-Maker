'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { Shield, Users, Megaphone, CalendarDays, CheckSquare, LayoutDashboard } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/admin/events', label: 'Events', icon: CalendarDays },
  { href: '/admin/roles', label: 'Role Requests', icon: CheckSquare },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!(user?.roles ?? []).includes('super_admin')) { router.push('/events'); }
  }, [isAuthenticated, user, router]);

  const isActive = (item: (typeof NAV_ITEMS)[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-white/10 bg-surface-800/60 backdrop-blur flex flex-col py-6 px-3 gap-1">
        <div className="flex items-center gap-2 px-3 mb-6">
          <Shield className="w-5 h-5 text-neon-red" />
          <span className="font-orbitron font-bold text-sm text-white tracking-widest uppercase">Admin</span>
        </div>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive(item)
                ? 'bg-neon-red/15 text-neon-red font-semibold'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
