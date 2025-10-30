# 🤖 We Call Smart - AI-Powered Business Communication Platform

A comprehensive SaaS platform that enables businesses to automate customer service and appointment booking using AI voice agents. Built with VAPI.ai, this platform provides 24/7 intelligent phone support that can handle bookings, answer questions, and manage customer interactions.

## What This Platform Does

**We Call Smart** empowers small businesses to provide enterprise-level customer service through AI automation:
- **AI Phone Receptionist**: Automated voice assistant that answers calls and books appointments
- **Service Management**: Complete system for managing business services and availability
- **Booking System**: Full appointment lifecycle management with email confirmations
- **Business Dashboard**: Centralized control panel for managing all aspects of the business
- **Multi-Provider Phone Numbers**: Support for VAPI, Twilio, or bring-your-own-number

## Key Features

### 🎤 AI Voice Assistant ("Ava")
- **Customizable AI Agent**: Configure voice, GPT model, temperature, and personality
- **Natural Conversations**: Handles complex booking flows with context awareness
- **Smart Booking Tools**: 6 integrated tools for managing appointments:
  - List services and pricing
  - Check real-time availability
  - Create and update bookings
  - Retrieve customer booking history
  - Get business information
- **Voice & Text Interface**: Phone calls via VAPI + web chat via LangChain
- **Testing Environment**: "Talk to Ava" page for real-time assistant testing

### 📞 Phone Number Management
- **Multi-Provider Support**: VAPI, Twilio, or custom SIP numbers
- **Area Code Selection**: Choose specific area codes for your business
- **Direct Assistant Linking**: Connect phone numbers to AI assistants
- **One-Click Provisioning**: Instant phone number setup

### 🏢 Business Profile Management
- Complete business information (name, type, contact details)
- Physical address and timezone configuration
- Branding and profile customization

### 💼 Service Management
- **CRUD Operations**: Create, edit, and delete services
- **Service Details**:
  - Name, description, category
  - Pricing and duration (minutes/hours)
  - Custom duration options
- **Availability Schedules**: Set specific availability per service
- **Real-time Updates**: Changes instantly reflected in AI assistant

### 📅 Booking System
- **Full Lifecycle Management**: Track bookings from creation to completion
- **Status Tracking**: Pending → Confirmed → Completed/Cancelled
- **Customer Information**: Capture name, email, phone for each booking
- **Automated Emails**: Dual confirmations to customer and business owner
- **Booking Details View**: Complete booking information with service details
- **Status Filters**: Easy filtering and search functionality
- **Email Retry System**: Automatic retry for failed email deliveries

### ⏰ Business Hours Configuration
- Set operating hours for each day of the week
- Visual calendar interface
- Timezone-aware scheduling
- Affects AI assistant availability responses

### 🚀 Guided Onboarding
Progressive 5-step setup wizard:
1. Business Profile setup
2. Business Hours configuration
3. Services creation
4. Phone Number provisioning
5. AI Assistant activation

Visual progress tracking ensures complete setup before going live.

### 🎨 Professional Landing Page
- Hero section with animated effects
- Feature showcase
- "How It Works" guide with screenshots
- Responsive design with mobile support
- Call-to-action for signup

## Project Structure

```
/src
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Landing page
│   ├── onboarding/        # Setup wizard
│   ├── business-profile/  # Business settings
│   ├── services/          # Service management
│   ├── bookings/          # Booking management
│   ├── business-hours/    # Hours configuration
│   ├── phone-numbers/     # Phone number management
│   ├── my-assistants/     # AI assistant configuration
│   ├── talk-to-ava/       # Voice assistant testing
│   └── api/               # API routes
│       ├── vapi/          # VAPI integration endpoints
│       │   ├── assistant/ # Assistant CRUD
│       │   ├── phone-numbers/ # Phone management
│       │   └── booking-tools/ # AI assistant tools
│       ├── booker/        # LangChain chat agent
│       └── webhooks/      # External service webhooks
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── booking/          # Booking-related components
│   └── assistant/        # AI assistant components
├── lib/
│   ├── services/         # Core business logic
│   ├── supabase/         # Database clients and types
│   └── utils.ts          # Shared utilities
└── middleware.ts         # Auth middleware

/vapi                     # VAPI configuration
├── prompts/             # Assistant prompt templates
├── tools/               # AI assistant tool definitions
└── publish-vapi-config.js # Assistant deployment script

/supabase                # Database
└── migrations/          # Database schema and migrations

/docs                    # Documentation
```

