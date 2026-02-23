#!/bin/bash
# send-alert.sh - Send alerts to Discord webhook
# Usage: ./send-alert.sh "Alert message"
#
# Environment: DISCORD_ALERT_WEBHOOK

set -euo pipefail

WEBHOOK="${DISCORD_ALERT_WEBHOOK:-}"
MESSAGE="${1:-No message provided}"

if [ -z "$WEBHOOK" ]; then
  echo "Warning: DISCORD_ALERT_WEBHOOK not set, skipping alert"
  exit 0
fi

curl -s -X POST "$WEBHOOK" \
  -H "Content-Type: application/json" \
  -d "{\"content\":\"🚨 **Inspector Alert**\n${MESSAGE}\"}" \
  --max-time 10

echo "Alert sent: $MESSAGE"
