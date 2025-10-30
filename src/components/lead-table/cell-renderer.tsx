import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateTime } from "@/lib/utils";
import type { Lead } from "@/lib/supabase/types";
import { STATUS_STYLES, NON_EDITABLE_FIELDS } from "./constants";
import { EditingCell } from "./types";

interface CellRendererProps {
  lead: Lead;
  field: keyof Lead;
  editingCell: EditingCell | null;
  onEdit: (id: string, field: keyof Lead, value: string) => void;
  onStartEdit: (id: string, field: keyof Lead) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, id: string, field: keyof Lead, value: string) => void;
  setEditingCell: (editingCell: EditingCell | null) => void;
}

export function CellRenderer({
  lead,
  field,
  editingCell,
  onEdit,
  onStartEdit,
  onKeyDown,
  setEditingCell,
}: CellRendererProps) {
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCell?.id === lead.id && editingCell?.field === field) {
      setEditValue(String(lead[field] || ""));
      // Add a small delay to ensure the input is rendered before focusing
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [editingCell, lead, field]);

  if (editingCell?.id === lead.id && editingCell?.field === field && !NON_EDITABLE_FIELDS.includes(field)) {
    if (field === "status") {
      return (
        <Select
          value={editValue}
          onValueChange={async (value) => {
            await onEdit(lead.id, field, value);
            setEditingCell(null);
          }}
          onOpenChange={(open) => {
            if (!open) {
              setEditingCell(null);
            }
          }}
        >
          <SelectTrigger onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              setEditingCell(null);
            } else if (e.key === "Tab") {
              onKeyDown(e as unknown as React.KeyboardEvent<HTMLInputElement>, lead.id, field, editValue);
            }
          }}>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(STATUS_STYLES).map((status) => (
              <SelectItem key={status} value={status}>
                {status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={async (e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onKeyDown(e, lead.id, field, editValue);
          } else if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault();
            // First save the value
            await onEdit(lead.id, field, editValue);
            // Only trigger navigation on Tab
            if (e.key === "Tab") {
              onKeyDown(e, lead.id, field, editValue);
            } else {
              // For Enter, just exit edit mode
              setEditingCell(null);
            }
          }
        }}
        onBlur={async () => {
          // Only save on blur if the value has changed
          if (editValue !== String(lead[field] || "")) {
            await onEdit(lead.id, field, editValue);
          }
          setEditingCell(null);
        }}
        className="h-8"
      />
    );
  }

  const value = lead[field];

  if (field === "status" && typeof value === "string") {
    return (
      <Badge 
        className={`${STATUS_STYLES[value as keyof typeof STATUS_STYLES]} cursor-pointer`}
        onClick={() => onStartEdit(lead.id, field)}
      >
        {value.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  }

  if (
    field === "last_called_at" ||
    field === "created_at" ||
    field === "updated_at"
  ) {
    return value ? formatDateTime(value as string) : "Never";
  }

  return (
    <span
      className={NON_EDITABLE_FIELDS.includes(field) ? "" : "cursor-text"}
      onClick={() => !NON_EDITABLE_FIELDS.includes(field) && onStartEdit(lead.id, field)}
    >
      {value ?? ""}
    </span>
  );
}
