# Design: Personnel & Credentials Management

**Status:** Draft  
**Sprint:** 4c  
**Author:** Archer  
**Requirement:** #155  
**Date:** 2026-02-19

## Context

Building surveyors and inspectors need professional credentials tracked and displayed in reports. Auckland Council requires Registered Building Surveyors for COA assessments, and credentials must be stated in reports for compliance.

This is a foundational entity that reports (#149), inspections (#150), and workflow (#157) depend on.

## Decision

Create Company, Personnel, and Credential entities with:
- Role-based capabilities (who can author vs review)
- Formatted credential strings for reports
- Expiry tracking with alerts
- Signature block generation

## Architecture

### Entity Relationships

```
┌─────────────────┐
│    Company      │
│  (organization) │
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐      ┌─────────────────┐
│   Personnel     │──────│   Credential    │
│ (person/role)   │ 1:N  │  (cert/license) │
└────────┬────────┘      └─────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│Report  │ │Inspect │
│(author)│ │(inspec)│
└────────┘ └────────┘
```

## Data Model

### Prisma Schema

```prisma
model Company {
  id          String      @id @default(uuid())
  name        String      // "Abacus Building Consulting Limited"
  logoPath    String?     // Path to logo image
  address     String?
  phone       String?
  email       String?
  website     String?
  
  personnel   Personnel[]
  
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model Personnel {
  id          String          @id @default(uuid())
  name        String
  role        PersonnelRole
  email       String          @unique
  phone       String?
  mobile      String?
  active      Boolean         @default(true)
  
  companyId   String
  company     Company         @relation(fields: [companyId], references: [id])
  
  credentials Credential[]
  
  // Relations to other entities
  authoredReports   Report[]      @relation("author")
  reviewedReports   Report[]      @relation("reviewer")
  inspections       Inspection[]  @relation("inspector")
  
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

enum PersonnelRole {
  REGISTERED_BUILDING_SURVEYOR  // Full credentials, can review
  BUILDING_SURVEYOR             // Can author, cannot review
  INSPECTOR                     // Site inspection only
  ADMIN                         // System access only
}

model Credential {
  id              String          @id @default(uuid())
  personnelId     String
  personnel       Personnel       @relation(fields: [personnelId], references: [id], onDelete: Cascade)
  
  type            CredentialType
  
  // Membership details
  membershipCode  String?         // "MNZIBS", "MEngNZ"
  membershipFull  String?         // "Member of NZ Institute of Building Surveyors"
  
  // Registration
  registration    String?         // "Registered Building Surveyor"
  licenseNumber   String?         // LBP or other license
  
  // Academic
  qualifications  String[]        @default([])  // ["BE (Hons)", "MBA"]
  
  // Validity
  issuedDate      DateTime?
  expiryDate      DateTime?
  verified        Boolean         @default(false)
  
  sortOrder       Int             @default(0)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  @@index([personnelId])
  @@index([expiryDate])
}

enum CredentialType {
  NZIBS       // NZ Institute of Building Surveyors
  LBP         // Licensed Building Practitioner
  ENG_NZ      // Engineering New Zealand
  ACADEMIC    // Degree/Diploma
  OTHER       // Other certification
}
```

## API Endpoints

### Companies

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/companies` | Create company |
| GET | `/api/companies` | List companies |
| GET | `/api/companies/:id` | Get company details |
| PUT | `/api/companies/:id` | Update company |
| DELETE | `/api/companies/:id` | Delete company |
| POST | `/api/companies/:id/logo` | Upload logo |

### Personnel

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/personnel` | Create personnel |
| GET | `/api/personnel` | List personnel (filter by role, active) |
| GET | `/api/personnel/:id` | Get personnel with credentials |
| PUT | `/api/personnel/:id` | Update personnel |
| DELETE | `/api/personnel/:id` | Deactivate (soft delete) |
| GET | `/api/personnel/:id/credentials-string` | Get formatted credentials |

### Credentials

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/personnel/:id/credentials` | Add credential |
| PUT | `/api/credentials/:id` | Update credential |
| DELETE | `/api/credentials/:id` | Remove credential |
| GET | `/api/credentials/expiring` | List expiring credentials |

### Report Integration

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/personnel/authors` | Personnel who can author |
| GET | `/api/personnel/reviewers` | Personnel who can review |
| GET | `/api/reports/:id/signature-block` | Generate signature block |

## Credential Formatting

### Format String Generation

```typescript
function formatCredentials(personnel: Personnel): string {
  const parts: string[] = [];
  
  // 1. Registration (highest priority)
  const registration = personnel.credentials.find(c => c.registration);
  if (registration?.registration) {
    parts.push(registration.registration);
  }
  
  // 2. Memberships (sorted by type priority)
  const memberships = personnel.credentials
    .filter(c => c.membershipCode)
    .sort((a, b) => credentialPriority(a.type) - credentialPriority(b.type))
    .map(c => c.membershipCode);
  parts.push(...memberships);
  
  // 3. Qualifications (academic)
  const qualifications = personnel.credentials
    .filter(c => c.type === 'ACADEMIC')
    .flatMap(c => c.qualifications);
  parts.push(...qualifications);
  
  return parts.join(', ');
}

function credentialPriority(type: CredentialType): number {
  const priority = {
    NZIBS: 1,
    ENG_NZ: 2,
    LBP: 3,
    ACADEMIC: 4,
    OTHER: 5,
  };
  return priority[type] ?? 99;
}
```

### Example Outputs

| Personnel | Formatted String |
|-----------|------------------|
| Ian Fong | Registered Building Surveyor, MNZIBS, Dip. Building Surveying, BE (Hons), MBA |
| Jake Li | Building Surveyor, MCon. Mgt., M.Engin. (Safety), BSc. (Materials) |

## Signature Block Generation

### Template

```typescript
interface SignatureBlockData {
  author: {
    name: string;
    credentials: string;
    company: string;
  };
  reviewer?: {
    name: string;
    credentials: string;
    company: string;
  };
}

function generateSignatureBlock(report: Report): SignatureBlockData {
  return {
    author: {
      name: report.preparedBy.name,
      credentials: formatCredentials(report.preparedBy),
      company: report.preparedBy.company.name,
    },
    reviewer: report.reviewedBy ? {
      name: report.reviewedBy.name,
      credentials: formatCredentials(report.reviewedBy),
      company: report.reviewedBy.company.name,
    } : undefined,
  };
}
```

### Rendered Output (for PDF)

```
Report prepared by:              Peer reviewed by:
_________________________        _________________________
Ian Fong                         Jake Li
Registered Building Surveyor,    Building Surveyor,
MNZIBS, BE (Hons), MBA           MCon. Mgt., M.Engin. (Safety)
For and on behalf of             For and on behalf of
Abacus Building Consulting Ltd   Abacus Building Consulting Ltd
```

## Capability Matrix

### Role Capabilities

```typescript
const ROLE_CAPABILITIES = {
  REGISTERED_BUILDING_SURVEYOR: {
    canAuthor: true,
    canReview: true,
    canInspect: true,
    canApprove: true,
  },
  BUILDING_SURVEYOR: {
    canAuthor: true,
    canReview: false,  // Cannot peer review
    canInspect: true,
    canApprove: false,
  },
  INSPECTOR: {
    canAuthor: false,
    canReview: false,
    canInspect: true,
    canApprove: false,
  },
  ADMIN: {
    canAuthor: false,
    canReview: false,
    canInspect: false,
    canApprove: false,
  },
};
```

### Validation Rules

```typescript
function validateReportAssignment(report: Report): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Author must be able to author
  if (!ROLE_CAPABILITIES[report.preparedBy.role].canAuthor) {
    errors.push({
      field: 'preparedById',
      message: `${report.preparedBy.role} cannot author reports`,
    });
  }
  
  // Reviewer must be Registered Building Surveyor
  if (report.reviewedBy && !ROLE_CAPABILITIES[report.reviewedBy.role].canReview) {
    errors.push({
      field: 'reviewedById',
      message: 'Reviewer must be a Registered Building Surveyor',
    });
  }
  
  // Reviewer should have higher/equal credentials than author (warning)
  if (report.reviewedBy && 
      getRoleLevel(report.reviewedBy.role) < getRoleLevel(report.preparedBy.role)) {
    errors.push({
      field: 'reviewedById',
      message: 'Reviewer should have higher credentials than author',
      severity: 'warning',
    });
  }
  
  return errors;
}
```

## Expiry Alerts

### Alert Thresholds

| Days Before Expiry | Alert Level |
|--------------------|-------------|
| 90 | Info |
| 60 | Warning |
| 30 | Urgent |
| 0 (Expired) | Error |

### Alert Query

```typescript
async function getExpiringCredentials(thresholdDays: number = 90): Promise<ExpiringCredential[]> {
  const threshold = addDays(new Date(), thresholdDays);
  
  return prisma.credential.findMany({
    where: {
      expiryDate: {
        lte: threshold,
        not: null,
      },
      personnel: {
        active: true,
      },
    },
    include: {
      personnel: {
        select: { name: true, email: true },
      },
    },
    orderBy: { expiryDate: 'asc' },
  });
}
```

### Notification Integration

```typescript
// Cron job: daily check for expiring credentials
async function checkExpiringCredentials(): Promise<void> {
  const expiring = await getExpiringCredentials(90);
  
  for (const credential of expiring) {
    const daysUntilExpiry = differenceInDays(credential.expiryDate, new Date());
    
    if ([90, 60, 30, 7, 1].includes(daysUntilExpiry)) {
      await sendNotification({
        to: credential.personnel.email,
        subject: `Credential expiring in ${daysUntilExpiry} days`,
        body: `Your ${credential.type} credential expires on ${format(credential.expiryDate, 'dd MMM yyyy')}.`,
      });
    }
  }
}
```

## LBP License Validation

### License Number Format

LBP license numbers follow specific formats:

```typescript
function validateLBPLicense(licenseNumber: string): boolean {
  // LBP format: BP followed by 6 digits
  const lbpPattern = /^BP\d{6}$/;
  return lbpPattern.test(licenseNumber);
}
```

## Dependencies

| Dependency | Relationship |
|------------|--------------|
| #149 COA Report | Uses Personnel for author/reviewer |
| #150 Inspection | Uses Personnel for inspectors |
| #157 Report Workflow | Validates reviewer credentials |

## Alternatives Considered

### 1. Store Credentials as JSON Array

**Rejected.** Relational model allows proper querying (expiring credentials), validation, and indexing.

### 2. Single Credential String Field

**Rejected.** Structured credentials enable proper formatting, expiry tracking, and verification status.

### 3. Credentials on User Model (Authentication)

**Rejected.** Personnel are domain entities, separate from authentication users. A web user may or may not be linked to a Personnel record.

## Acceptance Criteria Mapping

### Personnel Management
- [x] Create/edit personnel records — CRUD endpoints
- [x] Assign role — PersonnelRole enum
- [x] Link to company — companyId relation
- [x] Track contact details — phone, mobile, email
- [x] Activate/deactivate — active boolean

### Credentials
- [x] Add multiple credentials per person — 1:N relation
- [x] Record credential type and details — CredentialType enum
- [x] Track expiry dates — expiryDate field
- [x] Generate formatted credential string — formatCredentials()
- [x] Alert on expiring credentials — getExpiringCredentials()
- [x] Verify credentials — verified boolean

### Report Integration
- [x] Assign author to report — Report.preparedById
- [x] Assign reviewer to report — Report.reviewedById
- [x] Assign inspectors to inspection — Inspection.inspectorId
- [x] Generate signature blocks — generateSignatureBlock()
- [x] Include credentials in Section 4 — formatCredentials()

### Company Management
- [x] Create/edit company details — CRUD endpoints
- [x] Upload company logo — POST /companies/:id/logo
- [x] Use in report headers/footers — logoPath field

### Validation
- [x] LBP license format validation — validateLBPLicense()
- [x] Email format validation — Prisma email type
- [x] Warn before credential expiry — alert thresholds
- [x] Prevent assigning inactive personnel — active check
- [x] Require reviewer credentials > author — validateReportAssignment()

---

## Next Steps

1. Review with Master for approval
2. Create user stories for implementation
