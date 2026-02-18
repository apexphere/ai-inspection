/**
 * Domain configuration from APP_DOMAIN env var
 * 
 * Usage: Set APP_DOMAIN=apexphere.co.nz in production
 * This generates cookie domain and CORS origins automatically.
 */

const APP_DOMAIN = process.env.APP_DOMAIN; // e.g., 'apexphere.co.nz'

/**
 * Cookie domain with leading dot for subdomain sharing
 * e.g., '.apexphere.co.nz'
 */
export const cookieDomain = APP_DOMAIN ? `.${APP_DOMAIN}` : undefined;

/**
 * Generate allowed CORS origins from APP_DOMAIN
 */
export function getAllowedOrigins(): (string | RegExp)[] {
  const origins: (string | RegExp)[] = [
    'http://localhost:3001',
    /^https:\/\/ai-inspection.*\.vercel\.app$/,  // Vercel preview/production URLs
  ];

  if (APP_DOMAIN) {
    // Add custom domain origins
    origins.push(`https://app-ai-inspection.${APP_DOMAIN}`);      // Production
    origins.push(`https://app-test-ai-inspection.${APP_DOMAIN}`); // Test
  }

  return origins;
}
