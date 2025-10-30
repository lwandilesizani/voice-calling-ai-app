'use client';

import { LeadTable } from './lead-table';
import type { Lead } from '@/lib/supabase/types';

export function ClientLeadTable({ initialLeads }: { initialLeads: Lead[] }) {
  return <LeadTable initialLeads={initialLeads} />;
}
