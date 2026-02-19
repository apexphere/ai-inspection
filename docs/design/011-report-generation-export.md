# Design: Report Generation & Export

**Status:** Draft  
**Sprint:** 4c  
**Author:** Archer  
**Requirement:** #158  
**Date:** 2026-02-19

## Context

Building on #149 (COA Report Generation), this design covers the generation engine, multi-format export, and operational concerns like performance, error handling, and batch processing.

## Decision

Extend the report generation system with:
1. **Multi-format output** — PDF (Puppeteer) + DOCX (docx library)
2. **Background job queue** — async generation with progress tracking
3. **Image optimization** — compress photos during generation
4. **Cross-reference system** — clickable TOC and photo refs

## Architecture

### Generation Pipeline

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Report    │────▶│   Job       │────▶│   Renderer  │────▶│   Storage   │
│   Request   │     │   Queue     │     │   (PDF/DOCX)│     │   (S3)      │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                          │                    │
                          ▼                    ▼
                    ┌───────────┐        ┌───────────┐
                    │  Progress │        │  Image    │
                    │  Events   │        │  Optimizer│
                    └───────────┘        └───────────┘
```

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| GenerationService | Orchestrates generation, creates jobs |
| JobQueue | BullMQ queue for async processing |
| PdfRenderer | Puppeteer-based PDF generation |
| DocxRenderer | docx library for Word output |
| ImageOptimizer | Sharp-based image compression |
| StorageService | S3/local file storage |
| ProgressEmitter | SSE/WebSocket progress updates |

## API Endpoints

### Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reports/:id/generate` | Start generation job |
| GET | `/api/reports/:id/generate/status` | Get job progress |
| GET | `/api/reports/:id/preview` | HTML preview |
| GET | `/api/reports/:id/download/:format` | Download PDF/DOCX |

### Batch Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reports/batch/generate` | Generate multiple |
| GET | `/api/reports/batch/:batchId/status` | Batch progress |

## Job Queue

### Queue Configuration

```typescript
const generationQueue = new Queue('report-generation', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { age: 86400 }, // 24 hours
    removeOnFail: { age: 604800 },    // 7 days
  },
});
```

### Job Data

```typescript
interface GenerationJob {
  reportId: string;
  format: 'pdf' | 'docx' | 'both';
  options: {
    watermark?: boolean;      // Draft watermark
    compress?: boolean;       // Image compression
    quality?: 'draft' | 'final';
  };
  requestedBy: string;
  requestedAt: Date;
}
```

### Progress Events

```typescript
interface ProgressEvent {
  jobId: string;
  stage: 'preparing' | 'rendering' | 'optimizing' | 'uploading' | 'complete' | 'failed';
  progress: number;           // 0-100
  message: string;
  estimatedTimeMs?: number;
}
```

## Multi-Format Generation

### PDF Generation (Puppeteer)

```typescript
class PdfRenderer {
  async render(report: ReportData, options: PdfOptions): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    
    // Render HTML with embedded styles
    const html = await this.templateEngine.render('coa', report);
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '25mm', bottom: '25mm', left: '20mm', right: '20mm' },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: this.getHeaderTemplate(report),
      footerTemplate: this.getFooterTemplate(),
    });
    
    await browser.close();
    return pdf;
  }
}
```

### DOCX Generation

```typescript
import { Document, Packer, Paragraph, Table, TextRun, ImageRun } from 'docx';

class DocxRenderer {
  async render(report: ReportData): Promise<Buffer> {
    const doc = new Document({
      sections: [
        this.renderCoverPage(report),
        this.renderTableOfContents(),
        ...this.renderSections(report),
        ...this.renderAppendices(report),
      ],
    });
    
    return Packer.toBuffer(doc);
  }
  
  private renderClauseReviewTable(reviews: ClauseReview[]): Table {
    return new Table({
      rows: [
        this.headerRow(['NZBC Clause', 'Photos', 'Observations', 'Docs', 'Compliance', 'Remedial']),
        ...reviews.map(r => this.clauseRow(r)),
      ],
    });
  }
}
```

## Image Optimization

### Sharp Pipeline

```typescript
class ImageOptimizer {
  async optimize(photo: Photo): Promise<Buffer> {
    const image = sharp(photo.buffer);
    const metadata = await image.metadata();
    
    // Resize if too large
    if (metadata.width > 1920 || metadata.height > 1080) {
      image.resize(1920, 1080, { fit: 'inside', withoutEnlargement: true });
    }
    
    // Compress
    return image
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();
  }
  
  async optimizeForPdf(photo: Photo): Promise<string> {
    const optimized = await this.optimize(photo);
    return `data:image/jpeg;base64,${optimized.toString('base64')}`;
  }
}
```

