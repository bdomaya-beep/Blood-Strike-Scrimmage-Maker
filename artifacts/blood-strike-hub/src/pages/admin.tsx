import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  useGetCurrentUser, 
  useCreateScrim, 
  useUpdateScrim,
  useListAnnouncements,
  useCreateAnnouncement,
  useListViolations,
  useCreateViolation,
  useUpdateViolation,
  useListUsers,
  useListTeams,
  useUpdateUser,
  getListAnnouncementsQueryKey,
  getListViolationsQueryKey,
  getListUsersQueryKey
} from "@workspace/api-client-react";
import { ShieldAlert, Crosshair, Megaphone, Users, Plus, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const BASE_URL = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
const ALL_SCRIMS_KEY = ["scrims", "all"];

async function fetchAllScrims() {
  const res = await fetch(`${BASE_URL}/api/scrims?all=true`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch scrims");
  return res.json();
}

const createScrimSchema = z.object({
  name: z.string().min(3),
  scheduledAt: z.string(),
  maxTeams: z.coerce.number().min(2),
  bracketType: z.enum(["low", "high"]),
  maps: z.string(),
  totalRounds: z.coerce.number().min(1),
  flyTimeSeconds: z.coerce.number().min(10),
});

const createAnnouncementSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(5),
  category: z.enum(["tournament", "event", "scrim", "update", "general"]),
  isPinned: z.boolean().default(false),
});

const createViolationSchema = z.object({
  teamId: z.coerce.number().int().positive(),
  userId: z.coerce.number().int().optional(),
  scrimId: z.coerce.number().int().optional(),
  type: z.enum(["no_show", "rule_breaking", "banned_weapon", "account_mismatch", "other"]),
  description: z.string().min(5),
  pointDeduction: z.coerce.number().int().min(0),
});

