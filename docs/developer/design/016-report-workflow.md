# Design: Report Workflow & Lifecycle

**Status:** Draft  
**Sprint:** 4c  
**Author:** Archer  
**Requirement:** #157  
**Date:** 2026-02-19

## Context

Reports go through multiple drafts and require peer review before finalization. The system needs to manage state transitions, version control, review comments, and maintain an audit trail for compliance.

## Decision

Implement a state machine for report lifecycle with:
- Defined states and valid transitions
- Version tracking (R0, R1, R2...)
- Review comments linked to sections
- Comprehensive audit trail
- Notifications on state changes

## Architecture

### State Machine

```
┌─────────┐     submit      ┌───────────┐
│  DRAFT  │────────────────▶│ IN_REVIEW │
└─────────┘                  └─────┬─────┘
     ▲                             │
     │                    ┌────────┴────────┐
     │                    ▼                 ▼
     │              ┌──────────┐      ┌──────────┐
     │              │ REVISION │      │ APPROVED │
     │              └────┬─────┘      └────┬─────┘
     │                   │                 │
     └───────────────────┘                 ▼
                                    ┌───────────┐
                                    │ FINALIZED │
                                    └─────┬─────┘
                                          │
                                          ▼
                                    ┌───────────┐
                                    │ SUBMITTED │
                                    └───────────┘
```

### State Transitions

| From | To | Action | Who | Conditions |
|------|-----|--------|-----|------------|
| DRAFT | IN_REVIEW | submit | Author | Has content |
| IN_REVIEW | APPROVED | approve | Reviewer | All comments resolved |
| IN_REVIEW | REVISION | requestChanges | Reviewer | Has comments |
| REVISION | IN_REVIEW | resubmit | Author | Changes addressed |
| APPROVED | FINALIZED | finalize | Author | PDF generated |
| FINALIZED | SUBMITTED | submit | Author | Confirmed |
| FINALIZED | REVISION | revert | Admin | With reason |

## Data Model

### Report Status (extend from #149)

```prisma
enum ReportStatus {
  DRAFT
  IN_REVIEW
  REVISION
  APPROVED
  FINALIZED
  SUBMITTED
}
```

### Report Version

```prisma
model ReportVersion {
  id            String    @id @default(uuid())
  reportId      String
  report        Report    @relation(fields: [reportId], references: [id])
  
  version       String    // "R0", "R1", "R2"
  versionNumber Int       // 0, 1, 2
  
  // Snapshot of content at this version
  contentSnapshot Json?   // Optional: full content backup
  pdfPath       String?   // Generated PDF for this version
  
  // Metadata
  createdById   String
  createdBy     Personnel @relation(fields: [createdById], references: [id])
  description   String?   // "First draft", "Review comments addressed"
  
  createdAt     DateTime  @default(now())
  
  @@unique([reportId, versionNumber])
  @@index([reportId])
}
```

### Review Comment

```prisma
model ReviewComment {
  id            String          @id @default(uuid())
  reportId      String
  report        Report          @relation(fields: [reportId], references: [id])
  
  sectionId     String?         // Which section (null = general)
  clauseId      String?         // Specific clause (optional)
  
  content       String
  priority      CommentPriority
  status        CommentStatus   @default(OPEN)
  
  authorId      String
  author        Personnel       @relation(fields: [authorId], references: [id])
  
  // Resolution
  resolvedById  String?
  resolvedBy    Personnel?      @relation("resolver", fields: [resolvedById], references: [id])
  resolvedAt    DateTime?
  resolution    String?         // How it was addressed
  
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  
  @@index([reportId, status])
}

enum CommentPriority {
  MUST_FIX      // Blocking
  SHOULD_FIX    // Important
  SUGGESTION    // Nice to have
}

enum CommentStatus {
  OPEN
  ADDRESSED
  DISMISSED
}
```

### Audit Log

```prisma
model ReportAuditLog {
  id          String    @id @default(uuid())
  reportId    String
  report      Report    @relation(fields: [reportId], references: [id])
  
  action      AuditAction
  fromStatus  ReportStatus?
  toStatus    ReportStatus?
  
  userId      String
  user        Personnel @relation(fields: [userId], references: [id])
  
  details     Json?     // Action-specific details
  ipAddress   String?
  userAgent   String?
  
  createdAt   DateTime  @default(now())
  
  @@index([reportId, createdAt])
}

enum AuditAction {
  CREATED
  EDITED
  SUBMITTED_FOR_REVIEW
  COMMENT_ADDED
  COMMENT_RESOLVED
  CHANGES_REQUESTED
  APPROVED
  FINALIZED
  SUBMITTED
  REVERTED
  PDF_GENERATED
}
```

## API Endpoints

### State Transitions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reports/:id/submit` | Submit for review |
| POST | `/api/reports/:id/approve` | Approve report |
| POST | `/api/reports/:id/request-changes` | Request revisions |
| POST | `/api/reports/:id/resubmit` | Resubmit after revision |
| POST | `/api/reports/:id/finalize` | Finalize report |
| POST | `/api/reports/:id/submit-to-council` | Mark as submitted |
| POST | `/api/reports/:id/revert` | Revert to revision (admin) |

