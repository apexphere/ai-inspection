# Design: Web Interface

**Status:** Draft  
**Sprint:** 4b  
**Author:** Archer  
**Requirement:** #159  
**Date:** 2026-02-19

## Context

Inspectors capture data on-site via WhatsApp (Phase 1). Back at the office, they need a web interface to review captured data, refine observations, manage photos/documents, and finalize reports (Phase 2).

The web app serves as the editing and review layer on top of the existing API backend.

## Decision

Extend the existing Next.js 16 scaffold (`web/`) with:
- Two-layer navigation (Project List → Project Page)
- Server Components for data fetching
- Client Components for interactive editing
- Auto-save with optimistic updates
- Session-based authentication

## Architecture

### Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              App Layout                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Header: Logo | User Menu | Logout                                      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                                                                         │  │
│  │  /projects                    /projects/:id                            │  │
│  │  ┌─────────────────────┐     ┌─────────────────────────────────────┐  │  │
│  │  │   ProjectList       │     │   ProjectPage                       │  │  │
│  │  │   ├── SearchBar     │     │   ├── ProjectHeader                 │  │  │
│  │  │   ├── FilterDropdown│     │   ├── Section (expandable)          │  │  │
│  │  │   └── ProjectTable  │     │   │   ├── ProjectInfo               │  │  │
│  │  │       └── Row       │     │   │   ├── PropertyDetails           │  │  │
│  │  │                     │     │   │   ├── BuildingHistory           │  │  │
│  │  └─────────────────────┘     │   │   ├── InspectionDetails         │  │  │
│  │                               │   │   ├── ClauseReviews             │  │  │
│  │                               │   │   ├── Documents                 │  │  │
│  │                               │   │   └── Photos                    │  │  │
│  │                               │   └── SaveIndicator                 │  │  │
│  │                               └─────────────────────────────────────┘  │  │
│  │                                                                         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Next.js    │────▶│   API        │────▶│   Database   │
│   (RSC/RCC)  │◀────│   (Express)  │◀────│   (Postgres) │
└──────────────┘     └──────────────┘     └──────────────┘
       │
       ▼
┌──────────────┐
│   Browser    │
│   State      │
│   (optimistic)│
└──────────────┘
```

### Route Structure

```
app/
├── (auth)/
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── forgot-password/page.tsx
├── (dashboard)/
│   ├── layout.tsx           # Authenticated layout with header
│   ├── projects/
│   │   ├── page.tsx         # Project list
│   │   └── [id]/
│   │       └── page.tsx     # Project detail/edit
│   └── settings/
│       └── page.tsx         # User settings
└── api/
    └── auth/
        └── [...nextauth]/route.ts
```

## Authentication

### MVP: Email + Password with NextAuth.js

```typescript
// Auth configuration
const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Call API to validate credentials
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          body: JSON.stringify(credentials),
          headers: { "Content-Type": "application/json" }
        });
        const user = await res.json();
        if (res.ok && user) return user;
        return null;
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/login',
    error: '/login',
  }
};
```

### API Auth Endpoints (new)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, return JWT |
| POST | `/api/auth/logout` | Invalidate session |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password` | Set new password |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/me` | Update profile |
| POST | `/api/auth/link-whatsapp` | Link WhatsApp number |

### User Schema (addition to Prisma)

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  name          String
  phone         String?   // WhatsApp number for linking
  role          UserRole  @default(INSPECTOR)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  projects      Project[] // Projects this user can access
  inspections   Inspection[] @relation("inspector")
}

enum UserRole {
  INSPECTOR
  SENIOR_SURVEYOR
  ADMIN
}
```

## Project List Page

### Server Component (data fetching)

```typescript
// app/(dashboard)/projects/page.tsx
export default async function ProjectsPage({
  searchParams
}: {
  searchParams: { status?: string; search?: string; sort?: string }
}) {
  const projects = await getProjects({
    status: searchParams.status,
    search: searchParams.search,
    sort: searchParams.sort || 'updatedAt:desc'
  });
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Projects</h1>
      <ProjectFilters />
      <ProjectTable projects={projects} />
    </div>
  );
}
```

### Client Components

