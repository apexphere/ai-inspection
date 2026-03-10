'use client';
import { getApiUrl } from '@/lib/api-url';

import { useState, useCallback } from 'react';
import { CollapsibleSection } from '@/components/collapsible-section';

const API_URL = getApiUrl();

type BuildingHistoryType =
  | 'BUILDING_PERMIT'
  | 'BUILDING_CONSENT'
  | 'CCC'
  | 'COA'
  | 'RESOURCE_CONSENT'
  | 'OTHER';

type BuildingHistoryStatus =
  | 'ISSUED'
  | 'LAPSED'
  | 'CANCELLED'
  | 'COMPLETE'
  | 'UNKNOWN';

export interface BuildingHistoryEntry {
  id: string;
  type: BuildingHistoryType;
  reference: string;
  year: number;
  status: BuildingHistoryStatus;
  description: string | null;
  issuer: string | null;
  issuedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface BuildingHistorySectionProps {
  propertyId: string;
  initialEntries: BuildingHistoryEntry[];
}

const TYPE_LABELS: Record<BuildingHistoryType, string> = {
  BUILDING_PERMIT: 'Building Permit',
  BUILDING_CONSENT: 'Building Consent',
  CCC: 'Code Compliance Certificate',
  COA: 'Certificate of Acceptance',
  RESOURCE_CONSENT: 'Resource Consent',
  OTHER: 'Other',
};

const STATUS_LABELS: Record<BuildingHistoryStatus, string> = {
  ISSUED: 'Issued',
  LAPSED: 'Lapsed',
  CANCELLED: 'Cancelled',
  COMPLETE: 'Complete',
  UNKNOWN: 'Unknown',
};

const TYPE_OPTIONS: BuildingHistoryType[] = [
  'BUILDING_PERMIT',
  'BUILDING_CONSENT',
  'CCC',
  'COA',
  'RESOURCE_CONSENT',
  'OTHER',
];

const STATUS_OPTIONS: BuildingHistoryStatus[] = [
  'ISSUED',
  'LAPSED',
  'CANCELLED',
  'COMPLETE',
  'UNKNOWN',
];

const CURRENT_YEAR = new Date().getFullYear();

interface EntryFormValues {
  type: BuildingHistoryType;
  reference: string;
  year: string;
  status: BuildingHistoryStatus;
  description: string;
  issuer: string;
}

const EMPTY_FORM: EntryFormValues = {
  type: 'BUILDING_CONSENT',
  reference: '',
  year: String(CURRENT_YEAR),
  status: 'ISSUED',
  description: '',
  issuer: '',
};

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT_CLS =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

function EntryForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: EntryFormValues;
  onSave: (values: EntryFormValues) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}): React.ReactElement {
  const [values, setValues] = useState<EntryFormValues>(initial);
  const [error, setError] = useState<string | null>(null);

  const set = useCallback(
    (field: keyof EntryFormValues) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setValues((prev) => ({ ...prev, [field]: e.target.value }));
      },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      if (!values.reference.trim()) {
        setError('Reference is required.');
        return;
      }
      const yr = parseInt(values.year, 10);
      if (isNaN(yr) || yr < 1800 || yr > CURRENT_YEAR + 1) {
        setError('Enter a valid year.');
        return;
      }
      try {
        await onSave(values);
      } catch {
        setError('Failed to save. Please try again.');
      }
    },
    [values, onSave]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Type" required>
          <select value={values.type} onChange={set('type')} className={INPUT_CLS}>
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Reference / Number" required>
          <input
            type="text"
            value={values.reference}
            onChange={set('reference')}
            placeholder="e.g. BA/05236/02"
            className={INPUT_CLS}
          />
        </FormField>

        <FormField label="Year" required>
          <input
            type="number"
            value={values.year}
            onChange={set('year')}
            min={1800}
            max={CURRENT_YEAR + 1}
            className={INPUT_CLS}
          />
        </FormField>

        <FormField label="Status">
          <select value={values.status} onChange={set('status')} className={INPUT_CLS}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Issuer">
          <input
            type="text"
            value={values.issuer}
            onChange={set('issuer')}
            placeholder="e.g. Auckland Council"
            className={INPUT_CLS}
          />
        </FormField>
      </div>

      <FormField label="Description">
        <textarea
          value={values.description}
          onChange={set('description')}
          rows={2}
          placeholder="e.g. Ground floor extension + exterior decks"
          className={INPUT_CLS}
        />
      </FormField>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

