import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

// Routes that don't require authentication
const publicRoutes = ['/auth/signin', '/auth/signup', '/api/auth'];

// Check if a path matches any public route
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
}

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isPublic = isPublicRoute(nextUrl.pathname);
  const isApiRoute = nextUrl.pathname.startsWith('/api/');
  
  // Allow public routes
  if (isPublic) {
    // Redirect logged-in users away from signin page
    if (isLoggedIn && nextUrl.pathname === '/auth/signin') {
      return NextResponse.redirect(new URL('/', nextUrl));
    }
    return NextResponse.next();
  }
  
  // Protect API routes - return 401 instead of redirect
  if (isApiRoute && !isLoggedIn) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Redirect unauthenticated users to signin for page routes
  if (!isLoggedIn) {
    const signinUrl = new URL('/auth/signin', nextUrl);
    signinUrl.searchParams.set('callbackUrl', nextUrl.pathname);
    return NextResponse.redirect(signinUrl);
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
