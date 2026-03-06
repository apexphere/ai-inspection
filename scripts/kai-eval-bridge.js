#!/usr/bin/env node

const { execFileSync } = require('node:child_process');

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
  if (!found?.sessionId) {
    throw new Error(`Session key not found: ${sessionKey}`);
  }
  return found.sessionId;
}

function buildPrompt(payload) {
  return [
    'You are Kai, a building inspection assistant.',
    'Analyze the inspection note and return STRICT JSON only (no markdown, no prose).',
    'Output schema:',
    '{"checklist":[{"id":"string","status":"ok|defect|na","notes":"string optional"}],"defects":[{"key":"string","category":"string","severity":"low|medium|high|critical","recommendation":"string optional"}],"report":{"summary":"string","sections":["string"]}}',
    'Rules:',
    '- Include concise, inspection-relevant checklist IDs.',
    '- Defects should be specific and grounded in the input.',
    '- Report.sections should be short section labels.',
    '- Return valid JSON only.',
    '',
    'Eval payload:',
    JSON.stringify(payload),
  ].join('\n');
}

function extractFirstJson(text) {
  const trimmed = text.trim();

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed;
  }

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) return fenceMatch[1].trim();

  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1);

  throw new Error(`No JSON object found in response: ${trimmed.slice(0, 300)}`);
}

function normalizeResponse(obj) {
  const checklist = Array.isArray(obj.checklist) ? obj.checklist : [];
  const defects = Array.isArray(obj.defects) ? obj.defects : [];
  const report = obj.report && typeof obj.report === 'object' ? obj.report : {};

  return {
    checklist: checklist.map((c) => ({
      id: String(c.id || '').trim(),
      status: ['ok', 'defect', 'na'].includes(c.status) ? c.status : 'na',
      ...(c.notes ? { notes: String(c.notes) } : {}),
    })).filter((c) => c.id),
    defects: defects.map((d) => ({
      key: String(d.key || '').trim(),
      category: String(d.category || 'General').trim(),
      severity: ['low', 'medium', 'high', 'critical'].includes(d.severity) ? d.severity : 'low',
      ...(d.recommendation ? { recommendation: String(d.recommendation) } : {}),
    })).filter((d) => d.key),
    report: {
      summary: String(report.summary || '').trim(),
      sections: Array.isArray(report.sections) ? report.sections.map((s) => String(s)) : [],
    },
  };
}

async function main() {
  const agentId = process.env.KAI_EVAL_AGENT_ID || 'kai';
  const sessionKey = process.env.KAI_EVAL_SESSION_KEY || 'agent:kai:main';
  const timeoutSeconds = Number(process.env.KAI_EVAL_TIMEOUT_SECONDS || '90');

  const rawIn = await readStdin();
  if (!rawIn.trim()) throw new Error('No stdin payload received');
  const payload = JSON.parse(rawIn);

  const sessionId = findSessionId(agentId, sessionKey);
  const prompt = buildPrompt(payload);

  const result = runJson('openclaw', [
    'agent',
    '--agent',
    agentId,
    '--session-id',
    sessionId,
    '--message',
    prompt,
    '--timeout',
    String(timeoutSeconds),
    '--json',
  ]);

  const text = result?.result?.payloads?.[0]?.text;
  if (!text) throw new Error('No assistant text payload returned from openclaw agent');

  const jsonText = extractFirstJson(text);
  const parsed = JSON.parse(jsonText);
  const normalized = normalizeResponse(parsed);

  process.stdout.write(JSON.stringify(normalized));
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
