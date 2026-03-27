export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface ExpectedDefect {
  key: string;
  category: string;
  severity: Severity;
}

export interface ExpectedOutput {
  requiredChecklistItems: string[];
  expectedDefects: ExpectedDefect[];
  requiredReportSections: string[];
  maxSummaryWords?: number;
}

export interface EvalCase {
  id: string;
  name: string;
  scenario: string;
  input: {
    inspectorMessage: string;
    photosProvided: number;
    section: string;
  };
  expected: ExpectedOutput;
  mockResponse: KaiResponse;
}

export interface KaiChecklistItem {
  id: string;
  status: 'ok' | 'defect' | 'na';
  notes?: string;
}

export interface KaiDefect {
  key: string;
  category: string;
  severity: Severity;
  recommendation?: string;
}

export interface KaiResponse {
  checklist: KaiChecklistItem[];
  defects: KaiDefect[];
  report: {
    summary: string;
    sections: string[];
  };
}

export interface MetricScore {
  score: number;
  maxScore: number;
  details: string;
}

export interface CaseScore {
  caseId: string;
  caseName: string;
  checklistCompleteness: MetricScore;
  defectAccuracy: MetricScore;
  reportFormatCompliance: MetricScore;
  weightedScore: number;
}

export interface EvalSummary {
  runAt: string;
  adapter: string;
  totalCases: number;
  averageChecklistCompleteness: number;
  averageDefectAccuracy: number;
  averageReportFormatCompliance: number;
  overallScore: number;
  caseScores: CaseScore[];
}
