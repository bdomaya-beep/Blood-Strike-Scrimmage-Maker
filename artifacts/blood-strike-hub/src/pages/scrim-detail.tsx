import { useParams, Link } from "wouter";
import { 
  useGetScrim, 
  useGetScrimMatches, 
  useGetScrimRegistrations, 
  useGetScrimScoreboard,
  useGetCurrentUser,
  useRegisterTeamToScrim,
  getGetScrimQueryKey,
  getGetScrimRegistrationsQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Crosshair, Clock, ShieldAlert, Users, Calendar, MapPin, Trophy, Sword, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

function CountdownTimer({ seconds }: { seconds: number }) {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div className="font-mono text-2xl tracking-widest text-primary animate-pulse">
      {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
    </div>
  );
}

export default function ScrimDetail() {
  const { id } = useParams<{ id: string }>();
  const scrimId = parseInt(id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useGetCurrentUser();
  const { data: scrim, isLoading: scrimLoading } = useGetScrim(scrimId, { query: { enabled: !!scrimId, queryKey: getGetScrimQueryKey(scrimId) } });
  const { data: matches } = useGetScrimMatches(scrimId, { query: { enabled: !!scrimId } });
  const { data: registrations } = useGetScrimRegistrations(scrimId, { query: { enabled: !!scrimId, queryKey: getGetScrimRegistrationsQueryKey(scrimId) } });
  const { data: scoreboard } = useGetScrimScoreboard(scrimId, { query: { enabled: !!scrimId } });
  
  const registerTeam = useRegisterTeamToScrim();

  const activeMatch = matches?.find(m => m.status === 'active');
  const pendingMatch = matches?.find(m => m.status === 'pending');

  const isCaptain = user?.role === 'captain';
  const isRegistered = registrations?.some(r => r.teamId === 1); // Mocked check, need user team ID ideally

  const handleRegister = () => {
    // Requires a team ID. As captain, we'd normally pick our team. Hardcoding 1 for now if no specific context.
    // In a real app we'd fetch the captain's team first.
    toast({ title: "Enlisting...", description: "Feature needs captain team context." });
  };

  if (scrimLoading) {
    return <div className="animate-pulse h-96 bg-card/50 rounded-xl border border-border"></div>;
  }

  if (!scrim) {
    return <div>Scrim not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant={scrim.status === 'open' ? 'default' : 'secondary'} className="font-mono uppercase text-[10px]">
                {scrim.status}
              </Badge>
              <Badge variant="outline" className="font-mono uppercase text-[10px] border-primary/30 text-primary">
                {scrim.bracketType} Tier
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-mono uppercase tracking-tighter mb-2">{scrim.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-mono">
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {format(new Date(scrim.scheduledAt), "PPp")}</span>
              <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {scrim.registeredTeams} / {scrim.maxTeams}</span>
              <span className="flex items-center gap-1"><Sword className="w-4 h-4" /> {scrim.totalRounds} Rounds</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            {scrim.status === 'open' && isCaptain && !isRegistered && (
              <Button size="lg" className="font-mono uppercase tracking-widest w-full md:w-auto" onClick={handleRegister}>
                Deploy Squad
              </Button>
            )}
            {isRegistered && (
              <div className="px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-md font-mono text-sm uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Squad Enlisted
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fly Time Active State */}
      {scrim.status === 'ongoing' && activeMatch && (
        <Card className="bg-primary/5 border-primary/30 shadow-[0_0_15px_rgba(220,38,38,0.1)]">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Crosshair className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <div>
                <h3 className="font-mono font-bold uppercase tracking-widest text-lg">Active Deployment</h3>
                <p className="text-muted-foreground text-sm font-mono uppercase">Round {activeMatch.roundNumber} • {activeMatch.mapName}</p>
              </div>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest mb-1">Fly Time</p>
              <CountdownTimer seconds={scrim.flyTimeSeconds} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Tabs */}
      <Tabs defaultValue="intel" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 font-mono uppercase tracking-widest">
          <TabsTrigger value="intel">Intel</TabsTrigger>
          <TabsTrigger value="roster">Roster</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="standings">Standings</TabsTrigger>
        </TabsList>

        <TabsContent value="intel" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Info className="w-4 h-4" /> Mission Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <span className="font-bold text-foreground">Maps: </span>
                  <span className="text-muted-foreground">{scrim.maps.join(", ")}</span>
                </div>
                <div>
                  <span className="font-bold text-foreground">Fly Time: </span>
                  <span className="text-muted-foreground">{scrim.flyTimeSeconds} seconds</span>
                </div>
                <div>
                  <span className="font-bold text-foreground">Creator: </span>
                  <span className="text-primary">{scrim.createdByUsername || "System"}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Restrictions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <span className="font-bold text-foreground text-destructive">Weapon Bans: </span>
                  <span className="text-muted-foreground">{scrim.weaponBans?.length ? scrim.weaponBans.join(", ") : "None"}</span>
                </div>
                <div>
                  <span className="font-bold text-foreground text-destructive">Item Bans: </span>
                  <span className="text-muted-foreground">{scrim.itemBans?.length ? scrim.itemBans.join(", ") : "None"}</span>
                </div>
              </CardContent>
            </Card>

            {scrim.rules && (
              <Card className="bg-card/50 border-border md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Sword className="w-4 h-4" /> Rules of Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {scrim.rules}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="roster" className="mt-6">
          <Card className="bg-card/50 border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-mono uppercase text-xs tracking-widest">Squad Name</TableHead>
                  <TableHead className="font-mono uppercase text-xs tracking-widest text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground font-mono">No squads enlisted</TableCell>
                  </TableRow>
                ) : (
                  registrations?.map((reg) => (
                    <TableRow key={reg.id} className="border-border">
                      <TableCell className="font-bold">{reg.teamName || `Team ${reg.teamId}`}</TableCell>
                      <TableCell className="text-right text-xs font-mono uppercase text-green-500">Confirmed</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="mt-6">
          <div className="space-y-4">
            {matches?.length === 0 ? (
              <div className="text-center py-12 border border-border bg-card/30 rounded-lg">
                <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="font-mono uppercase tracking-widest text-sm text-muted-foreground">Schedule pending</p>
              </div>
            ) : (
              matches?.map((match) => (
                <div key={match.id} className={`p-4 border rounded-lg flex items-center justify-between ${match.status === 'active' ? 'border-primary/50 bg-primary/5' : 'border-border bg-card/50'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center font-mono font-bold">R{match.roundNumber}</div>
                    <div>
                      <h4 className="font-bold uppercase">{match.mapName}</h4>
                      <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Match #{match.matchNumber}</p>
                    </div>
                  </div>
                  <Badge variant={match.status === 'active' ? 'default' : 'outline'} className="font-mono uppercase text-[10px]">
                    {match.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="standings" className="mt-6">
          <Card className="bg-card/50 border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent bg-muted/30">
                  <TableHead className="font-mono uppercase text-xs tracking-widest w-16">Rank</TableHead>
                  <TableHead className="font-mono uppercase text-xs tracking-widest">Squad</TableHead>
                  <TableHead className="font-mono uppercase text-xs tracking-widest text-right">Kills</TableHead>
                  <TableHead className="font-mono uppercase text-xs tracking-widest text-right text-destructive">Violations</TableHead>
                  <TableHead className="font-mono uppercase text-xs tracking-widest text-right text-primary">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scoreboard?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground font-mono">No data available</TableCell>
                  </TableRow>
                ) : (
                  scoreboard?.map((entry) => (
                    <TableRow key={entry.teamId} className="border-border">
                      <TableCell className="font-mono font-bold text-muted-foreground">#{entry.rank}</TableCell>
                      <TableCell className="font-bold">{entry.teamName}</TableCell>
                      <TableCell className="text-right font-mono">{entry.totalKills}</TableCell>
                      <TableCell className="text-right font-mono text-destructive">{entry.violations || 0}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-primary">{entry.totalPoints}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