### Versions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/:id/versions` | List all versions |
| GET | `/api/reports/:id/versions/:version` | Get specific version |
| GET | `/api/reports/:id/versions/compare` | Compare two versions |

### Review Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reports/:id/comments` | Add comment |
| GET | `/api/reports/:id/comments` | List comments |
| PUT | `/api/comments/:id` | Update comment |
| POST | `/api/comments/:id/resolve` | Mark resolved |
| POST | `/api/comments/:id/dismiss` | Dismiss comment |

### Audit

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/:id/audit` | Get audit trail |

## State Machine Implementation

```typescript
interface StateTransition {
  from: ReportStatus;
  to: ReportStatus;
  action: string;
  allowedRoles: PersonnelRole[];
  conditions: (report: Report, user: Personnel) => ValidationResult;
}

const STATE_TRANSITIONS: StateTransition[] = [
  {
    from: 'DRAFT',
    to: 'IN_REVIEW',
    action: 'submit',
    allowedRoles: ['REGISTERED_BUILDING_SURVEYOR', 'BUILDING_SURVEYOR'],
    conditions: (report) => {
      if (!report.clauseReviews.some(c => c.observations)) {
        return { valid: false, error: 'Report has no content' };
      }
      return { valid: true };
    },
  },
  {
    from: 'IN_REVIEW',
    to: 'APPROVED',
    action: 'approve',
    allowedRoles: ['REGISTERED_BUILDING_SURVEYOR'],
    conditions: (report, user) => {
      if (report.preparedById === user.id) {
        return { valid: false, error: 'Cannot approve own report' };
      }
      const openComments = report.comments.filter(c => 
        c.status === 'OPEN' && c.priority === 'MUST_FIX'
      );
      if (openComments.length > 0) {
        return { valid: false, error: 'Must-fix comments still open' };
      }
      return { valid: true };
    },
  },
  // ... more transitions
];

async function transitionState(
  reportId: string,
  action: string,
  userId: string,
  data?: any
): Promise<Report> {
  const report = await getReportWithRelations(reportId);
  const user = await getPersonnel(userId);
  
  const transition = STATE_TRANSITIONS.find(
    t => t.from === report.status && t.action === action
  );
  
  if (!transition) {
    throw new Error(`Invalid action "${action}" for status "${report.status}"`);
  }
  
  if (!transition.allowedRoles.includes(user.role)) {
    throw new Error(`Role "${user.role}" cannot perform "${action}"`);
  }
  
  const validation = transition.conditions(report, user);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  // Perform transition
  const updated = await prisma.report.update({
    where: { id: reportId },
    data: { status: transition.to },
  });
  
  // Create audit log
  await createAuditLog(reportId, action, report.status, transition.to, userId);
  
  // Send notifications
  await sendStateChangeNotifications(report, transition, user);
  
  return updated;
}
```

## Version Management

### Auto-Increment on Submit

```typescript
async function submitForReview(reportId: string, userId: string): Promise<Report> {
  const report = await getReport(reportId);
  
  // Get current version number
  const latestVersion = await prisma.reportVersion.findFirst({
    where: { reportId },
    orderBy: { versionNumber: 'desc' },
  });
  
  const newVersionNumber = (latestVersion?.versionNumber ?? -1) + 1;
  
  // Create new version
  await prisma.reportVersion.create({
    data: {
      reportId,
      version: `R${newVersionNumber}`,
      versionNumber: newVersionNumber,
      createdById: userId,
      description: newVersionNumber === 0 
        ? 'Initial draft' 
        : 'Submitted for review',
    },
  });
  
  // Update report version field
  await prisma.report.update({
    where: { id: reportId },
    data: { 
      version: newVersionNumber,
      status: 'IN_REVIEW',
    },
  });
  
  return getReport(reportId);
}
```

### Document Control Block

```typescript
interface DocumentControlBlock {
  preparedBy: string;
  company: string;
  revisions: Array<{
    rev: number;
    preparedBy: string;
    description: string;
    date: string;
  }>;
}

