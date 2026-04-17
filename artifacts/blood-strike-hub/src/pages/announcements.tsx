import { useListAnnouncements } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Pin, Calendar, AlertCircle, Info, Trophy, Crosshair } from "lucide-react";
import { format } from "date-fns";

export default function Announcements() {
  const { data: announcements, isLoading } = useListAnnouncements();

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'tournament': return <Trophy className="w-4 h-4 text-yellow-500" />;
      case 'event': return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'scrim': return <Crosshair className="w-4 h-4 text-primary" />;
      case 'update': return <AlertCircle className="w-4 h-4 text-green-500" />;
      default: return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'tournament': return 'border-yellow-500/30 text-yellow-500 bg-yellow-500/10';
      case 'event': return 'border-blue-500/30 text-blue-500 bg-blue-500/10';
      case 'scrim': return 'border-primary/30 text-primary bg-primary/10';
      case 'update': return 'border-green-500/30 text-green-500 bg-green-500/10';
      default: return 'border-border text-muted-foreground bg-muted';
    }
  };

  const pinned = announcements?.filter(a => a.isPinned) || [];
  const recent = announcements?.filter(a => !a.isPinned) || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 border-b border-border pb-6">
        <Megaphone className="text-primary w-8 h-8" />
        <div>
          <h1 className="text-3xl font-mono font-bold uppercase tracking-tighter">Command Intel</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest mt-1">Official announcements and updates</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Card className="bg-card/50 border-border animate-pulse h-32"></Card>
          <Card className="bg-card/50 border-border animate-pulse h-32"></Card>
        </div>
      ) : (
        <div className="space-y-8">
          {pinned.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-mono uppercase tracking-widest text-xs text-muted-foreground flex items-center gap-2">
                <Pin className="w-3 h-3" /> Pinned Intel
              </h3>
              {pinned.map((item) => (
                <Card key={item.id} className="bg-primary/5 border-primary/30 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                  <CardHeader className="pb-2 flex flex-row items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={`font-mono uppercase text-[10px] ${getCategoryColor(item.category)}`}>
                          {item.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {format(new Date(item.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                      <CardTitle className="text-xl font-bold">{item.title}</CardTitle>
                    </div>
                    {getCategoryIcon(item.category)}
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap leading-relaxed">{item.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-mono uppercase tracking-widest text-xs text-muted-foreground">Recent Intel</h3>
            {recent.length === 0 ? (
              <div className="text-center py-12 border border-border bg-card/30 rounded-lg">
                <p className="font-mono text-muted-foreground text-sm">No recent intel available.</p>
              </div>
            ) : (
              recent.map((item) => (
                <Card key={item.id} className="bg-card border-border hover:border-primary/20 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className={`font-mono uppercase text-[10px] ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                        {format(new Date(item.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    <CardTitle className="text-lg font-bold">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap leading-relaxed">{item.content}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
