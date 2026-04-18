import { useParams } from "wouter";
import {
  useGetTeam,
  useGetTeamMembers,
  useListUsers,
  useGetCurrentUser,
  useInviteTeamMember,
  useAcceptTeamInvite,
  useRemoveTeamMember,
  getGetTeamQueryKey,
  getGetTeamMembersQueryKey,
  getListTeamsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Users, Crosshair, Award, UserPlus, Trash2, Star, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

async function setCaptain(teamId: number, userId: number) {
  const res = await fetch(`${API_BASE_URL}/api/teams/${teamId}/captain`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ captainId: userId }),
  });
  if (!res.ok) throw new Error("Failed to set captain");
}

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>();
  const teamId = Number.parseInt(id ?? "", 10);
  const hasValidTeamId = Number.isFinite(teamId);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: team, isLoading } = useGetTeam(teamId, { query: { enabled: hasValidTeamId, queryKey: getGetTeamQueryKey(teamId) } });
  const { data: members, refetch: refetchMembers } = useGetTeamMembers(teamId, { query: { enabled: hasValidTeamId, queryKey: getGetTeamMembersQueryKey(teamId) } });
  const { data: user } = useGetCurrentUser();
  const { data: allUsers } = useListUsers({ query: { enabled: user?.role === 'team_manager' || user?.role === 'admin' } });
  const inviteTeamMember = useInviteTeamMember();
  const acceptTeamInvite = useAcceptTeamInvite();
  const removeTeamMember = useRemoveTeamMember();

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [addingMember, setAddingMember] = useState(false);

  const isManager = user?.role === 'team_manager' && members?.some(m => m.userId === user.id && m.status === 'accepted');
  const isAdmin = user?.role === 'admin';
  const canManage = isManager || isAdmin;

  const acceptedMembers = members?.filter(m => m.status === 'accepted') ?? [];
  const pendingMembers = members?.filter(m => m.status === 'pending') ?? [];

  const handleAddMember = async () => {
    if (!selectedUserId) return;
    setAddingMember(true);
    try {
      await inviteTeamMember.mutateAsync({ id: teamId, data: { userId: Number.parseInt(selectedUserId, 10) } });
      toast({ title: "Member Invited", description: "Invitation sent successfully." });
      refetchMembers();
      setAddMemberOpen(false);
      setSelectedUserId("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err?.message ?? "Could not invite member." });
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    try {
      await removeTeamMember.mutateAsync({ id: teamId, userId });
      toast({ title: "Member Removed" });
      refetchMembers();
      queryClient.invalidateQueries({ queryKey: getGetTeamQueryKey(teamId) });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not remove member." });
    }
  };

  const handleAcceptMember = async (userId: number) => {
    try {
      await acceptTeamInvite.mutateAsync({ id: teamId, userId });
      toast({ title: "Member Accepted" });
      refetchMembers();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not accept member." });
    }
  };

  const handleSetCaptain = async (userId: number) => {
    try {
      await setCaptain(teamId, userId);
      toast({ title: "Captain Updated", description: "New squad captain assigned." });
      queryClient.invalidateQueries({ queryKey: getGetTeamQueryKey(teamId) });
      queryClient.invalidateQueries({ queryKey: getListTeamsQueryKey() });
      refetchMembers();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not update captain." });
    }
  };

  const availableToAdd = allUsers?.filter(u =>
    !members?.some(m => m.userId === u.id) &&
    u.id !== team?.captainId &&
    u.role !== 'admin'
  ) ?? [];

  if (!hasValidTeamId) return <div>Team not found</div>;
  if (isLoading) return <div className="animate-pulse h-64 bg-card/50 rounded-xl"></div>;
  if (!team) return <div>Team not found</div>;

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-8 relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center border border-border">
          {team.logoUrl ? (
            <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover rounded-lg" />
          ) : (
            <ShieldAlert className="w-12 h-12 text-muted-foreground opacity-50" />
          )}
        </div>
        
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl md:text-4xl font-bold font-mono uppercase tracking-tighter mb-2">{team.name}</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest font-mono">Captain: {team.captainUsername}</p>
          {team.description && <p className="text-muted-foreground mt-2 text-sm">{team.description}</p>}
        </div>

        <div className="flex gap-4">
          <div className="text-center px-6 py-3 bg-muted/30 rounded-lg border border-border">
            <p className="text-xs font-mono uppercase text-muted-foreground mb-1">Points</p>
            <p className="text-2xl font-bold font-mono text-primary">{team.totalPoints}</p>
          </div>
          <div className="text-center px-6 py-3 bg-muted/30 rounded-lg border border-border">
            <p className="text-xs font-mono uppercase text-muted-foreground mb-1">Kills</p>
            <p className="text-2xl font-bold font-mono">{team.totalKills}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="border-b border-border pb-4 flex-row items-center justify-between">
            <CardTitle className="font-mono uppercase tracking-widest flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Active Roster ({acceptedMembers.length})
            </CardTitle>
            {canManage && (
              <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="font-mono uppercase text-xs border-border gap-1">
                    <UserPlus className="w-4 h-4" /> Add Operator
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="font-mono uppercase tracking-tighter">Add Squad Member</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger className="font-mono">
                        <SelectValue placeholder="Select operator..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableToAdd.map(u => (
                          <SelectItem key={u.id} value={String(u.id)} className="font-mono">
                            {u.username} <span className="text-muted-foreground text-xs ml-2">({u.role})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      className="w-full font-mono uppercase tracking-widest"
                      disabled={!selectedUserId || addingMember}
                      onClick={handleAddMember}
                    >
                      {addingMember ? "Adding..." : "Send Invite"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {acceptedMembers.map(member => (
                <div key={member.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center font-mono font-bold text-xs border border-border">
                      {member.username?.substring(0, 2).toUpperCase() || '??'}
                    </div>
                    <div>
                      <p className="font-bold font-mono text-sm">{member.username}</p>
                      <p className="text-xs text-muted-foreground font-mono">UID: {member.bloodStrikeId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.userId === team.captainId && (
                      <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded font-mono uppercase border border-primary/30">Captain</span>
                    )}
                    {canManage && member.userId !== team.captainId && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-amber-500 hover:text-amber-400"
                          title="Set as Captain"
                          onClick={() => handleSetCaptain(member.userId)}
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          title="Remove Member"
                          onClick={() => handleRemoveMember(member.userId)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {acceptedMembers.length === 0 && (
                <div className="p-8 text-center text-muted-foreground font-mono text-sm">Roster Intel Unavailable</div>
              )}
            </div>
          </CardContent>

          {canManage && pendingMembers.length > 0 && (
            <>
              <div className="border-t border-border px-4 py-3 bg-muted/10">
                <p className="font-mono uppercase text-xs text-muted-foreground flex items-center gap-2">
                  <Clock className="w-3 h-3" /> Pending Requests ({pendingMembers.length})
                </p>
              </div>
              <div className="divide-y divide-border">
                {pendingMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-muted/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-muted/50 flex items-center justify-center font-mono font-bold text-xs border border-dashed border-border">
                        {member.username?.substring(0, 2).toUpperCase() || '??'}
                      </div>
                      <div>
                        <p className="font-bold font-mono text-sm text-muted-foreground">{member.username}</p>
                        <p className="text-xs text-muted-foreground font-mono">UID: {member.bloodStrikeId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[10px] uppercase">Pending</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs font-mono uppercase border-primary/30 text-primary"
                        onClick={() => handleAcceptMember(member.userId)}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-destructive"
                        onClick={() => handleRemoveMember(member.userId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="font-mono uppercase tracking-widest flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-primary" /> Service Record
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2 font-mono">
                <span className="text-muted-foreground uppercase">Win Rate</span>
                <span className="font-bold">
                  {team.totalWins && acceptedMembers.length > 0
                    ? `${Math.round((team.totalWins / Math.max(1, team.totalWins + 1)) * 100)}%`
                    : "--%"}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary w-0"></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground font-mono uppercase mb-1 flex items-center gap-1"><Award className="w-3 h-3"/> Wins</p>
                <p className="text-xl font-bold font-mono">{team.totalWins}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-mono uppercase mb-1 flex items-center gap-1"><Crosshair className="w-3 h-3"/> Kills</p>
                <p className="text-xl font-bold font-mono">{team.totalKills}</p>
              </div>
            </div>

            {canManage && (
              <div className="pt-4 border-t border-border">
                <p className="text-xs font-mono uppercase text-muted-foreground mb-3">Manager Controls</p>
                <p className="text-xs text-muted-foreground font-mono">Use the Add Operator button to invite players. Use the star icon to promote a member as captain. Remove operators with the trash icon.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
