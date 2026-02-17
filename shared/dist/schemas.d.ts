/**
 * Zod Schemas — Issue #42
 *
 * Validation schemas that match the TypeScript types.
 */
import { z } from 'zod';
import { Status, Severity } from './types.js';
export declare const StatusSchema: z.ZodNativeEnum<typeof Status>;
export declare const SeveritySchema: z.ZodNativeEnum<typeof Severity>;
export declare const PhotoSchema: z.ZodObject<{
    id: z.ZodString;
    findingId: z.ZodString;
    filename: z.ZodString;
    path: z.ZodString;
    mimeType: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    findingId: string;
    filename: string;
    path: string;
    mimeType: string;
}, {
    id: string;
    findingId: string;
    filename: string;
    path: string;
    mimeType: string;
}>;
export declare const FindingSchema: z.ZodObject<{
    id: z.ZodString;
    inspectionId: z.ZodString;
    section: z.ZodString;
    text: z.ZodString;
    severity: z.ZodNativeEnum<typeof Severity>;
    matchedComment: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    photos: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        findingId: z.ZodString;
        filename: z.ZodString;
        path: z.ZodString;
        mimeType: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        findingId: string;
        filename: string;
        path: string;
        mimeType: string;
    }, {
        id: string;
        findingId: string;
        filename: string;
        path: string;
        mimeType: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    inspectionId: string;
    section: string;
    text: string;
    severity: Severity;
    createdAt: Date;
    updatedAt: Date;
    matchedComment?: string | undefined;
    photos?: {
        id: string;
        findingId: string;
        filename: string;
        path: string;
        mimeType: string;
    }[] | undefined;
}, {
    id: string;
    inspectionId: string;
    section: string;
    text: string;
    severity: Severity;
    createdAt: Date;
    updatedAt: Date;
    matchedComment?: string | undefined;
    photos?: {
        id: string;
        findingId: string;
        filename: string;
        path: string;
        mimeType: string;
    }[] | undefined;
}>;
export declare const InspectionSchema: z.ZodObject<{
    id: z.ZodString;
    address: z.ZodString;
    clientName: z.ZodString;
    inspectorName: z.ZodOptional<z.ZodString>;
    checklistId: z.ZodString;
    status: z.ZodNativeEnum<typeof Status>;
    currentSection: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    completedAt: z.ZodOptional<z.ZodDate>;
    findings: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        inspectionId: z.ZodString;
        section: z.ZodString;
        text: z.ZodString;
        severity: z.ZodNativeEnum<typeof Severity>;
        matchedComment: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        photos: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            findingId: z.ZodString;
            filename: z.ZodString;
            path: z.ZodString;
            mimeType: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
            findingId: string;
            filename: string;
            path: string;
            mimeType: string;
        }, {
            id: string;
            findingId: string;
            filename: string;
            path: string;
            mimeType: string;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        inspectionId: string;
        section: string;
        text: string;
        severity: Severity;
        createdAt: Date;
        updatedAt: Date;
        matchedComment?: string | undefined;
        photos?: {
            id: string;
            findingId: string;
            filename: string;
            path: string;
            mimeType: string;
        }[] | undefined;
    }, {
        id: string;
        inspectionId: string;
        section: string;
        text: string;
        severity: Severity;
        createdAt: Date;
        updatedAt: Date;
        matchedComment?: string | undefined;
        photos?: {
            id: string;
            findingId: string;
            filename: string;
            path: string;
            mimeType: string;
        }[] | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: Status;
    createdAt: Date;
    updatedAt: Date;
    address: string;
    clientName: string;
    checklistId: string;
    currentSection: string;
    inspectorName?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    completedAt?: Date | undefined;
    findings?: {
        id: string;
        inspectionId: string;
        section: string;
        text: string;
        severity: Severity;
        createdAt: Date;
        updatedAt: Date;
        matchedComment?: string | undefined;
        photos?: {
            id: string;
            findingId: string;
            filename: string;
            path: string;
            mimeType: string;
        }[] | undefined;
    }[] | undefined;
}, {
    id: string;
    status: Status;
    createdAt: Date;
    updatedAt: Date;
    address: string;
    clientName: string;
    checklistId: string;
    currentSection: string;
    inspectorName?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    completedAt?: Date | undefined;
    findings?: {
        id: string;
        inspectionId: string;
        section: string;
        text: string;
        severity: Severity;
        createdAt: Date;
        updatedAt: Date;
        matchedComment?: string | undefined;
        photos?: {
            id: string;
            findingId: string;
            filename: string;
            path: string;
            mimeType: string;
        }[] | undefined;
    }[] | undefined;
}>;
export declare const PhotoResponseSchema: z.ZodObject<{
    id: z.ZodString;
    findingId: z.ZodString;
    filename: z.ZodString;
    path: z.ZodString;
    mimeType: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    findingId: string;
    filename: string;
    path: string;
    mimeType: string;
}, {
    id: string;
    findingId: string;
    filename: string;
    path: string;
    mimeType: string;
}>;
export declare const FindingResponseSchema: z.ZodObject<{
    id: z.ZodString;
    inspectionId: z.ZodString;
    section: z.ZodString;
    text: z.ZodString;
    severity: z.ZodNativeEnum<typeof Severity>;
    matchedComment: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    photos: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        findingId: z.ZodString;
        filename: z.ZodString;
        path: z.ZodString;
        mimeType: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        findingId: string;
        filename: string;
        path: string;
        mimeType: string;
    }, {
        id: string;
        findingId: string;
        filename: string;
        path: string;
        mimeType: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    inspectionId: string;
    section: string;
    text: string;
    severity: Severity;
    matchedComment: string | null;
    createdAt: string;
    updatedAt: string;
    photos: {
        id: string;
        findingId: string;
        filename: string;
        path: string;
        mimeType: string;
    }[];
}, {
    id: string;
    inspectionId: string;
    section: string;
    text: string;
    severity: Severity;
    matchedComment: string | null;
    createdAt: string;
    updatedAt: string;
    photos: {
        id: string;
        findingId: string;
        filename: string;
        path: string;
        mimeType: string;
    }[];
}>;
export declare const InspectionResponseSchema: z.ZodObject<{
    id: z.ZodString;
    address: z.ZodString;
    clientName: z.ZodString;
    inspectorName: z.ZodNullable<z.ZodString>;
    checklistId: z.ZodString;
    status: z.ZodNativeEnum<typeof Status>;
    currentSection: z.ZodString;
    metadata: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    completedAt: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: Status;
    createdAt: string;
    updatedAt: string;
    address: string;
    clientName: string;
    inspectorName: string | null;
    checklistId: string;
    currentSection: string;
    metadata: Record<string, unknown> | null;
    completedAt: string | null;
}, {
    id: string;
    status: Status;
    createdAt: string;
    updatedAt: string;
    address: string;
    clientName: string;
    inspectorName: string | null;
    checklistId: string;
    currentSection: string;
    metadata: Record<string, unknown> | null;
    completedAt: string | null;
}>;
export declare const InspectionDetailResponseSchema: z.ZodObject<{
    id: z.ZodString;
    address: z.ZodString;
    clientName: z.ZodString;
    inspectorName: z.ZodNullable<z.ZodString>;
    checklistId: z.ZodString;
    status: z.ZodNativeEnum<typeof Status>;
    currentSection: z.ZodString;
    metadata: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    completedAt: z.ZodNullable<z.ZodString>;
} & {
    findings: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        inspectionId: z.ZodString;
        section: z.ZodString;
        text: z.ZodString;
        severity: z.ZodNativeEnum<typeof Severity>;
        matchedComment: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        photos: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            findingId: z.ZodString;
            filename: z.ZodString;
            path: z.ZodString;
            mimeType: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
            findingId: string;
            filename: string;
            path: string;
            mimeType: string;
        }, {
            id: string;
            findingId: string;
            filename: string;
            path: string;
            mimeType: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        id: string;
        inspectionId: string;
        section: string;
        text: string;
        severity: Severity;
        matchedComment: string | null;
        createdAt: string;
        updatedAt: string;
        photos: {
            id: string;
            findingId: string;
            filename: string;
            path: string;
            mimeType: string;
        }[];
    }, {
        id: string;
        inspectionId: string;
        section: string;
        text: string;
        severity: Severity;
        matchedComment: string | null;
        createdAt: string;
        updatedAt: string;
        photos: {
            id: string;
            findingId: string;
            filename: string;
            path: string;
            mimeType: string;
        }[];
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: Status;
    createdAt: string;
    updatedAt: string;
    address: string;
    clientName: string;
    inspectorName: string | null;
    checklistId: string;
    currentSection: string;
    metadata: Record<string, unknown> | null;
    completedAt: string | null;
    findings: {
        id: string;
        inspectionId: string;
        section: string;
        text: string;
        severity: Severity;
        matchedComment: string | null;
        createdAt: string;
        updatedAt: string;
        photos: {
            id: string;
            findingId: string;
            filename: string;
            path: string;
            mimeType: string;
        }[];
    }[];
}, {
    id: string;
    status: Status;
    createdAt: string;
    updatedAt: string;
    address: string;
    clientName: string;
    inspectorName: string | null;
    checklistId: string;
    currentSection: string;
    metadata: Record<string, unknown> | null;
    completedAt: string | null;
    findings: {
        id: string;
        inspectionId: string;
        section: string;
        text: string;
        severity: Severity;
        matchedComment: string | null;
        createdAt: string;
        updatedAt: string;
        photos: {
            id: string;
            findingId: string;
            filename: string;
            path: string;
            mimeType: string;
        }[];
    }[];
}>;
export declare const CreateInspectionInputSchema: z.ZodObject<{
    address: z.ZodString;
    clientName: z.ZodString;
    inspectorName: z.ZodOptional<z.ZodString>;
    checklistId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    address: string;
    clientName: string;
    checklistId: string;
    inspectorName?: string | undefined;
}, {
    address: string;
    clientName: string;
    checklistId: string;
    inspectorName?: string | undefined;
}>;
export declare const UpdateInspectionInputSchema: z.ZodObject<{
    address: z.ZodOptional<z.ZodString>;
    clientName: z.ZodOptional<z.ZodString>;
    inspectorName: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof Status>>;
    currentSection: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: Status | undefined;
    address?: string | undefined;
    clientName?: string | undefined;
    inspectorName?: string | undefined;
    currentSection?: string | undefined;
}, {
    status?: Status | undefined;
    address?: string | undefined;
    clientName?: string | undefined;
    inspectorName?: string | undefined;
    currentSection?: string | undefined;
}>;
export declare const CreateFindingInputSchema: z.ZodObject<{
    section: z.ZodString;
    text: z.ZodString;
    severity: z.ZodDefault<z.ZodOptional<z.ZodNativeEnum<typeof Severity>>>;
    matchedComment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    section: string;
    text: string;
    severity: Severity;
    matchedComment?: string | undefined;
}, {
    section: string;
    text: string;
    severity?: Severity | undefined;
    matchedComment?: string | undefined;
}>;
export declare const UpdateFindingInputSchema: z.ZodObject<{
    section: z.ZodOptional<z.ZodString>;
    text: z.ZodOptional<z.ZodString>;
    severity: z.ZodOptional<z.ZodNativeEnum<typeof Severity>>;
    matchedComment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    section?: string | undefined;
    text?: string | undefined;
    severity?: Severity | undefined;
    matchedComment?: string | undefined;
}, {
    section?: string | undefined;
    text?: string | undefined;
    severity?: Severity | undefined;
    matchedComment?: string | undefined;
}>;
export declare const UploadPhotoInputSchema: z.ZodObject<{
    base64Data: z.ZodString;
    mimeType: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    base64Data: string;
    mimeType?: string | undefined;
}, {
    base64Data: string;
    mimeType?: string | undefined;
}>;
export type PhotoSchemaType = z.infer<typeof PhotoSchema>;
export type FindingSchemaType = z.infer<typeof FindingSchema>;
export type InspectionSchemaType = z.infer<typeof InspectionSchema>;
export type CreateInspectionInputSchemaType = z.infer<typeof CreateInspectionInputSchema>;
export type UpdateInspectionInputSchemaType = z.infer<typeof UpdateInspectionInputSchema>;
export type CreateFindingInputSchemaType = z.infer<typeof CreateFindingInputSchema>;
export type UpdateFindingInputSchemaType = z.infer<typeof UpdateFindingInputSchema>;
export type UploadPhotoInputSchemaType = z.infer<typeof UploadPhotoInputSchema>;
//# sourceMappingURL=schemas.d.ts.map