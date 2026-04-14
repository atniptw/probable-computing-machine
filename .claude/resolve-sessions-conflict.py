#!/usr/bin/env python3
"""
Resolve a SESSIONS.md merge conflict during git rebase.

Called by auto-merge.sh when SESSIONS.md is the only conflicted file.
Uses git's index stages to get clean versions of both sides, then
produces a merged file with the branch's new entries prepended to main's.

Usage: resolve-sessions-conflict.py /path/to/worktree/SESSIONS.md
"""
import subprocess
import re
import sys
import os

sessions_file = sys.argv[1] if len(sys.argv) > 1 else "SESSIONS.md"
worktree_dir = os.path.dirname(os.path.abspath(sessions_file))


def get_git_version(stage: int, path: str = "SESSIONS.md") -> str | None:
    """Get a specific stage of a conflicted file from the git index.
    Stage 2 = ours (main, rebasing onto), Stage 3 = theirs (branch commit).
    Returns None if the stage doesn't exist (file was auto-merged by git)."""
    result = subprocess.run(
        ["git", "show", f":{stage}:{path}"],
        cwd=worktree_dir,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return None
    return result.stdout


def split_sessions(content: str) -> tuple[str, list[str]]:
    """Split SESSIONS.md into (header, [session_entry, ...]).
    Each session entry starts with a ## YYYY-MM-DD line."""
    match = re.search(r"(?m)^## \d{4}-\d{2}-\d{2}", content)
    if not match:
        return content, []
    header = content[: match.start()]
    body = content[match.start() :]
    entries = re.split(r"(?m)(?=^## \d{4}-\d{2}-\d{2})", body)
    return header, [e for e in entries if e.strip()]


def entry_title(entry: str) -> str:
    m = re.match(r"^## .+", entry)
    return m.group(0) if m else ""


# Stage 2 = main (ours), Stage 3 = branch (theirs)
# If stage 2 is absent, git auto-merged the file — nothing to do.
main_content = get_git_version(2)
if main_content is None:
    print("SESSIONS.md has no stage 2 — already auto-merged by git, skipping", file=sys.stderr)
    sys.exit(0)

branch_content = get_git_version(3)
if branch_content is None:
    print("SESSIONS.md has no stage 3 — nothing to merge in from branch, skipping", file=sys.stderr)
    sys.exit(0)

header, main_entries = split_sessions(main_content)
_, branch_entries = split_sessions(branch_content)

# New entries: in branch but not in main
main_titles = {entry_title(e) for e in main_entries}
new_entries = [e for e in branch_entries if entry_title(e) not in main_titles]

if not new_entries:
    print("Warning: no new entries found in branch — writing main version", file=sys.stderr)
    with open(sessions_file, "w") as f:
        f.write(main_content)
    sys.exit(0)

# Assemble: header + new branch entries + all main entries
parts = [header.rstrip("\n")]
for entry in new_entries:
    parts.append("\n" + entry.rstrip("\n"))
for entry in main_entries:
    parts.append("\n" + entry.rstrip("\n"))

result = "\n".join(parts).lstrip("\n") + "\n"

with open(sessions_file, "w") as f:
    f.write(result)

print(f"Resolved: prepended {len(new_entries)} new session entry/entries from branch")
