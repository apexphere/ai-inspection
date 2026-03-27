# Kai Eval Harness

Measures Kai's inspection output quality for **V1 goals** (data capture + report assembly):

| Metric | Weight | What it measures |
|--------|--------|-----------------|
| Checklist completeness (data capture proxy) | 70% | Are expected inspection data points captured? |
| Report format compliance (PDF assembly proxy) | 30% | Required sections present + summary conciseness |
| Defect accuracy | 0% (tracked only) | Kept for future phases when Kai performs full analysis |

## Quick Start

```bash
# From repo root — run with mock adapter (no API needed)
npx tsx test/evals/kai/runner.ts mock

# Run against live Kai endpoint (if available)
KAI_EVAL_BASE_URL=http://localhost:3000 npx tsx test/evals/kai/runner.ts http

# Preferred: out-of-process command adapter (no API test endpoint needed)
# Command must read JSON from stdin and print KaiResponse JSON to stdout
KAI_EVAL_FEWSHOT_PATH='test/evals/kai/fewshot/examples.json' \
KAI_EVAL_COMMAND='node scripts/kai-eval-bridge.js' npx tsx test/evals/kai/runner.ts command
```

## Structure

```
test/evals/kai/
├── types.ts              # Interfaces
├── case-validator.ts     # JSON case validation
├── grader.ts             # Scoring logic
├── runner.ts             # CLI entry point
├── adapters/
│   ├── mock-adapter.ts     # Returns mockResponse from case (baseline)
│   ├── http-adapter.ts     # Calls live Kai endpoint
│   └── command-adapter.ts  # Calls external command/bridge (preferred)
├── cases/
│   └── scenarios.json    # 8 eval scenarios
├── reports/              # Generated reports (gitignored)
└── README.md
```

## Adding Cases

Add JSON files to `cases/`. Each file is an array of `EvalCase` objects (or a single object). Required fields:

- `id` — unique case identifier
- `name` — human-readable name
- `scenario` — description of the inspection scenario
- `input` — `{ inspectorMessage, photosProvided, section }`
- `expected` — `{ requiredChecklistItems[], expectedDefects[], requiredReportSections[], maxSummaryWords? }`
- `mockResponse` — the response to use with the mock adapter

## Scoring

Defect accuracy gives 0.5 points for matching category and 0.5 for matching severity, per expected defect, but is currently **non-gating** in V1 (weight = 0).

The mock adapter baseline should score high (except intentionally imperfect scenarios). Real adapter scores show where Kai diverges from expected V1 behavior.

## Command Adapter (Preferred for real Kai)

Use `adapter=command` to test Kai through its real execution path without adding `/eval` to the API.

Contract for `KAI_EVAL_COMMAND`:
- Reads one JSON payload from stdin: `{ caseId, scenario, input }`
- Writes one JSON payload to stdout in `KaiResponse` format
- Exits `0` on success

This keeps test harness concerns outside product API surface.

## Adding Adapters

Create a new file in `adapters/` that exports a function matching:

```ts
(evalCase: EvalCase) => Promise<KaiResponse>
```

Then register it in `runner.ts` in the `ADAPTERS` map.

### OpenClaw Session Bridge (Kai)

Bridge script: `scripts/kai-eval-bridge.js`

```bash
# Uses agent:kai:main by default
KAI_EVAL_FEWSHOT_PATH='test/evals/kai/fewshot/examples.json' \
KAI_EVAL_COMMAND='node scripts/kai-eval-bridge.js' npx tsx test/evals/kai/runner.ts command

# Optional overrides
KAI_EVAL_AGENT_ID=kai \
KAI_EVAL_SESSION_KEY=agent:kai:main \
KAI_EVAL_TIMEOUT_SECONDS=120 \
KAI_EVAL_COMMAND='node scripts/kai-eval-bridge.js' \
npx tsx test/evals/kai/runner.ts command
```

This route avoids WhatsApp contamination by targeting Kai's OpenClaw session key (`agent:kai:main`).


Bridge improvements in place:
- strict JSON extraction
- schema normalization to allowed checklist/section sets
- one-pass auto-repair when required fields are missing
- optional few-shot injection via KAI_EVAL_FEWSHOT_PATH
