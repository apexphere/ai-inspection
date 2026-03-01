#!/usr/bin/env bash
set -euo pipefail

# Parse flags
FORCE=false
for arg in "$@"; do
  case "$arg" in
    --force|-f) FORCE=true ;;
  esac
done

# Deploy building-inspection skill to Kai's OpenClaw workspace
# Issue #612 — version-aware, session-safe, atomic swap

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
SOURCE_SKILL="$ROOT_DIR/skills/building-inspection/SKILL.md"
TARGET_DIR="$HOME/.openclaw/agents/kai/workspace/skills/building-inspection"
TARGET_SKILL="$TARGET_DIR/SKILL.md"

# ── Helpers ──────────────────────────────────────────────────────────────────

extract_version() {
  local file="$1"
  grep -E "^version:" "$file" 2>/dev/null | sed 's/version:[[:space:]]*//' | tr -d '[:space:]' || echo ""
}

log() {
  echo "[deploy-skill] $*"
}

# ── Preflight ─────────────────────────────────────────────────────────────────

if [[ ! -f "$SOURCE_SKILL" ]]; then
  echo "ERROR: Source skill not found: $SOURCE_SKILL" >&2
  exit 1
fi

REPO_VERSION=$(extract_version "$SOURCE_SKILL")
if [[ -z "$REPO_VERSION" ]]; then
  echo "ERROR: Could not read version from $SOURCE_SKILL" >&2
  exit 1
fi

# ── Version check ─────────────────────────────────────────────────────────────

DEPLOYED_VERSION=""
if [[ -f "$TARGET_SKILL" ]]; then
  DEPLOYED_VERSION=$(extract_version "$TARGET_SKILL")
fi

log "Repo version:     $REPO_VERSION"
log "Deployed version: ${DEPLOYED_VERSION:-none}"

if [[ "$REPO_VERSION" == "$DEPLOYED_VERSION" ]]; then
  log "Already up to date — nothing to do."
  exit 0
fi

# ── Active session check ──────────────────────────────────────────────────────

SESSION_ACTIVE=false

# Check if an OpenClaw session for kai was updated in the last 10 minutes
SESSION_STATE_FILE="$HOME/.openclaw/agents/kai/session.json"
if [[ -f "$SESSION_STATE_FILE" ]]; then
  # File modified within last 10 minutes = active
  if find "$SESSION_STATE_FILE" -mmin -10 -print | grep -q .; then
    SESSION_ACTIVE=true
  fi
fi

# Also check openclaw status if available
if command -v openclaw &>/dev/null; then
  if openclaw status --agent kai 2>/dev/null | grep -q "active"; then
    SESSION_ACTIVE=true
  fi
fi

if [[ "$SESSION_ACTIVE" == "true" ]]; then
  if [[ "$FORCE" == "true" ]]; then
    log "WARNING: Kai has an active session — deploying anyway (--force)."
  else
    echo "WARNING: Kai has an active session — aborting deploy to avoid disruption." >&2
    echo "Use --force to override, or wait for the session to end and retry." >&2
    exit 2
  fi
fi

# ── Deploy (atomic swap) ──────────────────────────────────────────────────────

# Remove broken symlink if present
if [[ -L "$TARGET_DIR" ]]; then
  rm "$TARGET_DIR"
fi

mkdir -p "$TARGET_DIR"

TEMP_SKILL="$TARGET_DIR/SKILL.md.tmp"

# Copy to temp file first, then atomic rename
cp "$SOURCE_SKILL" "$TEMP_SKILL"
mv "$TEMP_SKILL" "$TARGET_SKILL"

log "Deployed: $DEPLOYED_VERSION -> $REPO_VERSION"
log "Skill file: $TARGET_SKILL"
