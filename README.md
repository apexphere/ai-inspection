# AI Inspection

AI-powered building inspection assistant that guides inspectors through checklists via WhatsApp and auto-generates PDF reports.

## Status

**MVP Complete** ✅

## Features

- **Guided workflow** — walks inspector through NZS4306-style property inspection sections
- **Photo capture** — attach photos to findings, embedded in final report
- **Smart suggestions** — matches findings to boilerplate comment library
- **PDF generation** — professional report with photos, severity ratings, conclusions
- **WhatsApp-native** — designed for field use via messaging

## Quick Start

### 1. Build the Server

```bash
cd server
npm install
npm run build
```

### 2. Install the Skill

```bash
# Symlink for development:
ln -sf $(pwd)/skill ~/.openclaw/skills/building-inspection
```

### 3. Configure OpenClaw

Add to `~/.openclaw/config.yaml`:

```yaml
mcpServers:
  ai-inspection:
    command: node
    args:
      - /path/to/ai-inspection/server/dist/index.js
    env:
      DATA_DIR: /path/to/ai-inspection/data
```

### 4. Restart & Test

```bash
openclaw gateway restart
```

Then message your agent:
> "Start an inspection at 123 Test Street for John Smith"

## MCP Tools

| Tool | Purpose |
|------|---------|
| `inspection_start` | Begin new inspection at address |
| `inspection_add_finding` | Record issue with severity + photos |
| `inspection_suggest_next` | Get guidance for current section |
| `inspection_navigate` | Move between sections |
| `inspection_status` | Check progress |
| `inspection_complete` | Finish and generate PDF |
| `inspection_get_report` | Retrieve generated report |

## Workflow

```
Start → Exterior → Subfloor → Interior → Kitchen → Bathroom → Electrical → Plumbing → Roof Space → Complete → PDF
```

Inspector sends findings and photos as they walk through. Agent confirms each entry and prompts for next section.

## Project Structure

```
ai-inspection/
├── server/               # MCP server (TypeScript)
│   ├── src/
│   │   ├── tools/        # MCP tool implementations
│   │   ├── services/     # Checklist, comments, PDF generation
│   │   └── storage/      # Mock storage (MVP)
│   └── dist/             # Compiled output
├── skill/                # OpenClaw skill
│   ├── SKILL.md          # Conversation guidance
│   └── mcp.json          # MCP server config
├── config/
│   ├── checklists/       # Inspection templates (YAML)
│   └── comments/         # Boilerplate comment library
├── templates/
│   └── reports/          # Handlebars PDF templates
├── data/                 # Runtime data (gitignored)
│   ├── photos/           # Uploaded inspection photos
│   └── reports/          # Generated PDFs
└── docs/
    ├── design/           # Architecture docs
    └── research/         # Competitive analysis, template specs
```

## Testing

```bash
cd server
npm test          # Run all tests (27 tests)
npm run test:watch  # Watch mode
```

## Docker

```bash
docker-compose up --build
```

## Documentation

- [MVP Design](docs/design/001-mvp-inspection-workflow.md)
- [Competitive Analysis](docs/research/competitive-analysis.md)
- [Template Analysis](docs/research/template-analysis.md)
- [Skill Guide](skill/SKILL.md)

## License

Private — not for distribution.
