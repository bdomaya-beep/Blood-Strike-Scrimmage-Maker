'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Menu, X, LogOut, Settings } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useNotificationStore } from '@/stores/notification-store';
import { NeonButton } from '@/components/ui/neon-button';

const NAV_LINKS = [
  { href: '/events', label: 'Events' },
  { href: '/scrims', label: 'Scrims' },
  { href: '/clans', label: 'Clans' },
  { href: '/leaderboard', label: 'Leaderboard' },
];

export function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };

    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [profileOpen]);

  const handleLogout = async () => {
    await logout();
    setProfileOpen(false);
    router.push('/login');
  };

  const navLinks = [
    ...NAV_LINKS,
    ...((user?.roles ?? []).includes('super_admin') ? [{ href: '/admin', label: 'Admin Panel' }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-surface-900/90 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="font-orbitron font-black text-lg text-white tracking-tight flex-shrink-0">
          <span className="neon-text">BS</span>
          <span className="text-white/80">SH</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith(link.href)
                  ? 'text-neon-red bg-neon-red/10'
                  : 'text-white/60 hover:text-white hover:bg-white/5',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link href="/notifications" className="relative p-2 text-white/60 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-neon-red text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Profile Dropdown */}
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="w-8 h-8 rounded-lg bg-neon-red/20 border border-neon-red/30 flex items-center justify-center text-neon-red font-orbitron font-black text-xs hover:border-neon-red/50 transition-colors"
                >
                  {user?.username?.[0]?.toUpperCase() ?? '?'}
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-surface-800 border border-white/20 rounded-lg shadow-lg overflow-hidden z-50">
                    {/* User Info */}
                    <div className="p-4 border-b border-white/10 bg-surface-900/50">
                      <p className="text-white font-semibold text-sm">{user?.displayName}</p>
                      <p className="text-white/60 text-xs">@{user?.username}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        href="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-white/60 hover:text-white hover:bg-white/5 transition-colors text-sm"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-white/60 hover:text-neon-red hover:bg-neon-red/10 transition-colors text-sm"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors">
                Login
              </Link>
              <NeonButton size="sm" asChild>
                <Link href="/register">Register</Link>
              </NeonButton>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 text-white/60 hover:text-white"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-white/10 px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith(link.href)
                  ? 'text-neon-red bg-neon-red/10'
                  : 'text-white/60 hover:text-white hover:bg-white/5',
              )}
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-white/60 hover:text-neon-red hover:bg-neon-red/10 transition-colors text-sm rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
