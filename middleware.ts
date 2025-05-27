import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware' // Adjust path if needed
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  // Update user's session
  const response = await updateSession(request);

  const supabaseMiddlewareClient = createServerClient( // From lib/supabase/middleware, slightly different setup
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        // No need for set/remove in this specific middleware client instance if only reading auth state
      },
    }
  );

  const { data: { user } } = await supabaseMiddlewareClient.auth.getUser();

  const { pathname } = request.nextUrl;

  // Auth routes
  if (['/login', '/signup'].includes(pathname)) {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return response;
  }

  // Protected routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/mocks/new')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/v1/mock/ (public mock serving API)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/v1/mock).*)',
  ],
}