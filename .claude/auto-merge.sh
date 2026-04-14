#!/bin/bash
# .claude/auto-merge.sh
# Usage: bash .claude/auto-merge.sh feat/issue-N
#
# Cherry-picks a branch's commits onto main (resolving SESSIONS.md conflicts
# automatically), pushes, and cleans up the worktree.
# Handles the case where the agent already pushed directly to origin/main.

set -euo pipefail

BRANCH="${1:?Usage: auto-merge.sh feat/issue-N}"
REPO="$(git rev-parse --show-toplevel)"
ISSUE_NUM=$(echo "$BRANCH" | sed 's/feat\/issue-//')

cleanup_worktree() {
  local worktree_path="${1:-}"
  if [ -n "$worktree_path" ]; then
    git -C "$REPO" worktree remove "$worktree_path" --force 2>/dev/null || true
  fi
  git -C "$REPO" branch -d "$BRANCH" 2>/dev/null || git -C "$REPO" branch -D "$BRANCH" 2>/dev/null || true
}

echo "→ Fetching origin/main..."
git -C "$REPO" fetch origin main --quiet

# Sync local main with origin/main
git -C "$REPO" merge --ff-only origin/main --quiet 2>/dev/null || true

# Check if agent already pushed the branch commits to origin/main directly.
# Use GitHub issue state as the authoritative signal: if the issue is CLOSED,
# the "Closes #N" commit landed in main and we just need to clean up the worktree.
AHEAD=$(git -C "$REPO" log "main..$BRANCH" --oneline 2>/dev/null | wc -l | tr -d ' ')
ISSUE_STATE=$(gh issue view "$ISSUE_NUM" --json state --jq .state 2>/dev/null || echo "OPEN")
if [ "$AHEAD" -eq 0 ] && [ "$ISSUE_STATE" = "CLOSED" ]; then
  echo "→ Branch commits already in main (agent pushed directly) — cleaning up"
  WORKTREE_PATH=$(git -C "$REPO" worktree list --porcelain | awk -v branch="refs/heads/$BRANCH" '/^worktree /{path=$2} $2==branch{print path}')
  if [ -z "$WORKTREE_PATH" ]; then
    WORKTREE_PATH=$(git -C "$REPO" worktree list | awk -v n="$ISSUE_NUM" '$1 ~ "pcm-issue-" n "$" {print $1}')
  fi
  cleanup_worktree "${WORKTREE_PATH:-}"
  COMMIT_MSG=$(git -C "$REPO" log -1 --pretty="%s")
  FILES_CHANGED=$(git -C "$REPO" show --stat HEAD | tail -1)
  echo "MERGED: $COMMIT_MSG | $FILES_CHANGED"
  exit 0
fi

# Derive worktree path for cleanup later — try branch-name lookup first,
# fall back to path pattern for detached HEAD / mid-rebase worktrees.
WORKTREE_PATH=$(git -C "$REPO" worktree list --porcelain | awk -v branch="refs/heads/$BRANCH" '/^worktree /{path=$2} $2==branch{print path}')
if [ -z "$WORKTREE_PATH" ]; then
  WORKTREE_PATH=$(git -C "$REPO" worktree list | awk -v n="$ISSUE_NUM" '$1 ~ "pcm-issue-" n "$" {print $1}')
fi

# Cherry-pick branch commits onto main (operates in main repo, avoids
# the git 2.43+ rebase --continue AUTO_MERGE false-positive issue).
echo "→ Cherry-picking $BRANCH onto main..."
COMMITS=$(git -C "$REPO" log "main..$BRANCH" --reverse --format="%H")

if [ -z "$COMMITS" ]; then
  echo "ERROR: No commits found on $BRANCH ahead of main" >&2
  exit 1
fi

for SHA in $COMMITS; do
  git -C "$REPO" cherry-pick "$SHA" 2>&1 || {
    CONFLICTS=$(git -C "$REPO" diff --name-only --diff-filter=U 2>/dev/null)

    if echo "$CONFLICTS" | grep -q "^SESSIONS.md$" && [ "$(echo "$CONFLICTS" | wc -l | tr -d ' ')" -eq 1 ]; then
      echo "→ Resolving SESSIONS.md conflict automatically..."
      python3 "$REPO/.claude/resolve-sessions-conflict.py" "$REPO/SESSIONS.md"
      git -C "$REPO" add SESSIONS.md
      git -C "$REPO" cherry-pick --continue --no-edit
    else
      echo "ERROR: Conflict in unexpected file(s):" >&2
      echo "$CONFLICTS" >&2
      echo "Aborting cherry-pick — run: git -C $REPO cherry-pick --abort" >&2
      exit 1
    fi
  }
done

echo "→ Pushing to origin/main..."
git -C "$REPO" push origin main

# Capture summary before cleanup
COMMIT_MSG=$(git -C "$REPO" log -1 --pretty="%s")
FILES_CHANGED=$(git -C "$REPO" show --stat HEAD | tail -1)

echo "→ Cleaning up worktree and branch..."
cleanup_worktree "${WORKTREE_PATH:-}"

echo "MERGED: $COMMIT_MSG | $FILES_CHANGED"
