#!/usr/bin/env bash
set -euo pipefail

# Deploy building-inspection skill to Kai's OpenClaw workspace
# Issue #590

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
SOURCE_SKILL="$ROOT_DIR/skills/building-inspection/SKILL.md"
TARGET_DIR="$HOME/.openclaw/agents/kai/workspace/skills/building-inspection"
TARGET_SKILL="$TARGET_DIR/SKILL.md"

if [[ ! -f "$SOURCE_SKILL" ]]; then
  echo "❌ Source skill not found: $SOURCE_SKILL" >&2
  exit 1
fi

# Remove broken symlink if present
if [[ -L "$TARGET_DIR" ]]; then
  rm "$TARGET_DIR"
fi

mkdir -p "$TARGET_DIR"

cp "$SOURCE_SKILL" "$TARGET_SKILL"

echo "✅ Deployed skill to: $TARGET_SKILL"
