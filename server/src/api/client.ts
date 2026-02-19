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
// Site Inspection API (New inspection system)
// ============================================================================

export interface CreateSiteInspectionInput {
  projectId: string;
  type: 'SIMPLE' | 'CLAUSE_REVIEW';
  stage: string;
  date: string;
  inspectorName: string;
  weather?: string;
}

export interface SiteInspection {
  id: string;
  projectId: string;
  type: 'SIMPLE' | 'CLAUSE_REVIEW';
  stage: string;
  date: string;
  status: string;
  weather?: string;
  inspectorName: string;
  currentSection?: string;
  currentClauseId?: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    jobNumber: string;
    property: {
      streetAddress: string;
    };
    client: {
      name: string;
    };
  };
}

export const siteInspectionApi = {
  create: (projectId: string, input: Omit<CreateSiteInspectionInput, 'projectId'>) =>
    request<SiteInspection>('POST', `/api/projects/${projectId}/inspections`, input),
  
  get: (id: string) =>
    request<SiteInspection>('GET', `/api/site-inspections/${id}`),
  
  update: (id: string, input: Partial<CreateSiteInspectionInput> & { status?: string; currentSection?: string; currentClauseId?: string }) =>
    request<SiteInspection>('PUT', `/api/site-inspections/${id}`, input),
  
  list: (projectId: string) =>
    request<SiteInspection[]>('GET', `/api/projects/${projectId}/inspections`),
};

// ============================================================================
// Checklist Item API (Simple mode)
// ============================================================================

export interface CreateChecklistItemInput {
  category: string;
  item: string;
  decision: 'PASS' | 'FAIL' | 'NA';
  notes?: string;
  photoIds?: string[];
}

export interface ChecklistItem {
  id: string;
  inspectionId: string;
  category: string;
  item: string;
  decision: string;
  notes?: string;
  photoIds: string[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistSummary {
  total: number;
  passed: number;
  failed: number;
  na: number;
  byCategory: Record<string, { passed: number; failed: number; na: number }>;
  failedItemsWithoutNotes: string[];
  overallResult: 'PASS' | 'FAIL' | 'INCOMPLETE';
}

export const checklistItemApi = {
  create: (inspectionId: string, input: CreateChecklistItemInput) =>
    request<ChecklistItem>('POST', `/api/site-inspections/${inspectionId}/checklist-items`, input),
  
  list: (inspectionId: string) =>
    request<ChecklistItem[]>('GET', `/api/site-inspections/${inspectionId}/checklist-items`),
  
  getSummary: (inspectionId: string) =>
    request<ChecklistSummary>('GET', `/api/site-inspections/${inspectionId}/checklist-summary`),
  
  update: (id: string, input: Partial<CreateChecklistItemInput>) =>
    request<ChecklistItem>('PUT', `/api/checklist-items/${id}`, input),
};

// ============================================================================
// Clause Review API (Clause Review mode)
// ============================================================================

export interface CreateClauseReviewInput {
  clauseId: string;
  applicability: 'APPLICABLE' | 'NA';
  naReason?: string;
  observations?: string;
  photoIds?: string[];
  docIds?: string[];
}

export interface ClauseReview {
  id: string;
  inspectionId: string;
  clauseId: string;
  applicability: string;
  naReason?: string;
  observations?: string;
  photoIds: string[];
  docIds: string[];
  remedialWorks?: string;
  clause: {
    id: string;
    code: string;
    title: string;
    category: string;
    performanceText: string;
    typicalEvidence: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface ClauseReviewSummary {
  total: number;
  applicable: number;
  na: number;
  withObservations: number;
  withPhotos: number;
  completionPercentage: number;
  byCategory: Record<string, { applicable: number; na: number }>;
}

export const clauseReviewApi = {
  create: (inspectionId: string, input: CreateClauseReviewInput) =>
    request<ClauseReview>('POST', `/api/site-inspections/${inspectionId}/clause-reviews`, input),
  
  list: (inspectionId: string) =>
    request<ClauseReview[]>('GET', `/api/site-inspections/${inspectionId}/clause-reviews`),
  
  getSummary: (inspectionId: string) =>
    request<ClauseReviewSummary>('GET', `/api/site-inspections/${inspectionId}/clause-review-summary`),
  
  update: (id: string, input: Partial<CreateClauseReviewInput>) =>
    request<ClauseReview>('PUT', `/api/clause-reviews/${id}`, input),
  
  markNA: (id: string, naReason: string) =>
    request<ClauseReview>('POST', `/api/clause-reviews/${id}/mark-na`, { naReason }),
  
  markApplicable: (id: string) =>
    request<ClauseReview>('POST', `/api/clause-reviews/${id}/mark-applicable`, {}),
  
  initialize: (inspectionId: string, clauseIds: string[]) =>
    request<ClauseReview[]>('POST', `/api/site-inspections/${inspectionId}/clause-reviews/init`, { clauseIds }),
};

// ============================================================================
// Building Code API
// ============================================================================

export interface BuildingCodeClause {
  id: string;
  code: string;
  title: string;
  category: string;
  performanceText: string;
  durabilityPeriod?: string;
  typicalEvidence: string[];
  sortOrder: number;
}

export const buildingCodeApi = {
  listClauses: (category?: string) =>
    request<BuildingCodeClause[]>('GET', `/api/building-code/clauses${category ? `?category=${category}` : ''}`),
  
  getClause: (code: string) =>
    request<BuildingCodeClause>('GET', `/api/building-code/clauses/${code}`),
  
  getHierarchy: () =>
    request<Record<string, BuildingCodeClause[]>>('GET', `/api/building-code/clauses/hierarchy`),
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

// ============================================================================
// Inspection Photos API (New photo system)
// ============================================================================

export interface UploadInspectionPhotoInput {
  base64Data: string;
  mimeType?: string;
  caption: string;
  source?: 'SITE' | 'OWNER' | 'CONTRACTOR';
  inspectionId?: string;
  linkedClauses?: string[];
  linkedItemId?: string;
  linkedItemType?: 'ChecklistItem' | 'ClauseReview';
}

export interface InspectionPhoto {
  id: string;
  projectId: string;
  inspectionId?: string;
  reportNumber: number;
  filePath: string;
  thumbnailPath?: string;
  filename: string;
  mimeType: string;
  caption: string;
  source: string;
  linkedClauses: string[];
  linkedItemId?: string;
  linkedItemType?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const inspectionPhotoApi = {
  upload: (projectId: string, input: UploadInspectionPhotoInput) =>
    request<InspectionPhoto>('POST', `/api/projects/${projectId}/inspection-photos`, input),
  
  listByProject: (projectId: string) =>
    request<InspectionPhoto[]>('GET', `/api/projects/${projectId}/inspection-photos`),
  
  listByInspection: (inspectionId: string) =>
    request<InspectionPhoto[]>('GET', `/api/inspections/${inspectionId}/photos`),
  
  get: (id: string) =>
    request<InspectionPhoto>('GET', `/api/inspection-photos/${id}`),
  
  update: (id: string, input: Partial<UploadInspectionPhotoInput>) =>
    request<InspectionPhoto>('PUT', `/api/inspection-photos/${id}`, input),
  
  delete: (id: string) =>
    request<void>('DELETE', `/api/inspection-photos/${id}`),
};
