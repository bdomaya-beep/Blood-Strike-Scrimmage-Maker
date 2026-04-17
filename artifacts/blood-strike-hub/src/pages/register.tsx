import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateUser, useLoginUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Crosshair } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetCurrentUserQueryKey } from "@workspace/api-client-react";

const formSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  bloodStrikeId: z.string().min(5),
  role: z.enum(["player", "captain", "admin"]),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createUser = useCreateUser();
  const loginUser = useLoginUser();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      bloodStrikeId: "",
      role: "player",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createUser.mutate({ data: values }, {
      onSuccess: () => {
        loginUser.mutate({ data: { username: values.username, password: values.password } }, {
          onSuccess: (user) => {
            localStorage.setItem("userId", user.id.toString());
            queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
            toast({ title: "Registration Successful", description: "Operator profile created." });
            setLocation("/");
          }
        });
      },
      onError: (error) => {
        toast({ variant: "destructive", title: "Registration Failed", description: "Could not create operator profile." });
      }
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070')] bg-cover bg-center before:content-[''] before:absolute before:inset-0 before:bg-background/90 before:backdrop-blur-sm relative">
      <div className="w-full max-w-md z-10">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Crosshair className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-mono font-bold uppercase tracking-tighter mb-2">Enlist</h1>
          <p className="text-muted-foreground uppercase text-xs tracking-widest">Create Operator Profile</p>
        </div>

        <div className="bg-card/50 backdrop-blur border border-border p-6 rounded-lg shadow-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-xs font-mono tracking-widest text-muted-foreground">Operator Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Choose username" {...field} className="bg-background/50 font-mono" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bloodStrikeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-xs font-mono tracking-widest text-muted-foreground">Blood Strike ID</FormLabel>
                    <FormControl>
                      <Input placeholder="In-game ID" {...field} className="bg-background/50 font-mono" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-xs font-mono tracking-widest text-muted-foreground">Designation</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background/50 font-mono uppercase text-xs">
                          <SelectValue placeholder="Select designation" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="player" className="font-mono uppercase text-xs">Player</SelectItem>
                        <SelectItem value="captain" className="font-mono uppercase text-xs">Squad Captain</SelectItem>
                        <SelectItem value="admin" className="font-mono uppercase text-xs">Command Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-xs font-mono tracking-widest text-muted-foreground">Passcode</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Create passcode" {...field} className="bg-background/50 font-mono" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full font-mono uppercase tracking-widest mt-6" disabled={createUser.isPending || loginUser.isPending}>
                {(createUser.isPending || loginUser.isPending) ? "Processing..." : "Confirm Enlistment"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <Button variant="link" className="text-muted-foreground text-xs uppercase tracking-widest font-mono" onClick={() => setLocation("/login")}>
              Return to Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
