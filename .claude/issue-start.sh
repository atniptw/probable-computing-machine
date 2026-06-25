#!/usr/bin/env bash
# Start work on an issue: create its feature branch and mark it in progress.
# Usage: bash .claude/issue-start.sh <issue-number>
#
# Replaces the recurring `git checkout -b ... && gh issue edit ...` sequence
# with a single pre-approved call (the bash .claude/* allowlist entry covers it).
set -euo pipefail

N="${1:?Usage: issue-start.sh <issue-number>}"
REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO"

git checkout -b "feat/issue-$N"
gh issue edit "$N" --add-label "in progress" >/dev/null 2>&1 ||
  echo "warn: could not add 'in progress' label to #$N (continuing)"

echo "Started feat/issue-$N"
