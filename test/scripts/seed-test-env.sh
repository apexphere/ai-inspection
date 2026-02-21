#!/bin/bash
# Seed test environment on Railway
#
# Usage:
#   ./scripts/seed-test-env.sh
#
# Prerequisites:
#   - Railway CLI installed (npm i -g @railway/cli)
#   - Linked to project (railway link)
#   - TEST_PASSWORD set in Railway variables

set -e

echo "🚂 Running seed script on Railway..."
echo ""

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install with: npm i -g @railway/cli"
    exit 1
fi

# Run the seed script
cd "$(dirname "$0")/.."
railway run npm run seed

echo ""
echo "✅ Done!"
