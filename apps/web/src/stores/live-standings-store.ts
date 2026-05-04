import { create } from 'zustand';
import { getSocket } from '@/lib/socket';

export interface StandingsEntry {
  rank: number;
  clanId: string;
  clanName: string;
  clanTag: string;
  logoUrl: string | null;
  totalPoints: number;
  totalKills: number;
  matchesPlayed: number;
  wins: number;
  rankDelta?: number; // positive = moved up, negative = moved down
}

interface LiveStandingsState {
  eventId: string | null;
  entries: StandingsEntry[];
  version: number;
  lastUpdated: Date | null;
  isLive: boolean;
  subscribe: (eventId: string) => void;
  unsubscribe: () => void;
  setEntries: (entries: StandingsEntry[], version: number) => void;
}

export const useLiveStandingsStore = create<LiveStandingsState>((set, get) => ({
  eventId: null,
  entries: [],
  version: 0,
  lastUpdated: null,
  isLive: false,

  subscribe: (eventId) => {
    const socket = getSocket();
    socket.emit('join:event', eventId);

    socket.on('standings:update', (data: { entries: StandingsEntry[]; version: number }) => {
      const previous = get().entries;
      // Compute rank deltas
      const prevRankMap = new Map(previous.map((e) => [e.clanId, e.rank]));
      const enriched = data.entries.map((e) => ({
        ...e,
        rankDelta: (prevRankMap.get(e.clanId) ?? e.rank) - e.rank,
      }));
      set({ entries: enriched, version: data.version, lastUpdated: new Date() });
    });

    set({ eventId, isLive: true });
  },

  unsubscribe: () => {
    const { eventId } = get();
    if (eventId) {
      getSocket().emit('leave:event', eventId);
    }
    set({ eventId: null, isLive: false });
  },

  setEntries: (entries, version) => set({ entries, version, lastUpdated: new Date() }),
}));
