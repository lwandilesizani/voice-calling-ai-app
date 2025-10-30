import { useState } from "react";
import type { Lead } from "@/lib/supabase/types";
import { SortState } from "../types";

export function useLeadSort(initialSortState?: SortState) {
  const [sortState, setSortState] = useState<SortState>(() => {
    if (typeof window === 'undefined') return { column: null, direction: null };
    const savedSort = localStorage.getItem('leadTableSort');
    return savedSort ? JSON.parse(savedSort) : initialSortState || { column: null, direction: null };
  });

  const handleSort = (column: keyof Lead) => {
    setSortState(prev => {
      const newState = (() => {
        if (prev.column !== column) {
          return { column, direction: "asc" as const };
        }
        if (prev.direction === "asc") {
          return { column, direction: "desc" as const };
        }
        if (prev.direction === "desc") {
          return { column: null, direction: null };
        }
        return { column, direction: "asc" as const };
      })();
      
      localStorage.setItem('leadTableSort', JSON.stringify(newState));
      return newState;
    });
  };

  const getSortedLeads = (leadsToSort: Lead[]): Lead[] => {
    // Always create a new array to maintain referential integrity
    const leads = [...leadsToSort];
    
    // Apply default sort by id to maintain consistent order when no explicit sort
    if (!sortState.column || !sortState.direction) {
      return leads.sort((a, b) => a.id.localeCompare(b.id));
    }

    return leads.sort((a, b) => {
      const column = sortState.column!;
      const direction = sortState.direction!;
      const aValue = a[column];
      const bValue = b[column];

      // Handle null values
      if (aValue === null) return direction === "asc" ? 1 : -1;
      if (bValue === null) return direction === "asc" ? -1 : 1;

      // Compare dates
      if (
        column === "last_called_at" ||
        column === "created_at" ||
        column === "updated_at"
      ) {
        const aDate = new Date(aValue as string).getTime();
        const bDate = new Date(bValue as string).getTime();
        return direction === "asc" ? aDate - bDate : bDate - aDate;
      }

      // Compare numbers
      if (typeof aValue === "number" && typeof bValue === "number") {
        return direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      // Compare strings case-insensitively
      if (typeof aValue === "string" && typeof bValue === "string") {
        return direction === "asc"
          ? aValue.localeCompare(bValue, undefined, { sensitivity: "base" })
          : bValue.localeCompare(aValue, undefined, { sensitivity: "base" });
      }

      return 0;
    });
  };

  return {
    sortState,
    handleSort,
    getSortedLeads,
  };
}
