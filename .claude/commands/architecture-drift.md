You are an architecture fitness sensor for this repository. Compare the live codebase against `docs/COMPONENT_DESIGN.md` and report any divergences. Execute the steps below in order.

## Step 1 — Read the documented architecture

Read `docs/COMPONENT_DESIGN.md` and extract two lists:

- **Documented components**: every named component in the Runtime Component Tree section (skip inline JSX notes and `×N` multiplicity markers).
- **Documented hooks**: every hook name in the App Contract hooks section.
- **Documented dormant**: every file listed in the Dormant Assets table.

## Step 2 — Read the live codebase

Run the following commands to enumerate what actually exists:

```
# All component files (non-test)
find src/components -name "*.tsx" | sort

# All hook files (non-test)
find src/hooks -name "*.ts" | sort
```

Extract base names (without path or extension) from the results.

## Step 3 — Static import analysis

For each component and hook file found in Step 2, check whether it is imported by any non-test source file:

```
grep -r "import.*from.*<filename>" src --include="*.ts" --include="*.tsx" | grep -v "\.test\."
```

Flag any file with zero non-test imports as a **dormant candidate**.

## Step 4 — Compare and report

Produce a structured drift report with these sections:

### Missing from docs

Components or hooks present in `src/` but not mentioned in `docs/COMPONENT_DESIGN.md`. These need to be documented.

### Stale in docs

Components or hooks listed in `docs/COMPONENT_DESIGN.md` but no longer present in `src/`. These need to be removed from the doc.

### Dormant candidates

Files in `src/` with no non-test imports. Cross-reference with the Dormant Assets table: items already listed there are **expected**; items not listed are **new candidates** that should be added to the table or removed.

### Summary

| Category               | Count |
| ---------------------- | ----- |
| Missing from docs      | N     |
| Stale in docs          | N     |
| New dormant candidates | N     |

**Verdict**: `CLEAN` (all counts zero) or `DRIFT DETECTED` (any count > 0).

## Step 5 — Recommend actions

For each divergence, state the recommended action using the resolution process in `docs/COMPONENT_DESIGN.md`:

- Missing from docs → update COMPONENT_DESIGN.md
- Stale in docs → remove entry from COMPONENT_DESIGN.md
- New dormant candidate → add to Dormant Assets table or open a clean-up issue
