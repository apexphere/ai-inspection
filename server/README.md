# AI Inspection MCP Server

MCP server for the AI building inspection assistant.

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Docker

### Using docker-compose (recommended)

```bash
# From project root
docker-compose up -d

# View logs
docker-compose logs -f ai-inspection

# Stop
docker-compose down
```

### Manual Docker build

```bash
# Build image
docker build -t ai-inspection-server ./server

# Run container
docker run -d \
  --name ai-inspection \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/config:/app/config:ro \
  -p 3100:3100 \
  ai-inspection-server
```

### Data Persistence

Data is stored in mounted volumes:
- `./data/` — SQLite database and photos
- `./config/` — Checklists and templates (read-only)

## Project Structure

```
src/
├── index.ts          # MCP server entry point
├── tools/            # MCP tool implementations
├── services/         # Business logic
├── storage/          # Database + file storage
└── pdf/              # Report generation
```

## Tools

The server exposes the following MCP tools:

| Tool | Description |
|------|-------------|
| `inspection_start` | Start a new inspection at an address |
| `inspection_add_finding` | Record a finding/issue with optional photos |
| `inspection_navigate` | Navigate between checklist sections |
| `inspection_status` | Get inspection progress and state |
| `inspection_suggest_next` | Get guidance on what to check next |
| `inspection_complete` | Finish inspection and generate report |
| `inspection_get_report` | Retrieve a generated report |

### Tool Details

#### `inspection_start`
Creates a new inspection session.

**Parameters:**
- `address` (required): Property address
- `client_name` (required): Client name
- `inspector_name` (optional): Inspector name
- `checklist` (optional): Checklist ID (default: "nz-ppi")
- `metadata` (optional): Property metadata (type, bedrooms, bathrooms, year_built)

#### `inspection_add_finding`
Records a finding during the inspection.

**Parameters:**
- `inspection_id` (required): Active inspection ID
- `text` (required): Description of the finding
- `section` (optional): Section ID (defaults to current section)
- `photos` (optional): Array of base64-encoded photos
- `severity` (optional): "info" | "minor" | "major" | "urgent"

#### `inspection_navigate`
Moves to a different section.

**Parameters:**
- `inspection_id` (required): Active inspection ID
- `action` (required): "next", "back", "skip", or a section ID

#### `inspection_status`
Gets current inspection state.

**Parameters:**
- `inspection_id` (required): Inspection ID

#### `inspection_suggest_next`
Gets guidance for the current section.

**Parameters:**
- `inspection_id` (required): Active inspection ID

#### `inspection_complete`
Finalizes inspection and generates PDF.

**Parameters:**
- `inspection_id` (required): Inspection ID
- `summary_notes` (optional): Overall notes
- `weather` (optional): Weather conditions

#### `inspection_get_report`
Retrieves a generated report.

**Parameters:**
- `inspection_id` (required): Inspection ID
- `format` (optional): "pdf" | "markdown" (default: "pdf")

## Development

```bash
# Type check
npm run typecheck

# Lint
npm run lint
```
