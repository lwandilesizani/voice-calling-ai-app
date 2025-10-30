'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Settings, ChevronLeft, ChevronRight, Calendar, Package, Bot, Building, Sparkles, Phone, Clock, LogOut, UserPlus } from 'lucide-react'
import { cn } from "@/lib/utils"
import { ThemeToggle } from './theme-toggle'
import { Button } from './ui/button'
import { useToast } from "@/hooks/use-toast"
import { supabase } from '@/lib/supabase/client'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname() || ''
  const router = useRouter()
  const { toast } = useToast()

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
    <div
      className={cn(
        "fixed top-0 left-0 h-screen bg-background border-r transition-all duration-200 ease-in-out flex flex-col",
        collapsed ? "w-[var(--sidebar-width-collapsed)]" : "w-[var(--sidebar-width)]"
      )}
    >
      <div className="p-4 flex items-center justify-between">
        {!collapsed && (
          <h1 className="text-xl font-semibold">AI Dialer</h1>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className={cn(
            "p-2 hover:bg-accent rounded-md",
            collapsed && "w-full flex justify-center"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <Link
          href="/bookings"
          className={cn(
            "flex items-center space-x-2 rounded-md p-2 hover:bg-accent",
            pathname.startsWith("/bookings") && "bg-accent",
            collapsed && "justify-center"
          )}
        >
          <Calendar className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Bookings</span>}
        </Link>
        <Link
          href="/services"
          className={cn(
            "flex items-center space-x-2 rounded-md p-2 hover:bg-accent",
            pathname.startsWith("/services") && "bg-accent",
            collapsed && "justify-center"
          )}
        >
          <Package className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Services</span>}
        </Link>
        <Link
          href="/talk-to-ava"
          className={cn(
            "flex items-center space-x-2 rounded-md p-2 hover:bg-accent",
            pathname.startsWith("/talk-to-ava") && "bg-accent",
            collapsed && "justify-center"
          )}
        >
          <Bot className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Talk to Ava</span>}
        </Link>
        <Link
          href="/my-assistants"
          className={cn(
            "flex items-center space-x-2 rounded-md p-2 hover:bg-accent",
            pathname.startsWith("/my-assistants") && "bg-accent",
            collapsed && "justify-center"
          )}
        >
          <Sparkles className="h-4 w-4 shrink-0" />
          {!collapsed && <span>My Assistants</span>}
        </Link>
        <Link
          href="/phone-numbers"
          className={cn(
            "flex items-center space-x-2 rounded-md p-2 hover:bg-accent",
            pathname.startsWith("/phone-numbers") && "bg-accent",
            collapsed && "justify-center"
          )}
        >
          <Phone className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Phone Numbers</span>}
        </Link>
        <Link
          href="/onboarding"
          className={cn(
            "flex items-center space-x-2 rounded-md p-2 hover:bg-accent",
            pathname.startsWith("/onboarding") && "bg-accent",
            collapsed && "justify-center"
          )}
        >
          <UserPlus className="h-4 w-4 shrink-0" />
          {!collapsed && <span>On Boarding</span>}
        </Link>
      </nav>
      <div className="p-4 border-t flex flex-col space-y-2">
        <Link
          href="/business-profile"
          className={cn(
            "flex items-center space-x-2 rounded-md p-2 hover:bg-accent",
            pathname === "/business-profile" && "bg-accent",
            collapsed && "justify-center"
          )}
        >
          <Building className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Business Profile</span>}
        </Link>
        <Link
          href="/business-hours"
          className={cn(
            "flex items-center space-x-2 rounded-md p-2 hover:bg-accent",
            pathname === "/business-hours" && "bg-accent",
            collapsed && "justify-center"
          )}
        >
          <Clock className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Business Hours</span>}
        </Link>
        <ThemeToggle 
          className="w-full justify-start" 
          collapsed={collapsed}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className={cn(
            "flex items-center space-x-2 rounded-md p-2 hover:bg-accent justify-start",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </div>
  )
}
