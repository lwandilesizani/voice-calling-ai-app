# AI Dialer Architecture

## System Overview
The AI Dialer is a proof-of-concept system designed to demonstrate automated outbound calling capabilities using AI-powered voice technology. The system manages leads, schedules calls, and handles appointment booking through an autonomous voice agent.

## Technical Architecture

### Frontend Layer
- **Framework**: Next.js 15.0.3 with App Router
- **Key Components**:
  - Lead Management Table (with sorting, filtering, and batch actions)
  - Automation Control Panel (with real-time status updates)
  - Real-time Status Updates
  - CSV Import Interface
  - Settings Configuration UI (API keys, automation settings, email templates)
  - Theme Support (light/dark mode with system preference)

### Database Layer
- **Platform**: Supabase Postgres
- **Client Strategy**:
  - Frontend: Uses `createBrowserClient()` from `@supabase/ssr` for authenticated user operations
  - Server (API Routes): Uses `createRouteHandlerClient()` for route handlers
  - Service Role: Uses `createServiceClient()` for privileged operations (cron jobs)
  - Authentication handled via Supabase Auth and Next.js middleware
  - Row Level Security (RLS) policies enforce access control

- **Services Layer**:
  - Structure:
    ```
    /src/lib/
    ├── services/
    │   ├── leads.ts       # Lead management operations
    │   ├── settings.ts    # System settings and automation config
    │   ├── call-logs.ts   # Call history and reporting
    │   └── email.ts       # Email notifications via Resend
    ├── supabase/
    │   ├── client.ts      # Browser-side Supabase client
    │   ├── server.ts      # Server-side route handler client
    │   ├── service.ts     # Service-role operations (bypasses RLS)
    │   └── types.ts       # Supabase database type definitions
    ├── cal.ts            # Cal.com API integration
    ├── types.ts          # Shared type definitions
    └── utils.ts          # Shared utilities
    ```
  - Each service encapsulates:
    - Database operations
    - Business logic
    - Error handling
    - Type definitions

- **Schema**:
  - `leads` table:
    - `id`: UUID (primary key, default: uuid_generate_v4())
    - `company_name`: text (not null)
    - `contact_name`: text (not null)
    - `phone`: text (not null)
    - `email`: text (not null)
    - `status`: lead_status enum ('pending', 'calling', 'no_answer', 'scheduled', 'not_interested', 'error')
    - `call_attempts`: integer (default: 0)
    - `timezone`: text (default: 'America/Los_Angeles')
    - `last_called_at`: timestamp with time zone
    - `cal_booking_uid`: text (unique)
    - `follow_up_email_sent`: boolean (default: false)
    - `created_at`: timestamp with time zone (default: now())
    - `updated_at`: timestamp with time zone (default: now())
    - Indexes:
      - idx_leads_status on status
      - idx_leads_last_called_at on last_called_at
      - idx_leads_cal_booking_uid on cal_booking_uid
  
  - `settings` table:
    - `id`: UUID (primary key, default: gen_random_uuid())
    - `automation_enabled`: boolean (default: false)
    - `max_calls_batch`: integer (default: 10)
    - `retry_interval`: integer (default: 15)
    - `max_attempts`: integer (default: 3)
    - `created_at`: timestamp with time zone (default: now())
    - `updated_at`: timestamp with time zone (default: now())

  - `call_logs` table:
    - `id`: UUID (primary key, default: gen_random_uuid())
    - `lead_id`: UUID (references leads.id)
    - `vapi_call_id`: text (not null)
    - `initial_response`: jsonb
    - `report`: jsonb
    - `initiated_at`: timestamp with time zone
    - `ended_at`: timestamp with time zone
    - `ended_reason`: text
    - `recording_url`: text
    - `stereo_recording_url`: text
    - `duration_seconds`: integer
    - `cost`: numeric
    - `created_at`: timestamp with time zone (default: now())
    - `updated_at`: timestamp with time zone (default: now())
    - Indexes:
      - idx_call_logs_lead_id on lead_id
      - idx_call_logs_vapi_call_id on vapi_call_id

### Integration Layer
- **VAPI.ai Integration**
  - Configuration:
    ```
    /vapi/
    ├── assistant_config.json    # Main assistant configuration
    ├── tools/                   # VAPI tool definitions
    │   ├── check_availability.json
    │   └── book_appointment.json
    ├── prompts/                 # Conversation prompts
    │   ├── system.txt          # System context
    │   ├── first_message.txt   # Initial greeting
    │   └── end_call.txt        # Call conclusion
    └── publish-vapi-config.js   # Config deployment script
    ```
  - Integration Flow:
    1. VAPI Flow:
       - VAPI agent initiates outbound call
       - Agent follows conversation flow based on prompts
       - Agent interacts with tools for scheduling
       - Call outcomes logged to call_logs table

    2. Cal.com Flow:
       - Integration with Cal.com API for availability check
       - Handles appointment creation and management
       - Updates appointment status in database
       - Triggers email notifications via Resend

- **Email Integration (Resend)**
  - Handles all email communications:
    - Appointment confirmations
    - Follow-up emails for missed calls
    - Not interested follow-ups
  - Email templates customizable via settings

### Automation Layer
- **Vercel Cron Jobs**
  - 5-minute interval scheduling
  - Lead qualification logic:
    ```sql
    SELECT * FROM leads 
    WHERE status = 'pending'
      AND (last_called_at IS NULL OR last_called_at < now() - interval '15 minutes')
      AND call_attempts < 3
    ORDER BY last_called_at ASC NULLS FIRST
    LIMIT 10;
    ```
  - Status transition flow:
    ```
    pending -> calling -> (no_answer | scheduled | not_interested)
    ```
  - Rate limiting (10 leads per run)
  - Error handling and retry logic

## Data Flow

1. **Lead Ingestion**
   ```
   CSV Import/Manual Entry -> Supabase leads table -> Real-time UI update
   ```

2. **Automated Calling**
   ```
   Vercel Cron -> Lead Selection -> VAPI Call -> Call Logs -> Status Update -> Email Follow-up
   ```

3. **Appointment Booking**
   ```
   Successful Call -> Cal.com Scheduling -> Appointment Creation -> Email Confirmation -> Lead Status Update
   ```

## Security Considerations
- Authentication implemented via Supabase Auth and Next.js middleware
- Middleware protection for API routes:
  - All `/api/*` routes require authentication except:
    - `/api/cron` (protected by CRON_SECRET)
    - `/api/integrations/vapi` (protected by VAPI_SECRET_KEY)
- Row Level Security (RLS) policies ensure data isolation
- Secure environment variables for all integration keys
- CORS configuration in middleware.ts
- API route protection via Next.js middleware

## Monitoring
- Real-time lead status tracking
- Automation system status monitoring
- Call attempt tracking and logging
- Success rate metrics
- Cost tracking per call
- Call recording access
