/**
 * DOCX Generator Service — Issue #223
 *
 * Generates DOCX documents for COA reports using the docx npm package.
 */

import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  ImageRun,
  AlignmentType,
  WidthType,
  PageNumber,
  Footer,
  Header,
  NumberFormat,
  TableOfContents,
  convertInchesToTwip,
  VerticalAlign,
  ShadingType,
} from 'docx';
import { writeFile, readFile } from 'node:fs/promises';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface DocxGenerateOptions {
  reportData: DocxReportData;
  outputPath: string;
}

export interface DocxReportData {
  // Cover page
  companyName: string;
  companyLogoPath?: string;
  reportTitle: string;
  address: string;
  clientName: string;
  jobNumber: string;
  date: string;
  preparedBy: string;
  preparedByCredentials?: string;
  reviewedBy?: string;
  reviewedByCredentials?: string;

  // Sections (matching COA template)
  sections: DocxSection[];

  // Clause review table
  clauseReviews?: ClauseReviewRow[];

  // Building history table
  buildingHistory?: BuildingHistoryRow[];

  // Photos for appendix
  photos?: PhotoEntry[];
}

export interface DocxSection {
  title: string;
  content: string;
  subsections?: DocxSubsection[];
}

export interface DocxSubsection {
  title: string;
  content: string;
}

export interface ClauseReviewRow {
  clauseCode: string;
  title: string;
  applicability: 'APPLICABLE' | 'NA';
  observations: string;
  remedialWorks: string;
}

export interface BuildingHistoryRow {
  type: string;
  reference: string;
  year: string;
  status: string;
  description: string;
}

export interface PhotoEntry {
  imagePath: string;
  caption: string;
  photoNumber: number;
}

