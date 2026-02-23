# Documentation Index

> Central map of all documentation. Find what you need, spot what's missing.

**Last Updated:** 2026-02-23  
**Maintainer:** Sage

---

## Quick Links

| I want to... | Go to |
|--------------|-------|
| Set up local dev environment | [Developer Setup](setup/developer.md) *(coming soon)* |
| Deploy the system | [Deployment Runbook](runbooks/deployment.md) |
| Understand the architecture | [Architecture Overview](architecture.md) *(coming soon)* |
| Learn how inspectors use WhatsApp | [Inspector Workflow Guide](guides/inspector-workflow.md) *(coming soon)* |
| Use the web interface | [Web UI Guide](guides/web-ui.md) *(coming soon)* |
| Operate the inspector agent | [Inspector Agent Ops](ops/inspector-agent.md) |

---

## Documentation by Category

### 📘 Guides (User-Facing)
*How to USE the system*

| Document | Description | Status |
|----------|-------------|--------|
| [Getting Started](guides/getting-started.md) | New user introduction | 🔴 To create |
| [Inspector Workflow](guides/inspector-workflow.md) | WhatsApp inspection flow | 🔴 To create |
| [Web UI Guide](guides/web-ui.md) | Using the web interface | 🔴 To create |

### 🛠️ Setup & Operations
*How to DEPLOY and RUN the system*

| Document | Description | Status |
|----------|-------------|--------|
| [Deployment Runbook](runbooks/deployment.md) | Full deployment guide | ✅ Current |
| [WhatsApp Pairing](runbooks/whatsapp-pairing.md) | Link WhatsApp to agent | ✅ Current |
| [Inspector Agent Ops](ops/inspector-agent.md) | Agent operations guide | ✅ Current |
| [Infrastructure Overview](infrastructure/overview.md) | Infra components | ⚠️ Needs review |
| [Developer Setup](setup/developer.md) | Local dev environment | 🔴 To create |

### 🏗️ Architecture & Design
*How the system is BUILT*

| Document | Description | Status |
|----------|-------------|--------|
| [Architecture Overview](architecture.md) | High-level system design | 🔴 To create |
| [001 MVP Inspection Workflow](design/001-mvp-inspection-workflow.md) | Core inspection flow design | ⚠️ Needs review |
| [002 Backend Service Architecture](design/002-backend-service-architecture.md) | API/service structure | ⚠️ Needs review |
| [003 CI/CD Pipeline](design/003-ci-cd-pipeline.md) | Build and deploy pipeline | ✅ Current |
| [004 Inspection Checklist System](design/004-inspection-checklist-system.md) | Checklist data model | ⚠️ Needs review |
| [005 Building Code Reference](design/005-building-code-reference.md) | NZ building code data | ⚠️ Needs review |
| [005 Web Interface](design/005-web-interface.md) | Web UI architecture | ⚠️ Needs review |
| [006 Document & Photo Attachments](design/006-document-photo-attachments.md) | Photo/file handling | ⚠️ Needs review |
| [007 Project & Property Management](design/007-project-property-management.md) | Project data model | ⚠️ Needs review |
| [008 COA Report Generation](design/008-coa-report-generation.md) | Certificate of Accuracy reports | ⚠️ Needs review |
| [009 Personnel & Credentials](design/009-personnel-credentials.md) | Inspector credentials | ⚠️ Needs review |
| [010 Report Templates](design/010-report-templates.md) | Template system design | ⚠️ Needs review |
| [011 Report Generation & Export](design/011-report-generation-export.md) | PDF/export generation | ⚠️ Needs review |
| [011 Report Workflow](design/011-report-workflow.md) | Report lifecycle | ⚠️ Needs review |
| [012 CCC Gap Analysis](design/012-ccc-gap-analysis.md) | Code compliance reports | ⚠️ Needs review |
| [013 Agent Deployment](design/013-agent-deployment.md) | OpenClaw agent setup | ✅ Current |
| [013 Report Generation & Export](design/013-report-generation-export.md) | *Duplicate — needs cleanup* | ⚠️ Duplicate |
| [014 Design System](design/014-design-system.md) | UI design system | ✅ Current |

### 🎨 UI Specifications
*Component and page designs*

| Document | Description | Status |
|----------|-------------|--------|
| [Design Tokens](design/tokens.yaml) | Colors, spacing, typography | ✅ Current |
| [UI Audit](design/ui-audit.md) | Current state audit | ✅ Current |
| [Auth Pages Spec](design/ui/auth.spec.md) | Login/register design | ✅ Current |
| [Inspection Detail Spec](design/ui/inspection-detail.spec.md) | Inspection view design | ✅ Current |
| [Project List Spec](design/ui/project-list.spec.md) | Project list design | ✅ Current |
| [Project Page Spec](design/ui/project-page.spec.md) | Project detail design | ✅ Current |

### 📋 Requirements & Research
*What we're building and why*

| Document | Description | Status |
|----------|-------------|--------|
| [PRD: Agent Deployment](requirements/prd-agent-deployment.md) | Agent deployment requirements | ✅ Current |
| [Competitive Analysis](research/competitive-analysis.md) | Market research | ✅ Current |
| [Template Analysis](research/template-analysis.md) | Report template research | ✅ Current |

### 🧪 Testing
*Quality assurance*

| Document | Description | Status |
|----------|-------------|--------|
| [E2E Test Plan](test-plan-e2e.md) | End-to-end testing approach | ✅ Current |

### 📖 Other
*Miscellaneous docs*

| Document | Description | Status |
|----------|-------------|--------|
| [Workflow Scenario](workflow-scenario.md) | Example inspection walkthrough | ✅ Current |
| [A Day with AI Inspection](showcase/a-day-with-ai-inspection.md) | Demo/showcase narrative | ✅ Current |

---

## Status Legend

| Status | Meaning |
|--------|---------|
| ✅ Current | Up-to-date and accurate |
| ⚠️ Needs review | May be outdated, needs verification |
| 🔴 To create | Planned but not yet written |
| ⚠️ Duplicate | Naming conflict, needs cleanup |

---

## Known Issues

1. **Duplicate numbering in design docs:**
   - Two `005-*.md` files (building-code-reference, web-interface)
   - Two `011-*.md` files (report-generation-export, report-workflow)
   - Two `013-*.md` files (agent-deployment, report-generation-export)
   
   See #394 for cleanup.

2. **Missing directories:**
   - `docs/guides/` — user-facing guides
   - `docs/setup/` — setup documentation
   - `docs/api/` — API reference

---

## Contributing

When adding docs:
1. Add entry to this index
2. Follow [Style Guide](style-guide.md) *(coming soon)*
3. Use consistent naming: `XXX-kebab-case-title.md`
4. Include status header in document
