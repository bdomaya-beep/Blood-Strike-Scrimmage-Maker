import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = [
  '/events',
  '/scrims',
  '/clans',
  '/leaderboard',
  '/profile',
  '/notifications',
  '/announcements',
  '/streams',
];

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value;
  const pathname = request.nextUrl.pathname;

  // Check if the route requires authentication
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !accessToken) {
    // Redirect to login with return URL
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Allow auth routes when not authenticated
  if ((pathname === '/login' || pathname === '/register') && accessToken) {
    return NextResponse.redirect(new URL('/events', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|h/).*)',
  ],
};
