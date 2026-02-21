/**
 * useApi Hook — Issue #339
 *
 * Provides an authenticated API client using the session token.
 * Use this in client components for authenticated API calls.
 *
 * @example
 * const api = useApi();
 * const inspections = await api.inspections.list();
 */

'use client';

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { createApiClient } from './api';

export function useApi() {
  const { data: session } = useSession();
  
  const api = useMemo(() => {
    return createApiClient(session?.apiToken);
  }, [session?.apiToken]);

  return api;
}

/**
 * Hook to get just the API token from session
 */
export function useApiToken(): string | undefined {
  const { data: session } = useSession();
  return session?.apiToken;
}
