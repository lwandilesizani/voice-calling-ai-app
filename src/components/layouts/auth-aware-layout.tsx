"use client";

import { DashboardLayout } from "./dashboard-layout";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Spinner } from "@/components/ui/spinner";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2">
      <Spinner className="h-8 w-8" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  );
}

export function AuthAwareLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(false); // Start with false for public pages
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // For public pages, don't show loading and don't check auth
    if (pathname === "/" || pathname === "/login" || pathname === "/signup") {
      setLoading(false);
      return;
    }

    // For protected pages, start with loading state
    setLoading(true);

    // Handle auth state changes for protected pages only
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Don't redirect if on public pages
      if (!session && pathname !== "/" && pathname !== "/login" && pathname !== "/signup") {
        router.push("/login");
      }
      // Update loading state after auth check
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router, supabase.auth]);

  // Public pages don't need loading state or dashboard layout
  if (pathname === "/" || pathname === "/login" || pathname === "/signup") {
    return children;
  }

  // Show loading for protected pages while checking auth
  if (loading) {
    return <LoadingScreen />;
  }

  // For all other routes, use dashboard layout
  // The middleware ensures these routes are authenticated
  return <DashboardLayout>{children}</DashboardLayout>;
}
