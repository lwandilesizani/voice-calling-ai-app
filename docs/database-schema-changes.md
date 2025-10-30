# Database Schema Changes

This document outlines the process for making changes to the database schema in the AI Dialer project.

## Example: Adding Timezone Support

Here's a detailed walkthrough of how we added timezone support to the leads table. This serves as a template for future schema changes.

### 1. Database Changes

First, modify the database schema in `supabase/init.sql`:
```sql
create table leads (
  -- existing columns...
  timezone text default 'America/Los_Angeles',
  -- other columns...
);
```

### 2. TypeScript Types

Update the TypeScript types in `src/lib/supabase/types.ts`:
```typescript
export interface Database {
  public: {
    Tables: {
      leads: {
        Row: {
          // existing fields...
          timezone: string
          // other fields...
        }
        // ...
      }
    }
  }
}
```

### 3. Test Data

Update the test data in `supabase/test_data.csv` to include the new column:
```csv
company_name,contact_name,phone,email,timezone
"Company Name","Contact Name","+1-555-0123","email@example.com","America/New_York"
```

### 4. UI Components

1. Add the field to table constants in `src/components/lead-table/constants.ts`:
```typescript
export const FIELD_MAPPINGS = {
  // existing fields...
  timezone: "Timezone",
  // other fields...
} as const;
```

2. Update form types in `src/components/lead-table/types.ts`:
```typescript
export interface LeadFormState {
  // existing fields...
  timezone?: string;
}

export interface CSVPreviewData {
  // existing fields...
  timezone?: string;
}
```

3. Add the field to form components in `src/components/lead-table/lead-form-dialog.tsx`:
```typescript
<Select
  value={formData.timezone || "America/Los_Angeles"}
  onValueChange={(value) => setFormData({ ...formData, timezone: value })}
>
  <SelectTrigger>
    <SelectValue placeholder="Select timezone" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
    <SelectItem value="America/Phoenix">Arizona Time (AZ)</SelectItem>
  </SelectContent>
</Select>
```

### 5. System Integration

1. Update the system prompt in `vapi/prompts/system-prompt.md`:
```markdown
# [Call Information]
Current Date & Time: {{lead_datetime}}
Contact Timezone: {{lead_timezone}}
...
```

2. Add timezone support to VAPI route in `src/app/api/integrations/vapi/route.ts`:
```typescript
// Add timezone conversion helpers
function localToUTC(dateStr: string, timezone: string): string {
  const date = new Date(dateStr);
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const localDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  const diff = utcDate.getTime() - localDate.getTime();
  return new Date(date.getTime() + diff).toISOString();
}

function utcToLocal(dateStr: string, timezone: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', { timeZone: timezone });
}
```

3. Update VAPI tool definitions:
   - Add timezone parameter to `vapi/tools/check_availability.json`
   - Add timezone parameter to `vapi/tools/book_appointment.json`

### 6. Testing

1. Test the schema changes by running the Supabase initialization script
2. Test CSV imports with the new column
3. Test the UI for creating and editing leads with timezone
4. Test timezone conversion in calendar bookings
5. Test that the AI assistant correctly uses the timezone information

### Best Practices

1. Always provide a default value for new columns to ensure backward compatibility
2. Update all relevant TypeScript types to maintain type safety
3. Update test data to include the new field
4. Consider the impact on existing records and migrations
5. Test the changes thoroughly, especially date/time handling
6. Document any new environment variables or configuration changes
7. Update relevant documentation and API specifications

## Notes

- When dealing with timezones, always store them in IANA timezone format (e.g., 'America/Los_Angeles')
- For cal.com integration, convert times to UTC before sending and from UTC when receiving
- Consider adding database migrations for production deployments
- Always test timezone conversions across different timezone boundaries
