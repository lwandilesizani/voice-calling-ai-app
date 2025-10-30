export type SortDirection = "asc" | "desc" | "none";

export interface SortCriterion {
  column: string;
  direction: SortDirection;
}

export interface FilterCriterion {
  column: string;
  value: string;
  type: "contains" | "equals";
} 