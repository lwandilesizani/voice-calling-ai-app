'use client';

import { useState, useEffect } from 'react';

export function useSidebarState() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load initial state from localStorage
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('sidebarOpen');
      setIsSidebarOpen(savedState === null ? true : savedState === 'true');
      setIsLoaded(true);
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', String(newState));
  };

  return {
    isSidebarOpen,
    toggleSidebar,
    isLoaded
  };
}
