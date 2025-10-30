"use client";

import { createBrowserClient, CookieOptions } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { ArrowLeft, LogIn, Mail, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => {
          const pairs = document.cookie.split("; ").map(pair => {
            const [name, value] = pair.split("=");
            return { name, value };
          });
          return pairs;
        },
        setAll: (cookiesList: { name: string; value: string; options?: CookieOptions }[]) => {
          cookiesList.forEach(({ name, value, options }) => {
            document.cookie = `${name}=${value}; path=/; ${options?.sameSite ? `SameSite=${options.sameSite}; ` : ""}${options?.secure ? "Secure; " : ""}${options?.httpOnly ? "HttpOnly; " : ""}`
          });
        }
      }
    }
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Redirect to bookings page after successful login
      router.push("/bookings");
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to login",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted/30">
      <div className="p-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary-foreground/20 rounded-lg blur-xl opacity-30"></div>
            <div className="relative bg-background rounded-lg border shadow-lg p-8 space-y-8">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <LogIn className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
                <p className="text-muted-foreground">
                  Sign in to your We Call Smart account to continue
                </p>
              </div>
              
              <form className="space-y-6" onSubmit={handleLogin}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      Email address
                    </label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-3 py-6 border-muted-foreground/20 focus:border-primary"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-3 py-6 border-muted-foreground/20 focus:border-primary"
                        placeholder="Enter your password"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-2">
                  <Button
                    type="submit"
                    className={cn(
                      "w-full py-6 text-base font-medium transition-all",
                      "bg-primary hover:bg-primary/90 text-primary-foreground",
                      "shadow-md hover:shadow-lg",
                      "relative overflow-hidden group"
                    )}
                    disabled={loading}
                  >
                    <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-0 -skew-x-12 bg-primary-foreground/10 group-hover:translate-x-full group-hover:skew-x-12"></span>
                    <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform skew-x-12 bg-primary-foreground/5 group-hover:translate-x-full group-hover:-skew-x-12"></span>
                    <span className="absolute bottom-0 left-0 hidden w-10 h-20 transition-all duration-100 ease-out transform translate-x-0 translate-y-0 bg-primary-foreground/10 rotate-10 group-hover:block"></span>
                    <span className="absolute bottom-0 right-0 hidden w-10 h-20 transition-all duration-100 ease-out transform translate-x-0 translate-y-0 bg-primary-foreground/10 -rotate-10 group-hover:block"></span>
                    <span className="relative flex items-center justify-center gap-2">
                      {loading ? "Signing in..." : "Sign in to Account"}
                      <LogIn className="h-5 w-5" />
                    </span>
                  </Button>
                </div>
                
                <div className="flex items-center justify-center pt-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Don't have an account?{" "}
                      <Link href="/signup" className="font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors">
                        Create an account
                      </Link>
                    </p>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
