'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Loader, Shield, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

type RoleRequest = {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter?: {
    id: string;
    username: string;
    displayName: string;
    email: string;
  };
};

const STATUS_TABS = ['open', 'approved', 'rejected'] as const;

const roleLabel = (roleCode: string) =>
  roleCode
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');

export default function AdminRoleRequestsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [items, setItems] = useState<RoleRequest[]>([]);
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]>('open');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSuperAdmin = useMemo(() => (user?.roles ?? []).includes('super_admin'), [user?.roles]);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get<RoleRequest[]>(`/auth/admin/role-requests?status=${status}`);
      setItems(data ?? []);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load role requests');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!isSuperAdmin) {
      router.push('/events');
      return;
    }
    loadRequests();
  }, [isAuthenticated, isSuperAdmin, router, loadRequests]);

  const handleReview = async (requestId: string, approve: boolean) => {
    try {
      setBusyId(requestId);
      await apiClient.post(`/auth/admin/role-requests/${requestId}/review`, { approve });
      await loadRequests();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to review request');
    } finally {
      setBusyId(null);
    }
  };

  if (!isAuthenticated || !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 text-neon-red animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-orbitron font-black text-white mb-2">
              <span className="neon-text">Role Requests</span>
            </h1>
            <p className="text-white/60">Super Admin approval queue for organizer to spectator roles</p>
          </div>
          <Button onClick={loadRequests} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="flex gap-2 mb-6">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatus(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                status === tab
                  ? 'bg-neon-red/20 text-neon-red border border-neon-red/40'
                  : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-neon-red animate-spin" />
          </div>
        )}

        {error && (
          <GlassCard className="p-5 border-red-500/30 bg-red-500/5 mb-4">
            <p className="text-red-400">{error}</p>
          </GlassCard>
        )}

        {!loading && items.length === 0 && !error && (
          <GlassCard className="p-8 text-center">
            <Shield className="w-8 h-8 text-white/30 mx-auto mb-3" />
            <p className="text-white/60">No {status} role requests.</p>
          </GlassCard>
        )}

        <div className="space-y-4">
          {items.map((req) => (
            <GlassCard key={req.id} className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-neon-red font-semibold">{roleLabel(req.reason)}</p>
                  <h3 className="text-white font-orbitron font-bold mt-1">{req.reporter?.displayName || req.reporter?.username}</h3>
                  <p className="text-white/60 text-sm">@{req.reporter?.username} • {req.reporter?.email}</p>
                  <p className="text-white/40 text-xs mt-2">Requested: {new Date(req.createdAt).toLocaleString()}</p>
                </div>

                {status === 'open' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleReview(req.id, true)}
                      disabled={busyId === req.id}
                      className="bg-green-600 hover:bg-green-500"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReview(req.id, false)}
                      disabled={busyId === req.id}
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
