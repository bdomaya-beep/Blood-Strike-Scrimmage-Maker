import { useGetDashboardStats } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crosshair, Users, Trophy, ShieldAlert, Activity, Swords } from "lucide-react";

export default function Home() {
  const { data: stats, isLoading } = useGetDashboardStats();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-xl border border-border bg-card/50 backdrop-blur-sm">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent"></div>
        
        <div className="relative p-8 md:p-12 z-10 flex flex-col items-start max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono uppercase tracking-widest mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            System Online
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold font-mono uppercase tracking-tighter mb-4 text-foreground drop-shadow-md">
            Blood Strike <br />
            <span className="text-primary">Scrim Hub</span>
          </h1>
          
          <p className="text-muted-foreground text-lg mb-8 max-w-xl">
            Command center for high-stakes competitive play. Register your squad, claim deployment slots, track confirmed kills, and dominate the global leaderboard.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link href="/scrims">
              <Button size="lg" className="font-mono uppercase tracking-widest gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Crosshair className="w-4 h-4" /> View Scrims
              </Button>
            </Link>
            <Link href="/teams">
              <Button size="lg" variant="outline" className="font-mono uppercase tracking-widest gap-2 border-border text-foreground hover:bg-muted">
                <Users className="w-4 h-4" /> Find Teams
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section>
        <div className="flex items-center gap-2 mb-6 border-b border-border pb-2">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-mono uppercase tracking-widest font-bold">Network Status</h2>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-card/50 border-border animate-pulse h-32"></Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-widest">Active Scrims</CardTitle>
                <Crosshair className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-mono font-bold text-foreground">{stats?.activeScrims || 0}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-widest">Total Squads</CardTitle>
                <Users className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-mono font-bold text-foreground">{stats?.totalTeams || 0}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-widest">Registered Operators</CardTitle>
                <ShieldAlert className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-mono font-bold text-foreground">{stats?.totalUsers || 0}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-widest">Top Squad</CardTitle>
                <Trophy className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-mono font-bold text-primary truncate" title={stats?.topTeam || "None"}>{stats?.topTeam || "---"}</div>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* Quick Links */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-muted/30 border border-border p-6 rounded-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Swords className="w-8 h-8 text-primary mb-4" />
          <h3 className="text-lg font-mono uppercase font-bold mb-2">Upcoming Operations</h3>
          <p className="text-muted-foreground text-sm mb-4">View scheduled scrims and secure your squad's deployment slot before they fill up.</p>
          <Link href="/scrims">
            <Button variant="outline" size="sm" className="font-mono uppercase text-xs">Browse Scrims</Button>
          </Link>
        </div>
        
        <div className="bg-muted/30 border border-border p-6 rounded-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Trophy className="w-8 h-8 text-primary mb-4" />
          <h3 className="text-lg font-mono uppercase font-bold mb-2">Global Leaderboard</h3>
          <p className="text-muted-foreground text-sm mb-4">Check squad rankings, individual operator stats, and recent performance metrics.</p>
          <Link href="/leaderboard">
            <Button variant="outline" size="sm" className="font-mono uppercase text-xs">View Rankings</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
