/**
 * API Client for MCP Server
 * 
 * Thin HTTP client that calls the inspection API.
 * Configurable via API_URL environment variable.
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';

export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: ApiError;
  status: number;
}

/**
 * Make an HTTP request to the API.
 */
async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  const url = `${API_URL}${path}`;
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const status = response.status;

    // Handle no content
    if (status === 204) {
      return { ok: true, status };
    }

    // Parse JSON response
    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data as ApiError,
        status,
      };
    }

    return {
      ok: true,
      data: data as T,
      status,
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        error: error instanceof Error ? error.message : 'Network error',
      },
      status: 0,
    };
  }
}

// ============================================================================
// Inspection API
// ============================================================================

export interface CreateInspectionInput {
  address: string;
  clientName: string;
  inspectorName?: string;
  checklistId: string;
  currentSection: string;
  metadata?: Record<string, unknown>;
}

export interface Inspection {
  id: string;
  address: string;
  clientName: string;
  inspectorName?: string;
  checklistId: string;
  status: string;
  currentSection: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface UpdateInspectionInput {
  status?: string;
  currentSection?: string;
  completedAt?: string;
}

export const inspectionApi = {
  create: (input: CreateInspectionInput) =>
    request<Inspection>('POST', '/api/inspections', input),
  
  get: (id: string) =>
    request<Inspection>('GET', `/api/inspections/${id}`),
  
  update: (id: string, input: UpdateInspectionInput) =>
    request<Inspection>('PUT', `/api/inspections/${id}`, input),
};

// ============================================================================
// Navigation API
// ============================================================================

export interface NavigateInput {
  section: string;
}

export interface NavigationResult {
  inspectionId: string;
  previousSection: string;
  currentSection: string;
  sectionName: string;
  prompt?: string;
  items?: string[];
}

export interface InspectionStatus {
  inspectionId: string;
  address: string;
  clientName: string;
  inspectorName?: string;
  status: string;
  currentSection: {
    id: string;
    name: string;
    prompt?: string;
    items?: string[];
    findingsCount: number;
  };
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  sections: Array<{
    id: string;
    name: string;
    findingsCount: number;
    hasFindings: boolean;
  }>;
  totalFindings: number;
  canComplete: boolean;
}

export interface SuggestResult {
  inspectionId: string;
  currentSection: string;
  nextSection?: {
    id: string;
    name: string;
    prompt?: string;
  };
  remainingSections: number;
  canComplete: boolean;
  suggestion: string;
}

export const navigationApi = {
  navigate: (inspectionId: string, input: NavigateInput) =>
    request<NavigationResult>('POST', `/api/inspections/${inspectionId}/navigate`, input),
  
  getStatus: (inspectionId: string) =>
    request<InspectionStatus>('GET', `/api/inspections/${inspectionId}/status`),
  
  suggest: (inspectionId: string) =>
    request<SuggestResult>('GET', `/api/inspections/${inspectionId}/suggest`),
};

// ============================================================================
// Findings API
// ============================================================================

export interface CreateFindingInput {
  section: string;
  text: string;
  severity?: 'INFO' | 'MINOR' | 'MAJOR' | 'URGENT';
  matchedComment?: string;
}

export interface Finding {
  id: string;
  inspectionId: string;
  section: string;
  text: string;
  severity: string;
  matchedComment?: string;
  createdAt: string;
  updatedAt: string;
}

export const findingsApi = {
  create: (inspectionId: string, input: CreateFindingInput) =>
    request<Finding>('POST', `/api/inspections/${inspectionId}/findings`, input),
  
  list: (inspectionId: string) =>
    request<Finding[]>('GET', `/api/inspections/${inspectionId}/findings`),
};

// ============================================================================
// Photos API
// ============================================================================

export interface UploadPhotoInput {
  base64Data: string;
  mimeType?: string;
}

export interface Photo {
  id: string;
  findingId: string;
  filename: string;
  path: string;
  mimeType: string;
  createdAt: string;
}

export const photosApi = {
  upload: (findingId: string, input: UploadPhotoInput) =>
    request<Photo>('POST', `/api/findings/${findingId}/photos`, input),
};

// ============================================================================
// Reports API
// ============================================================================

export interface Report {
  id: string;
  inspectionId: string;
  format: string;
  path: string;
  createdAt: string;
}

export const reportsApi = {
  generate: (inspectionId: string) =>
    request<Report>('POST', `/api/inspections/${inspectionId}/report`),
  
  getLatest: (inspectionId: string) =>
    request<Report>('GET', `/api/inspections/${inspectionId}/report`),
};
