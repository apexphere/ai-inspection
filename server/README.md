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
| `start_inspection` | Start a new inspection at an address |
| `add_finding` | Record a finding/issue |
| `add_photo` | Attach a photo to a section |
| `go_to_section` | Navigate checklist sections |
| `get_status` | Get inspection progress |
| `complete_inspection` | Finish and generate report |

## Development

```bash
# Type check
npm run typecheck

# Lint
npm run lint
```