## Tech Stack

### Frontend
- **Framework**: Next.js 15.0.3 with App Router
- **UI Library**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS with custom animations
- **Theme**: Dark/light mode support via next-themes
- **State**: React hooks with real-time Supabase subscriptions

### Backend
- **API**: Next.js API Routes (serverless functions)
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth with JWT middleware
- **Voice AI**: VAPI.ai for voice synthesis and call handling
- **Text AI**: LangChain with OpenAI GPT models
- **Email**: Resend for transactional emails
- **Scheduling**: Vercel Cron for automated tasks

### Database Schema

**Core Tables:**
- `business_profiles` - Business information and settings
- `services` - Service offerings with pricing and duration
- `bookings` - Appointment bookings with customer details
- `service_availability` - Availability schedules per service
- `business_hours` - Operating hours per day
- `phone_numbers` - Managed phone numbers
- `assistant_configs` - AI assistant configurations
- `assistants` - Assistant records and templates
- `call_logs` - Call history and recordings (legacy)
- `leads` - Lead tracking (legacy/alternative flow)

## Getting Started

### Prerequisites

- **Node.js** 18+
- **pnpm** (`npm install -g pnpm`)
- **Supabase** account (database + auth)
- **VAPI.ai** account (voice AI)
- **Resend** account (email service)
- **OpenAI** API key (GPT models)

### Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Configure your environment variables (see `.env.example` for all required variables):

```env
# Database Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# VAPI Configuration
VAPI_API_KEY=your_vapi_api_key
VAPI_SECRET_KEY=your_vapi_webhook_secret
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_public_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Email Configuration (Resend)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=Your Business Name

# Application URLs
AI_DIALER_URL=https://your-domain.com

# Cron Configuration
CRON_SECRET=your_secure_random_string
```

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Database Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Run database migrations**:
   - Navigate to the SQL Editor in your Supabase dashboard
   - Execute the SQL files in `/supabase/migrations/` in order
   - Or use the Supabase CLI: `supabase db push`

3. **Verify setup**:
   - Check all tables exist in the Supabase dashboard
   - Confirm Row Level Security policies are enabled
   - Test authentication flow

### VAPI Setup

