/**
 * Auth Middleware — Issue #181
 * 
 * Protects routes using NextAuth.js
 */

export { auth as middleware } from '@/auth';

export const config = {
  // Match all routes except static files and API routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
