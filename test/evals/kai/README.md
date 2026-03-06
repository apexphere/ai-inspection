# Kai Eval Harness

Measures Kai's inspection output quality across three metrics:

| Metric | Weight | What it measures |
|--------|--------|-----------------|
| Checklist completeness | 40% | Are all expected checklist items present? |
| Defect accuracy | 40% | Are defects correctly classified (category + severity)? |
| Report format compliance | 20% | Required sections present + summary conciseness |

## Quick Start

```bash
# From repo root — run with mock adapter (no API needed)
npx tsx test/evals/kai/runner.ts mock

# Run against live Kai endpoint (if available)
KAI_EVAL_BASE_URL=http://localhost:3000 npx tsx test/evals/kai/runner.ts http

# Preferred: out-of-process command adapter (no API test endpoint needed)
# Command must read JSON from stdin and print KaiResponse JSON to stdout
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

Defect accuracy gives 0.5 points for matching category and 0.5 for matching severity, per expected defect.

The mock adapter baseline should score 100% (it returns the expected response). Real adapter scores show where Kai diverges from expected output.

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
