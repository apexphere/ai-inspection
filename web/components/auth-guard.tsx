'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { LoadingPage } from './loading';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Auth Guard Component — Issue #181
 * 
 * Note: With NextAuth middleware, most routes are protected automatically.
 * This component provides additional client-side protection and loading states.
 */
export function AuthGuard({ children }: AuthGuardProps): React.ReactElement {
  const router = useRouter();
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    return <LoadingPage />;
  }

  return <>{children}</>;
}
