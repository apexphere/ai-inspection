# Building Inspection Skill for OpenClaw

OpenClaw skill that guides building inspectors through property inspections.

## Installation

### 1. Build the MCP Server

```bash
cd server
npm install
npm run build
```

### 2. Install the Skill

Symlink the skill to Kai's workspace:

```bash
ln -sf $(pwd)/agents/kai/workspace ~/.openclaw/agents/kai/workspace/skills/building-inspection
```

The skill includes `mcp.json` (in `skill/`) — OpenClaw auto-loads MCP server config from there.

### 3. Test

Start a conversation:

```
You: I'm at 123 Test Street for an inspection
Agent: Starting inspection at 123 Test Street...
```

## Files

- **SKILL.md:** `agents/kai/workspace/SKILL.md` — Kai's behavior instructions
- **mcp.json:** `skill/mcp.json` — MCP server configuration
- **Server:** `server/` — MCP server implementation

## Data Storage

- **Database:** Prisma/PostgreSQL
- **Photos:** Cloudflare R2
- **Reports:** Generated PDFs stored in R2
