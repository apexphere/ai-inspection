#!/bin/bash
# kai-env-switch.sh — Switch Kai between local dev and Railway environments
# Usage: ./kai-env-switch.sh [local|railway|status]

KAI_ENV_FILE="$HOME/.openclaw/agents/kai/workspace/.env"
TARGET="${1:-status}"

case "$TARGET" in
  local)
    cat > "$KAI_ENV_FILE" << EOF
AI_INSPECTION_API_URL=http://localhost:3000
API_SERVICE_KEY=sk_2fbee9079bf823a4d57012714fe65f98ccad81fefda62bf4
EOF
    echo "✅ Switched Kai to LOCAL dev (http://localhost:3000)"
    ;;
  railway)
    cat > "$KAI_ENV_FILE" << EOF
AI_INSPECTION_API_URL=https://api-test-ai-inspection.apexphere.co.nz
API_SERVICE_KEY=sk_ca389e17cbf2b41ecc823502b3788cb116a3553f3514fe1d
EOF
    echo "✅ Switched Kai to RAILWAY test env"
    ;;
  status|*)
    echo "Current Kai config:"
    cat "$KAI_ENV_FILE"
    echo ""
    echo "Usage: $0 [local|railway]"
    ;;
esac
