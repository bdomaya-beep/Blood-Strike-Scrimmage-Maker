import { useListScrims } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crosshair, Calendar, MapPin, Users, Sword, ShieldAlert } from "lucide-react";
import { format } from "date-fns";

export default function ScrimsList() {
  const { data: scrims, isLoading } = useListScrims();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 font-mono uppercase text-[10px]">Open</Badge>;
      case "ongoing":
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono uppercase text-[10px] animate-pulse">Live</Badge>;
      case "finished":
        return <Badge variant="outline" className="bg-muted text-muted-foreground border-border font-mono uppercase text-[10px]">Concluded</Badge>;
      default:
        return null;
    }
  };

  const getBracketBadge = (bracket: string) => {
    return <Badge variant="secondary" className="font-mono uppercase text-[10px] bg-accent/50">{bracket} Tier</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-mono font-bold uppercase tracking-tighter flex items-center gap-3">
            <Crosshair className="text-primary w-8 h-8" /> Active Deployments
          </h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest mt-1">Scheduled and ongoing operations</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-card/50 border-border animate-pulse h-64"></Card>
          ))}
        </div>
      ) : scrims?.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-lg bg-card/30">
          <ShieldAlert className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-mono uppercase font-bold text-muted-foreground">No Active Scrims</h3>
          <p className="text-sm text-muted-foreground/70 mt-2">Check back later for new deployments.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scrims?.map((scrim) => (
            <Card key={scrim.id} className="bg-card border-border overflow-hidden group hover:border-primary/30 transition-colors flex flex-col">
              <div className="h-2 bg-gradient-to-r from-primary/50 to-transparent w-full"></div>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  {getStatusBadge(scrim.status)}
                  {getBracketBadge(scrim.bracketType)}
                </div>
                <CardTitle className="text-xl font-bold font-mono tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                  {scrim.name}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary/70" />
                    <span>{format(new Date(scrim.scheduledAt), "MMM d, HH:mm")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4 text-primary/70" />
                    <span>{scrim.registeredTeams} / {scrim.maxTeams} Squads</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary/70" />
                    <span className="truncate">{scrim.maps.length} Maps</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Sword className="w-4 h-4 text-primary/70" />
                    <span>{scrim.totalRounds} Rounds</span>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="pt-4 border-t border-border/50 bg-muted/10">
                <Link href={`/scrims/${scrim.id}`} className="w-full">
                  <Button className="w-full font-mono uppercase tracking-widest text-xs" variant={scrim.status === 'open' ? "default" : "secondary"}>
                    {scrim.status === 'open' ? 'View Details / Enlist' : 'View Intel'}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