### Size Targets

| Photo Count | Target Size | Strategy |
|-------------|-------------|----------|
| 1-20 | < 5MB | Quality 85% |
| 21-50 | < 10MB | Quality 75% |
| 50+ | < 20MB | Quality 65%, resize |

## Cross-References

### TOC Generation

```typescript
interface TocEntry {
  level: number;        // 1 = section, 2 = subsection
  title: string;
  pageNumber: number;
  anchor: string;       // For clickable links
}

function generateToc(html: string): TocEntry[] {
  // Parse headings and assign anchors
  const entries: TocEntry[] = [];
  // ... implementation
  return entries;
}
```

### Photo References

In body text: `See Photograph 7` → links to Appendix A, Photo 7

```typescript
function linkPhotoReferences(html: string, photos: Photo[]): string {
  return html.replace(/Photograph (\d+)/g, (match, num) => {
    return `<a href="#photo-${num}">${match}</a>`;
  });
}
```

## Error Handling

### Graceful Degradation

| Error | Handling |
|-------|----------|
| Missing photo file | Show placeholder image + log warning |
| Missing document | Show "Document not available" + continue |
| Missing variable | Show `[MISSING: varname]` in output |
| Timeout (>60s) | Retry once, then fail |
| Out of memory | Reduce image quality, retry |

### Validation Before Generation

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

async function validateForGeneration(reportId: string): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Check required fields
  if (!report.preparedBy) errors.push({ field: 'preparedBy', message: 'Author required' });
  
  // Check photos have captions
  for (const photo of report.photos) {
    if (!photo.caption) warnings.push({ field: `photo.${photo.id}`, message: 'Missing caption' });
  }
  
  // Check required documents
  // ...
  
  return { valid: errors.length === 0, errors, warnings };
}
```

## Storage

### File Organization

```
storage/
└── reports/
    └── {report_id}/
        ├── v1/
        │   ├── report.pdf
        │   └── report.docx
        ├── v2/
        │   ├── report.pdf
        │   └── report.docx
        └── preview.html
```

### Signed URLs

```typescript
async function getDownloadUrl(reportId: string, version: number, format: string): Promise<string> {
  const key = `reports/${reportId}/v${version}/report.${format}`;
  return s3.getSignedUrl('getObject', {
    Bucket: BUCKET,
    Key: key,
    Expires: 3600, // 1 hour
  });
}
```

## Performance

### Targets

| Metric | Target |
|--------|--------|
| Small report (10 photos) | < 10s |
| Medium report (30 photos) | < 20s |
| Large report (100 photos) | < 45s |
| Concurrent jobs | 5 |
| Memory per job | < 512MB |

### Optimization Strategies

1. **Parallel image processing** — Process photos concurrently
2. **Caching** — Cache rendered templates
3. **Streaming** — Stream large files to storage
4. **Worker pool** — Multiple Puppeteer instances

## Acceptance Criteria

### Generation
- [ ] Generate PDF from report data
- [ ] Generate DOCX from report data
- [ ] Background job with progress tracking
- [ ] Retry on failure

### Output Quality
- [ ] Cover page with branding
- [ ] Auto-generated TOC with links
- [ ] Clickable photo references
- [ ] Professional table formatting
- [ ] Photos in appendix with captions

### Performance
- [ ] < 30s for typical report
- [ ] < 512MB memory usage
- [ ] Support 5 concurrent generations

### Error Handling
- [ ] Validate before generation
- [ ] Handle missing attachments gracefully
- [ ] Show progress indicator
- [ ] Meaningful error messages

### Storage
- [ ] Store generated files in S3
- [ ] Version management
- [ ] Signed download URLs
- [ ] 24-hour link expiry

---

## Dependencies

- #149 COA Report Generation (base templates)
- #152 Document/Photo (attachments)
- #155 Personnel (author credentials)
- #156 Report Templates (section content)

## User Stories (after approval)

1. **Job queue setup** — BullMQ + Redis
2. **PDF renderer** — Puppeteer implementation
3. **DOCX renderer** — docx library implementation
4. **Image optimizer** — Sharp pipeline
5. **Progress tracking** — SSE/WebSocket events
6. **Storage integration** — S3 upload/download
7. **Batch export** — Multiple reports

## References

- Requirement: #158
- Related: #149, #152, #153
