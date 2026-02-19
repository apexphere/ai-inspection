import type {
  SiteInspection,
  InspectionType,
  InspectionStage,
  InspectionStatus,
  InspectionOutcome,
} from '@prisma/client';

export interface CreateSiteInspectionInput {
  projectId: string;
  type: InspectionType;
  stage: InspectionStage;
  date: Date;
  inspectorName: string;
  weather?: string;
  personsPresent?: string;
  equipment?: string[];
  methodology?: string;
  areasNotAccessed?: string;
}

export interface UpdateSiteInspectionInput {
  type?: InspectionType;
  stage?: InspectionStage;
  date?: Date;
  status?: InspectionStatus;
  weather?: string;
  personsPresent?: string;
  equipment?: string[];
  methodology?: string;
  areasNotAccessed?: string;
  inspectorName?: string;
  lbpOnSite?: boolean;
  lbpLicenseSighted?: boolean;
  lbpLicenseNumber?: string;
  lbpExpiryDate?: Date;
  outcome?: InspectionOutcome;
  signatureData?: string;
  signatureDate?: Date;
  currentSection?: string;
  currentClauseId?: string;
}

export interface SiteInspectionSearchParams {
  projectId?: string;
  type?: InspectionType;
  stage?: InspectionStage;
  status?: InspectionStatus;
  includeDeleted?: boolean;
}

export interface ISiteInspectionRepository {
  create(input: CreateSiteInspectionInput): Promise<SiteInspection>;
  findById(id: string, includeDeleted?: boolean): Promise<SiteInspection | null>;
  findByProjectId(projectId: string, includeDeleted?: boolean): Promise<SiteInspection[]>;
  findAll(params?: SiteInspectionSearchParams): Promise<SiteInspection[]>;
  update(id: string, input: UpdateSiteInspectionInput): Promise<SiteInspection>;
  softDelete(id: string): Promise<SiteInspection>;
  restore(id: string): Promise<SiteInspection>;
  hardDelete(id: string): Promise<void>;
}
