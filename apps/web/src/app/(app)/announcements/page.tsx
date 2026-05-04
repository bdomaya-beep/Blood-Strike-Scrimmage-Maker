'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { GlassCard } from '@/components/ui/glass-card';
import { Loader, Megaphone, Bell, Trophy, Swords } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  author?: string;
  createdAt: string;
  imageUrl?: string;
  category?: 'UPDATE' | 'TOURNAMENT' | 'EVENT' | 'GENERAL';
}

const FALLBACK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    title: 'Welcome to Blood Strike Scrim Hub!',
    content: 'We are thrilled to launch the premier competitive platform for Blood Strike. Register your clan, join scrimmages, and compete in tournaments to climb the leaderboard.',
    author: 'BSSH Team',
    createdAt: new Date().toISOString(),
    category: 'GENERAL',
  },
  {
    id: '2',
    title: 'Season 1 Registration Open',
    content: 'Season 1 is now live! Organize your clan, sign up for events, and prove your skills. The top 3 clans will receive exclusive in-game rewards and recognition.',
    author: 'BSSH Team',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    category: 'TOURNAMENT',
  },
  {
    id: '3',
    title: 'Platform Rules and Code of Conduct',
    content: 'All participants must follow the platform rules. Unsportsmanlike behavior, cheating, or abuse will result in penalties or permanent bans. Stay competitive, stay respectful.',
    author: 'BSSH Team',
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    category: 'UPDATE',
  },
];

const categoryIcon = (category?: string) => {
  if (category === 'TOURNAMENT') return <Trophy className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />;
  if (category === 'EVENT') return <Swords className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />;
  if (category === 'UPDATE') return <Bell className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />;
  return <Megaphone className="w-5 h-5 text-neon-red flex-shrink-0 mt-1" />;
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get<Announcement[]>('/announcements');
        setAnnouncements((data && data.length > 0) ? data : FALLBACK_ANNOUNCEMENTS);
      } catch {
        // API not available yet — show fallback platform announcements
        setAnnouncements(FALLBACK_ANNOUNCEMENTS);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-orbitron font-black text-white mb-2">
            <span className="neon-text">Announcements</span>
          </h1>
          <p className="text-white/60">Latest updates, tournaments, and platform news</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-neon-red animate-spin" />
          </div>
        )}

        {!loading && (
          <div className="space-y-6">
            {announcements.map((announcement) => (
              <GlassCard key={announcement.id} className="p-6 hover:border-neon-red/20 transition-colors">
                <div className="flex items-start gap-4">
                  {categoryIcon(announcement.category)}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-orbitron font-bold text-lg text-white">{announcement.title}</h3>
                    {announcement.author && (
                      <p className="text-white/40 text-xs mt-1">By {announcement.author} &middot; {new Date(announcement.createdAt).toLocaleDateString()}</p>
                    )}
                    <p className="text-white/70 mt-3 leading-relaxed text-sm">{announcement.content}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


interface Announcement {
  id: string;
  title: string;
  content: string;
  author?: string;
  createdAt: string;
  imageUrl?: string;
}
