import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { VersionBadge } from "@/components/version-badge";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Inspection",
  description: "AI-powered building inspection assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <AppHeader />
            <main className="mx-auto max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
              {children}
            </main>
            <footer className="border-t border-gray-200 bg-white py-4">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-right">
                <VersionBadge />
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
