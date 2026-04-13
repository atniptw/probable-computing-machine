#!/bin/bash
# .claude/auto-merge.sh
# Usage: bash .claude/auto-merge.sh feat/issue-N
#
# Rebases a worktree branch onto main (resolving SESSIONS.md conflicts
# automatically), merges to main, pushes, and cleans up the worktree.
# Handles the case where the agent already pushed directly to origin/main.

set -euo pipefail

BRANCH="${1:?Usage: auto-merge.sh feat/issue-N}"
REPO="$(git rev-parse --show-toplevel)"

# Derive worktree path from git worktree list
WORKTREE_PATH=$(git worktree list --porcelain | awk '/^worktree /{path=$2} /^branch refs\/heads\/'"$BRANCH"'/{print path}')

if [ -z "$WORKTREE_PATH" ]; then
  echo "ERROR: No worktree found for branch $BRANCH" >&2
  exit 1
fi

echo "→ Fetching origin/main..."
git -C "$REPO" fetch origin main --quiet

# Sync local main with origin/main
git -C "$REPO" merge --ff-only origin/main --quiet 2>/dev/null || true

# Check if agent already pushed the branch commits to origin/main directly
if ! git -C "$REPO" merge-base --is-ancestor "main" "$BRANCH" 2>/dev/null || \
   [ "$(git -C "$REPO" log "main..$BRANCH" --oneline 2>/dev/null | wc -l | tr -d ' ')" -eq 0 ]; then
  echo "→ Branch commits already in main (agent pushed directly) — cleaning up"
  git -C "$REPO" worktree remove "$WORKTREE_PATH" --force 2>/dev/null || true
  git -C "$REPO" branch -d "$BRANCH" 2>/dev/null || true
  COMMIT_MSG=$(git -C "$REPO" log -1 --pretty="%s")
  FILES_CHANGED=$(git -C "$REPO" show --stat HEAD | tail -1)
  echo "MERGED: $COMMIT_MSG | $FILES_CHANGED"
  exit 0
fi

# Rebase branch onto current main
echo "→ Rebasing $BRANCH onto main..."
git -C "$WORKTREE_PATH" rebase main 2>&1 || {
  CONFLICTS=$(git -C "$WORKTREE_PATH" diff --name-only --diff-filter=U 2>/dev/null)

  if [ "$(echo "$CONFLICTS" | grep -c .)" -eq 1 ] && echo "$CONFLICTS" | grep -q "^SESSIONS.md$"; then
    echo "→ Resolving SESSIONS.md conflict automatically..."
    python3 "$REPO/.claude/resolve-sessions-conflict.py" "$WORKTREE_PATH/SESSIONS.md"
    git -C "$WORKTREE_PATH" add SESSIONS.md
    GIT_EDITOR=true git -C "$WORKTREE_PATH" rebase --continue
  else
    echo "ERROR: Conflict in unexpected file(s): $CONFLICTS" >&2
    echo "Manual resolution required — run: git -C $WORKTREE_PATH rebase --abort" >&2
    exit 1
  fi
}

# Fast-forward merge into main
echo "→ Merging $BRANCH into main..."
git -C "$REPO" merge --ff-only "$BRANCH"

echo "→ Pushing to origin/main..."
git -C "$REPO" push origin main

# Capture summary before cleanup
COMMIT_MSG=$(git -C "$REPO" log -1 --pretty="%s")
FILES_CHANGED=$(git -C "$REPO" show --stat HEAD | tail -1)

echo "→ Cleaning up worktree and branch..."
git -C "$REPO" worktree remove "$WORKTREE_PATH" --force 2>/dev/null || true
git -C "$REPO" branch -d "$BRANCH" 2>/dev/null || true

echo "MERGED: $COMMIT_MSG | $FILES_CHANGED"