```typescript
// components/project-table.tsx
'use client';

interface ProjectTableProps {
  projects: Project[];
}

export function ProjectTable({ projects }: ProjectTableProps) {
  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>Job #</th>
          <th>Address</th>
          <th>Client</th>
          <th>Status</th>
          <th>Last Updated</th>
        </tr>
      </thead>
      <tbody>
        {projects.map(project => (
          <ProjectRow key={project.id} project={project} />
        ))}
      </tbody>
    </table>
  );
}
```

## Project Page (Edit Mode)

### Expandable Sections

```typescript
// components/section.tsx
'use client';

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  completionStatus?: string; // e.g., "3/5 complete"
  children: React.ReactNode;
}

export function Section({ title, defaultOpen = false, completionStatus, children }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border rounded-lg mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex justify-between items-center"
      >
        <span className="font-medium">{title}</span>
        <div className="flex items-center gap-2">
          {completionStatus && (
            <span className="text-sm text-gray-500">{completionStatus}</span>
          )}
          <ChevronIcon className={isOpen ? 'rotate-180' : ''} />
        </div>
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
}
```

### Section Order

| Order | Section | Description |
|-------|---------|-------------|
| 1 | Project Info | Job number, client, type, dates |
| 2 | Property | Address, zones, construction details |
| 3 | Building History | Consent timeline |
| 4 | Inspection | Date, weather, equipment, methodology |
| 5 | Clause Review | Per-clause observations (main editing area) |
| 6 | Documents | Uploaded documents with status |
| 7 | Photos | All photos with captions |

## Auto-Save System

### Hook Implementation

```typescript
// hooks/use-auto-save.ts
'use client';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  debounceMs?: number;
}

export function useAutoSave<T>({ data, onSave, debounceMs = 1000 }: UseAutoSaveOptions<T>) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  
  // Track previous data for undo
  const history = useRef<T[]>([]);
  const historyIndex = useRef(-1);
  
  // Debounced save
  const debouncedSave = useMemo(
    () => debounce(async (newData: T) => {
      setStatus('saving');
      try {
        await onSave(newData);
        setStatus('saved');
        // Reset to idle after 2 seconds
        setTimeout(() => setStatus('idle'), 2000);
      } catch (err) {
        setStatus('error');
        setError(err.message);
      }
    }, debounceMs),
    [onSave, debounceMs]
  );
  
  // Save on data change
  useEffect(() => {
    if (data !== history.current[historyIndex.current]) {
      // Push to history
      history.current = [...history.current.slice(0, historyIndex.current + 1), data];
      historyIndex.current++;
      
      debouncedSave(data);
    }
  }, [data, debouncedSave]);
  
  // Undo handler
  const undo = useCallback(() => {
    if (historyIndex.current > 0) {
      historyIndex.current--;
      return history.current[historyIndex.current];
    }
    return null;
  }, []);
  
  // Redo handler
  const redo = useCallback(() => {
    if (historyIndex.current < history.current.length - 1) {
      historyIndex.current++;
      return history.current[historyIndex.current];
    }
    return null;
  }, []);
  
  return { status, error, undo, redo };
}
```

### Save Indicator Component

```typescript
// components/save-indicator.tsx
'use client';

interface SaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
}

export function SaveIndicator({ status }: SaveIndicatorProps) {
  if (status === 'idle') return null;
  
  return (
    <div className="fixed bottom-4 right-4 px-3 py-2 rounded-lg shadow-lg">
      {status === 'saving' && (
        <span className="text-gray-600">
          <Spinner className="inline mr-2" /> Saving...
        </span>
      )}
      {status === 'saved' && (
        <span className="text-green-600">
          <CheckIcon className="inline mr-2" /> Saved
        </span>
      )}
      {status === 'error' && (
        <span className="text-red-600">
          <XIcon className="inline mr-2" /> Save failed
        </span>
      )}
    </div>
  );
}
```

### Keyboard Shortcuts

```typescript
// hooks/use-keyboard-shortcuts.ts
'use client';

export function useKeyboardShortcuts({ onUndo, onRedo }: {
  onUndo: () => void;
  onRedo: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          onRedo();
        } else {
          onUndo();
        }
      }
    };
    
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onUndo, onRedo]);
}
```

## Observation Editor

### Plain Text Editor (MVP)

```typescript
// components/observation-editor.tsx
'use client';

interface ObservationEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ObservationEditor({ value, onChange, placeholder }: ObservationEditorProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => {/* triggers auto-save via parent */}}
      placeholder={placeholder}
      className="w-full min-h-[100px] p-3 border rounded-lg resize-y"
    />
  );
}
```

