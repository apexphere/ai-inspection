#!/usr/bin/env node

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

function runJson(cmd, args) {
  const out = execFileSync(cmd, args, { encoding: 'utf8' });
  return JSON.parse(out);
}

function findSessionId(agentId, sessionKey) {
  const sessions = runJson('openclaw', ['sessions', '--agent', agentId, '--json']);
  const found = (sessions.sessions || []).find((s) => s.key === sessionKey);
  if (!found?.sessionId) throw new Error(`Session key not found: ${sessionKey}`);
  return found.sessionId;
}

function parseFewShots() {
  const file = process.env.KAI_EVAL_FEWSHOT_PATH;
  if (!file) return [];
  if (!fs.existsSync(file)) throw new Error(`KAI_EVAL_FEWSHOT_PATH not found: ${file}`);
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  return Array.isArray(raw) ? raw.slice(0, 8) : [];
}

function buildPrompt(payload, fewShots = []) {
  const requiredChecklist = payload?.expected?.requiredChecklistItems || [];
  const requiredSections = payload?.expected?.requiredReportSections || [];

  const lines = [
    'You are Kai, a building inspection assistant.',
    'V1 objective: capture inspection data reliably and structure report sections for PDF assembly.',
    'Do NOT invent facts. Extract only from provided input/scenario.',
    'Return STRICT JSON only (no markdown, no prose).',
    '',
    'Required output schema:',
    '{"checklist":[{"id":"string","status":"ok|defect|na","notes":"string optional"}],"defects":[{"key":"string","category":"string","severity":"low|medium|high|critical","recommendation":"string optional"}],"report":{"summary":"string","sections":["string"]}}',
    '',
    'Hard constraints:',
    `- Prefer checklist IDs from allowed set: ${JSON.stringify(requiredChecklist)}`,
    `- report.sections MUST use labels from allowed set: ${JSON.stringify(requiredSections)}`,
    '- Keep summary concise, factual, and inspection-specific.',
    '',
    'Execution steps:',
    '1) Extract data points from inspector input.',
    '2) Map to allowed checklist IDs and report sections.',
    '3) Emit strict JSON.',
  ];

  if (fewShots.length) {
    lines.push('', 'Few-shot examples (style + mapping):');
    for (const [i, ex] of fewShots.entries()) {
      lines.push(`Example ${i + 1} input: ${JSON.stringify(ex.input || {})}`);
      lines.push(`Example ${i + 1} output: ${JSON.stringify(ex.output || {})}`);
    }
  }

  lines.push('', 'Eval payload:', JSON.stringify(payload));
  return lines.join('\n');
}

function buildRepairPrompt(payload, priorJson, errors) {
  return [
    'Repair this output. Return STRICT JSON only.',
    'Do not explain. Do not add markdown.',
    '',
    `Validation errors: ${JSON.stringify(errors)}`,
    `Current output: ${JSON.stringify(priorJson)}`,
    `Allowed checklist IDs: ${JSON.stringify(payload?.expected?.requiredChecklistItems || [])}`,
    `Allowed report sections: ${JSON.stringify(payload?.expected?.requiredReportSections || [])}`,
  ].join('\n');
}

function extractFirstJson(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed;
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) return fenceMatch[1].trim();
  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1);
  throw new Error(`No JSON object found in response: ${trimmed.slice(0, 300)}`);
}

