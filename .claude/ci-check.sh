#!/usr/bin/env bash
# Confirm the GitHub CI run (deploy.yml: lint/format/tsc/test/build/e2e) for the
# current main HEAD actually passed — don't assume local verify == CI green.
#
# Usage: bash .claude/ci-check.sh
# Exit: 0 = CI succeeded; 1 = failed/cancelled; 2 = no run found.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"
REPO_SLUG="atniptw/probable-computing-machine"
SHA="$(git rev-parse HEAD)"

echo "→ Locating CI run for ${SHA:0:8} ..."
RUN_ID=""
for _ in $(seq 1 20); do
  RUN_ID="$(gh run list --repo "$REPO_SLUG" --branch main --limit 20 \
    --json databaseId,headSha \
    --jq "[.[] | select(.headSha==\"$SHA\")][0].databaseId" 2>/dev/null || true)"
  if [ -n "$RUN_ID" ] && [ "$RUN_ID" != "null" ]; then break; fi
  sleep 6
done

if [ -z "$RUN_ID" ] || [ "$RUN_ID" = "null" ]; then
  echo "✗ No CI run found for $SHA after ~2m — check GitHub Actions manually." >&2
  exit 2
fi

echo "→ Watching run $RUN_ID (this blocks until CI finishes) ..."
if gh run watch "$RUN_ID" --repo "$REPO_SLUG" --exit-status >/dev/null 2>&1; then
  echo "✓ CI green for ${SHA:0:8} (run $RUN_ID)"
else
  echo "✗ CI did NOT pass for ${SHA:0:8} (run $RUN_ID)." >&2
  echo "  Inspect: gh run view $RUN_ID --log-failed" >&2
  exit 1
fi
