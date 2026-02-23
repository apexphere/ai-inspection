#!/bin/bash
# healthcheck.sh - Check OpenClaw gateway health
# Returns 0 if healthy, 1 if unhealthy
# Used by container health checks and monitoring

set -euo pipefail

HEALTH_URL="${HEALTH_URL:-http://localhost:3000/health}"
TIMEOUT="${TIMEOUT:-5}"

response=$(curl -s --max-time "$TIMEOUT" "$HEALTH_URL" || echo "FAIL")

if echo "$response" | grep -q "OK\|ok\|healthy"; then
  echo "Health check passed"
  exit 0
else
  echo "Health check failed: $response"
  exit 1
fi
