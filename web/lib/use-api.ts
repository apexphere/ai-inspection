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

// Extended session type with apiToken
interface ExtendedSession {
  apiToken?: string;
}

export function useApi() {
  const { data: session } = useSession();
  const extSession = session as ExtendedSession | null;
  
  const api = useMemo(() => {
    return createApiClient(extSession?.apiToken);
  }, [extSession?.apiToken]);

  return api;
}

/**
 * Hook to get just the API token from session
 */
export function useApiToken(): string | undefined {
  const { data: session } = useSession();
  const extSession = session as ExtendedSession | null;
  return extSession?.apiToken;
}
