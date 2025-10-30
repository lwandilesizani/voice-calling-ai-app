# Next.js 15 API Patterns and Best Practices

## Dynamic API Handling

In Next.js 15, several APIs have been made asynchronous to improve performance and reliability. This document outlines the patterns we use to handle these changes.

### Async Parameters in Route Handlers

When working with dynamic route parameters (e.g., `[id]`), you must await the params before accessing their properties:

```typescript
// ❌ Wrong - Will trigger warning
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = params  // Direct access is not allowed
}

// ✅ Correct - Properly awaited
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = await Promise.resolve(params)
}
```

### Cookie Handling

Cookies must also be accessed asynchronously:

```typescript
// ❌ Wrong - Will trigger warning
const cookieStore = cookies()

// ✅ Correct - Properly awaited
const cookieStore = await cookies()
```

### Complete Route Handler Example

Here's a complete example of a route handler following Next.js 15 best practices:

```typescript
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/lib/supabase/types'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    // 1. Handle cookies asynchronously
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    // 2. Authentication check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 3. Access params asynchronously
    const { id } = await Promise.resolve(params)
    
    // 4. Process the request
    const updates = await request.json()
    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()

    // 5. Handle response
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
```

## Common Patterns

1. **Always wrap route handlers in try-catch blocks** for comprehensive error handling
2. **Await all dynamic APIs** (params, cookies, headers) before using their properties
3. **Type your Supabase client** using the Database type for better type safety
4. **Return appropriate HTTP status codes** with error messages
5. **Use NextResponse.json()** for consistent response formatting

## Related Resources

- [Next.js 15 Dynamic APIs Documentation](https://nextjs.org/docs/messages/sync-dynamic-apis)
- [Next.js Route Handlers Guide](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Supabase Auth Helpers for Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
