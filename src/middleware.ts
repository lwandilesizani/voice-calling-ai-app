import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Ensure environment variables are typed and validated
const requiredEnvs = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NODE_ENV'
] as const
requiredEnvs.forEach(env => {
  if (!process.env[env]) throw new Error(`Missing required environment variable: ${env}`)
})

// Define public routes as a constant set for O(1) lookup
const PUBLIC_ROUTES = new Set([
  '/',
  '/api/cron',
  '/api/integrations/vapi',
  '/login',
  '/signup'
])

// Define routes that require a business profile
const BUSINESS_PROFILE_REQUIRED_ROUTES = new Set([
  '/services',
  '/services/new',
  '/bookings'
])

export async function middleware(req: NextRequest) {
  // Early return for static assets and public files
  if (req.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)) {
    return NextResponse.next()
  }

  const res = NextResponse.next()
  
  // Create supabase server client with enhanced cookie security
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll().map(cookie => ({
          name: cookie.name,
          value: cookie.value,
        })),
        setAll: (cookiesList) => {
          cookiesList.forEach(({ name, value, ...options }) => {
            res.cookies.set({
              name,
              value,
              ...options,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              httpOnly: true,
              path: '/',
              maxAge: 7200 // 2 hours
            })
          })
        }
      }
    }
  )

  // Check if route is public before proceeding with auth
  if (PUBLIC_ROUTES.has(req.nextUrl.pathname)) {
    // Add security headers even for public routes
    addSecurityHeaders(res)
    return res
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    // Refresh session for authenticated users
    if (user) {
      const { error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
    }

    // Handle API authentication
    if ((!user || userError) && req.nextUrl.pathname.startsWith('/api/')) {
      return createAuthError(401, 'Unauthorized access')
    }

    // Redirect unauthenticated users to login
    if (!user || userError) {
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('returnTo', encodeURIComponent(req.nextUrl.pathname))
      return NextResponse.redirect(redirectUrl)
    }

    // Check if the route requires a business profile
    if (BUSINESS_PROFILE_REQUIRED_ROUTES.has(req.nextUrl.pathname) || 
        req.nextUrl.pathname.startsWith('/services/') || 
        req.nextUrl.pathname.startsWith('/bookings/')) {
      
      // Check if the user has a business profile
      const { data: businessProfile, error: profileError } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (profileError) throw profileError

      // If no business profile exists, redirect to the business profile page
      if (!businessProfile) {
        const redirectUrl = new URL('/business-profile', req.url)
        redirectUrl.searchParams.set('returnTo', encodeURIComponent(req.nextUrl.pathname))
        return NextResponse.redirect(redirectUrl)
      }
    }

    // Add security headers
    addSecurityHeaders(res)

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return createAuthError(500, 'Internal server error')
    }

    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('error', 'An unexpected error occurred')
    return NextResponse.redirect(redirectUrl)
  }
}

// Helper function to add security headers
function addSecurityHeaders(res: NextResponse) {
  const headers = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co wss://*.supabase.co;",
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  }

  Object.entries(headers).forEach(([key, value]) => {
    res.headers.set(key, value)
  })
}

// Helper function to create authentication error responses
function createAuthError(status: number, message: string) {
  return NextResponse.json(
    { error: message },
    { 
      status,
      headers: {
        'WWW-Authenticate': 'Bearer',
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache'
      }
    }
  )
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
