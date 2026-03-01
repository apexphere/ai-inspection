import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps): Promise<React.ReactElement> {
  const session = await auth();

  // @ts-expect-error isAdmin is added via extended session
  if (!session?.isAdmin) {
    redirect('/');
  }

  return <>{children}</>;
}
