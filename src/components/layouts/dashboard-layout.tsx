"use client";

import { cn } from "@/lib/utils";
import { useSidebarState } from "@/hooks/use-sidebar-state";
import { Sidebar } from "@/components/sidebar";

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { isSidebarOpen, toggleSidebar, isLoaded } = useSidebarState();

  // Don't render until we've loaded the initial state from localStorage
  // This prevents a flash of the default state
  if (!isLoaded) {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar
        collapsed={!isSidebarOpen}
        onToggleCollapse={toggleSidebar}
      />
      <main
        className={cn(
          "flex-1 p-8 transition-all duration-200 ease-in-out",
          isSidebarOpen ? "ml-64" : "ml-16"
        )}
      >
        {children}
      </main>
    </div>
  );
};
