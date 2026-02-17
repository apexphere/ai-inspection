/**
 * API Client - Issue #34, #35, #42
 *
 * Centralized HTTP client for backend API communication.
 * Types imported from @ai-inspection/shared.
 */

import type {
  InspectionResponse,
  InspectionDetailResponse,
  FindingResponse,
  PhotoResponse,
  CreateInspectionInput,
  CreateFindingInput,
  UpdateFindingInput,
  InspectionStatus,
  FindingSeverity,
} from '@ai-inspection/shared';

// Re-export types for convenience
export type {
  InspectionStatus,
  FindingSeverity,
  CreateInspectionInput,
  CreateFindingInput,
  UpdateFindingInput,
};

// Alias response types with simpler names for client code
export type Inspection = InspectionResponse;
export type InspectionDetail = InspectionDetailResponse;
export type Finding = FindingResponse;
export type Photo = PhotoResponse;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(
      data.message || `API error: ${response.status}`,
      response.status,
      data
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ============================================================================
// API Methods
// ============================================================================

export const api = {
  // Inspections
  inspections: {
    list: (): Promise<Inspection[]> =>
      request('/inspections'),

    get: (id: string): Promise<InspectionDetail> =>
      request(`/inspections/${id}`),

    create: (data: CreateInspectionInput): Promise<Inspection> =>
      request('/inspections', { method: 'POST', body: data }),

    update: (id: string, data: Partial<CreateInspectionInput>): Promise<Inspection> =>
      request(`/inspections/${id}`, { method: 'PATCH', body: data }),

    delete: (id: string): Promise<void> =>
      request(`/inspections/${id}`, { method: 'DELETE' }),
  },

  // Findings
  findings: {
    list: (inspectionId: string): Promise<Finding[]> =>
      request(`/inspections/${inspectionId}/findings`),

    create: (inspectionId: string, data: CreateFindingInput): Promise<Finding> =>
      request(`/inspections/${inspectionId}/findings`, { method: 'POST', body: data }),

    update: (inspectionId: string, findingId: string, data: UpdateFindingInput): Promise<Finding> =>
      request(`/inspections/${inspectionId}/findings/${findingId}`, {
        method: 'PATCH',
        body: data,
      }),

    delete: (inspectionId: string, findingId: string): Promise<void> =>
      request(`/inspections/${inspectionId}/findings/${findingId}`, { method: 'DELETE' }),
  },

  // Reports
  reports: {
    generate: (inspectionId: string): Promise<{ url: string }> =>
      request(`/inspections/${inspectionId}/report`, { method: 'POST' }),
  },

  // Photos
  photos: {
    upload: (findingId: string, base64Data: string, mimeType?: string): Promise<Photo> =>
      request(`/findings/${findingId}/photos`, {
        method: 'POST',
        body: { base64Data, mimeType },
      }),

    delete: (photoId: string): Promise<void> =>
      request(`/photos/${photoId}`, { method: 'DELETE' }),

    getUrl: (photoId: string): string =>
      `${API_URL}/photos/${photoId}`,
  },
};

export { ApiError };
export default api;
