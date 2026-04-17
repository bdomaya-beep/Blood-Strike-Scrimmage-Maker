import { useParams } from "wouter";
import { useGetTeam, useGetTeamMembers, getGetTeamQueryKey, getGetTeamMembersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Users, Trophy, Crosshair, Award } from "lucide-react";

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>();
  const teamId = parseInt(id);

  const { data: team, isLoading } = useGetTeam(teamId, { query: { enabled: !!teamId, queryKey: getGetTeamQueryKey(teamId) } });
  const { data: members } = useGetTeamMembers(teamId, { query: { enabled: !!teamId, queryKey: getGetTeamMembersQueryKey(teamId) } });

  if (isLoading) return <div className="animate-pulse h-64 bg-card/50 rounded-xl"></div>;
  if (!team) return <div>Team not found</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
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
        {/* Roster */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="font-mono uppercase tracking-widest flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Active Roster ({team.memberCount})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {members?.map(member => (
                <div key={member.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center font-mono font-bold text-xs border border-border">
                      {member.username?.substring(0, 2).toUpperCase() || '??'}
                    </div>
                    <div>
                      <p className="font-bold font-mono text-sm">{member.username}</p>
                      <p className="text-xs text-muted-foreground font-mono">BSID: {member.bloodStrikeId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {member.userId === team.captainId && (
                      <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded font-mono uppercase border border-primary/30">Captain</span>
                    )}
                  </div>
                </div>
              ))}
              {(!members || members.length === 0) && (
                <div className="p-8 text-center text-muted-foreground font-mono text-sm">Roster Intel Unavailable</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
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
                <span className="font-bold">--%</span>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
