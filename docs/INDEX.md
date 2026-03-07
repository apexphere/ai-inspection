# Documentation Index

> Central map of all documentation, organized by audience.

**Last Updated:** 2026-02-25  
**Maintainer:** Riley

---

## Quick Links

| I want to... | Go to |
|--------------|-------|
| Start using the system | [Getting Started](user/getting-started.md) |
| Conduct inspections via WhatsApp | [Inspector Workflow](user/inspector-workflow.md) |
| Use the web interface | [Web UI Guide](user/web-ui.md) |
| Set up local dev environment | [Developer Setup](developer/setup.md) |
| Deploy the system | [Deployment Runbook](ops/deployment.md) |
| Understand the architecture | [Architecture Overview](developer/architecture.md) |
| Browse API endpoints | [API Reference](developer/api/README.md) |

---

## 👤 User Docs

*For inspectors and surveyors — how to USE the system.*

| Document | Description | Status |
|----------|-------------|--------|
| [Getting Started](user/getting-started.md) | New user introduction | ✅ Current |
| [Inspector Workflow](user/inspector-workflow.md) | WhatsApp inspection flow | ✅ Current |
| [Web UI Guide](user/web-ui.md) | Using the web interface | ✅ Current |
| [A Day with AI Inspection](user/a-day-with-ai-inspection.md) | Demo/showcase narrative | ✅ Current |

---

## 👨‍💻 Developer Docs

*For developers — how to BUILD and extend the system.*

| Document | Description | Status |
|----------|-------------|--------|
| [Developer Setup](developer/setup.md) | Local dev environment | ✅ Current |
| [Architecture Overview](developer/architecture.md) | High-level system design | ⚠️ Needs review |
| [API Reference](developer/api/README.md) | REST API (auto-generated via OpenAPI) | ✅ Current |
| [Testing](developer/testing.md) | E2E test plan | ✅ Current |
| [Agent Production Process](developer/agent-production-process.md) | Reusable process for building/evaluating agents | ✅ Current |

### Design Docs

| Document | Description | Status |
|----------|-------------|--------|
| [001 MVP Inspection Workflow](developer/design/001-mvp-inspection-workflow.md) | Core inspection flow | ⚠️ Needs review |
| [002 Backend Service Architecture](developer/design/002-backend-service-architecture.md) | API/service structure | ⚠️ Needs review |
| [003 CI/CD Pipeline](developer/design/003-ci-cd-pipeline.md) | Build and deploy pipeline | ✅ Current |
| [004 Inspection Checklist System](developer/design/004-inspection-checklist-system.md) | Checklist data model | ⚠️ Needs review |
| [005 Building Code Reference](developer/design/005-building-code-reference.md) | NZ building code data | ⚠️ Needs review |
| [006 Document & Photo Attachments](developer/design/006-document-photo-attachments.md) | Photo/file handling | ⚠️ Needs review |
| [007 Project & Property Management](developer/design/007-project-property-management.md) | Project data model | ⚠️ Needs review |
| [008 COA Report Generation](developer/design/008-coa-report-generation.md) | COA reports | ⚠️ Needs review |
| [009 Personnel & Credentials](developer/design/009-personnel-credentials.md) | Inspector credentials | ⚠️ Needs review |
| [010 Report Templates](developer/design/010-report-templates.md) | Template system | ⚠️ Needs review |
| [011 Report Generation & Export](developer/design/011-report-generation-export.md) | PDF/DOCX export | ⚠️ Needs review |
| [012 CCC Gap Analysis](developer/design/012-ccc-gap-analysis.md) | Code compliance reports | ⚠️ Needs review |
| [013 Agent Deployment](developer/design/013-agent-deployment.md) | OpenClaw agent setup | ✅ Current |
| [014 Design System](developer/design/014-design-system.md) | UI design system | ✅ Current |
| [015 OpenAPI Spec](developer/design/015-openapi-spec.md) | API documentation | ✅ Current |
| [015 Web Interface](developer/design/015-web-interface.md) | Web UI architecture | ⚠️ Needs review |
| [016 Report Workflow](developer/design/016-report-workflow.md) | Report lifecycle | ⚠️ Needs review |

### UI Specifications

| Document | Description | Status |
|----------|-------------|--------|
| [Design Tokens](developer/design/tokens.yaml) | Colors, spacing, typography | ✅ Current |
| [UI Audit](developer/design/ui-audit.md) | Current state audit | ✅ Current |
| [Auth Pages](developer/design/ui/auth.spec.md) | Login/register design | ✅ Current |
| [Inspection Detail](developer/design/ui/inspection-detail.spec.md) | Inspection view | ✅ Current |
| [Project List](developer/design/ui/project-list.spec.md) | Project list | ✅ Current |
| [Project Page](developer/design/ui/project-page.spec.md) | Project detail | ✅ Current |

---

## 🔧 Operations Docs

*For operators — how to DEPLOY and maintain the system.*

| Document | Description | Status |
|----------|-------------|--------|
| [Deployment Runbook](ops/deployment.md) | Full deployment guide | ✅ Current |
| [WhatsApp Pairing](ops/whatsapp-pairing.md) | Link WhatsApp to agent | ✅ Current |
| [Inspector Agent Ops](ops/inspector-agent.md) | Agent operations guide | ✅ Current |
| [Infrastructure Overview](ops/infrastructure.md) | Infra components | ⚠️ Needs review |

---

## 📋 Requirements & Research

| Document | Description | Status |
|----------|-------------|--------|
| [PRD: Agent Deployment](requirements/prd-agent-deployment.md) | Agent deployment requirements | ✅ Current |
| [Competitive Analysis](research/competitive-analysis.md) | Market research | ✅ Current |
| [Template Analysis](research/template-analysis.md) | Report template research | ✅ Current |
| [Workflow Scenario](research/workflow-scenario.md) | Example inspection walkthrough | ✅ Current |

---

## Meta

| Document | Description |
|----------|-------------|
| [Style Guide](style-guide.md) | Documentation standards |
| [Archive](archive/) | Superseded docs |

---

## Status Legend

| Status | Meaning |
|--------|---------|
| ✅ Current | Up-to-date and accurate |
| ⚠️ Needs review | May be outdated |
| 🔴 To create | Planned |

---

## Known Issues

1. **Duplicate numbering in design docs:** Two `015-*.md` files (openapi-spec, web-interface). See #394.
