import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getApiUrl } from '@/lib/api-url';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = (await auth()) as { apiToken?: string } | null;
  const token = session?.apiToken;

  const res = await fetch(`${getApiUrl()}/api/reports/${id}/download`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });

  const contentType = res.headers.get('content-type') || 'application/pdf';
  const disposition = res.headers.get('content-disposition') || `inline; filename=\"${id}.pdf\"`;
  const body = await res.arrayBuffer();

  return new NextResponse(body, {
    status: res.status,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': disposition,
    },
  });
}