async function generateDocumentControl(reportId: string): Promise<DocumentControlBlock> {
  const report = await getReportWithRelations(reportId);
  const versions = await prisma.reportVersion.findMany({
    where: { reportId },
    orderBy: { versionNumber: 'asc' },
    include: { createdBy: true },
  });
  
  return {
    preparedBy: report.preparedBy.name,
    company: report.preparedBy.company.name,
    revisions: versions.map(v => ({
      rev: v.versionNumber + 1,
      preparedBy: v.createdBy.name,
      description: v.description || `Revision ${v.version}`,
      date: format(v.createdAt, 'dd/MM/yy'),
    })),
  };
}
```

## Review Comments

### Adding Comments

```typescript
async function addReviewComment(
  reportId: string,
  authorId: string,
  data: {
    sectionId?: string;
    clauseId?: string;
    content: string;
    priority: CommentPriority;
  }
): Promise<ReviewComment> {
  const report = await getReport(reportId);
  
  // Only allow comments on reports in review
  if (report.status !== 'IN_REVIEW') {
    throw new Error('Can only comment on reports in review');
  }
  
  const comment = await prisma.reviewComment.create({
    data: {
      reportId,
      authorId,
      ...data,
    },
  });
  
  await createAuditLog(reportId, 'COMMENT_ADDED', null, null, authorId, {
    commentId: comment.id,
    priority: data.priority,
  });
  
  return comment;
}
```

### Resolving Comments

```typescript
async function resolveComment(
  commentId: string,
  userId: string,
  resolution: string
): Promise<ReviewComment> {
  const comment = await prisma.reviewComment.update({
    where: { id: commentId },
    data: {
      status: 'ADDRESSED',
      resolvedById: userId,
      resolvedAt: new Date(),
      resolution,
    },
  });
  
  await createAuditLog(comment.reportId, 'COMMENT_RESOLVED', null, null, userId, {
    commentId,
    resolution,
  });
  
  return comment;
}
```

## Notifications

```typescript
const NOTIFICATION_CONFIG: Record<string, {
  recipients: (report: Report) => string[];
  template: string;
}> = {
  'IN_REVIEW': {
    recipients: (report) => [report.reviewedById].filter(Boolean),
    template: 'Report {{jobNumber}} submitted for your review',
  },
  'APPROVED': {
    recipients: (report) => [report.preparedById],
    template: 'Report {{jobNumber}} has been approved',
  },
  'REVISION': {
    recipients: (report) => [report.preparedById],
    template: 'Changes requested on report {{jobNumber}}',
  },
  'FINALIZED': {
    recipients: (report) => [report.preparedById, report.reviewedById].filter(Boolean),
    template: 'Report {{jobNumber}} has been finalized',
  },
};

async function sendStateChangeNotifications(
  report: Report,
  transition: StateTransition,
  actor: Personnel
): Promise<void> {
  const config = NOTIFICATION_CONFIG[transition.to];
  if (!config) return;
  
  const recipients = config.recipients(report);
  for (const recipientId of recipients) {
    if (recipientId === actor.id) continue; // Don't notify self
    
    await sendNotification({
      to: recipientId,
      subject: renderTemplate(config.template, report),
      // ... notification details
    });
  }
}
```

## Access Control

```typescript
const STATE_PERMISSIONS: Record<ReportStatus, {
  canEdit: (report: Report, user: Personnel) => boolean;
  canView: (report: Report, user: Personnel) => boolean;
}> = {
  DRAFT: {
    canEdit: (report, user) => report.preparedById === user.id,
    canView: (report, user) => 
      report.preparedById === user.id || 
      report.reviewedById === user.id,
  },
  IN_REVIEW: {
    canEdit: () => false, // No editing during review
    canView: (report, user) => 
      report.preparedById === user.id || 
      report.reviewedById === user.id,
  },
  REVISION: {
    canEdit: (report, user) => report.preparedById === user.id,
    canView: (report, user) => 
      report.preparedById === user.id || 
      report.reviewedById === user.id,
  },
  APPROVED: {
    canEdit: () => false,
    canView: () => true,
  },
  FINALIZED: {
    canEdit: () => false,
    canView: () => true,
  },
  SUBMITTED: {
    canEdit: () => false,
    canView: () => true,
  },
};
```

## Dependencies

| Dependency | Relationship |
|------------|--------------|
| #149 COA Report | Report entity and status |
| #155 Personnel | Author, reviewer assignments |
| #156 Report Templates | Document control block |

## Alternatives Considered

### 1. Simple Status Field Without State Machine

**Rejected.** State machine ensures valid transitions and enforces business rules.

### 2. Store Full Content Snapshot Per Version

**Deferred.** Store only version metadata initially. Full snapshots can be added later if diff/rollback needed.

### 3. External Workflow Engine (Temporal, AWS Step Functions)

**Rejected.** Overkill for this use case. Simple state machine in code is sufficient.

## Acceptance Criteria Mapping

- [x] Create reports in Draft state — Initial status
- [x] Track report version (R0, R1, R2...) — ReportVersion entity
- [x] Submit report for peer review — submit action
- [x] Reviewer can approve or request changes — approve/requestChanges
- [x] Add review comments — ReviewComment entity
- [x] Lock report when finalized — FINALIZED state no edit
- [x] Generate version history block — generateDocumentControl()
- [x] Audit trail for all changes — ReportAuditLog
- [x] Notifications for state changes — notification system
- [x] Only author can edit Draft — STATE_PERMISSIONS
- [x] Only reviewer can approve/reject — allowedRoles
- [x] Prevent editing of Finalized reports — canEdit = false
- [x] Allow revert from Finalized — revert action (admin)
- [x] Review comments linked to sections — sectionId field
- [x] Mark comments as addressed — resolveComment()
- [x] Auto-increment version on submit — submitForReview()
- [x] Warn if submitting incomplete report — conditions validation

---

## Next Steps

1. Review with Master for approval
2. Create user stories for implementation