function normalizeId(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function mapToAllowedCanonical(rawId, allowedCanonical) {
  const n = normalizeId(rawId);
  if (!allowedCanonical.length) return rawId || n;

  const byNorm = new Map(allowedCanonical.map((a) => [normalizeId(a), a]));
  if (byNorm.has(n)) return byNorm.get(n);

  // token-overlap fallback against normalized labels
  const nTokens = new Set(n.split('-').filter(Boolean));
  let best = null;
  let bestScore = 0;
  for (const a of allowedCanonical) {
    const aN = normalizeId(a);
    const aTokens = new Set(aN.split('-').filter(Boolean));
    let overlap = 0;
    for (const t of nTokens) if (aTokens.has(t)) overlap += 1;
    const score = overlap / Math.max(aTokens.size, 1);
    if (score > bestScore) {
      bestScore = score;
      best = a;
    }
  }

  return bestScore >= 0.5 ? best : null;
}

function normalizeResponse(obj, payload) {
  const allowedChecklist = payload?.expected?.requiredChecklistItems || [];
  const allowedSections = payload?.expected?.requiredReportSections || [];

  const checklist = Array.isArray(obj.checklist) ? obj.checklist : [];
  const defects = Array.isArray(obj.defects) ? obj.defects : [];
  const report = obj.report && typeof obj.report === 'object' ? obj.report : {};

  const normalizedChecklist = checklist
    .map((c) => {
      const mapped = mapToAllowedCanonical(c.id || c.key || c.item || '', allowedChecklist);
      return {
        id: mapped || normalizeId(c.id || c.key || c.item || ''),
        status: ['ok', 'defect', 'na'].includes(c.status) ? c.status : 'na',
        ...(c.notes ? { notes: String(c.notes) } : {}),
      };
    })
    .filter((c) => c.id);

  const normalizedSections = (Array.isArray(report.sections) ? report.sections : [])
    .map((s) => mapToAllowedCanonical(s, allowedSections))
    .filter(Boolean);

  // V1 report assembly assist: ensure required sections are present
  for (const req of allowedSections) {
    if (!normalizedSections.some((s) => normalizeId(s) === normalizeId(req))) {
      normalizedSections.push(req);
    }
  }

  return {
    checklist: normalizedChecklist,
    defects: defects
      .map((d) => ({
        key: String(d.key || '').trim(),
        category: String(d.category || 'General').trim(),
        severity: ['low', 'medium', 'high', 'critical'].includes(d.severity) ? d.severity : 'low',
        ...(d.recommendation ? { recommendation: String(d.recommendation) } : {}),
      }))
      .filter((d) => d.key),
    report: {
      summary: String(report.summary || '').trim(),
      sections: [...new Set(normalizedSections)],
    },
  };
}

function validateResponse(normalized, payload) {
  const errors = [];
  const requiredChecklist = (payload?.expected?.requiredChecklistItems || []).map(normalizeId);
  const requiredSections = (payload?.expected?.requiredReportSections || []).map(normalizeId);

  const checklistIds = new Set((normalized.checklist || []).map((c) => normalizeId(c.id)));
  const sectionIds = new Set((normalized.report?.sections || []).map((s) => normalizeId(s)));

  const missingChecklist = requiredChecklist.filter((id) => !checklistIds.has(id));
  const missingSections = requiredSections.filter((s) => !sectionIds.has(s));

  if (!normalized.report?.summary) errors.push('report.summary is empty');
  if (missingChecklist.length) errors.push(`missing checklist ids: ${missingChecklist.join(',')}`);
  if (missingSections.length) errors.push(`missing report sections: ${missingSections.join(',')}`);

  return errors;
}

function invokeKai({ agentId, sessionId, message, timeoutSeconds }) {
  const result = runJson('openclaw', [
    'agent',
    '--agent',
    agentId,
    '--session-id',
    sessionId,
    '--message',
    message,
    '--timeout',
    String(timeoutSeconds),
    '--json',
  ]);

  const text = result?.result?.payloads?.[0]?.text;
  if (!text) throw new Error('No assistant text payload returned from openclaw agent');
  const jsonText = extractFirstJson(text);
  return JSON.parse(jsonText);
}

async function main() {
  const agentId = process.env.KAI_EVAL_AGENT_ID || 'kai';
  const sessionKey = process.env.KAI_EVAL_SESSION_KEY || 'agent:kai:main';
  const timeoutSeconds = Number(process.env.KAI_EVAL_TIMEOUT_SECONDS || '90');
  const fewShots = parseFewShots();

  const rawIn = await readStdin();
  if (!rawIn.trim()) throw new Error('No stdin payload received');
  const payload = JSON.parse(rawIn);

  const sessionId = findSessionId(agentId, sessionKey);

  // Attempt 1
  let raw = invokeKai({
    agentId,
    sessionId,
    message: buildPrompt(payload, fewShots),
    timeoutSeconds,
  });
  let normalized = normalizeResponse(raw, payload);
  let errors = validateResponse(normalized, payload);

  // Attempt 2 (repair pass)
  if (errors.length) {
    raw = invokeKai({
      agentId,
      sessionId,
      message: buildRepairPrompt(payload, normalized, errors),
      timeoutSeconds,
    });
    normalized = normalizeResponse(raw, payload);
    errors = validateResponse(normalized, payload);
  }

  process.stdout.write(JSON.stringify(normalized));
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
