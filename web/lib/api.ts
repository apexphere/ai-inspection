/**
 * API Client - Issue #34, #35, #42, #339
 *
 * Centralized HTTP client for backend API communication.
 * Types imported from @ai-inspection/shared.
 * 
 * Authentication: Pass apiToken from session to authenticate requests.
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
  token?: string; // API token for authentication
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
  const { method = 'GET', body, headers = {}, token } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
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
// API Factory - Creates authenticated API client
// ============================================================================

export function createApiClient(token?: string) {
  const opts = (options: RequestOptions = {}): RequestOptions => ({
    ...options,
    token: options.token ?? token,
  });

  return {
    // Inspections
    inspections: {
      list: (): Promise<Inspection[]> =>
        request('/api/inspections', opts()),

      get: (id: string): Promise<InspectionDetail> =>
        request(`/api/inspections/${id}`, opts()),

      create: (data: CreateInspectionInput): Promise<Inspection> =>
        request('/api/inspections', opts({ method: 'POST', body: data })),

      update: (id: string, data: Partial<CreateInspectionInput>): Promise<Inspection> =>
        request(`/api/inspections/${id}`, opts({ method: 'PATCH', body: data })),

      delete: (id: string): Promise<void> =>
        request(`/api/inspections/${id}`, opts({ method: 'DELETE' })),
    },

    // Findings
    findings: {
      list: (inspectionId: string): Promise<Finding[]> =>
        request(`/api/inspections/${inspectionId}/findings`, opts()),

      create: (inspectionId: string, data: CreateFindingInput): Promise<Finding> =>
        request(`/api/inspections/${inspectionId}/findings`, opts({ method: 'POST', body: data })),

      update: (inspectionId: string, findingId: string, data: UpdateFindingInput): Promise<Finding> =>
        request(`/api/inspections/${inspectionId}/findings/${findingId}`, opts({
          method: 'PATCH',
          body: data,
        })),

      delete: (inspectionId: string, findingId: string): Promise<void> =>
        request(`/api/inspections/${inspectionId}/findings/${findingId}`, opts({ method: 'DELETE' })),
    },

    // Reports
    reports: {
      generate: (inspectionId: string): Promise<{ url: string }> =>
        request(`/api/inspections/${inspectionId}/report`, opts({ method: 'POST' })),
    },

    // Photos
    photos: {
      upload: (findingId: string, base64Data: string, mimeType?: string): Promise<Photo> =>
        request(`/api/findings/${findingId}/photos`, opts({
          method: 'POST',
          body: { base64Data, mimeType },
        })),

      delete: (photoId: string): Promise<void> =>
        request(`/api/photos/${photoId}`, opts({ method: 'DELETE' })),

      getUrl: (photoId: string): string =>
        `${API_URL}/api/photos/${photoId}`,
    },
  };
}

// ============================================================================
// Legacy API object (for backward compatibility)
// Note: These calls won't have auth token - use createApiClient(token) instead
// ============================================================================

export const api = createApiClient();

export { ApiError };
export default api;
