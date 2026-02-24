/**
 * OpenAPI Route Registration for Report Management, Transitions & Cost Estimates
 * Issue #500
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { ErrorResponseSchema } from '../schemas/common.js';

// ============================================
// Report Management Schemas
// ============================================

const ReportTypeEnum = z.enum(['COA', 'CCC_GAP', 'PPI', 'SAFE_SANITARY', 'TFA']);
const ReportStatusEnum = z.enum(['DRAFT', 'IN_REVIEW', 'APPROVED', 'FINALIZED', 'SUBMITTED']);

const CreateReportSchema = z.object({
  siteInspectionId: z.string().uuid(),
  type: ReportTypeEnum,
  preparedById: z.string().min(1),
  reviewedById: z.string().optional(),
}).openapi('CreateReportRequest');

const UpdateReportSchema = z.object({
  status: ReportStatusEnum.optional(),
  preparedById: z.string().optional(),
  reviewedById: z.string().optional(),
  form9Data: z.record(z.unknown()).optional(),
}).openapi('UpdateReportRequest');

const ReportResponseSchema = z.object({
  id: z.string().uuid(),
  inspectionId: z.string().uuid().nullable(),
  siteInspectionId: z.string().uuid().nullable(),
  type: ReportTypeEnum,
  status: ReportStatusEnum,
  version: z.number(),
  format: z.string(),
  path: z.string().nullable(),
  pdfPath: z.string().nullable(),
  pdfSize: z.number().nullable(),
  generatedAt: z.string().datetime().nullable(),
  preparedById: z.string().nullable(),
  reviewedById: z.string().nullable(),
  reviewedAt: z.string().datetime().nullable(),
  form9Data: z.unknown().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('ReportResponse');

const ReportListResponseSchema = z.array(ReportResponseSchema).openapi('ReportListResponse');

const ApproveRequestSchema = z.object({
  reviewedById: z.string().min(1),
}).openapi('ApproveReportRequest');

const ValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
}).openapi('ReportValidationResult');

const SignatureBlockSchema = z.object({
  preparedBy: z.object({ name: z.string(), credentials: z.string() }).nullable(),
  reviewedBy: z.object({ name: z.string(), credentials: z.string() }).nullable(),
}).openapi('SignatureBlockResponse');

registry.register('CreateReportRequest', CreateReportSchema);
registry.register('ReportResponse', ReportResponseSchema);

// ============================================
// Report Management Routes
// ============================================

const reportIdParam = z.object({ id: z.string().uuid().openapi({ description: 'Report ID' }) });

registry.registerPath({
  method: 'post', path: '/api/reports', summary: 'Create report', tags: ['Reports'],
  request: { body: { content: { 'application/json': { schema: CreateReportSchema } } } },
  responses: {
    201: { description: 'Report created', content: { 'application/json': { schema: ReportResponseSchema } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get', path: '/api/reports', summary: 'List reports', tags: ['Reports'],
  request: {
    query: z.object({
      siteInspectionId: z.string().uuid().optional(),
      type: ReportTypeEnum.optional(),
      status: ReportStatusEnum.optional(),
      preparedById: z.string().optional(),
    }),
  },
  responses: { 200: { description: 'Reports list', content: { 'application/json': { schema: ReportListResponseSchema } } } },
});

registry.registerPath({
  method: 'get', path: '/api/reports/{id}/validate', summary: 'Validate report completeness', tags: ['Reports'],
  request: { params: reportIdParam },
  responses: {
    200: { description: 'Validation result', content: { 'application/json': { schema: ValidationResultSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get', path: '/api/reports/{id}', summary: 'Get report by ID', tags: ['Reports'],
  request: { params: reportIdParam },
  responses: {
    200: { description: 'Report details', content: { 'application/json': { schema: ReportResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'put', path: '/api/reports/{id}', summary: 'Update report', tags: ['Reports'],
  request: { params: reportIdParam, body: { content: { 'application/json': { schema: UpdateReportSchema } } } },
  responses: {
    200: { description: 'Report updated', content: { 'application/json': { schema: ReportResponseSchema } } },
    400: { description: 'Invalid status transition', content: { 'application/json': { schema: ErrorResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'delete', path: '/api/reports/{id}', summary: 'Delete report', tags: ['Reports'],
  request: { params: reportIdParam },
  responses: {
    204: { description: 'Report deleted' },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'post', path: '/api/reports/{id}/review', summary: 'Submit report for review', tags: ['Reports'],
  description: 'Transitions report from DRAFT → IN_REVIEW.',
  request: { params: reportIdParam },
  responses: {
    200: { description: 'Report submitted for review', content: { 'application/json': { schema: ReportResponseSchema } } },
    400: { description: 'Invalid transition', content: { 'application/json': { schema: ErrorResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'post', path: '/api/reports/{id}/approve', summary: 'Approve report', tags: ['Reports'],
  description: 'Transitions report from IN_REVIEW → APPROVED.',
  request: { params: reportIdParam, body: { content: { 'application/json': { schema: ApproveRequestSchema } } } },
  responses: {
    200: { description: 'Report approved', content: { 'application/json': { schema: ReportResponseSchema } } },
    400: { description: 'Invalid transition or missing reviewedById', content: { 'application/json': { schema: ErrorResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get', path: '/api/reports/{id}/signature-block', summary: 'Get report signature block', tags: ['Reports'],
  request: { params: reportIdParam },
  responses: {
    200: { description: 'Signature block data', content: { 'application/json': { schema: SignatureBlockSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get', path: '/api/reports/{id}/form9', summary: 'Get Form 9 data export', tags: ['Reports'],
  request: { params: reportIdParam },
  responses: {
    200: { description: 'Form 9 data', content: { 'application/json': { schema: z.object({ form9Data: z.unknown() }).openapi('Form9Response') } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

// ============================================
// Report Transitions
// ============================================

const TransitionRequestSchema = z.object({
  action: z.enum(['submitForReview', 'requestChanges', 'approve', 'finalize', 'markSubmitted']),
  role: z.enum(['AUTHOR', 'REVIEWER', 'ADMIN']),
  userId: z.string().min(1),
}).openapi('TransitionRequest');

const TransitionResponseSchema = z.object({
  report: ReportResponseSchema,
  transition: z.object({
    from: ReportStatusEnum,
    to: ReportStatusEnum,
    action: z.string(),
    performedBy: z.string(),
  }),
}).openapi('TransitionResponse');

const AvailableTransitionsSchema = z.object({
  currentStatus: ReportStatusEnum,
  availableTransitions: z.array(z.object({
    action: z.string(),
    targetStatus: ReportStatusEnum,
    allowedRoles: z.array(z.string()),
  })),
}).openapi('AvailableTransitionsResponse');

registry.registerPath({
  method: 'post', path: '/api/reports/{id}/transition', summary: 'Execute status transition', tags: ['Report Workflow'],
  request: { params: reportIdParam, body: { content: { 'application/json': { schema: TransitionRequestSchema } } } },
  responses: {
    200: { description: 'Transition executed', content: { 'application/json': { schema: TransitionResponseSchema } } },
    400: { description: 'Invalid transition', content: { 'application/json': { schema: ErrorResponseSchema } } },
    403: { description: 'Insufficient role', content: { 'application/json': { schema: ErrorResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get', path: '/api/reports/{id}/transitions', summary: 'Get available transitions', tags: ['Report Workflow'],
  request: {
    params: reportIdParam,
    query: z.object({ role: z.enum(['AUTHOR', 'REVIEWER', 'ADMIN']).optional() }),
  },
  responses: {
    200: { description: 'Available transitions', content: { 'application/json': { schema: AvailableTransitionsSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get', path: '/api/reports/transitions/all', summary: 'Get all defined transitions', tags: ['Report Workflow'],
  description: 'Returns all possible status transitions (documentation endpoint).',
  responses: {
    200: { description: 'All transitions', content: { 'application/json': { schema: z.array(z.object({
      from: ReportStatusEnum, to: ReportStatusEnum, action: z.string(), allowedRoles: z.array(z.string()),
    })).openapi('AllTransitionsResponse') } } },
  },
});

// ============================================
// Cost Estimates
// ============================================

const CreateCostEstimateSchema = z.object({
  contingencyRate: z.number().optional().openapi({ example: 0.2 }),
  notes: z.string().optional(),
}).openapi('CreateCostEstimateRequest');

const CostLineItemSchema = z.object({
  id: z.string().uuid(),
  costEstimateId: z.string().uuid(),
  category: z.string(),
  description: z.string(),
  quantity: z.number(),
  unit: z.string(),
  rate: z.number(),
  amount: z.number(),
  sortOrder: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('CostLineItemResponse');

const CostEstimateResponseSchema = z.object({
  id: z.string().uuid(),
  reportId: z.string().uuid(),
  contingencyRate: z.number(),
  subtotal: z.number(),
  totalExGst: z.number(),
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lineItems: z.array(CostLineItemSchema),
}).openapi('CostEstimateResponse');

const CreateLineItemSchema = z.object({
  category: z.string().min(1),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  rate: z.number().min(0),
}).openapi('CreateLineItemRequest');

const UpdateLineItemSchema = z.object({
  category: z.string().optional(),
  description: z.string().optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
  rate: z.number().min(0).optional(),
}).openapi('UpdateLineItemRequest');

const reportIdParamCost = z.object({ reportId: z.string().uuid().openapi({ description: 'Report ID' }) });
const costEstimateIdParam = z.object({ id: z.string().uuid().openapi({ description: 'Cost Estimate ID' }) });
const lineItemIdParam = z.object({ id: z.string().uuid().openapi({ description: 'Line Item ID' }) });

registry.registerPath({
  method: 'post', path: '/api/reports/{reportId}/cost-estimate', summary: 'Create cost estimate for report', tags: ['Cost Estimates'],
  request: { params: reportIdParamCost, body: { content: { 'application/json': { schema: CreateCostEstimateSchema } } } },
  responses: {
    201: { description: 'Cost estimate created', content: { 'application/json': { schema: CostEstimateResponseSchema } } },
    404: { description: 'Report not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
    409: { description: 'Already exists', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get', path: '/api/reports/{reportId}/cost-estimate', summary: 'Get cost estimate for report', tags: ['Cost Estimates'],
  request: { params: reportIdParamCost },
  responses: {
    200: { description: 'Cost estimate', content: { 'application/json': { schema: CostEstimateResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'put', path: '/api/cost-estimates/{id}', summary: 'Update cost estimate', tags: ['Cost Estimates'],
  request: { params: costEstimateIdParam, body: { content: { 'application/json': { schema: CreateCostEstimateSchema } } } },
  responses: {
    200: { description: 'Updated', content: { 'application/json': { schema: CostEstimateResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'delete', path: '/api/cost-estimates/{id}', summary: 'Delete cost estimate', tags: ['Cost Estimates'],
  request: { params: costEstimateIdParam },
  responses: {
    204: { description: 'Deleted' },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'post', path: '/api/cost-estimates/{id}/line-items', summary: 'Add line item', tags: ['Cost Estimates'],
  request: { params: costEstimateIdParam, body: { content: { 'application/json': { schema: CreateLineItemSchema } } } },
  responses: {
    201: { description: 'Line item added', content: { 'application/json': { schema: CostEstimateResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'put', path: '/api/cost-line-items/{id}', summary: 'Update line item', tags: ['Cost Estimates'],
  request: { params: lineItemIdParam, body: { content: { 'application/json': { schema: UpdateLineItemSchema } } } },
  responses: {
    200: { description: 'Line item updated', content: { 'application/json': { schema: CostEstimateResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'delete', path: '/api/cost-line-items/{id}', summary: 'Delete line item', tags: ['Cost Estimates'],
  request: { params: lineItemIdParam },
  responses: {
    200: { description: 'Line item deleted', content: { 'application/json': { schema: CostEstimateResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});