function EntryRow({
  entry,
  onEdit,
  onDelete,
}: {
  entry: BuildingHistoryEntry;
  onEdit: (entry: BuildingHistoryEntry) => void;
  onDelete: (id: string) => void;
}): React.ReactElement {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-900">
            {TYPE_LABELS[entry.type]}
          </span>
          <span className="text-xs text-gray-500">#{entry.reference}</span>
          <span className="text-xs text-gray-500">{entry.year}</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              entry.status === 'ISSUED' || entry.status === 'COMPLETE'
                ? 'bg-green-100 text-green-700'
                : entry.status === 'LAPSED' || entry.status === 'CANCELLED'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {STATUS_LABELS[entry.status]}
          </span>
        </div>
        {(entry.description || entry.issuer) && (
          <p className="text-sm text-gray-600 mt-0.5 truncate">
            {[entry.issuer, entry.description].filter(Boolean).join(' — ')}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {confirming ? (
          <>
            <span className="text-xs text-gray-600">Delete?</span>
            <button
              onClick={() => onDelete(entry.id)}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              No
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onEdit(entry)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Edit
            </button>
            <button
              onClick={() => setConfirming(true)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function BuildingHistorySection({
  propertyId,
  initialEntries,
}: BuildingHistorySectionProps): React.ReactElement {
  const [entries, setEntries] = useState<BuildingHistoryEntry[]>(initialEntries);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Sort by year descending
  const sorted = [...entries].sort((a, b) => b.year - a.year || b.sortOrder - a.sortOrder);

  const handleAdd = useCallback(
    async (values: EntryFormValues) => {
      setSaving(true);
      try {
        const res = await fetch(`${API_URL}/api/properties/${propertyId}/history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            type: values.type,
            reference: values.reference.trim(),
            year: parseInt(values.year, 10),
            status: values.status,
            description: values.description.trim() || undefined,
            issuer: values.issuer.trim() || undefined,
          }),
        });
        if (!res.ok) throw new Error('API error');
        const created = (await res.json()) as BuildingHistoryEntry;
        setEntries((prev) => [...prev, created]);
        setAdding(false);
      } finally {
        setSaving(false);
      }
    },
    [propertyId]
  );

  const handleEdit = useCallback(
    async (id: string, values: EntryFormValues) => {
      setSaving(true);
      try {
        const res = await fetch(`${API_URL}/api/building-history/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            type: values.type,
            reference: values.reference.trim(),
            year: parseInt(values.year, 10),
            status: values.status,
            description: values.description.trim() || null,
            issuer: values.issuer.trim() || null,
          }),
        });
        if (!res.ok) throw new Error('API error');
        const updated = (await res.json()) as BuildingHistoryEntry;
        setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
        setEditingId(null);
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const handleDelete = useCallback(async (id: string) => {
    const res = await fetch(`${API_URL}/api/building-history/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }
  }, []);

  const startEdit = useCallback((entry: BuildingHistoryEntry) => {
    setAdding(false);
    setEditingId(entry.id);
  }, []);

  const entryToForm = (entry: BuildingHistoryEntry): EntryFormValues => ({
    type: entry.type,
    reference: entry.reference,
    year: String(entry.year),
    status: entry.status,
    description: entry.description ?? '',
    issuer: entry.issuer ?? '',
  });

  return (
    <CollapsibleSection
      id="building-history"
      title="Building History"
      completionStatus={entries.length > 0 ? `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}` : undefined}
    >
      <div className="space-y-1">
        {sorted.length === 0 && !adding && (
          <p className="text-sm text-gray-500 py-2">No building history entries yet.</p>
        )}

        {sorted.map((entry) =>
          editingId === entry.id ? (
            <div key={entry.id} className="mb-2">
              <EntryForm
                initial={entryToForm(entry)}
                onSave={(values) => handleEdit(entry.id, values)}
                onCancel={() => setEditingId(null)}
                saving={saving}
              />
            </div>
          ) : (
            <EntryRow
              key={entry.id}
              entry={entry}
              onEdit={startEdit}
              onDelete={handleDelete}
            />
          )
        )}

        {adding && (
          <div className="mt-2">
            <EntryForm
              initial={EMPTY_FORM}
              onSave={handleAdd}
              onCancel={() => setAdding(false)}
              saving={saving}
            />
          </div>
        )}

        {!adding && editingId === null && (
          <div className="pt-2">
            <button
              onClick={() => setAdding(true)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              <span>+</span> Add entry
            </button>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}
