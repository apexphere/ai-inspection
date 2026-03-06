import * as fs from 'fs';
import * as path from 'path';
import { EvalCase, EvalSummary, KaiResponse } from './types';
import { validateEvalCase } from './case-validator';
import { gradeCase } from './grader';
import { runWithMockAdapter } from './adapters/mock-adapter';
import { runWithHttpAdapter } from './adapters/http-adapter';
import { runWithCommandAdapter } from './adapters/command-adapter';

type Adapter = (evalCase: EvalCase) => Promise<KaiResponse>;

const ADAPTERS: Record<string, Adapter> = {
  mock: runWithMockAdapter,
  http: runWithHttpAdapter,
  command: runWithCommandAdapter,
};

function loadCases(casesDir: string): EvalCase[] {
  const files = fs.readdirSync(casesDir).filter((f) => f.endsWith('.json'));
  const cases: EvalCase[] = [];

  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(casesDir, file), 'utf-8'));
    const items = Array.isArray(raw) ? raw : [raw];
    for (const item of items) {
      const result = validateEvalCase(item);
      if (result.valid) {
        cases.push(result.value);
      } else {
        console.error(`⚠️  Invalid case in ${file}:`, result.errors);
      }
    }
  }

  return cases;
}

function generateMarkdownReport(summary: EvalSummary): string {
  const lines: string[] = [];
  lines.push(`# Kai Eval Report`);
  lines.push(``);
  lines.push(`**Run at:** ${summary.runAt}`);
  lines.push(`**Adapter:** ${summary.adapter}`);
  lines.push(`**Total cases:** ${summary.totalCases}`);
  lines.push(``);
  lines.push(`## Overall Scores`);
  lines.push(``);
  lines.push(`| Metric | Score |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Checklist completeness | ${(summary.averageChecklistCompleteness * 100).toFixed(1)}% |`);
  lines.push(`| Defect accuracy | ${(summary.averageDefectAccuracy * 100).toFixed(1)}% |`);
  lines.push(`| Report format compliance | ${(summary.averageReportFormatCompliance * 100).toFixed(1)}% |`);
  lines.push(`| **Overall** | **${(summary.overallScore * 100).toFixed(1)}%** |`);
  lines.push(``);
  lines.push(`## Per-Case Results`);
  lines.push(``);

  for (const cs of summary.caseScores) {
    const pct = (cs.weightedScore * 100).toFixed(1);
    lines.push(`### ${cs.caseName} (\`${cs.caseId}\`) — ${pct}%`);
    lines.push(``);
    lines.push(`- **Checklist:** ${cs.checklistCompleteness.details}`);
    lines.push(`- **Defects:** ${cs.defectAccuracy.details}`);
    lines.push(`- **Report:** ${cs.reportFormatCompliance.details}`);
    lines.push(``);
  }

  return lines.join('\n');
}

async function main() {
  const adapterName = process.argv[2] || 'mock';
  const adapter = ADAPTERS[adapterName];
  if (!adapter) {
    console.error(`Unknown adapter: ${adapterName}. Available: ${Object.keys(ADAPTERS).join(', ')}`);
    process.exit(1);
  }

  const casesDir = path.join(__dirname, 'cases');
  const cases = loadCases(casesDir);
  console.log(`\n📋 Loaded ${cases.length} eval cases`);
  console.log(`🔌 Adapter: ${adapterName}\n`);

  const caseScores = [];

  for (const evalCase of cases) {
    try {
      const response = await adapter(evalCase);
      const score = gradeCase(evalCase, response);
      caseScores.push(score);
      const pct = (score.weightedScore * 100).toFixed(1);
      const icon = score.weightedScore >= 0.8 ? '✅' : score.weightedScore >= 0.5 ? '⚠️' : '❌';
      console.log(`${icon} ${evalCase.name} (${evalCase.id}): ${pct}%`);
    } catch (err) {
      console.error(`❌ ${evalCase.name} (${evalCase.id}): ERROR — ${err}`);
    }
  }

  const n = caseScores.length || 1;
  const avgChecklist = caseScores.reduce((sum, s) => sum + s.checklistCompleteness.score / s.checklistCompleteness.maxScore, 0) / n;
  const avgDefects = caseScores.reduce((sum, s) => sum + s.defectAccuracy.score / s.defectAccuracy.maxScore, 0) / n;
  const avgFormat = caseScores.reduce((sum, s) => sum + s.reportFormatCompliance.score / s.reportFormatCompliance.maxScore, 0) / n;
  const overall = caseScores.reduce((sum, s) => sum + s.weightedScore, 0) / n;

  const summary: EvalSummary = {
    runAt: new Date().toISOString(),
    adapter: adapterName,
    totalCases: caseScores.length,
    averageChecklistCompleteness: avgChecklist,
    averageDefectAccuracy: avgDefects,
    averageReportFormatCompliance: avgFormat,
    overallScore: overall,
    caseScores,
  };

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`📊 Overall: ${(overall * 100).toFixed(1)}%`);
  console.log(`   Checklist: ${(avgChecklist * 100).toFixed(1)}%`);
  console.log(`   Defects:   ${(avgDefects * 100).toFixed(1)}%`);
  console.log(`   Format:    ${(avgFormat * 100).toFixed(1)}%`);

  const reportsDir = path.join(__dirname, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, `eval-${adapterName}-${Date.now()}.md`);
  fs.writeFileSync(reportPath, generateMarkdownReport(summary));
  console.log(`\n📝 Report: ${reportPath}`);

  const jsonPath = path.join(reportsDir, `eval-${adapterName}-latest.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));
  console.log(`📦 JSON:   ${jsonPath}\n`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
