'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { Loader, Radio } from 'lucide-react';

interface Stream {
  id: string;
  title: string;
  hostName: string;
  viewers: number;
  game?: string;
  thumbnailUrl?: string;
  streamUrl?: string;
  status: 'LIVE' | 'OFFLINE';
}

export default function StreamsPage() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get<Stream[]>('/streams/live');
        setStreams(data || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch streams:', err);
        setError('Failed to load streams');
        setStreams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStreams();
    const interval = setInterval(fetchStreams, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-orbitron font-black text-white mb-2">
            <span className="neon-text">Live Streams</span>
          </h1>
          <p className="text-white/60">Watch live matches and featured content</p>
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

        {/* Streams Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {streams.length > 0 ? (
              streams.map((stream) => (
                <div key={stream.id}>
                  <a
                    href={stream.streamUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <GlassCard className="h-full hover:border-neon-red/50 transition-all overflow-hidden">
                      {/* Thumbnail */}
                      <div className="relative w-full pt-[56.25%] bg-black/50 overflow-hidden">
                        {stream.thumbnailUrl && (
                          <img
                            src={stream.thumbnailUrl}
                            alt={stream.title}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />

                        {/* Live Badge */}
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-red-600 text-white border-0 flex items-center gap-1">
                            <Radio className="w-3 h-3" />
                            LIVE
                          </Badge>
                        </div>

                        {/* Viewers Count */}
                        <div className="absolute bottom-2 right-2 bg-black/60 px-3 py-1 rounded text-xs text-white font-semibold">
                          {stream.viewers.toLocaleString()} viewers
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <h3 className="font-orbitron font-bold text-white line-clamp-2 group-hover:text-neon-red transition-colors">
                          {stream.title}
                        </h3>
                        <p className="text-white/60 text-sm mt-2">{stream.hostName}</p>
                        {stream.game && (
                          <p className="text-white/50 text-xs mt-2">Playing: {stream.game}</p>
                        )}
                      </div>
                    </GlassCard>
                  </a>
                </div>
              ))
            ) : (
              <div className="col-span-full">
                <GlassCard className="p-12 text-center">
                  <Radio className="w-8 h-8 text-white/30 mx-auto mb-4" />
                  <p className="text-white/60 mb-4">No live streams right now</p>
                  <p className="text-white/40 text-sm">Check back later for tournament broadcasts and community streams</p>
                </GlassCard>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
