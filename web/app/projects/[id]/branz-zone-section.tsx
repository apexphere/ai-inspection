import { getApiUrl } from '@/lib/api-url';
'use client';

import { useState, useCallback } from 'react';
import { CollapsibleSection } from '@/components/collapsible-section';
import { SaveIndicator } from '@/components/save-indicator';
import { useAutoSave } from '@/hooks/use-auto-save';

const API_URL = getApiUrl();

interface BranzZoneData {
  climateZone: string;
  earthquakeZone: string;
  exposureZone: string;
  leeZone: string;
  rainfallRange: string;
  windRegion: string;
  windZone: string;
}

interface BranzZoneSectionProps {
  propertyId: string;
  initialData: BranzZoneData;
}

const CLIMATE_ZONE_OPTIONS = ['1', '2', '3'];
const EARTHQUAKE_ZONE_OPTIONS = ['Zone 1', 'Zone 2'];
const EXPOSURE_ZONE_OPTIONS = ['Zone A', 'Zone B', 'Zone C', 'Zone D'];
const LEE_ZONE_OPTIONS = ['Yes', 'No'];
const WIND_REGION_OPTIONS = ['A', 'W'];
const WIND_ZONE_OPTIONS = ['Low', 'Medium', 'High', 'Very High', 'Extra High'];

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}): React.ReactElement {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">— Select —</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}): React.ReactElement {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}

export function BranzZoneSection({
  propertyId,
  initialData,
}: BranzZoneSectionProps): React.ReactElement {
  const [data, setData] = useState<BranzZoneData>(initialData);

  const handleSave = useCallback(
    async (dataToSave: BranzZoneData): Promise<void> => {
      const response = await fetch(`${API_URL}/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(dataToSave),
      });
      if (!response.ok) {
        throw new Error(`Failed to save: ${response.status}`);
      }
    },
    [propertyId]
  );

  const { status, error, retry } = useAutoSave({
    data,
    onSave: handleSave,
    debounceMs: 800,
  });

  const updateField = useCallback(
    (field: keyof BranzZoneData) => (value: string) => {
      setData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const filledCount = Object.values(data).filter(Boolean).length;

  return (
    <>
      <CollapsibleSection
        id="branz-zone-data"
        title="Site Data (BRANZ Maps)"
        completionStatus={filledCount > 0 ? `${filledCount}/7 fields` : undefined}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField
            label="Climate Zone"
            value={data.climateZone}
            options={CLIMATE_ZONE_OPTIONS}
            onChange={updateField('climateZone')}
          />
          <SelectField
            label="Earthquake Zone"
            value={data.earthquakeZone}
            options={EARTHQUAKE_ZONE_OPTIONS}
            onChange={updateField('earthquakeZone')}
          />
          <SelectField
            label="Exposure Zone"
            value={data.exposureZone}
            options={EXPOSURE_ZONE_OPTIONS}
            onChange={updateField('exposureZone')}
          />
          <SelectField
            label="Lee Zone"
            value={data.leeZone}
            options={LEE_ZONE_OPTIONS}
            onChange={updateField('leeZone')}
          />
          <TextField
            label="Rainfall Range"
            value={data.rainfallRange}
            placeholder="e.g. 90-100"
            onChange={updateField('rainfallRange')}
          />
          <SelectField
            label="Wind Region"
            value={data.windRegion}
            options={WIND_REGION_OPTIONS}
            onChange={updateField('windRegion')}
          />
          <SelectField
            label="Wind Zone"
            value={data.windZone}
            options={WIND_ZONE_OPTIONS}
            onChange={updateField('windZone')}
          />
        </div>
      </CollapsibleSection>
      <SaveIndicator status={status} error={error} onRetry={retry} />
    </>
  );
}
