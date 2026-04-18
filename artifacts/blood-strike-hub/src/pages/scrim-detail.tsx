import { useParams, Link } from "wouter";
import { 
  useGetScrim, 
  useGetScrimMatches, 
  useGetScrimRegistrations, 
  useGetScrimScoreboard,
  useGetCurrentUser,
  useRegisterTeamToScrim,
  useListTeams,
  useGetTeamMembers,
  getGetScrimQueryKey,
  getGetScrimRegistrationsQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Crosshair, Clock, ShieldAlert, Users, Calendar, MapPin, Trophy, Sword, Info, ClipboardList, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

const BASE_URL = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

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

type LineupPlayer = {
  userId?: number;
  ign: string;
  uid: string;
  designation: "main" | "sub";
};

export default function ScrimDetail() {
  const { id } = useParams<{ id: string }>();
  const scrimId = parseInt(id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useGetCurrentUser();
  const { data: scrim, isLoading: scrimLoading } = useGetScrim(scrimId, { query: { enabled: !!scrimId, queryKey: getGetScrimQueryKey(scrimId) } });
  const { data: matches } = useGetScrimMatches(scrimId, { query: { enabled: !!scrimId } });
  const { data: registrations, refetch: refetchRegistrations } = useGetScrimRegistrations(scrimId, { query: { enabled: !!scrimId, queryKey: getGetScrimRegistrationsQueryKey(scrimId) } });
  const { data: scoreboard } = useGetScrimScoreboard(scrimId, { query: { enabled: !!scrimId } });
  const { data: allTeams } = useListTeams({ query: { enabled: user?.role === 'captain' } });
  
  const registerTeam = useRegisterTeamToScrim();

  const isCaptain = user?.role === 'captain';
  const captainTeam = allTeams?.find(t => t.captainId === user?.id);
  const isRegistered = captainTeam ? registrations?.some(r => r.teamId === captainTeam.id) : false;

  const { data: teamMembers } = useGetTeamMembers(captainTeam?.id ?? 0, {
    query: { enabled: !!captainTeam?.id }
  });

  const activeMembers = teamMembers?.filter(m => m.status === 'accepted') ?? [];

  const [lineupOpen, setLineupOpen] = useState(false);
  const [lineupPlayers, setLineupPlayers] = useState<LineupPlayer[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [lineupData, setLineupData] = useState<any[]>([]);

  useEffect(() => {
    if (captainTeam && scrimId) {
      fetch(`${BASE_URL}/api/scrims/${scrimId}/lineups?teamId=${captainTeam.id}`, { credentials: "include" })
        .then(r => r.ok ? r.json() : [])
        .then(data => setLineupData(data))
        .catch(() => {});
    }
  }, [captainTeam, scrimId, isRegistered]);

  const openLineupDialog = () => {
    const initial: LineupPlayer[] = activeMembers.map(m => ({
      userId: m.userId,
      ign: m.username ?? "",
      uid: m.bloodStrikeId ?? "",
      designation: "main" as "main" | "sub",
    }));
    setLineupPlayers(initial.length > 0 ? initial : [{ ign: "", uid: "", designation: "main" }]);
    setLineupOpen(true);
  };

  const updatePlayer = (idx: number, field: keyof LineupPlayer, value: string) => {
    setLineupPlayers(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const addCustomPlayer = () => {
    setLineupPlayers(prev => [...prev, { ign: "", uid: "", designation: "sub" }]);
  };

  const removePlayer = (idx: number) => {
    setLineupPlayers(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitLineup = async () => {
    if (!captainTeam) return;
    const valid = lineupPlayers.filter(p => p.ign.trim() && p.uid.trim());
    if (valid.length === 0) {
      toast({ variant: "destructive", title: "Lineup Error", description: "At least one player required." });
      return;
    }

    setSubmitting(true);
    try {
      const lineupRes = await fetch(`${BASE_URL}/api/scrims/${scrimId}/lineups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ teamId: captainTeam.id, players: valid }),
      });
      if (!lineupRes.ok) throw new Error("Failed to submit lineup");

      if (!isRegistered) {
        await new Promise<void>((resolve, reject) => {
          registerTeam.mutate({ id: scrimId, data: { teamId: captainTeam.id } }, {
            onSuccess: () => resolve(),
            onError: (e: any) => reject(e),
          });
        });
      }

      toast({ title: "Squad Deployed", description: "Lineup submitted and team registered." });
      setLineupOpen(false);
      refetchRegistrations();
      queryClient.invalidateQueries({ queryKey: getGetScrimQueryKey(scrimId) });

      const updated = await fetch(`${BASE_URL}/api/scrims/${scrimId}/lineups?teamId=${captainTeam.id}`, { credentials: "include" });
      setLineupData(updated.ok ? await updated.json() : []);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message ?? "Could not deploy squad." });
    } finally {
      setSubmitting(false);
    }
  };

  const activeMatch = matches?.find(m => m.status === 'active');

  if (scrimLoading) return <div className="animate-pulse h-96 bg-card/50 rounded-xl border border-border"></div>;
  if (!scrim) return <div>Scrim not found</div>;

  return (
    <div className="space-y-6">
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
            {scrim.status === 'open' && isCaptain && !captainTeam && (
              <p className="text-xs text-muted-foreground font-mono uppercase">No squad found for your account</p>
            )}
            {scrim.status === 'open' && isCaptain && captainTeam && !isRegistered && (
              <Dialog open={lineupOpen} onOpenChange={setLineupOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="font-mono uppercase tracking-widest w-full md:w-auto" onClick={openLineupDialog}>
                    <ClipboardList className="w-4 h-4 mr-2" /> Submit Lineup & Deploy
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-mono uppercase tracking-tighter text-xl flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-primary" /> Squad Lineup — {captainTeam.name}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-3 mt-4">
                    <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-xs font-mono text-amber-500">Using a different account or UID during the scrim will result in an account mismatch violation and point deduction.</p>
                    </div>

                    <div className="grid grid-cols-[1fr_1fr_100px_32px] gap-2 px-1">
                      <span className="text-xs font-mono uppercase text-muted-foreground">IGN</span>
                      <span className="text-xs font-mono uppercase text-muted-foreground">UID</span>
                      <span className="text-xs font-mono uppercase text-muted-foreground">Role</span>
                      <span></span>
                    </div>

                    {lineupPlayers.map((player, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_1fr_100px_32px] gap-2 items-center">
                        <Input
                          value={player.ign}
                          onChange={e => updatePlayer(idx, "ign", e.target.value)}
                          placeholder="In-Game Name"
                          className="font-mono text-xs h-9"
                        />
                        <Input
                          value={player.uid}
                          onChange={e => updatePlayer(idx, "uid", e.target.value)}
                          placeholder="UID"
                          className="font-mono text-xs h-9"
                        />
                        <Select value={player.designation} onValueChange={v => updatePlayer(idx, "designation", v)}>
                          <SelectTrigger className="h-9 font-mono text-xs uppercase">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="main" className="font-mono text-xs">Main</SelectItem>
                            <SelectItem value="sub" className="font-mono text-xs">Sub</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="ghost" className="h-9 w-8 p-0 text-destructive" onClick={() => removePlayer(idx)}>×</Button>
                      </div>
                    ))}

                    <Button variant="outline" size="sm" className="font-mono uppercase text-xs w-full border-dashed" onClick={addCustomPlayer}>
                      + Add Custom Player
                    </Button>
                  </div>

                  <div className="flex gap-3 mt-6 pt-4 border-t border-border">
                    <Button variant="outline" className="flex-1 font-mono uppercase tracking-widest" onClick={() => setLineupOpen(false)}>
                      Cancel
                    </Button>
                    <Button className="flex-1 font-mono uppercase tracking-widest" disabled={submitting} onClick={handleSubmitLineup}>
                      {submitting ? "Deploying..." : "Confirm & Deploy Squad"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            {isRegistered && (
              <div className="flex flex-col items-end gap-2">
                <div className="px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-md font-mono text-sm uppercase tracking-widest flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Squad Enlisted
                </div>
                {lineupData.length > 0 && (
                  <Dialog open={lineupOpen} onOpenChange={setLineupOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="font-mono uppercase text-xs border-border" onClick={openLineupDialog}>
                        Update Lineup
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="font-mono uppercase tracking-tighter text-xl flex items-center gap-2">
                          <ClipboardList className="w-5 h-5 text-primary" /> Update Lineup — {captainTeam?.name}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 mt-4">
                        <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                          <p className="text-xs font-mono text-amber-500">Using a different account or UID during the scrim will result in an account mismatch violation and point deduction.</p>
                        </div>
                        <div className="grid grid-cols-[1fr_1fr_100px_32px] gap-2 px-1">
                          <span className="text-xs font-mono uppercase text-muted-foreground">IGN</span>
                          <span className="text-xs font-mono uppercase text-muted-foreground">UID</span>
                          <span className="text-xs font-mono uppercase text-muted-foreground">Role</span>
                          <span></span>
                        </div>
                        {lineupPlayers.map((player, idx) => (
                          <div key={idx} className="grid grid-cols-[1fr_1fr_100px_32px] gap-2 items-center">
                            <Input value={player.ign} onChange={e => updatePlayer(idx, "ign", e.target.value)} placeholder="IGN" className="font-mono text-xs h-9" />
                            <Input value={player.uid} onChange={e => updatePlayer(idx, "uid", e.target.value)} placeholder="UID" className="font-mono text-xs h-9" />
                            <Select value={player.designation} onValueChange={v => updatePlayer(idx, "designation", v)}>
                              <SelectTrigger className="h-9 font-mono text-xs uppercase"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="main" className="font-mono text-xs">Main</SelectItem>
                                <SelectItem value="sub" className="font-mono text-xs">Sub</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button size="sm" variant="ghost" className="h-9 w-8 p-0 text-destructive" onClick={() => removePlayer(idx)}>×</Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" className="font-mono uppercase text-xs w-full border-dashed" onClick={addCustomPlayer}>+ Add Custom Player</Button>
                      </div>
                      <div className="flex gap-3 mt-6 pt-4 border-t border-border">
                        <Button variant="outline" className="flex-1 font-mono uppercase tracking-widest" onClick={() => setLineupOpen(false)}>Cancel</Button>
                        <Button className="flex-1 font-mono uppercase tracking-widest" disabled={submitting} onClick={handleSubmitLineup}>{submitting ? "Saving..." : "Save Lineup"}</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

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
                <div><span className="font-bold">Maps: </span><span className="text-muted-foreground">{scrim.maps.join(", ")}</span></div>
                <div><span className="font-bold">Fly Time: </span><span className="text-muted-foreground">{scrim.flyTimeSeconds} seconds</span></div>
                <div><span className="font-bold">Creator: </span><span className="text-primary">{scrim.createdByUsername || "System"}</span></div>
                {scrim.approvedByUsername && <div><span className="font-bold">Approved by: </span><span className="text-green-500">{scrim.approvedByUsername}</span></div>}
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Restrictions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div><span className="font-bold text-destructive">Weapon Bans: </span><span className="text-muted-foreground">{scrim.weaponBans?.length ? scrim.weaponBans.join(", ") : "None"}</span></div>
                <div><span className="font-bold text-destructive">Item Bans: </span><span className="text-muted-foreground">{scrim.itemBans?.length ? scrim.itemBans.join(", ") : "None"}</span></div>
              </CardContent>
            </Card>

            {scrim.rules && (
              <Card className="bg-card/50 border-border md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Sword className="w-4 h-4" /> Rules of Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground whitespace-pre-wrap">{scrim.rules}</CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="roster" className="mt-6">
          <Card className="bg-card/50 border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-mono uppercase text-xs tracking-widest">Squad</TableHead>
                  <TableHead className="font-mono uppercase text-xs tracking-widest">Lineup</TableHead>
                  <TableHead className="font-mono uppercase text-xs tracking-widest text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!registrations || registrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground font-mono">No squads enlisted</TableCell>
                  </TableRow>
                ) : (
                  registrations.map((reg) => (
                    <TableRow key={reg.id} className="border-border">
                      <TableCell className="font-bold">{reg.teamName || `Team ${reg.teamId}`}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {reg.teamId === captainTeam?.id && lineupData.length > 0 ? (
                          <div className="space-y-0.5">
                            {lineupData.map((p: any) => (
                              <div key={p.id} className="flex items-center gap-2">
                                <span className={`text-[10px] uppercase px-1 rounded ${p.designation === 'main' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>{p.designation}</span>
                                <span>{p.ign}</span>
                                <span className="text-muted-foreground">({p.uid})</span>
                              </div>
                            ))}
                          </div>
                        ) : "—"}
                      </TableCell>
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
            {!matches || matches.length === 0 ? (
              <div className="text-center py-12 border border-border bg-card/30 rounded-lg">
                <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="font-mono uppercase tracking-widest text-sm text-muted-foreground">Schedule pending</p>
              </div>
            ) : (
              matches.map((match) => (
                <div key={match.id} className={`p-4 border rounded-lg flex items-center justify-between ${match.status === 'active' ? 'border-primary/50 bg-primary/5' : 'border-border bg-card/50'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center font-mono font-bold">R{match.roundNumber}</div>
                    <div>
                      <h4 className="font-bold uppercase">{match.mapName}</h4>
                      <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Match #{match.matchNumber}</p>
                    </div>
                  </div>
                  <Badge variant={match.status === 'active' ? 'default' : 'outline'} className="font-mono uppercase text-[10px]">{match.status}</Badge>
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
                {!scoreboard || scoreboard.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground font-mono">No data available</TableCell>
                  </TableRow>
                ) : (
                  scoreboard.map((entry) => (
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
