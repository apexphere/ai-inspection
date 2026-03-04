'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function ReportActions({ projectId }: { projectId: string }) {
  const { data: session } = useSession();
  const token = (session as { apiToken?: string } | null)?.apiToken;

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generateReport() {
    setLoading(true);
    setError(null);
    setDownloadUrl(null);
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/report/generate`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to generate report (${res.status})`);
      }
      setStatus('PENDING');
      pollStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  }

  async function pollStatus() {
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/report/status`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data.status || 'PENDING');
      if (data.status === 'COMPLETED') {
        const reportId = data.reportId || data.jobId || null;
        if (reportId) {
          setDownloadUrl(`${API_URL}/api/reports/${reportId}/download`);
        }
        return;
      }
      if (data.status === 'FAILED') {
        setError(data.error || 'Report generation failed');
        return;
      }
      setTimeout(pollStatus, 2000);
    } catch {
      // ignore polling errors
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={generateReport}
        disabled={loading}
        className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? 'Generating…' : 'Generate PDF'}
      </button>
      {status && (
        <span className="text-xs text-gray-500">Status: {status}</span>
      )}
      {downloadUrl && (
        <a
          href={downloadUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-blue-600 hover:underline"
        >
          Download PDF
        </a>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
