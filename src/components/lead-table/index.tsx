"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Table } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@/lib/supabase/types";
import { leadsService } from "@/lib/services/leads";
import { supabase } from "@/lib/supabase/client";
import debounce from "lodash/debounce";

// Import our new components and hooks
import { CSVPreviewDialog } from "./csv-preview-dialog";
import { LeadFormDialog } from "./lead-form-dialog";
import { LeadTableHeader } from "./table-header";
import { LeadTableBody } from "./table-body";
import { useLeadSort } from "./hooks/use-lead-sort";
import { useCSVImport } from "./hooks/use-csv-import";
import { usePageSize } from "./hooks/use-page-size";
import { LeadTableProps, EditingCell } from "./types";
import { FIELD_MAPPINGS, NON_EDITABLE_FIELDS } from "./constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pagination } from "./pagination";

export function LeadTable({ initialLeads }: LeadTableProps) {
  const [rawLeads, setRawLeads] = useState<Lead[]>(initialLeads);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(initialLeads.length);
  const { toast } = useToast();

  // Initialize our custom hooks
  const { sortState, handleSort, getSortedLeads } = useLeadSort();
  const sortedLeads = getSortedLeads(rawLeads);
  const { csvPreviewData, showCSVPreview, fileInputRef, handleFileUpload, handleCSVImport, setShowCSVPreview } = useCSVImport(() => fetchLeads(false));
  const { pageSize, setPageSize } = usePageSize();

  const fetchLeads = async (showSuccessToast = false, forceRefresh = false) => {
    console.log('fetchLeads called:', {
      currentPage,
      pageSize,
      hasSort: !!sortState.column,
      forceRefresh
    });

    // Only skip fetch if we're not forcing a refresh and we're on page 1 with initial data
    if (!forceRefresh && currentPage === 1 && rawLeads === initialLeads && !sortState.column) {
      console.log('Skipping fetch - using initial data');
      return;
    }

    try {
      const { data, error, count } = await leadsService.getLeads({
        sortBy: sortState.column ? {
          column: sortState.column,
          ascending: sortState.direction === 'asc'
        } : undefined,
        page: currentPage,
        pageSize,
      });

      if (error) {
        toast({
          title: "Error fetching leads",
          description: error.message || "An unexpected error occurred while fetching leads",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        setRawLeads(data);
        setTotalRecords(count);

        if (showSuccessToast) {
          toast({
            title: "Success",
            description: "Leads refreshed successfully",
            variant: "success",
          });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  // Only fetch when pagination, sorting changes
  useEffect(() => {
    fetchLeads(false, false);
  }, [currentPage, pageSize, sortState]);

  // Memoize the debounced update handler
  const handleDatabaseChange = useCallback(
    debounce(async () => {
      const { data: updatedLeads, error, count } = await leadsService.getLeads({
        sortBy: sortState.column
          ? {
              column: sortState.column,
              ascending: sortState.direction === "asc",
            }
          : undefined,
        page: currentPage,
        pageSize: pageSize,
      });

      if (error) {
        toast({
          title: "Error refreshing leads",
          description: "There was a problem updating the table.",
          variant: "destructive",
        });
        return;
      }

      if (updatedLeads) {
        setRawLeads(updatedLeads);
        if (count !== undefined) {
          setTotalRecords(count);
        }
      }
    }, 250),
    [currentPage, pageSize, sortState, toast]
  );

  useEffect(() => {
    // Subscribe to changes on the leads table
    const subscription = supabase
      .channel('leads-table-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
        },
        handleDatabaseChange
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
        },
        handleDatabaseChange
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'leads',
        },
        handleDatabaseChange
      )
      .subscribe();

    // Cleanup subscription and debounced handler on component unmount
    return () => {
      subscription.unsubscribe();
      handleDatabaseChange.cancel();
    };
  }, [handleDatabaseChange]);

  const handleManualRefresh = () => {
    // Force refresh when manually triggered
    fetchLeads(true, true);
  };

  const handleUpdateLead = async (id: string, updates: Partial<Lead>) => {
    const { success, data, error } = await leadsService.updateLead(id, updates);
    if (!success || !data) {
      console.error("Error updating lead:", error);
      toast({
        title: "Error",
        description: "Failed to update lead. Please try again.",
        variant: "destructive",
      });
      return false;
    }
    
    // Update the local state with the new data
    setRawLeads(prevLeads => 
      prevLeads.map(lead => lead.id === id ? {
        ...lead,  // Keep existing properties
        ...data,  // Update with new data
        // Preserve any properties that might be undefined in the response
        ...Object.fromEntries(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          Object.entries(data).filter(([_, v]) => v !== undefined)
        )
      } : lead)
    );
    
    return true;
  };

  const handleDeleteLeads = async () => {
    const results = await Promise.all(
      selectedLeads.map((id) => leadsService.deleteLead(id))
    );

    const errors = results.filter((r) => !r.success);
    if (errors.length > 0) {
      console.error("Error deleting leads:", errors);
      toast({
        title: "Error",
        description: `Failed to delete ${errors.length} leads. Please try again.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Successfully deleted ${selectedLeads.length} leads.`,
        variant: "success",
      });
    }

    setIsDeleteDialogOpen(false);
    setSelectedLeads([]);
    fetchLeads();
  };

  const handleAddLead = async (data: Partial<Lead>) => {
    const newLead = {
      company_name: data.company_name || '',
      contact_name: data.contact_name || data.company_name || 'Unknown Contact',
      phone: data.phone || '',
      email: data.email || '',
      timezone: data.timezone || 'America/Los_Angeles',
      ...data,
      status: "pending" as const,
      call_attempts: 0,
      last_called_at: null,
      cal_booking_uid: null,
      follow_up_email_sent: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: createdLead, error } = await leadsService.createLead(newLead);
    if (error || !createdLead) {
      console.error("Error creating lead:", error);
      toast({
        title: "Error",
        description: "Failed to create lead. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Lead created successfully.",
        variant: "success",
      });
      setIsAddingLead(false);
      fetchLeads(false, true);  // Set forceRefresh to true
    }
  };

  const handleBulkStatusUpdate = async (status: Lead["status"]) => {
    const { success, data, error } = await leadsService.updateLeadStatus(selectedLeads, status);

    if (!success || error) {
      console.error("Error updating leads:", error);
      toast({
        title: "Error",
        description: "Failed to update leads. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Successfully updated ${selectedLeads.length} leads to ${status}.`,
        variant: "success",
      });

      // Update local state with the returned data
      setRawLeads(prevLeads => 
        prevLeads.map(lead => {
          const updatedLead = data?.find(d => d.id === lead.id);
          return updatedLead ? { ...lead, ...updatedLead } : lead;
        })
      );
      setSelectedLeads([]);
    }
  };

  const toggleLead = (id: string) => {
    setSelectedLeads((prev) =>
      prev.includes(id)
        ? prev.filter((leadId) => leadId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedLeads(checked ? sortedLeads.map((lead) => lead.id) : []);
  };

  const handleKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>,
    id: string,
    field: keyof Lead,
    value: string
  ) => {
    if (e.key === "Escape") {
      setEditingCell(null);
      return;
    }

    if (e.key === "Enter") {
      try {
        const success = await handleUpdateLead(id, { [field]: value });
        if (success) {
          setEditingCell(null);
        }
      } catch (error) {
        toast({
          title: "Error updating lead",
          description: error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        });
      }
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      try {
        // Calculate next cell position
        const editableFields = Object.keys(FIELD_MAPPINGS).filter(
          (f) => !NON_EDITABLE_FIELDS.includes(f)
        );
        const currentLeadIndex = sortedLeads.findIndex((l) => l.id === id);
        const currentFieldIndex = editableFields.indexOf(field);
        const nextFieldIndex = e.shiftKey ? currentFieldIndex - 1 : currentFieldIndex + 1;

        let nextCell: EditingCell | null = null;

        if (e.shiftKey) {
          // Going backwards
          if (nextFieldIndex >= 0) {
            // Move to previous field in same row
            nextCell = { id, field: editableFields[nextFieldIndex] as keyof Lead };
          } else if (currentLeadIndex > 0) {
            // Move to last field of previous row
            nextCell = {
              id: sortedLeads[currentLeadIndex - 1].id,
              field: editableFields[editableFields.length - 1] as keyof Lead
            };
          }
        } else {
          // Going forwards
          if (nextFieldIndex < editableFields.length) {
            // Move to next field in same row
            nextCell = { id, field: editableFields[nextFieldIndex] as keyof Lead };
          } else if (currentLeadIndex < sortedLeads.length - 1) {
            // Move to first field of next row
            nextCell = {
              id: sortedLeads[currentLeadIndex + 1].id,
              field: editableFields[0] as keyof Lead
            };
          }
        }

        // If we have a next cell, move to it
        if (nextCell) {
          // Use requestAnimationFrame to ensure DOM updates are complete
          requestAnimationFrame(() => {
            setEditingCell(nextCell);
          });
        }
      } catch (error) {
        toast({
          title: "Error moving to next cell",
          description: error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            ref={fileInputRef}
          />
          <Button variant="outline" onClick={handleManualRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setIsAddingLead(true)}>
            Add Lead
          </Button>
          <Button onClick={() => fileInputRef.current?.click()}>
            Import CSV
          </Button>
        </div>
        {selectedLeads.length > 0 && (
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="destructive">
                  {selectedLeads.length === 1 ? 'Actions' : 'Bulk Actions'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleBulkStatusUpdate("pending")}>
                  Set to Pending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusUpdate("calling")}>
                  Set to Calling
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusUpdate("no_answer")}>
                  Set to No Answer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusUpdate("scheduled")}>
                  Set to Scheduled
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusUpdate("not_interested")}>
                  Set to Not Interested
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-red-600"
                >
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <LeadTableHeader
            onSelectAll={handleSelectAll}
            allSelected={
              sortedLeads.length > 0 &&
              sortedLeads.every((lead) => selectedLeads.includes(lead.id))
            }
            sortState={sortState}
            onSort={handleSort}
            hasLeads={sortedLeads.length > 0}
          />
          <LeadTableBody
            leads={sortedLeads}
            selectedLeads={selectedLeads}
            editingCell={editingCell}
            onToggleLead={toggleLead}
            onEdit={async (id, field, value) => {
              const success = await handleUpdateLead(id, { [field]: value });
              if (success) {
                setEditingCell(null);
              }
            }}
            onStartEdit={(id, field) => {
              if (id && field) {
                setEditingCell({ id, field });
              } else {
                setEditingCell(null);
              }
            }}
            onKeyDown={handleKeyDown}
            setEditingCell={setEditingCell}
          />
        </Table>
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(totalRecords / pageSize)}
        pageSize={pageSize}
        totalRecords={totalRecords}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1); // Reset to first page when changing page size
        }}
      />
      {selectedLeads.length > 0 && (
        <div className="bg-muted mt-4 p-2 rounded-md flex items-center justify-between">
          <span className="text-sm font-medium">{selectedLeads.length} record{selectedLeads.length === 1 ? '' : 's'} selected</span>
          <Button variant="ghost" size="sm" onClick={() => setSelectedLeads([])}>Clear selection</Button>
        </div>
      )}
      <LeadFormDialog
        open={isAddingLead}
        onOpenChange={setIsAddingLead}
        onSubmit={handleAddLead}
      />

      <CSVPreviewDialog
        previewData={csvPreviewData}
        onConfirm={handleCSVImport}
        onCancel={() => setShowCSVPreview(false)}
        open={showCSVPreview}
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              {selectedLeads.length} selected lead(s).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLeads}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
