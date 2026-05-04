'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Loader, Bell, X } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get<Notification[]>('/notifications');
      setNotifications(data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await apiClient.post(`/notifications/${id}/read`, {});
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await apiClient.delete(`/notifications/${id}`);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-orbitron font-black text-white mb-2">
            <span className="neon-text">Notifications</span>
          </h1>
          <p className="text-white/60">Stay updated with events, matches, and clan activities</p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-neon-red animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <GlassCard className="p-6 border-red-500/30 bg-red-500/5">
            <p className="text-red-400">{error}</p>
          </GlassCard>
        )}

        {/* Notifications List */}
        {!loading && (
          <div className="space-y-4">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <GlassCard
                  key={notif.id}
                  className={`p-6 flex items-start gap-4 ${!notif.read ? 'border-neon-red/30 bg-neon-red/5' : ''}`}
                >
                  <Bell className={`w-5 h-5 flex-shrink-0 mt-1 ${!notif.read ? 'text-neon-red' : 'text-white/40'}`} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-orbitron font-bold text-white">{notif.title}</h3>
                    <p className="text-white/70 text-sm mt-1">{notif.message}</p>
                    <p className="text-white/40 text-xs mt-2">{new Date(notif.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {!notif.read && (
                      <Button size="sm" variant="outline" onClick={() => markAsRead(notif.id)}>
                        Mark read
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteNotification(notif.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </GlassCard>
              ))
            ) : (
              <GlassCard className="p-8 text-center">
                <Bell className="w-8 h-8 text-white/30 mx-auto mb-4" />
                <p className="text-white/60">No notifications yet. Check back later!</p>
              </GlassCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
