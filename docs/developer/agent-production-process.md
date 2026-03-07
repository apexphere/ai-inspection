# Agent Production Process (Reusable)

Standard process for building any new agent (not just Kai) with measurable quality.

## Outcome

Ship agents with:
- clear role + boundaries
- deterministic output contract where needed
- eval harness + baseline score
- few-shot dataset strategy
- release + regression gate

---

## Stage 0 — Agent Charter

Create an **Agent Charter** before coding:
- Mission (one sentence)
- In-scope tasks
- Out-of-scope tasks
- Input channels
- Output artifacts
- Failure modes + safety rules

Deliverable: `agents/<agent>/CHARTER.md`

---

## Stage 1 — Contract First

Define the minimal structured output contract for the first version.

For operational agents, prefer strict JSON contract + canonical enums/IDs.

Checklist:
- Define required fields
- Define allowed labels/enums
- Define unknown/missing behavior (`null`, `na`, etc.)
- Define validation + normalization rules

Deliverables:
- `types` for contract
- validator + normalizer

---

## Stage 2 — Eval Harness (Mandatory)

Build eval harness before tuning prompts.

Minimum harness requirements:
- case format (JSON)
- runner
- scorer with weighted metrics
- markdown/json report artifacts
- deterministic mode (`mock`) + live mode

Deliverables:
- `test/evals/<agent>/`
- baseline report in `test/evals/<agent>/reports/`

---

## Stage 3 — Rubric Aligned to Version Goal

Do not over-grade early versions.

Example:
- v1 capture/assembly agent: weight capture + format, track analysis as non-gating
- v2 analysis agent: increase reasoning/classification weight

Rule:
- Every metric must map to a current product expectation.

---

## Stage 4 — Few-Shot Data Loop

Start with synthetic examples, then replace with curated production examples.

Data rules:
- anonymized only
- balanced scenario coverage
- include easy/normal/hard cases
- include no-issue and defect-heavy cases

Deliverables:
- `test/evals/<agent>/fewshot/examples.json`
- sourcing + anonymization note

---

## Stage 5 — Reliability Layer

Add pre-persistence reliability controls:
- schema normalization
- canonical label mapping
- repair pass (single retry)
- explicit validation errors

Goal:
- prevent malformed outputs from entering downstream workflow.

---

## Stage 6 — Release Workflow

For each release:
1. run deterministic eval
2. run live eval
3. compare against previous baseline
4. include report in PR
5. merge only if thresholds pass

Recommended v1 quality gate (customize per agent):
- overall >= 0.70
- primary metric >= 0.80
- no critical schema violations

---

## Stage 7 — Post-Release Monitoring

Track in production:
- schema violation rate
- repair-loop invocation rate
- human correction rate
- task completion time

Create follow-up issues from top failure clusters weekly.

---

## Required Artifacts Checklist

- [ ] Agent charter
- [ ] Contract types + validator
- [ ] Eval harness (mock + live)
- [ ] Weighted rubric
- [ ] Baseline report committed/attached
- [ ] Few-shot dataset (or placeholder issue)
- [ ] Reliability layer (normalize + repair)
- [ ] CI quality gate
- [ ] Release note with eval evidence

---

## PR Template Addendum (Agents)

Add this block to agent-related PRs:

- Agent: `<name>`
- Version goal: `<v1/v2>`
- Rubric weights: `<...>`
- Baseline before: `<score>`
- Baseline after: `<score>`
- Eval report: `<path or link>`
- Few-shot dataset version: `<id/date>`

---

## Kai Mapping (Current)

Kai now follows this process:
- Harness: `test/evals/kai/`
- Session bridge: `scripts/kai-eval-bridge.js`
- Few-shot input: `KAI_EVAL_FEWSHOT_PATH`
- Current focus: v1 data capture + report assembly