export interface DocxGenerateResult {
  outputPath: string;
  fileSize: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────

const BRAND_BLUE = '003366';
const FONT_FAMILY = 'Calibri';

// ──────────────────────────────────────────────────────────────────────────────
// Service
// ──────────────────────────────────────────────────────────────────────────────

export class DocxGeneratorService {
  /**
   * Generate a DOCX document from report data.
   */
  async generate(options: DocxGenerateOptions): Promise<DocxGenerateResult> {
    const { reportData, outputPath } = options;

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: FONT_FAMILY,
              size: 24, // 12pt
            },
          },
          heading1: {
            run: {
              font: FONT_FAMILY,
              size: 32, // 16pt
              bold: true,
              color: BRAND_BLUE,
            },
            paragraph: {
              spacing: { before: 400, after: 200 },
            },
          },
          heading2: {
            run: {
              font: FONT_FAMILY,
              size: 28, // 14pt
              bold: true,
              color: BRAND_BLUE,
            },
            paragraph: {
              spacing: { before: 300, after: 150 },
            },
          },
        },
      },
      sections: [
        // Cover page section
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(1),
                right: convertInchesToTwip(1),
                bottom: convertInchesToTwip(1),
                left: convertInchesToTwip(1),
              },
            },
          },
          children: await this.buildCoverPage(reportData),
        },
        // Content sections
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(1),
                right: convertInchesToTwip(1),
                bottom: convertInchesToTwip(1),
                left: convertInchesToTwip(1),
              },
              pageNumbers: {
                start: 1,
                formatType: NumberFormat.DECIMAL,
              },
            },
          },
          headers: {
            default: this.buildHeader(reportData.reportTitle),
          },
          footers: {
            default: this.buildFooter(reportData.jobNumber),
          },
          children: await this.buildContent(reportData),
        },
      ],
    });

    // Generate buffer and write to file
    const buffer = await Packer.toBuffer(doc);
    await writeFile(outputPath, buffer);

    return {
      outputPath,
      fileSize: buffer.length,
    };
  }

  /**
   * Build cover page content.
   */
  private async buildCoverPage(data: DocxReportData): Promise<Paragraph[]> {
    const elements: Paragraph[] = [];

    // Company logo or name
    if (data.companyLogoPath) {
      try {
        const imageBuffer = await readFile(data.companyLogoPath);
        elements.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new ImageRun({
                data: imageBuffer,
                transformation: {
                  width: 200,
                  height: 80,
                },
                type: 'png',
              }),
            ],
          }),
        );
      } catch {
        // Fall back to text if image can't be read
        elements.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({
                text: data.companyName,
                bold: true,
                size: 48,
                color: BRAND_BLUE,
              }),
            ],
          }),
        );
      }
    } else {
      elements.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [
            new TextRun({
              text: data.companyName,
              bold: true,
              size: 48,
              color: BRAND_BLUE,
            }),
          ],
        }),
      );
    }

    // Spacer
    elements.push(new Paragraph({ spacing: { after: 800 } }));

    // Report title
    elements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [
          new TextRun({
            text: data.reportTitle,
            bold: true,
            size: 56,
            color: BRAND_BLUE,
          }),
        ],
      }),
    );

    // Address
    elements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: data.address,
            size: 32,
          }),
        ],
      }),
    );

    // Spacer
    elements.push(new Paragraph({ spacing: { after: 800 } }));

    // Client
    elements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'Client: ', bold: true, size: 24 }),
          new TextRun({ text: data.clientName, size: 24 }),
        ],
      }),
    );

    // Job number
    elements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'Job Number: ', bold: true, size: 24 }),
          new TextRun({ text: data.jobNumber, size: 24 }),
        ],
      }),
    );

    // Date
    elements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
        children: [
          new TextRun({ text: 'Date: ', bold: true, size: 24 }),
          new TextRun({ text: data.date, size: 24 }),
        ],
      }),
    );

    // Spacer
    elements.push(new Paragraph({ spacing: { after: 800 } }));

    // Prepared by
    const preparedByText = data.preparedByCredentials
      ? `${data.preparedBy}, ${data.preparedByCredentials}`
      : data.preparedBy;
    elements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'Prepared by: ', bold: true, size: 24 }),
          new TextRun({ text: preparedByText, size: 24 }),
        ],
      }),
    );

    // Reviewed by (optional)
    if (data.reviewedBy) {
      const reviewedByText = data.reviewedByCredentials
        ? `${data.reviewedBy}, ${data.reviewedByCredentials}`
        : data.reviewedBy;
      elements.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: 'Reviewed by: ', bold: true, size: 24 }),
            new TextRun({ text: reviewedByText, size: 24 }),
          ],
        }),
      );
    }

    return elements;
  }

  /**
   * Build header for content pages.
   */
  private buildHeader(reportTitle: string): Header {
    return new Header({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: reportTitle,
              size: 18,
              color: '666666',
            }),
          ],
        }),
      ],
    });
  }

  /**
   * Build footer with page numbers.
   */
  private buildFooter(jobNumber: string): Footer {
    return new Footer({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'Confidential',
              size: 16,
              color: '666666',
            }),
            new TextRun({
              text: '    |    ',
              size: 16,
              color: '666666',
            }),
            new TextRun({
              text: jobNumber,
              size: 16,
              color: '666666',
            }),
            new TextRun({
              text: '    |    Page ',
              size: 16,
              color: '666666',
            }),
            new TextRun({
              children: [PageNumber.CURRENT],
              size: 16,
              color: '666666',
            }),
            new TextRun({
              text: ' of ',
              size: 16,
              color: '666666',
            }),
            new TextRun({
              children: [PageNumber.TOTAL_PAGES],
              size: 16,
              color: '666666',
            }),
          ],
        }),
      ],
    });
  }

  /**
   * Build main content sections.
   */
  private async buildContent(
    data: DocxReportData,
  ): Promise<(Paragraph | Table | TableOfContents)[]> {
    const elements: (Paragraph | Table | TableOfContents)[] = [];

    // Table of contents
    elements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: 'Table of Contents' })],
      }),
    );
    elements.push(...this.buildTextTableOfContents(data.sections));
    elements.push(new Paragraph({ spacing: { after: 400 } }));

    // Sections
    for (let i = 0; i < data.sections.length; i++) {
      const section = data.sections[i];
      elements.push(...this.buildSection(section, i + 1));
    }

    // Clause review table
    if (data.clauseReviews && data.clauseReviews.length > 0) {
      elements.push(...this.buildClauseReviewTable(data.clauseReviews));
    }

    // Building history table
    if (data.buildingHistory && data.buildingHistory.length > 0) {
      elements.push(...this.buildBuildingHistoryTable(data.buildingHistory));
    }

    // Photo appendix
    if (data.photos && data.photos.length > 0) {
      elements.push(...(await this.buildPhotoAppendix(data.photos)));
    }

    return elements;
  }

  /**
   * Build a simple text-based table of contents.
   */
  private buildTextTableOfContents(sections: DocxSection[]): Paragraph[] {
    return sections.map(
      (section, index) =>
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: `${index + 1}. ${section.title}`,
              size: 24,
            }),
          ],
        }),
    );
  }

  /**
   * Build a section with heading and content.
   */
  private buildSection(section: DocxSection, sectionNumber: number): Paragraph[] {
    const elements: Paragraph[] = [];

    // Section heading
    elements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [
          new TextRun({
            text: `${sectionNumber}. ${section.title}`,
          }),
        ],
      }),
    );

    // Section content
    if (section.content) {
      const paragraphs = section.content.split('\n\n');
      for (const para of paragraphs) {
        if (para.trim()) {
          elements.push(
            new Paragraph({
              spacing: { after: 200 },
              children: [new TextRun({ text: para.trim() })],
            }),
          );
        }
      }
    }

    // Subsections
    if (section.subsections) {
      for (const subsection of section.subsections) {
        elements.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: subsection.title })],
          }),
        );

        if (subsection.content) {
          const subParagraphs = subsection.content.split('\n\n');
          for (const para of subParagraphs) {
            if (para.trim()) {
              elements.push(
                new Paragraph({
                  spacing: { after: 200 },
                  children: [new TextRun({ text: para.trim() })],
                }),
              );
            }
          }
        }
      }
    }

    return elements;
  }

  /**
   * Build clause review table.
   */
  private buildClauseReviewTable(reviews: ClauseReviewRow[]): (Paragraph | Table)[] {
    const elements: (Paragraph | Table)[] = [];

    // Table header row
    const headerRow = new TableRow({
      tableHeader: true,
      children: [
        this.buildHeaderCell('Clause Code'),
        this.buildHeaderCell('Title'),
        this.buildHeaderCell('Applicability'),
        this.buildHeaderCell('Observations'),
        this.buildHeaderCell('Remedial Works'),
      ],
    });

    // Data rows
    const dataRows = reviews.map(
      (review) =>
        new TableRow({
          children: [
            this.buildDataCell(review.clauseCode),
            this.buildDataCell(review.title),
            this.buildDataCell(review.applicability),
            this.buildDataCell(review.observations),
            this.buildDataCell(review.remedialWorks),
          ],
        }),
    );

    elements.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow, ...dataRows],
      }),
    );

    return elements;
  }

  /**
   * Build building history table.
   */
  private buildBuildingHistoryTable(history: BuildingHistoryRow[]): (Paragraph | Table)[] {
    const elements: (Paragraph | Table)[] = [];

    // Table header row
    const headerRow = new TableRow({
      tableHeader: true,
      children: [
        this.buildHeaderCell('Type'),
        this.buildHeaderCell('Reference'),
        this.buildHeaderCell('Year'),
        this.buildHeaderCell('Status'),
        this.buildHeaderCell('Description'),
      ],
    });

    // Data rows
    const dataRows = history.map(
      (row) =>
        new TableRow({
          children: [
            this.buildDataCell(row.type),
            this.buildDataCell(row.reference),
            this.buildDataCell(row.year),
            this.buildDataCell(row.status),
            this.buildDataCell(row.description),
          ],
        }),
    );

    elements.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow, ...dataRows],
      }),
    );

    return elements;
  }

  /**
   * Build table header cell with styling.
   */
  private buildHeaderCell(text: string): TableCell {
    return new TableCell({
      shading: {
        type: ShadingType.SOLID,
        color: BRAND_BLUE,
        fill: BRAND_BLUE,
      },
      verticalAlign: VerticalAlign.CENTER,
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text,
              bold: true,
              color: 'FFFFFF',
              size: 22,
            }),
          ],
        }),
      ],
    });
  }

  /**
   * Build table data cell.
   */
  private buildDataCell(text: string): TableCell {
    return new TableCell({
      verticalAlign: VerticalAlign.CENTER,
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: text || '',
              size: 22,
            }),
          ],
        }),
      ],
    });
  }

  /**
   * Build photo appendix section.
   */
  private async buildPhotoAppendix(photos: PhotoEntry[]): Promise<Paragraph[]> {
    const elements: Paragraph[] = [];

    // Appendix heading
    elements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: 'Appendix A: Photographs' })],
      }),
    );

    for (const photo of photos) {
      try {
        const imageBuffer = await readFile(photo.imagePath);
        elements.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 100 },
            children: [
              new ImageRun({
                data: imageBuffer,
                transformation: {
                  width: 400,
                  height: 300,
                },
                type: 'jpg',
              }),
            ],
          }),
        );
        elements.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: `Photo ${photo.photoNumber}: ${photo.caption}`,
                italics: true,
                size: 20,
              }),
            ],
          }),
        );
      } catch {
        // Skip photos that can't be read
        elements.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: `Photo ${photo.photoNumber}: ${photo.caption} (image not available)`,
                italics: true,
                size: 20,
              }),
            ],
          }),
        );
      }
    }

    return elements;
  }
}
