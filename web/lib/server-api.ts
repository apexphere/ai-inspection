/**
 * Server-side API helper
 *
 * Use this for ALL server-side fetches (RSC, generateMetadata, etc.).
 * Handles:
 *   - Correct API URL (API_INTERNAL_URL inside Docker, NEXT_PUBLIC_API_URL for local dev)
 *   - Auth token injection
 *   - Consistent error handling
 *
 * Usage:
 *   const token = await getServerToken();
 *   const project = await serverFetch<Project>(`/api/projects/${id}`, token);
 */

import { auth } from '@/auth';
import { getApiUrl } from '@/lib/api-url';

type Session = { apiToken?: string } | null;

/**
 * Extract API token from session. Call once at the top of your page/metadata fn.
 */
export async function getServerToken(): Promise<string | undefined> {
  const session = (await auth()) as Session;
  return session?.apiToken;
}

/**
 * Server-side fetch with auth token and correct base URL.
 * Returns null on 404, throws on other errors.
 */
export async function serverFetch<T>(
  path: string,
  token?: string,
  init?: RequestInit
): Promise<T | null> {
  const url = `${getApiUrl()}${path}`;
  const res = await fetch(url, {
    cache: 'no-store',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API error ${res.status} for ${path}`);
  if (res.status === 204) return null;
  return res.json() as Promise<T>;
}

/**
 * Server-side fetch that returns [] on failure (for list endpoints).
 */
export async function serverFetchList<T>(
  path: string,
  token?: string,
  init?: RequestInit
): Promise<T[]> {
  try {
    const result = await serverFetch<T[]>(path, token, init);
    return result ?? [];
  } catch {
    return [];
  }
}
