/**
 * Returns the correct API URL depending on execution context.
 *
 * - Server-side (SSR/RSC): uses API_INTERNAL_URL if set (Docker internal hostname)
 *   so containers can talk to each other via the Docker network.
 * - Client-side (browser): always uses NEXT_PUBLIC_API_URL (host-accessible URL).
 */
export function getApiUrl(): string {
  // typeof window === 'undefined' means we are server-side
  if (typeof window === 'undefined') {
    return (
      process.env.API_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:3000'
    );
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
}
