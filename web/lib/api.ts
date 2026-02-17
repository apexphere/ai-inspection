/**
 * API Client - Issue #34, #35
 *
 * Centralized HTTP client for backend API communication.
 */

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
// Types (aligned with API schema)
// ============================================================================

export type InspectionStatus = 'STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type FindingSeverity = 'INFO' | 'MINOR' | 'MAJOR' | 'URGENT';

export interface Inspection {
  id: string;
  address: string;
  clientName: string;
  inspectorName: string | null;
  checklistId: string;
  status: InspectionStatus;
  currentSection: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface Finding {
  id: string;
  inspectionId: string;
  section: string;
  text: string;
  severity: FindingSeverity;
  matchedComment: string | null;
  createdAt: string;
  updatedAt: string;
  photos: Photo[];
}

export interface Photo {
  id: string;
  findingId: string;
  filename: string;
  path: string;
  mimeType: string;
}

export interface InspectionDetail extends Inspection {
  findings: Finding[];
}

export interface CreateInspectionInput {
  address: string;
  clientName: string;
  inspectorName?: string;
  checklistId: string;
}

export interface CreateFindingInput {
  section: string;
  text: string;
  severity?: FindingSeverity;
  matchedComment?: string;
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

    update: (inspectionId: string, findingId: string, data: Partial<CreateFindingInput>): Promise<Finding> =>
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
};

export { ApiError };
export default api;
