import { useGetCurrentUser, useGetUser, getGetUserQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Crosshair, Award, ShieldAlert, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Profile() {
  const { data: currentUser } = useGetCurrentUser();
  const userId = currentUser?.id ?? 0;
  const { data: user, isLoading } = useGetUser(userId, { query: { enabled: !!currentUser?.id, queryKey: getGetUserQueryKey(userId) } });

  if (isLoading) return <div className="animate-pulse h-64 bg-card/50 rounded-xl"></div>;
  if (!user) return <div>Profile not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-card border border-border rounded-xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center border border-border">
            <User className="w-12 h-12 text-muted-foreground" />
          </div>
          
          <div className="text-center md:text-left flex-1">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-3xl font-bold font-mono uppercase tracking-tighter">{user.username}</h1>
              {user.isBanned && (
                <Badge variant="destructive" className="font-mono uppercase text-[10px]">Restricted</Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-mono text-muted-foreground">
              <span className="uppercase">BSID: <span className="text-foreground">{user.bloodStrikeId}</span></span>
              <span className="uppercase">Role: <span className="text-primary">{user.role}</span></span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border md:col-span-2">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="font-mono uppercase tracking-widest flex items-center gap-2 text-sm">
              <Crosshair className="w-4 h-4 text-primary" /> Combat Record
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-3xl font-bold font-mono text-primary mb-1">{user.totalPoints}</p>
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Score</p>
              </div>
              <div>
                <p className="text-3xl font-bold font-mono mb-1">{user.totalKills}</p>
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Kills</p>
              </div>
              <div>
                <p className="text-3xl font-bold font-mono mb-1">{user.totalWins}</p>
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Wins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="font-mono uppercase tracking-widest flex items-center gap-2 text-sm text-destructive">
              <ShieldAlert className="w-4 h-4" /> Infractions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-border mx-auto flex items-center justify-center mb-3">
                <span className="font-mono text-2xl text-muted-foreground">0</span>
              </div>
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Recorded Violations</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
