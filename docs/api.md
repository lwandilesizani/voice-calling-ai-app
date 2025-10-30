# API Documentation

## Authentication

All API endpoints require authentication via Supabase Auth except:
- `/api/cron` (requires CRON_SECRET)
- `/api/integrations/vapi` (requires VAPI_SECRET_KEY)

Unauthorized requests will receive:
```typescript
{
  error: "Unauthorized"
}
```

## Endpoints Overview

### Lead Management

#### GET `/api/leads`
Retrieves all leads from the system.

**Response:**
```typescript
[
  {
    id: string;
    company_name: string;
    contact_name: string;
    phone: string;
    email: string;
    status: 'pending' | 'calling' | 'no_answer' | 'scheduled' | 'not_interested' | 'error';
    call_attempts: number;
    timezone: string;
    last_called_at: string | null;
    cal_booking_uid: string | null;
    follow_up_email_sent: boolean;
    created_at: string;
    updated_at: string;
  }
]
```

#### POST `/api/leads`
Add new leads to the system. Accepts single lead or array of leads.

**Request Body:**
```typescript
{
  company_name: string;
  contact_name: string;
  phone: string;
  email: string;
  timezone?: string; // defaults to 'America/Los_Angeles'
}
```
or
```typescript
Array<{
  company_name: string;
  contact_name: string;
  phone: string;
  email: string;
  timezone?: string;
}>
```

**Response:**
```typescript
{
  data: Lead[] | null;
  error?: string;
}
```

#### POST `/api/leads/import`
Bulk import leads.

**Request Body:**
```typescript
Array<{
  company_name: string;
  contact_name: string;
  phone: string;
  email: string;
  timezone?: string;
}>
```

**Response:**
```typescript
{
  data: Lead[] | null;
  error?: string;
}
```

#### PUT `/api/leads/[id]`
Update lead details.

**Request Body:**
```typescript
{
  company_name?: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  status?: 'pending' | 'calling' | 'no_answer' | 'scheduled' | 'not_interested' | 'error';
  call_attempts?: number;
  timezone?: string;
  last_called_at?: string | null;
  cal_booking_uid?: string | null;
  follow_up_email_sent?: boolean;
}
```

#### DELETE `/api/leads/[id]`
Remove a lead from the system.

**Response:**
```typescript
{
  message: string;
  error?: string;
}
```

### Automation Control

#### GET `/api/automation/status`
Get current automation system status.

**Response:**
```typescript
{
  automation_enabled: boolean;
  max_calls_batch: number;
  retry_interval: number;
  max_attempts: number;
}
```

#### POST `/api/automation/toggle`
Enable or disable the automation system.

**Request Body:**
```typescript
{
  automation_enabled: boolean;
}
```

### Cron Job

#### GET `/api/cron`
Trigger the automation system to process pending leads.

**Authentication:**
```http
Authorization: Bearer YOUR_CRON_SECRET
```

**Response:**
```typescript
{
  message: string;
  summary?: {
    total: number;
    successful: number;
    failed: number;
  };
  details?: Array<{
    lead: Lead;
    success: boolean;
    callId?: string;
    error?: any;
  }>;
  error?: string;
}
```

### Integrations

#### VAPI Integration

##### POST `/api/integrations/vapi`
Endpoint for VAPI agent to interact with the system.

**Authentication:**
```http
x-vapi-secret: YOUR_VAPI_SECRET_KEY
```

**Request Body:**
```typescript
{
  message: {
    type: 'tool-calls' | 'end-of-call-report';
    toolCalls?: Array<{
      id: string;
      type: 'function';
      function: {
        name: 'check_availability' | 'book_appointment';
        arguments: Record<string, any>;
      };
    }>;
    endedReason?: string;
    transcript?: string;
    summary?: string;
    messages?: any[];
    call?: {
      id: string;
    };
  };
}
```

For `check_availability` function:
```typescript
{
  timezone: string;
}
```

For `book_appointment` function:
```typescript
{
  name: string;
  email: string;
  company: string;
  phone: string;
  timezone: string;
  notes?: string;
  startTime: string; // ISO string
}
```

**Response:**
```typescript
{
  results?: Array<{
    toolCallId: string;
    result: string;
  }>;
  error?: string;
}
```

## Error Handling

API errors follow this format:
```typescript
{
  error: string;
}
```

Common HTTP Status Codes:
- 200: Success
- 201: Created
- 401: Unauthorized
- 400: Bad Request
- 500: Internal Server Error
