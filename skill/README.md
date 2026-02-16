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

Copy the `skill/` directory to your OpenClaw skills folder:

```bash
cp -r skill ~/.openclaw/skills/building-inspection
```

Or symlink for development:

```bash
ln -s $(pwd)/skill ~/.openclaw/skills/building-inspection
```

### 3. Configure OpenClaw

Add to your OpenClaw config (`~/.openclaw/config.yaml`):

```yaml
skills:
  - building-inspection

mcpServers:
  ai-inspection:
    command: node
    args:
      - /path/to/ai-inspection/server/dist/index.js
    env:
      DATA_DIR: /path/to/ai-inspection/data
```

### 4. Test

Start a conversation:

```
You: I'm at 123 Test Street for an inspection
Agent: Starting inspection at 123 Test Street...
```

## Usage

See [SKILL.md](SKILL.md) for the full workflow and commands.

## Data Storage

- **Database:** `data/inspections.db` (SQLite)
- **Photos:** `data/photos/{inspection_id}/`
- **Reports:** `data/reports/{inspection_id}.pdf`
