import { CaseScore, EvalCase, KaiResponse, MetricScore } from './types';

const WEIGHTS = {
  checklistCompleteness: 0.4,
  defectAccuracy: 0.4,
  reportFormatCompliance: 0.2,
};

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function scoreChecklist(caseData: EvalCase, response: KaiResponse): MetricScore {
  const required = caseData.expected.requiredChecklistItems;
  const actualIds = new Set(response.checklist.map((c) => c.id));
  const matched = required.filter((id) => actualIds.has(id)).length;

  return {
    score: matched,
    maxScore: required.length || 1,
    details: `Matched ${matched}/${required.length} required checklist items`,
  };
}

function scoreDefects(caseData: EvalCase, response: KaiResponse): MetricScore {
  const expected = caseData.expected.expectedDefects;
  if (expected.length === 0) {
    return {
      score: response.defects.length === 0 ? 1 : 0,
      maxScore: 1,
      details: response.defects.length === 0 ? 'Correctly returned no defects' : 'Returned unexpected defects',
    };
  }

  let points = 0;
  for (const exp of expected) {
    const found = response.defects.find((d) => d.key === exp.key);
    if (!found) continue;
    if (found.category === exp.category) points += 0.5;
    if (found.severity === exp.severity) points += 0.5;
  }

  return {
    score: points,
    maxScore: expected.length,
    details: `Matched defect classification score ${points.toFixed(2)}/${expected.length}`,
  };
}

function scoreReportFormat(caseData: EvalCase, response: KaiResponse): MetricScore {
  const requiredSections = caseData.expected.requiredReportSections;
  const actualSections = new Set(response.report.sections);
  const matchedSections = requiredSections.filter((s) => actualSections.has(s)).length;

  let score = matchedSections;
  let maxScore = requiredSections.length || 1;
  let details = `Matched ${matchedSections}/${requiredSections.length} required report sections`;

  if (caseData.expected.maxSummaryWords) {
    const wc = wordCount(response.report.summary);
    maxScore += 1;
    if (wc <= caseData.expected.maxSummaryWords) {
      score += 1;
      details += `; summary length ok (${wc} words)`;
    } else {
      details += `; summary too long (${wc} words)`;
    }
  }

  return { score, maxScore, details };
}

export function gradeCase(caseData: EvalCase, response: KaiResponse): CaseScore {
  const checklistCompleteness = scoreChecklist(caseData, response);
  const defectAccuracy = scoreDefects(caseData, response);
  const reportFormatCompliance = scoreReportFormat(caseData, response);

  const normalizedChecklist = checklistCompleteness.score / checklistCompleteness.maxScore;
  const normalizedDefects = defectAccuracy.score / defectAccuracy.maxScore;
  const normalizedFormat = reportFormatCompliance.score / reportFormatCompliance.maxScore;

  const weightedScore =
    normalizedChecklist * WEIGHTS.checklistCompleteness +
    normalizedDefects * WEIGHTS.defectAccuracy +
    normalizedFormat * WEIGHTS.reportFormatCompliance;

  return {
    caseId: caseData.id,
    caseName: caseData.name,
    checklistCompleteness,
    defectAccuracy,
    reportFormatCompliance,
    weightedScore,
  };
}
