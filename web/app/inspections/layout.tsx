'use client';

import { AuthGuard } from '@/components';

export default function InspectionsLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <AuthGuard>{children}</AuthGuard>;
}
