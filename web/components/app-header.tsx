'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export function AppHeader(): React.ReactElement | null {
  const pathname = usePathname();
  const isProjectsActive = pathname.startsWith('/projects');
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const isAdmin = !!(session as { isAdmin?: boolean })?.isAdmin;
  const isLoading = status === 'loading';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">
              🔍 AI Inspection
            </span>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/projects"
                className={`text-sm font-medium hover:text-gray-900 ${isProjectsActive ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-600'}`}
              >
                Projects
              </Link>
              {isAdmin && (
                <Link
                  href="/admin/service-keys"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/profile"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {session?.user?.email}
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </button>
            </nav>
          )}

          {/* Mobile Menu Button */}
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                // X icon
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                // Hamburger icon
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Mobile Menu */}
        {isAuthenticated && mobileMenuOpen && (
          <nav className="md:hidden border-t border-gray-200 py-3 space-y-1">
            <Link
              href="/projects"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium hover:text-gray-900 hover:bg-gray-50 ${isProjectsActive ? 'text-gray-900 bg-gray-50' : 'text-gray-600'}`}
            >
              Projects
            </Link>
            {isAdmin && (
              <Link
                href="/admin/service-keys"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              >
                Admin
              </Link>
            )}
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              Profile
            </Link>
            <div className="px-3 py-2 text-sm text-gray-500">
              {session?.user?.email}
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              Sign Out
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
