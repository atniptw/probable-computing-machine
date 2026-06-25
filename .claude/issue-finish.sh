#!/usr/bin/env bash
# Land the current feature branch on main and clean up.
# Usage: bash .claude/issue-finish.sh <issue-number>
#
# Run from the feat/issue-<N> branch after the work is committed and verified.
# Pushes to main (fast-forward), syncs local main, deletes the feature branch.
# Replaces the recurring push + checkout + merge + branch-delete chain with one
# pre-approved call. If the push is rejected (main moved), it stops and reports.
set -euo pipefail

N="${1:?Usage: issue-finish.sh <issue-number>}"
BRANCH="feat/issue-$N"
REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO"

current="$(git rev-parse --abbrev-ref HEAD)"
if [ "$current" != "$BRANCH" ]; then
  echo "ERROR: expected to be on $BRANCH but on $current" >&2
  exit 1
fi

git push origin HEAD:main
git checkout main
git merge --ff-only "$BRANCH"
git branch -d "$BRANCH"

echo "Landed $BRANCH on main ($(git rev-parse --short HEAD))"
