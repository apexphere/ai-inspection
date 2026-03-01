# Changelog — Building Inspection Skill

## [2.1.0] — 2026-03-01

### Added
- PPI element-level prompting per NZS 4306:2005
- Full element lists for SITE, EXTERIOR (Roof/Walls/Foundation), INTERIOR, DECKS, SERVICES
- Per-element commands: pass / fail [note] / skip / all pass / done
- Completion summary after all categories done

## [2.0.1] — 2026-03-01

### Changed
- Replace `$SERVICE_API_KEY` with `$API_SERVICE_KEY` throughout skill
- Kai now authenticates via scoped DB-backed key (Issue #618)

## [2.0.0] — 2026-03-01

### Changed (Breaking)
- Complete rewrite for multi-type inspection support
- Replaced legacy `/api/inspections` with site-inspection API
- Replaced hardcoded PPI/NZS4306 flow with type-selection onboarding

### Added
- Inspection type selection: PPI, COA, CCC Gap Analysis, Safe & Sanitary
- Onboarding flow: property → client → project → site inspection
- COA workflow: clause-by-clause NZBC review
- CCC workflow: defect checklist against consented plans
- SS workflow: simplified Safe & Sanitary checklist
- Skill version frontmatter header

### Removed
- Legacy `/api/inspections` endpoint references
- Hardcoded 8-section NZS4306 workflow
- Fixed section navigation

## [1.0.0] — 2026-02-23

### Initial Release
- COA inspection workflow via WhatsApp
- Guided section-by-section inspection
- Photo capture and finding creation
- Report generation trigger
