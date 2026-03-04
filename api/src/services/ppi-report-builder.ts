/**
 * PPI Report Builder Service
 *
 * Fetches all data for a site inspection and returns structured PpiReportData
 * for PDF generation.
 */

import { PrismaClient, type ChecklistItem, type ProjectPhoto } from '@prisma/client';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './data/uploads';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface PpiReportData {
  project: {
    jobNumber: string;
    address: string;
    client: string;
    company?: string;
  };
  property: {
    type?: string;
    yearBuilt?: number;
    bedrooms?: number;
    bathrooms?: number;
  };
  personnel: {
    author: { name: string; credentials?: string };
    reviewer?: { name: string; credentials?: string };
  };
  inspection: {
    date: string;
    weather?: string;
  };
  sections: {
    site: { items: FindingRow[]; conclusion?: string };
    exterior: { items: FindingRow[]; conclusion?: string };
    interior: RoomGroup[];
    services: { items: FindingRow[]; conclusion?: string };
  };
  photos: PhotoEntry[];
  generatedAt: string;
}

export interface FindingRow {
  name: string;
  decision: string;
  notes: string;
  photoNumbers: number[];
}

export interface RoomGroup {
  room: string;
  items: FindingRow[];
  conclusion?: string;
}

export interface PhotoEntry {
  number: number;
  dataUri: string;
  caption: string;
  location: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Service
// ──────────────────────────────────────────────────────────────────────────────

export class PpiReportBuilder {
  constructor(private prisma: PrismaClient) {}

  /**
   * Build complete PPI report data for an inspection.
   */
  async build(inspectionId: string): Promise<PpiReportData> {
    // Fetch inspection with all related data
    const inspection = await this.prisma.siteInspection.findUniqueOrThrow({
      where: { id: inspectionId },
      include: {
        project: {
          include: {
            client: true,
            property: true,
          },
        },
        checklistItems: {
          orderBy: { sortOrder: 'asc' },
        },
        sectionConclusions: true,
      },
    });

    const { project } = inspection;
    const { property, client } = project;

    // Fetch project photos
    const projectPhotos = await this.prisma.projectPhoto.findMany({
      where: { projectId: project.id },
      orderBy: { reportNumber: 'asc' },
    });

    // Build photo ID → number map
    const photoIdToNumber = new Map<string, number>();
    projectPhotos.forEach((photo, index) => {
      photoIdToNumber.set(photo.id, index + 1);
    });

    // Build section conclusions map
    const conclusionMap = new Map<string, string>();
    for (const sc of inspection.sectionConclusions) {
      conclusionMap.set(sc.section, sc.conclusion);
    }

    // Group checklist items by category
    const siteItems = inspection.checklistItems.filter((i) => i.category === 'SITE');
    const exteriorItems = inspection.checklistItems.filter((i) => i.category === 'EXTERIOR');
    const interiorItems = inspection.checklistItems.filter((i) => i.category === 'INTERIOR');
    const servicesItems = inspection.checklistItems.filter((i) => i.category === 'SERVICES');

    // Group interior items by room
    const roomMap = new Map<string, ChecklistItem[]>();
    for (const item of interiorItems) {
      const room = item.room || 'General';
      const existing = roomMap.get(room) || [];
      existing.push(item);
      roomMap.set(room, existing);
    }

    const interiorGroups: RoomGroup[] = [];
    for (const [room, items] of roomMap) {
      interiorGroups.push({
        room,
        items: items.map((i) => this.toFindingRow(i, photoIdToNumber)),
      });
    }

    // Convert photos to base64 data URIs
    const photos = await this.buildPhotoEntries(projectPhotos);

    // Format inspection date
    const inspectionDate = this.formatDate(inspection.date);

    return {
      project: {
        jobNumber: project.jobNumber,
        address: this.formatAddress(property),
        client: client.name,
        company: client.contactPerson ? undefined : client.name,
      },
      property: {
        type: property.buildingType ?? undefined,
        yearBuilt: property.yearBuilt ?? undefined,
        bedrooms: property.bedrooms ?? undefined,
        bathrooms: property.bathrooms ?? undefined,
      },
      personnel: {
        author: {
          name: inspection.inspectorName,
          credentials: undefined, // Could be enhanced with user lookup
        },
        reviewer: undefined, // Could be added from Report.reviewedById
      },
      inspection: {
        date: inspectionDate,
        weather: inspection.weather ?? undefined,
      },
      sections: {
        site: {
          items: siteItems.map((i) => this.toFindingRow(i, photoIdToNumber)),
          conclusion: conclusionMap.get('SITE'),
        },
        exterior: {
          items: exteriorItems.map((i) => this.toFindingRow(i, photoIdToNumber)),
          conclusion: conclusionMap.get('EXTERIOR'),
        },
        interior: interiorGroups,
        services: {
          items: servicesItems.map((i) => this.toFindingRow(i, photoIdToNumber)),
          conclusion: conclusionMap.get('SERVICES'),
        },
      },
      photos,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Convert ChecklistItem to FindingRow.
   */
  private toFindingRow(
    item: ChecklistItem,
    photoIdToNumber: Map<string, number>
  ): FindingRow {
    const photoNumbers = (item.photoIds || [])
      .map((id) => photoIdToNumber.get(id))
      .filter((n): n is number => n !== undefined);

    return {
      name: item.item,
      decision: item.decision,
      notes: item.notes || '',
      photoNumbers,
    };
  }

  /**
   * Build photo entries with base64 data URIs.
   */
  private async buildPhotoEntries(photos: ProjectPhoto[]): Promise<PhotoEntry[]> {
    const entries: PhotoEntry[] = [];

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const number = i + 1;

      try {
        const filePath = path.join(UPLOAD_DIR, photo.filePath);
        const buffer = await readFile(filePath);
        const base64 = buffer.toString('base64');
        const mimeType = photo.mimeType || 'image/jpeg';
        const dataUri = `data:${mimeType};base64,${base64}`;

        // Parse location from JSON if present
        let location = '';
        if (photo.location) {
          const loc = photo.location as { description?: string };
          location = loc.description || '';
        }

        entries.push({
          number,
          dataUri,
          caption: photo.caption,
          location,
        });
      } catch {
        // Skip photos that can't be read
        entries.push({
          number,
          dataUri: '',
          caption: photo.caption,
          location: '',
        });
      }
    }

    return entries;
  }

  /**
   * Format property address.
   */
  private formatAddress(property: {
    streetAddress: string;
    suburb?: string | null;
    city?: string | null;
    postcode?: string | null;
  }): string {
    const parts = [property.streetAddress];
    if (property.suburb) parts.push(property.suburb);
    if (property.city) parts.push(property.city);
    if (property.postcode) parts.push(property.postcode);
    return parts.join(', ');
  }

  /**
   * Format date to DD MMM YYYY.
   */
  private formatDate(date: Date): string {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }
}
