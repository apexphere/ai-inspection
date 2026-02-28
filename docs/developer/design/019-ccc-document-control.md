# Design: CCC Executive Summary & Document Control

**Status:** Approved (updated 2026-03-01 — both delivered)
**Author:** Riley
**Requirement:** #541
**Date:** 2026-02-28

## Context

Real CCC Gap Analysis reports have two sections our templates didn't generate:

1. **Document Control Records** (after cover, before TOC) — revision history + acceptance sign-off
2. **Executive Summary** (after TOC, before Section 1) — key findings at a glance

## Current State — DELIVERED ✅

Both features have been implemented:

### Document Control (#546, PR #557)
- Template: `api/templates/ccc/document-control.hbs` (root level, not in sections/)
- Template engine loads it via `compileTemplate('{reportType}/document-control.hbs')` with try/catch fallback
- Rendered as `{{{documentControlHtml}}}` in `base.hbs` between header and TOC
- **Architecture note:** This is a special slot, not a regular section file, because it must appear before the TOC

### Executive Summary (#547)
- Template: `api/templates/ccc/sections/00-executive-summary.hbs`
- Auto-generated from defect data
- API: `POST /api/reports/:id/executive-summary/generate`, `PUT /api/reports/:id/executive-summary`

## Architecture Lesson

The original design said "create `sections/00-document-control.hbs`" but the template engine renders ALL sections AFTER the TOC. Document Control needed to be BEFORE the TOC, requiring a special slot in `base.hbs`. The design should have specified this after reading the template engine code.

## Stories

| # | Story | Status |
|---|-------|--------|
| #546 | Document Control section | ✅ Delivered |
| #547 | Executive Summary | ✅ Delivered |
