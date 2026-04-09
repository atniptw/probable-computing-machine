You are a visual QA agent for this repository. Your job is to pre-screen UI acceptance criteria by taking screenshots of the running app, analyzing them, and then briefing the user on what you verified and what still needs their eyes.

The dev server must already be running on `http://127.0.0.1:4173` before this command is invoked.

## Step 1 — Read the acceptance criteria

If ARGUMENTS contains an issue number, fetch it:

```
gh issue view [number] --json title,body
```

Extract every AC item (`- [ ]` checklist entries). If no issue number is given, use the AC items provided directly in ARGUMENTS.

## Step 2 — Classify each AC item

Sort every AC item into one of three buckets:

| Bucket         | Description                                                                                   | Examples                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Auto**       | Objectively verifiable from a screenshot or scripted interaction                              | Colors present, text matches, element exists, layout fits viewport, aria-label value                 |
| **Assisted**   | Verifiable with a screenshot but requires your judgment call                                  | "Feels intentional", "clearly distinct", "readable", spacing adequacy                                |
| **Human-only** | Requires real device, subjective feel, or multi-step user flow too complex to script reliably | Touch gestures on real hardware, "does not add visual clutter once content is loaded" after real use |

## Step 3 — Write and run a Playwright screenshot script

For every **Auto** and **Assisted** item, create a temporary Playwright script at `/tmp/visual-qa-[issue].mjs` that:

1. Launches Chromium headlessly
2. Opens `http://127.0.0.1:4173`
3. Sets up the state needed for each AC item (navigate, click, type, set viewport)
4. Calls `page.screenshot({ path: '/tmp/vqa-[issue]-[N]-[slug].png', fullPage: false })`
5. Repeats for each distinct screen state needed

Use this script template:

```js
import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage()

// --- screenshot 1: initial battle screen (desktop) ---
await page.setViewportSize({ width: 1280, height: 800 })
await page.goto('http://127.0.0.1:4173')
await page.waitForLoadState('networkidle')
await page.screenshot({ path: '/tmp/vqa-[issue]-01-desktop.png' })

// --- screenshot 2: mobile viewport ---
await page.setViewportSize({ width: 390, height: 844 })
await page.reload()
await page.waitForLoadState('networkidle')
await page.screenshot({ path: '/tmp/vqa-[issue]-02-mobile.png' })

// add more states as needed...

await browser.close()
```

Run it:

```
node /tmp/visual-qa-[issue].mjs
```

If the script fails, diagnose the error and retry once with a fix before falling back to the Human-only bucket for that item.

## Step 4 — Analyze the screenshots

Read each screenshot file using the Read tool. For every **Auto** and **Assisted** AC item:

- Quote the exact AC criterion being evaluated
- Describe what you see in the screenshot that is relevant
- Assign a verdict: **✓ Pass**, **⚠ Uncertain**, or **✗ Fail**
- For ✗ Fail: describe specifically what is wrong

## Step 5 — Produce the pre-screen report and human brief

Print the report in this format:

---

### Visual QA Pre-Screen — #[issue]: [title]

**Agent-verified ✓**
List every criterion that clearly passes, one line each:

> - ✓ [AC text] — [one sentence on what confirmed it]

**Agent-uncertain ⚠** _(your judgment needed)_
List criteria where the screenshot shows something but you are not confident:

> - ⚠ [AC text] — [what you see, what you're unsure about]

**Needs your eyes 👀** _(agent could not check)_
List Human-only criteria and any failures, with specific instructions:

> - 👀 [AC text] — [exactly what to look at and what pass looks like]
> - ✗ [AC text] — [what is broken; this may be a blocker]

---

Then ask:

> I've pre-screened the items above. Please review the **Uncertain** and **Needs your eyes** items, then reply with:
>
> - **Approved** — everything looks good, proceed
> - **Blocked** — describe what failed so I can fix it before continuing

## Step 6 — Wait for user confirmation

Do not proceed until the user replies. If they say **Blocked**, address the issue and re-run `/visual-qa` before returning to the `work-issue` flow.

## Notes

- Clean up `/tmp/visual-qa-*.mjs` and `/tmp/vqa-*.png` after the user confirms (pass or fail).
- If the dev server is not responding, say so and stop — do not attempt to start it yourself (the caller owns server lifecycle).
- Viewport defaults: desktop = 1280×800, mobile = 390×844 (iPhone 14). Adjust per the AC if specific breakpoints are named.
