"""
PreToolUse hook — logs Bash commands that don't match the settings.json allowlist.
These are the commands that fall through to a user approval prompt.
Output goes to .claude/approval-log.md for periodic review.
"""
import sys
import json
import re
import datetime
import os

try:
    data = json.load(sys.stdin)
    cmd = data.get("tool_input", {}).get("command", "")
except Exception:
    sys.exit(0)

if not cmd:
    sys.exit(0)

# Mirrors the allowlist patterns in settings.json — keep in sync when allowlist changes
ALLOWED = [
    r"^npm run ",
    r"^npm audit",
    r"^npm install$",
    r"^npx playwright test",
    r"^npx playwright install",
    r"^bash /home/atnip/projects/probable-computing-machine/\.claude/",
    r"^find /home/atnip/projects/pcm-issue-",
    r"^git (add|diff|log|status|commit|fetch|merge|worktree|rm|push)",
    r"^git -C .* (log|diff|status|worktree|fetch|merge)",
    r"^gh (issue|label)",
    r"^gh pr (list|view)",
    r"^curl -s http://127\.0\.0\.1",
    r"^sleep ",
    r"^rm /tmp/(vqa|visual-qa|dr|design-review)-",
    r"^node /tmp/.*\.mjs",
]

if any(re.match(p, cmd) for p in ALLOWED):
    sys.exit(0)

log = os.path.join(os.path.dirname(__file__), "approval-log.md")
ts = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
with open(log, "a") as f:
    # Truncate very long commands (e.g. heredocs) to keep the table readable
    display = cmd.strip().replace("\n", " ↵ ")
    if len(display) > 120:
        display = display[:117] + "..."
    f.write(f"| {ts} | `{display}` |\n")

sys.exit(0)
