import { Link, useLocation } from "wouter";
import { useGetCurrentUser, useLogoutUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Crosshair, ShieldAlert, Trophy, Users, Megaphone, LogOut, LogIn, User, Plus, Settings } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user } = useGetCurrentUser({ query: { queryKey: getGetCurrentUserQueryKey(), retry: false } });
  const logout = useLogoutUser();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("userId");
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        setLocation("/");
      }
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <Link href="/" className="flex items-center gap-3 font-mono font-bold text-xl text-primary tracking-tighter">
            <Crosshair className="w-6 h-6 text-primary" />
            <span className="uppercase">Scrim Hub</span>
          </Link>
        </div>

        <nav className="flex-1 py-6 flex flex-col gap-2 px-4">
          <Link href="/scrims" className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${location.startsWith("/scrims") ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
            <Crosshair className="w-5 h-5" />
            <span className="font-medium uppercase tracking-wide">Scrims</span>
          </Link>
          <Link href="/teams" className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${location.startsWith("/teams") ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
            <Users className="w-5 h-5" />
            <span className="font-medium uppercase tracking-wide">Teams</span>
          </Link>
          <Link href="/leaderboard" className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${location.startsWith("/leaderboard") ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
            <Trophy className="w-5 h-5" />
            <span className="font-medium uppercase tracking-wide">Leaderboard</span>
          </Link>
          <Link href="/announcements" className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${location.startsWith("/announcements") ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
            <Megaphone className="w-5 h-5" />
            <span className="font-medium uppercase tracking-wide">Intel</span>
          </Link>
          {user?.role === "admin" && (
            <Link href="/admin" className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${location.startsWith("/admin") ? "bg-destructive/10 text-destructive border border-destructive/20" : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"}`}>
              <ShieldAlert className="w-5 h-5" />
              <span className="font-medium uppercase tracking-wide">Command</span>
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          {user ? (
            <div className="space-y-4">
              <div className="px-4 py-2 bg-muted/50 rounded-md border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-mono">Agent</p>
                <p className="font-bold text-sm truncate">{user.username}</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded font-mono uppercase">{user.role}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 justify-start gap-2 h-9 text-xs font-mono uppercase tracking-wider" onClick={() => setLocation("/profile")}>
                  <User className="w-3 h-3" /> Profile
                </Button>
                <Button variant="destructive" size="icon" className="h-9 w-9" onClick={handleLogout}>
                  <LogOut className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Button variant="default" className="w-full gap-2 font-mono uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setLocation("/login")}>
                <LogIn className="w-4 h-4" /> Login
              </Button>
              <Button variant="outline" className="w-full font-mono uppercase tracking-widest border-border text-muted-foreground hover:text-foreground" onClick={() => setLocation("/register")}>
                Enlist
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
