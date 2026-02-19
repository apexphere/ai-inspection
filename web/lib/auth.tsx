'use client';

/**
 * NextAuth Session Provider Wrapper — Issue #181
 */

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  return <SessionProvider>{children}</SessionProvider>;
}