### Clause Review Section

```typescript
// components/clause-review-section.tsx
'use client';

interface ClauseReviewSectionProps {
  inspectionId: string;
  clauseReviews: ClauseReview[];
}

export function ClauseReviewSection({ inspectionId, clauseReviews }: ClauseReviewSectionProps) {
  return (
    <div className="space-y-4">
      {clauseReviews.map(review => (
        <ClauseReviewCard
          key={review.id}
          review={review}
          onUpdate={(data) => updateClauseReview(review.id, data)}
        />
      ))}
    </div>
  );
}

function ClauseReviewCard({ review, onUpdate }: {
  review: ClauseReview;
  onUpdate: (data: Partial<ClauseReview>) => void;
}) {
  const [observations, setObservations] = useState(review.observations || '');
  
  const { status } = useAutoSave({
    data: { observations },
    onSave: (data) => onUpdate(data),
  });
  
  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-medium">{review.clause.code} {review.clause.title}</h4>
          <p className="text-sm text-gray-500">{review.clause.performanceText}</p>
        </div>
        <ApplicabilityBadge value={review.applicability} />
      </div>
      
      <ObservationEditor
        value={observations}
        onChange={setObservations}
        placeholder="Enter observations..."
      />
      
      <div className="mt-2 flex gap-2">
        <PhotoThumbnails photoIds={review.photoIds} />
        <DocumentChips docIds={review.docIds} />
      </div>
    </div>
  );
}
```

## Photo Management

### Photo Grid

```typescript
// components/photo-grid.tsx
'use client';

interface PhotoGridProps {
  photos: Photo[];
  onReorder: (photoIds: string[]) => void;
  onMove: (photoId: string, targetClauseId: string) => void;
  onDelete: (photoId: string) => void;
  onCaptionChange: (photoId: string, caption: string) => void;
}

export function PhotoGrid({
  photos,
  onReorder,
  onMove,
  onDelete,
  onCaptionChange
}: PhotoGridProps) {
  return (
    <DndContext onDragEnd={handleDragEnd}>
      <SortableContext items={photos.map(p => p.id)}>
        <div className="grid grid-cols-4 gap-4">
          {photos.map(photo => (
            <SortablePhotoCard
              key={photo.id}
              photo={photo}
              onDelete={() => onDelete(photo.id)}
              onCaptionChange={(caption) => onCaptionChange(photo.id, caption)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
```

### Photo Card

```typescript
// components/photo-card.tsx
'use client';

interface PhotoCardProps {
  photo: Photo;
  onDelete: () => void;
  onCaptionChange: (caption: string) => void;
}

export function PhotoCard({ photo, onDelete, onCaptionChange }: PhotoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [caption, setCaption] = useState(photo.caption);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  return (
    <div className="relative group">
      <img
        src={photo.thumbnailUrl}
        alt={photo.caption}
        className="w-full aspect-square object-cover rounded-lg"
        onClick={() => {/* open lightbox */}}
      />
      
      {/* Delete button */}
      <button
        onClick={() => setShowDeleteConfirm(true)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
      >
        <TrashIcon />
      </button>
      
      {/* Caption */}
      {isEditing ? (
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onBlur={() => {
            setIsEditing(false);
            onCaptionChange(caption);
          }}
          className="w-full mt-2 text-sm"
          autoFocus
        />
      ) : (
        <p
          onClick={() => setIsEditing(true)}
          className="mt-2 text-sm text-gray-600 cursor-pointer"
        >
          {caption || 'Add caption...'}
        </p>
      )}
      
      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Photo"
          message="Are you sure? This cannot be undone."
          onConfirm={() => {
            onDelete();
            setShowDeleteConfirm(false);
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
```

## Document Upload

### Drag & Drop Zone

