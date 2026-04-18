import { useGetTeamLeaderboard, useGetPlayerLeaderboard } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Crosshair, Users, ShieldAlert, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Leaderboard() {
  const { data: teams, isLoading: teamsLoading } = useGetTeamLeaderboard();
  const { data: players, isLoading: playersLoading } = useGetPlayerLeaderboard();

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <div className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center border border-yellow-500/50 font-bold font-mono shadow-[0_0_10px_rgba(234,179,8,0.3)]">1</div>;
    if (rank === 2) return <div className="w-8 h-8 rounded-full bg-slate-300/20 text-slate-300 flex items-center justify-center border border-slate-300/50 font-bold font-mono">2</div>;
    if (rank === 3) return <div className="w-8 h-8 rounded-full bg-amber-700/20 text-amber-700 flex items-center justify-center border border-amber-700/50 font-bold font-mono">3</div>;
    return <div className="w-8 h-8 flex items-center justify-center text-muted-foreground font-mono font-bold">#{rank}</div>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-border pb-6">
        <Trophy className="text-primary w-8 h-8" />
        <div>
          <h1 className="text-3xl font-mono font-bold uppercase tracking-tighter">Global Rankings</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest mt-1">Official Leaderboard Data</p>
        </div>
      </div>

      <Tabs defaultValue="teams" className="w-full">
        <TabsList className="grid w-full md:w-96 grid-cols-2 bg-muted/50 p-1 font-mono uppercase tracking-widest">
          <TabsTrigger value="teams" className="gap-2"><Users className="w-4 h-4"/> Squads</TabsTrigger>
          <TabsTrigger value="players" className="gap-2"><Crosshair className="w-4 h-4"/> Operators</TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="mt-6">
          <Card className="bg-card border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-20 font-mono uppercase text-xs tracking-widest">Rank</TableHead>
                  <TableHead className="font-mono uppercase text-xs tracking-widest">Squad Designation</TableHead>
                  <TableHead className="text-right font-mono uppercase text-xs tracking-widest">Matches</TableHead>
                  <TableHead className="text-right font-mono uppercase text-xs tracking-widest">Wins</TableHead>
                  <TableHead className="text-right font-mono uppercase text-xs tracking-widest">Kills</TableHead>
                  <TableHead className="text-right font-mono uppercase text-xs tracking-widest text-primary">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamsLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 font-mono text-muted-foreground">Gathering intel...</TableCell></TableRow>
                ) : Array.isArray(teams) ? teams.map((team) => (
                  <TableRow key={team.teamId} className="border-border hover:bg-muted/20 transition-colors">
                    <TableCell>{getRankBadge(team.rank)}</TableCell>
                    <TableCell className="font-bold text-base">{team.teamName}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{team.scrimsPlayed}</TableCell>
                    <TableCell className="text-right font-mono">{team.totalWins}</TableCell>
                    <TableCell className="text-right font-mono">{team.totalKills}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-lg text-primary">{team.totalPoints}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 font-mono text-muted-foreground">No data available</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="players" className="mt-6">
          <Card className="bg-card border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-20 font-mono uppercase text-xs tracking-widest">Rank</TableHead>
                  <TableHead className="font-mono uppercase text-xs tracking-widest">Operator / ID</TableHead>
                  <TableHead className="font-mono uppercase text-xs tracking-widest">Squad</TableHead>
                  <TableHead className="text-right font-mono uppercase text-xs tracking-widest">Wins</TableHead>
                  <TableHead className="text-right font-mono uppercase text-xs tracking-widest">Kills</TableHead>
                  <TableHead className="text-right font-mono uppercase text-xs tracking-widest text-primary">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {playersLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 font-mono text-muted-foreground">Gathering intel...</TableCell></TableRow>
                ) : Array.isArray(players) ? players.map((player) => (
                  <TableRow key={player.userId} className="border-border hover:bg-muted/20 transition-colors">
                    <TableCell>{getRankBadge(player.rank)}</TableCell>
                    <TableCell>
                      <div className="font-bold">{player.username}</div>
                      <div className="text-xs text-muted-foreground font-mono">{player.bloodStrikeId}</div>
                    </TableCell>
                    <TableCell>
                      {player.teamName ? (
                        <Badge variant="outline" className="font-mono font-normal bg-card">{player.teamName}</Badge>
                      ) : (
                        <span className="text-muted-foreground font-mono text-xs">Lone Wolf</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">{player.totalWins}</TableCell>
                    <TableCell className="text-right font-mono">{player.totalKills}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-lg text-primary">{player.totalPoints}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 font-mono text-muted-foreground">No data available</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
