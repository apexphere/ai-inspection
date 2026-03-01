import { auth } from '@/auth';
import { ServiceKeysClient } from './service-keys-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface ServiceKey {
  id: string;
  name: string;
  actor: string;
  scopes: string[];
  keyPrefix: string;
  active: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export const metadata = { title: 'Service Keys | Admin | AI Inspection' };

async function getServiceKeys(token: string): Promise<ServiceKey[]> {
  const response = await fetch(`${API_URL}/api/admin/service-keys`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) return [];
  return response.json();
}

export default async function ServiceKeysPage(): Promise<React.ReactElement> {
  const session = await auth();
  // @ts-expect-error apiToken is added via extended session
  const token: string = session?.apiToken ?? '';

  const keys = await getServiceKeys(token);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <ServiceKeysClient initialKeys={keys} apiToken={token} />
    </div>
  );
}
