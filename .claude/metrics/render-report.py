#!/usr/bin/env python3
"""Render .claude/metrics/REPORT.md from ledger.jsonl.

Reads the append-only ledger, derives fixups_after_push live from git history,
and writes a per-difficulty trend report: last-N vs prior-N. See README.md.
"""
import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
LEDGER = HERE / "ledger.jsonl"
REPORT = HERE / "REPORT.md"
REPO_ROOT = HERE.parent.parent  # .claude/metrics -> .claude -> repo root

BANDS = [("S", "Small"), ("M", "Medium"), ("L", "Large")]

# metric key -> (label, direction) ; direction: "lo" lower-better, "hi" higher-better, "neu" neutral
QUALITY = [
    ("review_rounds", "review rounds", "lo"),
    ("verify_first_try", "verify first try", "hi"),
    ("fixups_after_push", "fixups after push", "lo"),
]
AUTONOMY = [
    ("corrections", "corrections (user redirected me)", "lo"),
    ("avoidable_handoffs", "avoidable handoffs", "lo"),
    ("wrong_calls", "wrong autonomous calls", "lo"),
    ("necessary_handoffs", "necessary handoffs", "neu"),
    ("autonomy_burden", "AUTONOMY BURDEN (corr+avoid+wrong)", "lo"),
]


def load_rows():
    if not LEDGER.exists():
        return []
    rows = []
    for line in LEDGER.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError:
            print(f"warn: skipping malformed ledger line: {line[:60]}...", file=sys.stderr)
    return rows


def derive_fixups(row):
    """Count commits referencing #<issue> that land after the sign-off commit."""
    commit = (row.get("commit") or "").strip()
    issue = row.get("issue")
    if not commit or issue is None:
        return None
    try:
        out = subprocess.run(
            ["git", "log", "--grep", f"#{issue}\\b", "-E", "--oneline", f"{commit}..HEAD"],
            cwd=REPO_ROOT, capture_output=True, text=True, timeout=20,
        )
        if out.returncode != 0:
            return None
        return sum(1 for l in out.stdout.splitlines() if l.strip())
    except (subprocess.SubprocessError, OSError):
        return None


def enrich(rows):
    for r in rows:
        r["fixups_after_push"] = derive_fixups(r)
        r["autonomy_burden"] = (
            int(r.get("corrections", 0))
            + int(r.get("avoidable_handoffs", 0))
            + int(r.get("wrong_calls", 0))
        )
    rows.sort(key=lambda r: r.get("ts", ""))
    return rows


def mean(vals):
    vals = [v for v in vals if v is not None]
    if not vals:
        return None
    return sum(float(v) for v in vals) / len(vals)


def fmt(metric, value):
    if value is None:
        return "—"
    if metric == "verify_first_try":
        return f"{value * 100:.0f}%"
    return f"{value:.1f}"


def trend(metric, direction, prior, last):
    if prior is None or last is None:
        return "(need more data)"
    if abs(last - prior) < 1e-9:
        return "→ flat"
    improved = (last < prior) if direction == "lo" else (last > prior)
    if direction == "neu":
        return "↑" if last > prior else "↓"
    return ("↓ better" if direction == "lo" and improved else
            "↑ better" if direction == "hi" and improved else
            "↑ worse" if direction == "lo" else "↓ worse")


def metric_value(rows, metric):
    if metric == "verify_first_try":
        return mean([1.0 if r.get("verify_first_try") else 0.0 for r in rows])
    return mean([r.get(metric) for r in rows])


def render_band(rows, window):
    last = rows[-window:]
    prior = rows[-2 * window:-window]
    lines = []

    def section(title, metrics):
        lines.append(f"| {title} | prior {len(prior)} | last {len(last)} | trend |")
        lines.append("|---|---|---|---|")
        for key, label, direction in metrics:
            pv = metric_value(prior, key) if prior else None
            lv = metric_value(last, key)
            lines.append(f"| {label} | {fmt(key, pv)} | {fmt(key, lv)} | {trend(key, direction, pv, lv)} |")

    section("quality", QUALITY)
    lines.append("| | | | |")
    section("autonomy", AUTONOMY)
    return "\n".join(lines)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--window", type=int, default=10, help="rolling window size (default 10)")
    args = p.parse_args()

    rows = enrich(load_rows())
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")

    out = ["# Agent Performance Report", "",
           f"_Generated {now} from `ledger.jsonl` ({len(rows)} issues scored). "
           f"Window = last {args.window} vs prior {args.window}, per difficulty band._", ""]

    if not rows:
        out += ["No issues scored yet. Score one with `score-issue.py`, then re-run this report.",
                "", "See `README.md` for how the loop works and `rubric.md` for the scoring bar."]
        REPORT.write_text("\n".join(out) + "\n", encoding="utf-8")
        print(f"Wrote {REPORT} (empty — no data yet).")
        return 0

    # Headline: one line PER BAND (never mix difficulties — that's the whole point)
    out += ["## Headline — autonomy burden & verify, per band", ""]
    any_trend = False
    for code, name in BANDS:
        band_rows = [r for r in rows if r.get("difficulty") == code]
        last_b = band_rows[-args.window:]
        prior_b = band_rows[-2 * args.window:-args.window]
        hb_p = metric_value(prior_b, "autonomy_burden") if prior_b else None
        hb_l = metric_value(last_b, "autonomy_burden") if last_b else None
        vq_p = metric_value(prior_b, "verify_first_try") if prior_b else None
        vq_l = metric_value(last_b, "verify_first_try") if last_b else None
        if hb_l is None:
            out.append(f"- **{name} ({code}):** no data yet")
            continue
        if prior_b:
            any_trend = True
        out.append(
            f"- **{name} ({code}):** burden {fmt('autonomy_burden', hb_p)} → "
            f"{fmt('autonomy_burden', hb_l)} {trend('autonomy_burden', 'lo', hb_p, hb_l)}  ·  "
            f"verify {fmt('verify_first_try', vq_p)} → {fmt('verify_first_try', vq_l)} "
            f"{trend('verify_first_try', 'hi', vq_p, vq_l)}"
        )
    out += ["",
            "> Getting better at autonomy = burden trends **down** while verify-first-try holds or rises."
            + ("" if any_trend else "  _(Need ≥2 windows in a band before a trend appears.)_"),
            ""]

    for code, name in BANDS:
        band_rows = [r for r in rows if r.get("difficulty") == code]
        out.append(f"## {name} ({code}) — {len(band_rows)} issues")
        out.append("")
        if not band_rows:
            out += ["_No issues in this band yet._", ""]
            continue
        out.append(render_band(band_rows, args.window))
        out.append("")

    # Recent notes feed the /retro distillation step
    recent = rows[-args.window:]
    notes = [(r.get("issue"), r.get("notes")) for r in recent if (r.get("notes") or "").strip()]
    if notes:
        out += ["## Recent notes (for /retro distillation)", ""]
        out += [f"- #{i}: {n}" for i, n in notes]
        out.append("")

    REPORT.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"Wrote {REPORT} from {len(rows)} scored issues.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
