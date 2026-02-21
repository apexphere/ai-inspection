/**
 * NextAuth Configuration — Issue #181, #339
 *
 * Handles authentication via API credentials provider.
 * Stores API token in JWT for authenticated API calls.
 */

import type { NextAuthConfig, Session, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import Credentials from 'next-auth/providers/credentials';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Extended types for API token
interface ExtendedUser extends User {
  apiToken?: string;
}

interface ExtendedJWT extends JWT {
  apiToken?: string;
}

interface ExtendedSession extends Session {
  apiToken?: string;
}

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<ExtendedUser | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Call API to validate credentials
          const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            return null;
          }

          const data = await response.json();

          if (data.user && data.token) {
            return {
              id: data.user.id,
              email: data.user.email,
              apiToken: data.token, // Store API token for authenticated requests
            };
          }

          return null;
        } catch {
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours — matches API token expiry
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith('/login');
      const isOnRegister = nextUrl.pathname.startsWith('/register');
      const isPublic = isOnLogin || isOnRegister;

      if (isPublic) {
        if (isLoggedIn) {
          // Redirect to inspections if already logged in
          return Response.redirect(new URL('/inspections', nextUrl));
        }
        return true;
      }

      // Require auth for all other routes
      if (!isLoggedIn) {
        return Response.redirect(new URL('/login', nextUrl));
      }

      return true;
    },
    jwt({ token, user }): ExtendedJWT {
      if (user) {
        const extUser = user as ExtendedUser;
        token.id = extUser.id;
        token.email = extUser.email;
        token.apiToken = extUser.apiToken; // Persist API token in JWT
      }
      return token as ExtendedJWT;
    },
    session({ session, token }): ExtendedSession {
      const extToken = token as ExtendedJWT;
      const extSession = session as ExtendedSession;
      
      if (extToken && extSession.user) {
        extSession.user.id = extToken.id as string;
        extSession.user.email = extToken.email as string;
      }
      // Add apiToken to session for authenticated API calls
      if (extToken.apiToken) {
        extSession.apiToken = extToken.apiToken;
      }
      return extSession;
    },
  },
};
