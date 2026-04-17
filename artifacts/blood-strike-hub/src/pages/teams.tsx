import { useListTeams, getListTeamsQueryKey, useGetCurrentUser } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, ShieldAlert, Trophy, Crosshair, Plus } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateTeam } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const createTeamSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
});

export default function TeamsList() {
  const [search, setSearch] = useState("");
  const { data: teams, isLoading } = useListTeams();
  const { data: user } = useGetCurrentUser();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createTeam = useCreateTeam();
  const [, setLocation] = useLocation();

  const isCaptain = user?.role === 'captain';

  const form = useForm<z.infer<typeof createTeamSchema>>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: { name: "", description: "" },
  });

  const onSubmit = (values: z.infer<typeof createTeamSchema>) => {
    if (!user) return;
    createTeam.mutate({ data: { ...values, captainId: user.id } }, {
      onSuccess: (team) => {
        toast({ title: "Squad Formed", description: `${team.name} is ready for deployment.` });
        queryClient.invalidateQueries({ queryKey: getListTeamsQueryKey() });
        setOpen(false);
        setLocation(`/teams/${team.id}`);
      }
    });
  };

  const filteredTeams = teams?.filter(t => t.name.toLowerCase().includes(search.toLowerCase())) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-mono font-bold uppercase tracking-tighter flex items-center gap-3">
            <Users className="text-primary w-8 h-8" /> Squad Directory
          </h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest mt-1">Browse registered teams</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search squads..." 
              className="pl-9 bg-card border-border font-mono text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {isCaptain && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="font-mono uppercase tracking-widest gap-2 shrink-0">
                  <Plus className="w-4 h-4" /> Form Squad
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="font-mono uppercase tracking-tighter text-xl flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-primary" /> Initialize Squad
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-mono uppercase text-xs text-muted-foreground">Designation</FormLabel>
                          <FormControl>
                            <Input placeholder="Squad Name" {...field} className="font-mono" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-mono uppercase text-xs text-muted-foreground">Motto / Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Optional intel" {...field} className="font-mono" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="pt-4 flex justify-end">
                      <Button type="submit" className="font-mono uppercase tracking-widest" disabled={createTeam.isPending}>
                        Confirm Formation
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-card/50 border-border animate-pulse h-48"></Card>
          ))}
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-lg bg-card/30">
          <ShieldAlert className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-mono uppercase font-bold text-muted-foreground">No Squads Found</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTeams.map((team) => (
            <Card key={team.id} className="bg-card border-border hover:border-primary/30 transition-all flex flex-col group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShieldAlert className="w-16 h-16 text-primary" />
              </div>
              <CardHeader className="pb-2 z-10">
                <CardTitle className="text-xl font-bold font-mono tracking-tight line-clamp-1">{team.name}</CardTitle>
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest flex items-center gap-1">
                  Captain: {team.captainUsername || "Unknown"}
                </p>
              </CardHeader>
              
              <CardContent className="space-y-3 flex-1 z-10 mt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-mono uppercase text-xs flex items-center gap-2"><Users className="w-3 h-3"/> Roster</span>
                  <span className="font-bold font-mono">{team.memberCount} / 5</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-mono uppercase text-xs flex items-center gap-2"><Crosshair className="w-3 h-3"/> Kills</span>
                  <span className="font-bold font-mono">{team.totalKills}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-primary font-mono uppercase text-xs flex items-center gap-2"><Trophy className="w-3 h-3"/> Points</span>
                  <span className="font-bold font-mono text-primary">{team.totalPoints}</span>
                </div>
              </CardContent>
              
              <CardFooter className="pt-4 border-t border-border/50 bg-muted/10 z-10">
                <Link href={`/teams/${team.id}`} className="w-full">
                  <Button variant="secondary" className="w-full font-mono uppercase tracking-widest text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    Inspect Profile
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
