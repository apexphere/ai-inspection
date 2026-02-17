/**
 * API Client - Issue #34
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
// Inspection Types
// ============================================================================

export interface Inspection {
  id: string;
  propertyAddress: string;
  inspectorName: string;
  status: 'draft' | 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface InspectionDetail extends Inspection {
  checklistId: string;
  findings: Finding[];
}

export interface Finding {
  id: string;
  inspectionId: string;
  sectionId: string;
  itemId: string;
  status: 'pass' | 'fail' | 'na' | 'pending';
  notes?: string;
  photos: string[];
}

export interface CreateInspectionInput {
  propertyAddress: string;
  inspectorName: string;
  checklistId: string;
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
    update: (inspectionId: string, findingId: string, data: Partial<Finding>): Promise<Finding> =>
      request(`/inspections/${inspectionId}/findings/${findingId}`, {
        method: 'PATCH',
        body: data,
      }),
  },

  // Reports
  reports: {
    generate: (inspectionId: string): Promise<{ url: string }> =>
      request(`/inspections/${inspectionId}/report`, { method: 'POST' }),
  },
};

export { ApiError };
export default api;
