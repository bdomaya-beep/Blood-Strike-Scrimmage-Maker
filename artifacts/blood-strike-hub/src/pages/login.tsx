import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLoginUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Crosshair } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetCurrentUserQueryKey } from "@workspace/api-client-react";

const formSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const loginUser = useLoginUser();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    loginUser.mutate(
      { data: values },
      {
        onSuccess: (user) => {
          localStorage.setItem("userId", user.id.toString());
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          toast({ title: "Access Granted", description: "Welcome back, Operator." });
          setLocation("/");
        },
        onError: (error: any) => {
          const apiMessage =
            error?.data?.error ??
            error?.response?.data?.error ??
            error?.message ??
            "Invalid credentials.";

          toast({ variant: "destructive", title: "Access Denied", description: apiMessage });
        },
      },
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070')] bg-cover bg-center before:content-[''] before:absolute before:inset-0 before:bg-background/90 before:backdrop-blur-sm relative">
      <div className="w-full max-w-md z-10">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Crosshair className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-mono font-bold uppercase tracking-tighter mb-2">Login</h1>
          <p className="text-muted-foreground uppercase text-xs tracking-widest">Enter Credentials to Access Command</p>
        </div>

        <div className="bg-card/50 backdrop-blur border border-border p-6 rounded-lg shadow-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-xs font-mono tracking-widest text-muted-foreground">Operator ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter username" {...field} className="bg-background/50 font-mono" />
                    </FormControl>
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
                      <Input type="password" placeholder="Enter passcode" {...field} className="bg-background/50 font-mono" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full font-mono uppercase tracking-widest" disabled={loginUser.isPending}>
                {loginUser.isPending ? "Authenticating..." : "Initiate Uplink"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <Button variant="link" className="text-muted-foreground text-xs uppercase tracking-widest font-mono" onClick={() => setLocation("/register")}>
              Request Access (Register)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
