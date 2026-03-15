# User Guide

## What This Does

The Pokémon Matchup Advisor gives one clear recommendation for which Pokémon to send out against a selected opponent, using type effectiveness only.

## How to Use It

### Step 1 — Select Opponent on Main Battle Screen

The app opens to the battle screen by default.

Type 2–3 letters in the **Opponent** input and tap one of the instant suggestions.

### Step 2 — Read the Primary Recommendation

As soon as an exact opponent match is selected, the app shows a large **Best Choice** card with:

- Pokémon name
- Type badges
- Reason text (for example: “Immune to Electric ⚡”)
- “Based on type effectiveness” label

### Step 3 — Expand Optional Secondary Options

Tap **Show other options (X)** to open grouped alternatives:

- Also Good
- Neutral
- Risky

### Step 4 — Edit Team (When Needed)

Use **Edit Team** (top-right or team preview bar) to open team configuration.

Use up to 6 slots. Duplicates are allowed. Fewer than 6 entries is valid.

```
Examples: pikachu, charizard, blastoise, gengar, machamp, snorlax
```

Tap **Save Team** to persist locally and return to the battle screen.

---

## Reading the Results

Results prioritize one primary recommendation first, then optional secondary groups.

### Effectiveness Labels

| Label | What it means |
|-------|--------------|
| **2×** | Super Effective — your type hits theirs hard |
| **1×** | Neutral — normal damage |
| **0.5×** | Not Very Effective — reduced damage |
| **0×** | No Effect — your attack does nothing |

Each card shows two values:
- Defensive type result reason text (immune/resists/neutral/weak)
- Type badges for quick scanning

Team preview appears as a horizontal bar of small team icons and opens the editor on tap.

---

## Example

Saved team includes Swampert, Manectric, and Breloom.
Selected opponent is Pikachu.

- Swampert appears as **Best Choice** because it is immune to Electric.
- Other team members appear under **Also Good**, **Neutral**, or **Risky**.

---

## Tips

- A **0×** incoming matchup means complete immunity to that opponent type.
- Dual-type Pokémon stack modifiers — a 2× against both types means 4× total damage.
- Keep secondary options collapsed unless you need alternatives quickly.

---

## Limitations

- Matchups are **type-only** — moves, abilities, held items, and stats are not considered.
- Data comes from PokéAPI v2 which covers official main-series games only.
- Fan-made Pokémon and ROM hacks are not supported.
