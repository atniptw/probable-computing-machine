Work a group of issues in parallel using git worktrees. ARGUMENTS is a
space-separated list of issue numbers (e.g. `/work-wave 44 47 33`).

## Step 1 — Create worktrees

For each issue number N in ARGUMENTS, run:

```
git worktree add -b feat/issue-N ../pcm-issue-N
```

## Step 2 — Print terminal instructions

Print a launch block for each issue so the user knows exactly what to open:

```
Wave ready — open one terminal per issue:

Terminal 1 — #N (issue title):
  cd ~/projects/pcm-issue-N && claude
  Then: /work-issue N

Terminal 2 — ...
```

Fetch each issue title with `gh issue view N --json title --jq .title` before printing.

## Step 3 — Start the wave monitor

Construct and start a **persistent** Monitor. The monitor command must embed
the branch list for this specific wave. Template:

```bash
REPO="/home/atnip/projects/probable-computing-machine"
BRANCHES=(feat/issue-N1 feat/issue-N2 ...)   # substitute actual branches
declare -A MERGED

while true; do
  git -C "$REPO" fetch --all --quiet 2>/dev/null

  all_done=true
  for branch in "${BRANCHES[@]}"; do
    [[ "${MERGED[$branch]:-}" == "done" ]] && continue
    all_done=false

    count=$(git -C "$REPO" log "main..$branch" --oneline 2>/dev/null | wc -l | tr -d ' ')
    if [[ "$count" -gt 0 ]]; then
      last_files=$(git -C "$REPO" diff-tree --no-commit-id -r --name-only "$branch" 2>/dev/null)
      if echo "$last_files" | grep -q "SESSIONS.md"; then
        echo "[READY] $branch"
        MERGED[$branch]="done"
      else
        echo "[WAITING] $branch — commits present, SESSIONS.md not yet updated"
      fi
    else
      # "Already in main": agent pushed directly to origin/main, bypassing the branch.
      # Use GitHub issue state as the authoritative signal — if the issue is CLOSED,
      # the commit with "Closes #N" landed in main and we just need to clean up.
      issue_num=$(echo "$branch" | sed 's/feat\/issue-//')
      issue_state=$(gh issue view "$issue_num" --json state --jq .state 2>/dev/null || echo "OPEN")
      if [[ "$issue_state" == "CLOSED" ]]; then
        echo "[READY] $branch (already in main)"
        MERGED[$branch]="done"
      fi
    fi
  done

  $all_done && echo "[WAVE_COMPLETE]" && exit 0
  sleep 120
done
```

## Step 4 — React to monitor events

**When `[READY] feat/issue-N` fires:**

1. Run: `bash /home/atnip/projects/probable-computing-machine/.claude/auto-merge.sh feat/issue-N`
2. Capture the last line of output (starts with `MERGED:`).
3. Post to the user: `✓ #N merged — [summary from MERGED line]`
4. If the script exits non-zero: post `⚠ #N needs attention` and quote the error output.

**When `[WAVE_COMPLETE]` fires:**

Post a brief wave summary:

```
Wave complete ✓
  #N1 — [commit message]
  #N2 — [commit message]
  ...
All issues merged and pushed to main.
```

## Notes

- Do not ask the user for approval before each merge — the work-issue
  workflow already includes a reviewer agent (step 6) and user sign-off
  (step 7) before the branch is pushed. The [READY] signal is sufficient.
- The only exception: if auto-merge.sh exits non-zero with a conflict in
  a file other than SESSIONS.md, pause and report to the user.
- SESSIONS.md conflicts are always resolved automatically by
  `.claude/resolve-sessions-conflict.py`.
