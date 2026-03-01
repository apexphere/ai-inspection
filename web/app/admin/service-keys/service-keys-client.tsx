'use client';

import { useState, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const AVAILABLE_SCOPES = [
  'inspections:read',
  'projects:read',
  'properties:read',
  'clients:read',
  'checklist:read',
  'clause-reviews:read',
  'building-code:read',
  'photos:read',
];

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

interface ServiceKeysClientProps {
  initialKeys: ServiceKey[];
  apiToken: string;
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ─── Key Reveal Modal ────────────────────────────────────────────────────────

function KeyRevealModal({
  keyValue,
  onClose,
}: {
  keyValue: string;
  onClose: () => void;
}): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(keyValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-green-600 text-xl">✅</span>
          <h2 className="text-lg font-semibold text-gray-900">Key Created</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Copy this key — it won&apos;t be shown again.
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-mono text-sm text-gray-900 break-all mb-4">
          {keyValue}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {copied ? '✓ Copied!' : '📋 Copy to clipboard'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Key Modal ────────────────────────────────────────────────────────

function CreateKeyModal({
  apiToken,
  onCreated,
  onClose,
}: {
  apiToken: string;
  onCreated: (key: ServiceKey, rawKey: string) => void;
  onClose: () => void;
}): React.ReactElement {
  const [name, setName] = useState('');
  const [actor, setActor] = useState('');
  const [scopes, setScopes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleScope = (scope: string): void => {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!name.trim() || !actor.trim() || scopes.length === 0) {
      setError('Name, actor, and at least one scope are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/admin/service-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({ name: name.trim(), actor: actor.trim(), scopes }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        setError(data.error ?? 'Failed to create key');
        return;
      }
      const data = await response.json() as ServiceKey & { key: string };
      onCreated(data, data.key);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Service Key</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. kai-agent"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Actor <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              placeholder="e.g. agent:kai"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scopes <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {AVAILABLE_SCOPES.map((scope) => (
                <label key={scope} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scopes.includes(scope)}
                    onChange={() => toggleScope(scope)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 font-mono">{scope}</span>
                </label>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating…' : 'Create Key'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Key Table Row ────────────────────────────────────────────────────────────

function KeyRow({
  serviceKey,
  apiToken,
  onDeactivated,
  onRegenerated,
}: {
  serviceKey: ServiceKey;
  apiToken: string;
  onDeactivated: (id: string) => void;
  onRegenerated: (key: ServiceKey, rawKey: string) => void;
}): React.ReactElement {
  const [confirmAction, setConfirmAction] = useState<'deactivate' | 'regenerate' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDeactivate = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/service-keys/${serviceKey.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${apiToken}` },
      });
      if (response.ok) onDeactivated(serviceKey.id);
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  const handleRegenerate = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/admin/service-keys/${serviceKey.id}/regenerate`,
        { method: 'POST', headers: { Authorization: `Bearer ${apiToken}` } }
      );
      if (response.ok) {
        const data = await response.json() as ServiceKey & { key: string };
        onRegenerated(data, data.key);
      }
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  return (
    <tr className="text-sm border-t border-gray-100">
      <td className="px-6 py-3 font-mono font-medium text-gray-900">{serviceKey.name}</td>
      <td className="py-3 pr-4 text-gray-600 font-mono text-xs">{serviceKey.actor}</td>
      <td className="py-3 pr-4">
        <span
          title={serviceKey.scopes.join(', ')}
          className="cursor-help text-gray-600 underline decoration-dotted"
        >
          {serviceKey.scopes.length}
        </span>
      </td>
      <td className="py-3 pr-4 text-gray-500">{formatRelativeTime(serviceKey.lastUsedAt)}</td>
      <td className="py-3 pr-4">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
            serviceKey.active ? 'text-green-700' : 'text-gray-400'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${serviceKey.active ? 'bg-green-500' : 'bg-gray-300'}`} />
          {serviceKey.active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="py-3 pr-6">
        {serviceKey.active && confirmAction === null && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setConfirmAction('regenerate')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              ↻ Regenerate
            </button>
            <button
              type="button"
              onClick={() => setConfirmAction('deactivate')}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Deactivate
            </button>
          </div>
        )}
        {serviceKey.active && confirmAction === 'deactivate' && (
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="text-gray-600">Deactivate &ldquo;{serviceKey.name}&rdquo;?</span>
            <button
              type="button"
              onClick={handleDeactivate}
              disabled={loading}
              className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
            >
              {loading ? '…' : 'Confirm'}
            </button>
            <button type="button" onClick={() => setConfirmAction(null)} className="text-gray-500 hover:text-gray-700">
              Cancel
            </button>
          </div>
        )}
        {serviceKey.active && confirmAction === 'regenerate' && (
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="text-gray-600">Old key stops working immediately.</span>
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={loading}
              className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
            >
              {loading ? '…' : 'Confirm'}
            </button>
            <button type="button" onClick={() => setConfirmAction(null)} className="text-gray-500 hover:text-gray-700">
              Cancel
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ServiceKeysClient({
  initialKeys,
  apiToken,
}: ServiceKeysClientProps): React.ReactElement {
  const [keys, setKeys] = useState<ServiceKey[]>(initialKeys);
  const [showCreate, setShowCreate] = useState(false);
  const [revealKey, setRevealKey] = useState<string | null>(null);

  const handleCreated = useCallback((newKey: ServiceKey, rawKey: string): void => {
    setKeys((prev) => [newKey, ...prev]);
    setShowCreate(false);
    setRevealKey(rawKey);
  }, []);

  const handleDeactivated = useCallback((id: string): void => {
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, active: false } : k)));
  }, []);

  const handleRegenerated = useCallback((newKey: ServiceKey, rawKey: string): void => {
    setKeys((prev) => [newKey, ...prev.filter((k) => k.id !== newKey.id)]);
    setRevealKey(rawKey);
  }, []);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Service Keys</h1>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          + Create Key
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {keys.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-500 italic text-center">No service keys yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th className="px-6 py-3">Name</th>
                  <th className="py-3 pr-4">Actor</th>
                  <th className="py-3 pr-4">Scopes</th>
                  <th className="py-3 pr-4">Last Used</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((key) => (
                  <KeyRow
                    key={key.id}
                    serviceKey={key}
                    apiToken={apiToken}
                    onDeactivated={handleDeactivated}
                    onRegenerated={handleRegenerated}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateKeyModal
          apiToken={apiToken}
          onCreated={handleCreated}
          onClose={() => setShowCreate(false)}
        />
      )}

      {revealKey && (
        <KeyRevealModal keyValue={revealKey} onClose={() => setRevealKey(null)} />
      )}
    </>
  );
}
