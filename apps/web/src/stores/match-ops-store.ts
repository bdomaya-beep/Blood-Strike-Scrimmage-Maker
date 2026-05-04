import { create } from 'zustand';
import { getSocket } from '@/lib/socket';

export type MatchStatus =
  | 'SCHEDULED'
  | 'READY_CHECK'
  | 'LIVE'
  | 'RESULT_PENDING'
  | 'DISPUTED'
  | 'VERIFIED'
  | 'LOCKED';

export interface MatchOpsEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

interface MatchOpsState {
  matchId: string | null;
  status: MatchStatus | null;
  events: MatchOpsEvent[];
  subscribe: (matchId: string) => void;
  unsubscribe: () => void;
  setStatus: (status: MatchStatus) => void;
  addEvent: (event: MatchOpsEvent) => void;
}

export const useMatchOpsStore = create<MatchOpsState>((set, get) => ({
  matchId: null,
  status: null,
  events: [],

  subscribe: (matchId) => {
    const socket = getSocket();
    socket.emit('join:match', matchId);

    socket.on('match:status', (data: { status: MatchStatus }) => {
      set({ status: data.status });
    });

    socket.on('match:event', (event: MatchOpsEvent) => {
      set((state) => ({ events: [...state.events, event] }));
    });

    set({ matchId, events: [] });
  },

  unsubscribe: () => {
    const { matchId } = get();
    if (matchId) getSocket().emit('leave:match', matchId);
    set({ matchId: null, status: null });
  },

  setStatus: (status) => set({ status }),
  addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
}));