function violationTypeLabel(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export default function Admin() {
  const { data: user, isLoading } = useGetCurrentUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allScrims, refetch: refetchScrims } = useQuery({ queryKey: ALL_SCRIMS_KEY, queryFn: fetchAllScrims, enabled: !!user });
  const { data: announcements } = useListAnnouncements();
  const { data: violations } = useListViolations();
  const { data: users } = useListUsers();
  const { data: teams } = useListTeams();

  const createScrim = useCreateScrim();
  const updateScrim = useUpdateScrim();
  const createAnnouncement = useCreateAnnouncement();
  const createViolation = useCreateViolation();
  const updateViolation = useUpdateViolation();
  const updateUser = useUpdateUser();

  const [scrimOpen, setScrimOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [violationOpen, setViolationOpen] = useState(false);

  const scrimForm = useForm<z.infer<typeof createScrimSchema>>({
    resolver: zodResolver(createScrimSchema),
    defaultValues: {
      name: "",
      scheduledAt: new Date().toISOString().slice(0, 16),
      maxTeams: 16,
      bracketType: "high",
      maps: "Desert Valley",
      totalRounds: 3,
      flyTimeSeconds: 60,
    }
  });

  const announcementForm = useForm<z.infer<typeof createAnnouncementSchema>>({
    resolver: zodResolver(createAnnouncementSchema),
    defaultValues: { title: "", content: "", category: "general", isPinned: false }
  });

  const violationForm = useForm<z.infer<typeof createViolationSchema>>({
    resolver: zodResolver(createViolationSchema),
    defaultValues: { type: "account_mismatch", description: "", pointDeduction: 50 }
  });

  useEffect(() => {
    if (!isLoading && user?.role !== 'admin') setLocation('/');
  }, [user, isLoading, setLocation]);

  if (isLoading || user?.role !== 'admin') return null;

  const onScrimSubmit = (values: z.infer<typeof createScrimSchema>) => {
    createScrim.mutate({
      data: {
        ...values,
        maps: values.maps.split(',').map(m => m.trim()),
        createdBy: user.id
      }
    }, {
      onSuccess: () => {
        toast({ title: "Scrim Scheduled" });
        refetchScrims();
        setScrimOpen(false);
        scrimForm.reset();
      }
    });
  };

  const onAnnouncementSubmit = (values: z.infer<typeof createAnnouncementSchema>) => {
    createAnnouncement.mutate({ data: { ...values, createdBy: user.id } }, {
      onSuccess: () => {
        toast({ title: "Intel Broadcasted" });
        queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
        setAnnouncementOpen(false);
        announcementForm.reset();
      }
    });
  };

  const onViolationSubmit = (values: z.infer<typeof createViolationSchema>) => {
    createViolation.mutate({ data: { ...values, teamId: values.teamId, pointDeduction: values.pointDeduction } }, {
      onSuccess: () => {
        toast({ title: "Violation Filed" });
        queryClient.invalidateQueries({ queryKey: getListViolationsQueryKey() });
        setViolationOpen(false);
        violationForm.reset();
      },
      onError: () => {
        toast({ variant: "destructive", title: "Error", description: "Failed to file violation." });
      }
    });
  };

  const handleUpdateScrimStatus = (id: number, status: 'open' | 'ongoing' | 'finished') => {
    updateScrim.mutate({ id, data: { status } }, {
      onSuccess: () => {
        refetchScrims();
        toast({ title: `Scrim marked as ${status}` });
      }
    });
  };

  const handleApproveScrim = (id: number) => {
    updateScrim.mutate({ id, data: { status: "open" } }, {
      onSuccess: () => {
        refetchScrims();
        toast({ title: "Scrim Approved — now public" });
      }
    });
  };

  const handleResolveViolation = (id: number) => {
    updateViolation.mutate({ id, data: { status: 'resolved' } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListViolationsQueryKey() });
        toast({ title: "Violation Resolved" });
      }
    });
  };

  const handleToggleBan = (userId: number, currentBanState: boolean) => {
    updateUser.mutate({ id: userId, data: { isBanned: !currentBanState } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: currentBanState ? "Operator Restored" : "Operator Restricted" });
      }
    });
  };

  const pendingCount = (allScrims as any[])?.filter((s: any) => s.status === 'pending').length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-destructive/30 pb-6">
        <ShieldAlert className="text-destructive w-8 h-8" />
        <div>
          <h1 className="text-3xl font-mono font-bold uppercase tracking-tighter text-destructive">Command Override</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest mt-1">Admin Control Panel</p>
        </div>
      </div>

      <Tabs defaultValue="scrims" className="w-full">
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2 md:grid-cols-4 bg-muted/50 p-1 font-mono uppercase tracking-widest border border-border mb-6">
          <TabsTrigger value="scrims" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            Deployments {pendingCount > 0 && <Badge variant="destructive" className="ml-1 text-[9px] px-1 py-0 h-4">{pendingCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="announcements" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Intel</TabsTrigger>
          <TabsTrigger value="violations" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Infractions</TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Operators</TabsTrigger>
        </TabsList>

        <TabsContent value="scrims">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-mono font-bold uppercase flex items-center gap-2"><Crosshair className="w-5 h-5 text-primary" /> Scrim Operations</h2>
            <Dialog open={scrimOpen} onOpenChange={setScrimOpen}>
              <DialogTrigger asChild>
                <Button className="font-mono uppercase text-xs tracking-widest gap-2">
                  <Plus className="w-4 h-4" /> Schedule Deployment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="font-mono uppercase">Schedule Scrim</DialogTitle>
                </DialogHeader>
                <Form {...scrimForm}>
                  <form onSubmit={scrimForm.handleSubmit(onScrimSubmit)} className="space-y-4">
                    <FormField control={scrimForm.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel className="font-mono uppercase text-xs text-muted-foreground">Operation Name</FormLabel>
                      <FormControl><Input {...field} className="font-mono" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={scrimForm.control} name="scheduledAt" render={({ field }) => (
                        <FormItem><FormLabel className="font-mono uppercase text-xs text-muted-foreground">Schedule</FormLabel>
                        <FormControl><Input type="datetime-local" {...field} className="font-mono" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={scrimForm.control} name="bracketType" render={({ field }) => (
                        <FormItem><FormLabel className="font-mono uppercase text-xs text-muted-foreground">Tier</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="font-mono uppercase text-xs"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="low" className="font-mono uppercase text-xs">Low Tier</SelectItem>
                            <SelectItem value="high" className="font-mono uppercase text-xs">High Tier</SelectItem>
                          </SelectContent>
                        </Select><FormMessage /></FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField control={scrimForm.control} name="maxTeams" render={({ field }) => (
                        <FormItem><FormLabel className="font-mono uppercase text-xs text-muted-foreground">Max Squads</FormLabel>
                        <FormControl><Input type="number" {...field} className="font-mono" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={scrimForm.control} name="totalRounds" render={({ field }) => (
                        <FormItem><FormLabel className="font-mono uppercase text-xs text-muted-foreground">Rounds</FormLabel>
                        <FormControl><Input type="number" {...field} className="font-mono" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={scrimForm.control} name="flyTimeSeconds" render={({ field }) => (
                        <FormItem><FormLabel className="font-mono uppercase text-xs text-muted-foreground">Fly Time (s)</FormLabel>
                        <FormControl><Input type="number" {...field} className="font-mono" /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <FormField control={scrimForm.control} name="maps" render={({ field }) => (
                      <FormItem><FormLabel className="font-mono uppercase text-xs text-muted-foreground">Maps (comma separated)</FormLabel>
                      <FormControl><Input {...field} className="font-mono" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <p className="text-xs text-muted-foreground font-mono">Admin-created scrims are auto-approved and become immediately public.</p>
                    <Button type="submit" className="w-full font-mono uppercase tracking-widest mt-4">Initialize Operation</Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="bg-card/50 border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent bg-muted/30">
                  <TableHead className="font-mono uppercase text-xs tracking-widest">Operation</TableHead>
                  <TableHead className="font-mono uppercase text-xs tracking-widest">Creator</TableHead>
                  <TableHead className="font-mono uppercase text-xs tracking-widest">Approval</TableHead>
                  <TableHead className="font-mono uppercase text-xs tracking-widest">Schedule</TableHead>
                  <TableHead className="font-mono uppercase text-xs tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(allScrims as any[])?.map((scrim: any) => (
                  <TableRow key={scrim.id} className={`border-border ${scrim.status === 'pending' ? 'bg-amber-500/5' : ''}`}>
                    <TableCell className="font-bold">{scrim.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{scrim.createdByUsername || "System"}</TableCell>
                    <TableCell>
                      <Badge variant={scrim.status === 'open' || scrim.status === 'ongoing' || scrim.status === 'finished' ? 'default' : 'outline'} className="font-mono uppercase text-[10px]">
                        {scrim.status === 'pending' ? 'Pending' : scrim.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{format(new Date(scrim.scheduledAt), "PPp")}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {scrim.status === 'pending' && (
                        <Button size="sm" variant="outline" className="h-7 text-[10px] font-mono uppercase border-primary/30 text-primary" onClick={() => handleApproveScrim(scrim.id)}>Approve</Button>
                      )}
                      {scrim.status === 'open' && (
                        <Button size="sm" variant="secondary" className="h-7 text-[10px] font-mono uppercase" onClick={() => handleUpdateScrimStatus(scrim.id, 'ongoing')}>Start</Button>
                      )}
                      {scrim.status === 'ongoing' && (
                        <Button size="sm" variant="destructive" className="h-7 text-[10px] font-mono uppercase" onClick={() => handleUpdateScrimStatus(scrim.id, 'finished')}>Conclude</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="announcements">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-mono font-bold uppercase flex items-center gap-2"><Megaphone className="w-5 h-5 text-primary" /> Command Intel</h2>
            <Dialog open={announcementOpen} onOpenChange={setAnnouncementOpen}>
              <DialogTrigger asChild>
                <Button className="font-mono uppercase text-xs tracking-widest gap-2"><Plus className="w-4 h-4" /> Broadcast Intel</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-card border-border">
                <DialogHeader><DialogTitle className="font-mono uppercase">Broadcast New Intel</DialogTitle></DialogHeader>
                <Form {...announcementForm}>
                  <form onSubmit={announcementForm.handleSubmit(onAnnouncementSubmit)} className="space-y-4">
                    <FormField control={announcementForm.control} name="title" render={({ field }) => (
                      <FormItem><FormLabel className="font-mono uppercase text-xs text-muted-foreground">Title</FormLabel>
                      <FormControl><Input {...field} className="font-mono" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={announcementForm.control} name="category" render={({ field }) => (
                      <FormItem><FormLabel className="font-mono uppercase text-xs text-muted-foreground">Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="font-mono uppercase text-xs"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="tournament" className="font-mono uppercase text-xs">Tournament</SelectItem>
                          <SelectItem value="event" className="font-mono uppercase text-xs">Event</SelectItem>
                          <SelectItem value="scrim" className="font-mono uppercase text-xs">Scrim</SelectItem>
                          <SelectItem value="update" className="font-mono uppercase text-xs">Update</SelectItem>
                          <SelectItem value="general" className="font-mono uppercase text-xs">General</SelectItem>
                        </SelectContent>
                      </Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={announcementForm.control} name="content" render={({ field }) => (
                      <FormItem><FormLabel className="font-mono uppercase text-xs text-muted-foreground">Transmission Content</FormLabel>
                      <FormControl><Textarea {...field} className="font-mono" rows={4} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="submit" className="w-full font-mono uppercase tracking-widest mt-4">Send Broadcast</Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="bg-card/50 border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent bg-muted/30">
                  <TableHead className="font-mono uppercase text-xs tracking-widest">Title</TableHead>
                  <TableHead className="font-mono uppercase text-xs tracking-widest">Category</TableHead>
                  <TableHead className="font-mono uppercase text-xs tracking-widest">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements?.map(a => (
                  <TableRow key={a.id} className="border-border">
                    <TableCell className="font-bold flex items-center gap-2">
                      {a.isPinned && <Badge className="bg-primary text-primary-foreground text-[10px] uppercase font-mono px-1 py-0 h-4">Pinned</Badge>}
                      {a.title}
                    </TableCell>
                    <TableCell><Badge variant="outline" className="font-mono uppercase text-[10px]">{a.category}</Badge></TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{format(new Date(a.createdAt), "PP")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="violations">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-mono font-bold uppercase flex items-center gap-2"><AlertCircle className="w-5 h-5 text-destructive" /> Infractions</h2>
            <Dialog open={violationOpen} onOpenChange={setViolationOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="font-mono uppercase text-xs tracking-widest gap-2"><Plus className="w-4 h-4" /> File Violation</Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader><DialogTitle className="font-mono uppercase text-destructive">File Violation</DialogTitle></DialogHeader>
                <Form {...violationForm}>
                  <form onSubmit={violationForm.handleSubmit(onViolationSubmit)} className="space-y-4 mt-2">
                    <FormField control={violationForm.control} name="teamId" render={({ field }) => (
                      <FormItem><FormLabel className="font-mono uppercase text-xs text-muted-foreground">Target Squad</FormLabel>
                      <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value ? String(field.value) : ""}>
                        <FormControl><SelectTrigger className="font-mono"><SelectValue placeholder="Select squad..." /></SelectTrigger></FormControl>
                        <SelectContent>
                          {teams?.map(t => (
                            <SelectItem key={t.id} value={String(t.id)} className="font-mono">{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={violationForm.control} name="type" render={({ field }) => (
                      <FormItem><FormLabel className="font-mono uppercase text-xs text-muted-foreground">Violation Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="font-mono uppercase text-xs"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="account_mismatch" className="font-mono uppercase text-xs">Account Mismatch</SelectItem>
                          <SelectItem value="no_show" className="font-mono uppercase text-xs">No Show</SelectItem>
                          <SelectItem value="rule_breaking" className="font-mono uppercase text-xs">Rule Breaking</SelectItem>
                          <SelectItem value="banned_weapon" className="font-mono uppercase text-xs">Banned Weapon</SelectItem>
                          <SelectItem value="other" className="font-mono uppercase text-xs">Other</SelectItem>
                        </SelectContent>
                      </Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={violationForm.control} name="description" render={({ field }) => (
                      <FormItem><FormLabel className="font-mono uppercase text-xs text-muted-foreground">Description</FormLabel>
                      <FormControl><Textarea {...field} className="font-mono" placeholder="Describe the violation..." rows={3} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={violationForm.control} name="pointDeduction" render={({ field }) => (
                      <FormItem><FormLabel className="font-mono uppercase text-xs text-muted-foreground">Point Deduction</FormLabel>
                      <FormControl><Input type="number" {...field} className="font-mono" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="submit" variant="destructive" className="w-full font-mono uppercase tracking-widest">Confirm Violation</Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          <Card className="bg-card/50 border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent bg-muted/30">
                  <TableHead className="font-mono uppercase text-xs tracking-widest">Target</TableHead>
                  <TableHead className="font-mono uppercase text-xs tracking-widest">Type</TableHead>
                  <TableHead className="font-mono uppercase text-xs tracking-widest">Deduction</TableHead>
                  <TableHead className="font-mono uppercase text-xs tracking-widest">Status</TableHead>
                  <TableHead className="font-mono uppercase text-xs tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {violations?.map(v => (
                  <TableRow key={v.id} className="border-border">
                    <TableCell className="font-bold">{v.teamName || v.username || 'Unknown'}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground uppercase">{violationTypeLabel(v.type)}</TableCell>
                    <TableCell className="font-mono text-destructive font-bold">-{v.pointDeduction}</TableCell>
                    <TableCell>
                      <Badge variant={v.status === 'active' ? 'destructive' : 'outline'} className="font-mono uppercase text-[10px]">{v.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {v.status === 'active' && (
                        <Button size="sm" variant="outline" className="h-7 text-[10px] font-mono uppercase border-border" onClick={() => handleResolveViolation(v.id)}>Resolve</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <div className="mb-4">
            <h2 className="text-xl font-mono font-bold uppercase flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Operators</h2>
          </div>
          <Card className="bg-card/50 border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent bg-muted/30">
                  <TableHead className="font-mono uppercase text-xs tracking-widest">Operator</TableHead>
                  <TableHead className="font-mono uppercase text-xs tracking-widest">UID</TableHead>
                  <TableHead className="font-mono uppercase text-xs tracking-widest">Role</TableHead>
                  <TableHead className="font-mono uppercase text-xs tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map(u => (
                  <TableRow key={u.id} className="border-border">
                    <TableCell className="font-bold flex items-center gap-2">
                      {u.username}
                      {u.isBanned && <Badge variant="destructive" className="font-mono uppercase text-[10px] h-4 py-0">Banned</Badge>}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{u.bloodStrikeId}</TableCell>
                    <TableCell className="font-mono text-sm uppercase text-primary">{u.role.replace('_', ' ')}</TableCell>
                    <TableCell className="text-right">
                      {u.role !== 'admin' && (
                        <Button
                          size="sm"
                          variant={u.isBanned ? "secondary" : "destructive"}
                          className="h-7 text-[10px] font-mono uppercase"
                          onClick={() => handleToggleBan(u.id, u.isBanned)}
                        >
                          {u.isBanned ? 'Restore' : 'Restrict'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
