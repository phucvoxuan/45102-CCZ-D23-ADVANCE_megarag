import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/admin',
  '/system-admin',
  '/documents',
  '/chat',
  '/settings',
  '/profile',
];

// Routes that should redirect to dashboard if already logged in
const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];

// Public routes (no auth required)
const publicRoutes = ['/', '/pricing', '/about', '/terms', '/privacy'];

// API routes that should be protected
const protectedApiRoutes = [
  '/api/documents',
  '/api/chat',
  '/api/profile',
  '/api/settings',
];

// Public API routes
const publicApiRoutes = [
  '/api/auth',
  '/api/v1', // v1 API uses API key auth, not session auth
  '/api/admin/login',
  '/api/admin/register',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') // Static files like .css, .js, .png, etc.
  ) {
    return NextResponse.next();
  }

  // CRITICAL: Skip middleware for upload routes to avoid body size limit
  // Middleware buffers request body which causes "Request body exceeded 10MB" error
  // Authentication is handled directly in the upload route handler
  if (pathname.startsWith('/api/upload')) {
    return NextResponse.next();
  }

  // Update session (refresh token if needed)
  const { user, supabaseResponse } = await updateSession(request);

  // Check if it's an API route
  if (pathname.startsWith('/api')) {
    // Allow public API routes
    if (publicApiRoutes.some((route) => pathname.startsWith(route))) {
      return supabaseResponse;
    }

    // Check protected API routes
    if (protectedApiRoutes.some((route) => pathname.startsWith(route))) {
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    return supabaseResponse;
  }

  // Handle auth routes (login, signup, etc.)
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (user) {
      // Already logged in, redirect to dashboard
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/dashboard';
      return NextResponse.redirect(redirectUrl);
    }
    return supabaseResponse;
  }

  // Handle protected routes
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!user) {
      // Not logged in, redirect to login with return URL
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return supabaseResponse;
  }

  // Public routes and everything else
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     * - /api/upload (file upload routes - to avoid body size buffering)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/upload|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