```typescript
// components/document-upload.tsx
'use client';

interface DocumentUploadProps {
  projectId: string;
  onUpload: (files: File[]) => void;
}

export function DocumentUpload({ projectId, onUpload }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  
  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer?.files || []);
    await uploadFiles(files);
  };
  
  const uploadFiles = async (files: File[]) => {
    for (const file of files) {
      const id = crypto.randomUUID();
      setUploads(prev => [...prev, { id, name: file.name, progress: 0 }]);
      
      // Upload with progress tracking
      await uploadDocument(projectId, file, (progress) => {
        setUploads(prev => 
          prev.map(u => u.id === id ? { ...u, progress } : u)
        );
      });
      
      setUploads(prev => prev.filter(u => u.id !== id));
    }
    
    onUpload(files);
  };
  
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
      `}
    >
      <p>Drag & drop files here, or click to browse</p>
      
      {uploads.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploads.map(upload => (
            <UploadProgressBar key={upload.id} {...upload} />
          ))}
        </div>
      )}
    </div>
  );
}
```

## API Client

### Fetch Wrapper with Auth

```typescript
// lib/api.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const session = await getSession();
  
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.accessToken}`,
      ...options.headers,
    },
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'API Error');
  }
  
  return res.json();
}

// Project API
export const projectsApi = {
  list: (params?: ProjectListParams) => 
    apiFetch<Project[]>('/api/projects?' + new URLSearchParams(params)),
  
  get: (id: string) => 
    apiFetch<ProjectDetail>(`/api/projects/${id}`),
  
  update: (id: string, data: Partial<Project>) =>
    apiFetch<Project>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Clause Review API
export const clauseReviewsApi = {
  update: (id: string, data: Partial<ClauseReview>) =>
    apiFetch<ClauseReview>(`/api/clause-reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};
```

## Dependencies

| Dependency | Purpose |
|------------|---------|
| #150 Inspection Checklist | ClauseReview data to display/edit |
| #152 Document/Photo | Photo/document management |
| #154 Project Management | Project data |
| #157 Report Workflow | Status transitions |

## Alternatives Considered

### 1. Server Actions Only (No Client Components)

**Rejected.** Auto-save with debouncing, drag & drop, and undo/redo require client-side state. Hybrid approach with RSC for data fetching and RCC for interactivity is appropriate.

### 2. Separate Edit Mode / View Mode

**Rejected.** Single inline editing mode is simpler and matches the requirement. Users don't need to explicitly enter edit mode.

### 3. Rich Text Editor for MVP

**Deferred.** Plain text is sufficient for MVP. Rich text (TipTap/ProseMirror) can be added later without major refactoring.

### 4. OAuth/Social Login for MVP

**Deferred.** Email + password is simpler to implement. OAuth can be added later.

## Implementation Notes

### Optimistic Updates

For a responsive editing experience, update local state immediately and sync with server in background. If sync fails, show error and allow retry.

### WhatsApp Linking

During registration or in settings, user can link their WhatsApp number. API validates ownership via verification code sent to WhatsApp.

### Session Handling

- JWT stored in HTTP-only cookie
- 24-hour expiry (configurable)
- Refresh on activity

### Error Boundaries

Wrap sections in error boundaries to prevent entire page crash on section-level errors.

## Acceptance Criteria Mapping

### Project List
- [x] Display all projects → ProjectTable component
- [x] Show job number, address, client, status, last updated → ProjectRow
- [x] Sort by any column → URL params + API sort
- [x] Filter by status → FilterDropdown + URL params
- [x] Search by address/job number → SearchBar + URL params
- [x] Click to open project → Next.js routing

### Project Page
- [x] Single scroll layout → Sections with overflow
- [x] Expandable sections → Section component
- [x] All WhatsApp data displayed → ClauseReviewSection
- [x] Section headers show completion → completionStatus prop

### Editing
- [x] Edit observation text → ObservationEditor
- [x] Auto-save on edit → useAutoSave hook
- [x] Ctrl+Z undo → useKeyboardShortcuts
- [x] Visual save indicator → SaveIndicator component

### Photo Management
- [x] View thumbnails by clause → PhotoGrid
- [x] Edit caption inline → PhotoCard
- [x] Drag & drop reorder → DndContext + SortableContext
- [x] Drag & drop move between clauses → onMove handler
- [x] Delete with confirmation → ConfirmDialog

### Authentication
- [x] Register with email + password → /register page
- [x] Login with email + password → /login page
- [x] Password reset flow → /forgot-password page
- [x] Session management → NextAuth.js
- [x] Link WhatsApp number → /settings page

---

## Next Steps

1. Review with Master for approval
2. Create user stories for implementation
3. Coordinate with API team for auth endpoints
