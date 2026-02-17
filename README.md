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
ln -sf $(pwd)/skill ~/.openclaw/workspace/skills/building-inspection
```

The skill includes `mcp.json` — OpenClaw auto-loads MCP server config from there.

### 3. Restart OpenClaw

```bash
openclaw gateway restart
```

### 4. Test

Message your agent:
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
npm test            # Run all tests (27 tests)
npm run test:watch  # Watch mode
```

### Local Development

Run the server directly for debugging:

```bash
cd server
npm run dev    # Watch mode with auto-reload
```

The server communicates via stdio (JSON-RPC), so you won't see output directly — use tests or OpenClaw to interact with it.

## Local Development

### Full Stack (API + DB + Web)

```bash
# Start backend services (API + PostgreSQL)
docker-compose up -d api db

# Wait for healthy state
docker-compose ps

# Run database migrations
docker-compose exec api npx prisma migrate deploy

# In another terminal, start the web UI
cd web && npm run dev
```

**Services:**
- **API:** http://localhost:3000
- **Web:** http://localhost:3001 (or Next.js default port)
- **PostgreSQL:** localhost:5432

### API Only

```bash
# Start API + DB
docker-compose up api db

# API available at http://localhost:3000
# Health check: http://localhost:3000/health
```

### Database Access

```bash
# Connect to PostgreSQL
docker-compose exec db psql -U inspection -d inspection

# Run Prisma Studio (DB GUI)
cd api && npx prisma studio
```

### Stopping Services

```bash
docker-compose down          # Stop containers
docker-compose down -v       # Stop and remove volumes (deletes data!)
```

## Docker Services

| Service | Port | Purpose |
|---------|------|---------|
| `api` | 3000 | Express backend with Prisma |
| `db` | 5432 | PostgreSQL 16 database |
| `mcp` | 3100 | MCP server for OpenClaw |

```bash
docker-compose up --build    # Build and start all services
docker-compose up api db     # Start only API + database
```

## Documentation

- [MVP Design](docs/design/001-mvp-inspection-workflow.md)
- [Competitive Analysis](docs/research/competitive-analysis.md)
- [Template Analysis](docs/research/template-analysis.md)
- [Skill Guide](skill/SKILL.md)

## License

Private — not for distribution.
