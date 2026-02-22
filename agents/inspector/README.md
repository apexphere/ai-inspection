# Inspector Agent

Building inspection assistant that works via WhatsApp.

## Quick Start

### 1. Build MCP Server

```bash
cd server
npm ci
npm run build
cd ..
```

### 2. Configure OpenClaw

Copy the config to your OpenClaw directory:

```bash
cp agents/inspector/openclaw.yml ~/.openclaw/
cp -r agents/inspector/workspace ~/.openclaw/agents/inspector/
```

Or merge with existing config if you have other agents.

### 3. Set Environment Variables

```bash
export ANTHROPIC_API_KEY="sk-..."
export API_URL="https://api-test-ai-inspection.apexphere.co.nz"
export API_KEY="your-api-key"
export INSPECTION_SERVER_PATH="/path/to/ai-inspection/server"
```

### 4. Add Inspector Phone Numbers

Edit `~/.openclaw/openclaw.yml`:

```yaml
channels:
  whatsapp:
    allowFrom:
      - "+64211234567"  # Inspector 1
      - "+64221234567"  # Inspector 2
```

### 5. Pair WhatsApp

```bash
openclaw whatsapp pair
# Scan QR code with phone
```

### 6. Start Gateway

```bash
openclaw gateway start
```

## Usage

Once running, inspectors can WhatsApp the paired number:

1. **Start:** "I'm at 45 Oak Avenue"
2. **Add findings:** "Gutters rusted on north side" + photo
3. **Navigate:** "next section" / "back to exterior"
4. **Complete:** "generate the report"

## Files

```
agents/inspector/
├── README.md           # This file
├── openclaw.yml        # OpenClaw configuration
└── workspace/
    ├── SOUL.md         # Agent persona
    └── SKILL.md        # Inspection workflow
```

## Troubleshooting

### WhatsApp disconnected

Re-pair with `openclaw whatsapp pair`

### MCP tools not working

Check that `server/dist/index.js` exists (run `npm run build` in server/)

### API errors

Verify API_URL and API_KEY are correct
