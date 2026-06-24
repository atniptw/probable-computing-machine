#!/usr/bin/env python3
"""Append one scorecard row to .claude/metrics/ledger.jsonl.

Called at Step 9 of /work-issue. Values are assembled from the Step 5 prose
retrospective and the Step 6 review verdict, applying rubric.md. See README.md.
"""
import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

LEDGER = Path(__file__).resolve().parent / "ledger.jsonl"


def yesno(v: str) -> bool:
    s = v.strip().lower()
    if s in ("yes", "y", "true", "1"):
        return True
    if s in ("no", "n", "false", "0"):
        return False
    raise argparse.ArgumentTypeError(f"expected yes/no, got {v!r}")


def nonneg(v: str) -> int:
    i = int(v)
    if i < 0:
        raise argparse.ArgumentTypeError("must be >= 0")
    return i


def main() -> int:
    p = argparse.ArgumentParser(description="Append a scorecard row to the metrics ledger.")
    p.add_argument("--issue", type=int, required=True)
    p.add_argument("--difficulty", required=True, choices=["S", "M", "L"])
    p.add_argument("--review-rounds", type=nonneg, default=0)
    p.add_argument("--verify-first-try", type=yesno, required=True)
    p.add_argument("--corrections", type=nonneg, default=0)
    p.add_argument("--avoidable-handoffs", type=nonneg, default=0)
    p.add_argument("--necessary-handoffs", type=nonneg, default=0)
    p.add_argument("--wrong-calls", type=nonneg, default=0)
    p.add_argument("--commit", default="")
    p.add_argument("--notes", default="")
    args = p.parse_args()

    row = {
        "ts": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "issue": args.issue,
        "difficulty": args.difficulty,
        "review_rounds": args.review_rounds,
        "verify_first_try": args.verify_first_try,
        "corrections": args.corrections,
        "avoidable_handoffs": args.avoidable_handoffs,
        "necessary_handoffs": args.necessary_handoffs,
        "wrong_calls": args.wrong_calls,
        "commit": args.commit.strip(),
        "notes": args.notes.strip(),
    }

    with LEDGER.open("a", encoding="utf-8") as f:
        f.write(json.dumps(row, ensure_ascii=False) + "\n")

    burden = args.corrections + args.avoidable_handoffs + args.wrong_calls
    print(
        f"Scored #{args.issue} [{args.difficulty}] — "
        f"review_rounds={args.review_rounds}, verify_first_try={'yes' if args.verify_first_try else 'no'}, "
        f"autonomy_burden={burden} "
        f"(corrections={args.corrections}, avoidable={args.avoidable_handoffs}, wrong_calls={args.wrong_calls}; "
        f"necessary={args.necessary_handoffs})"
    )
    print(f"→ appended to {LEDGER}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
