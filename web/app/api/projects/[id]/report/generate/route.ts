import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getApiUrl } from '@/lib/api-url';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = (await auth()) as { apiToken?: string } | null;
  const token = session?.apiToken;

  const res = await fetch(`${getApiUrl()}/api/projects/${id}/report/generate`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' },
  });
}
