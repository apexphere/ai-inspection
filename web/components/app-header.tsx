'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export function AppHeader(): React.ReactElement | null {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';

  // Don't show header on login/register pages
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  // Don't show header while loading
  if (isLoading) {
    return null;
  }

  const handleLogout = async (): Promise<void> => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-900">
                🔍 AI Inspection
              </span>
            </Link>
            {isAuthenticated && (
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  href="/inspections"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Inspections
                </Link>
              </nav>
            )}
          </div>
          {isAuthenticated && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {session?.user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
