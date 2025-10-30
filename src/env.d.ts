declare namespace NodeJS {
  interface ProcessEnv {
    // VAPI Configuration
    VAPI_API_KEY: string;
    VAPI_AGENT_ID: string;
    VAPI_SECRET_KEY: string;      // Our generated API key for authenticating VAPI requests
    AI_DIALER_URL: string;     // Base URL for the application

    // Cal.com Configuration
    CALCOM_API_KEY: string;
    CALCOM_USER_ID: string;
    CALCOM_EVENT_TYPE_ID: string;
    CALCOM_EVENT_DURATION: string;

    // Database Configuration
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;

    // Email Configuration (Resend)
    RESEND_API_KEY: string;

    // Node Environment
    NODE_ENV: 'development' | 'production' | 'test';
  }
}
