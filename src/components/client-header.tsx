'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase/client';

export function ClientHeader() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    router.push('/login');
  };

  return (
    <div className="flex justify-between items-center">
      <h1 className="text-3xl font-bold">Lead Management</h1>
      <Button onClick={handleSignOut}>Sign Out</Button>
    </div>
  );
}