1. **Create a VAPI account** at [vapi.ai](https://vapi.ai)

2. **Get your API keys**:
   - API Key from VAPI dashboard
   - Generate a webhook secret for secure communication

3. **Configure webhooks**:
   - Set your application URL as the webhook endpoint
   - Format: `https://your-domain.com/api/vapi/booking-tools/`

4. **Create an assistant**:
   - Use the in-app assistant configuration page
   - Or run: `node vapi/publish-vapi-config.js`

### First Time Setup

After deployment, visit your application and:

1. **Sign up** for an account
2. **Complete the onboarding wizard**:
   - Set up your business profile
   - Configure business hours
   - Create your first service
   - Provision a phone number
   - Activate your AI assistant
3. **Test your assistant**: Use the "Talk to Ava" page
4. **Start receiving bookings**!

## How It Works

### Customer Journey

1. **Customer calls** your business phone number
2. **VAPI connects** to your AI assistant ("Ava")
3. **Assistant greets** and asks how they can help
4. **Customer requests** a service or appointment
5. **Assistant checks** real-time availability
6. **Assistant collects** necessary information (name, email, preferred time)
7. **Assistant confirms** all details with customer
8. **Booking created** in database
9. **Email confirmations** sent to both customer and business
10. **Business manages** booking through dashboard

### Technical Flow

```
Customer Phone Call
    ↓
VAPI Platform
    ↓
AI Assistant (GPT-4 + Custom Tools)
    ↓
Webhook API Routes (/api/vapi/booking-tools/*)
    ↓
Business Logic (Services)
    ↓
Supabase Database (PostgreSQL)
    ↓
Email Service (Resend)
    ↓
Business Dashboard (Real-time UI)
```

## AI Assistant Tools

The AI assistant has access to 6 server functions:

1. **`list_business_services`**: Retrieves all available services with pricing
2. **`get_business_info`**: Gets business details (name, hours, contact)
3. **`get_business_availability`**: Checks real-time availability for dates/times
4. **`book_business_service`**: Creates new bookings with customer info
5. **`get_customer_bookings`**: Retrieves existing bookings by email/phone
6. **`update_booking`**: Modifies or cancels existing bookings

Each tool is a webhook endpoint that:
- Authenticates the request
- Extracts business context
- Performs the operation
- Returns structured data to the AI

## API Routes

### VAPI Integration
- `POST /api/vapi/assistant` - Save assistant configuration
- `GET /api/vapi/assistant` - Fetch assistant config
- `PUT /api/vapi/assistant` - Activate assistant on VAPI
- `DELETE /api/vapi/assistant` - Deactivate assistant
- `POST /api/vapi/phone-numbers` - Provision phone number
- `GET /api/vapi/phone-numbers` - List phone numbers
- `DELETE /api/vapi/phone-numbers/[id]` - Release phone number

### Booking Tools (Webhooks)
- `POST /api/vapi/booking-tools/list_business_services`
- `POST /api/vapi/booking-tools/get_business_info`
- `POST /api/vapi/booking-tools/get_business_availability`
- `POST /api/vapi/booking-tools/book_business_service`
- `POST /api/vapi/booking-tools/get_customer_bookings`
- `POST /api/vapi/booking-tools/update_booking`

### Other
- `POST /api/booker` - LangChain chat agent (text interface)
- `POST /api/webhooks/resend-booking-emails` - Retry failed emails
- `GET /api/cron/retry-booking-emails` - Scheduled email retry

## Deployment

### Recommended: Vercel

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy!

Vercel automatically handles:
- Serverless functions for API routes
- Edge middleware for authentication
- Cron jobs for scheduled tasks

### Environment Variables

Ensure all variables from `.env.example` are configured in your deployment platform.

### Post-Deployment

1. Update `AI_DIALER_URL` to your production domain
2. Update VAPI webhook URLs to production endpoints
3. Configure Resend with your domain for email sending
4. Test the complete flow with a real phone call

## Documentation

- [Architecture Overview](docs/architecture.md) - System design and components
- [API Documentation](docs/api.md) - Detailed API reference
- [Cal.com Integration](docs/cal-integration.md) - Calendar integration guide
- [VAPI Tools](docs/vapi-tools-fix.md) - AI assistant tool configuration
- [Development Roadmap](docs/ROADMAP.md) - Future features and priorities

## Features in Detail

### Dual AI Interface
- **Voice**: VAPI-powered phone conversations with natural speech
- **Text**: LangChain-powered chat widget for web interactions

### Intelligent Booking
- Real-time availability calculation considering business hours
- Conflict detection prevents double-booking
- Timezone-aware scheduling
- Automatic email confirmations with retry logic

### Business Context Middleware
All VAPI tools automatically identify the calling business through:
- Assistant ID extraction from call metadata
- Database lookups for business context
- Secure authentication of webhook requests

### Email Automation
- HTML-formatted confirmation emails
- Dual emails: customer + business owner
- Retry mechanism for failed sends (cron job)
- Email status tracking in database

## Security Features

- **Row Level Security**: Supabase RLS ensures data isolation
- **JWT Authentication**: Secure session management
- **Webhook Verification**: VAPI secret validation
- **API Key Protection**: Server-side only keys
- **Environment Variables**: Sensitive data never in code

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

Built with ❤️ using Next.js, VAPI.ai, and Supabase
