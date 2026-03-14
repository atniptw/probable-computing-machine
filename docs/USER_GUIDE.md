# User Guide

## What This Does

The Pokémon Matchup Advisor shows which of your Pokémon are strong or weak against an opponent's team based on type effectiveness. Useful when playing a newer generation you haven't memorised the type chart for yet.

## How to Use It

### Step 1 — Configure Your Team

Use the **Configure Team** step to save up to 6 Pokémon. Names are not case-sensitive.

```
Examples: pikachu, charizard, blastoise, gengar, machamp, snorlax
```

You can fill 1–6 slots. Empty slots are ignored. Click **Save Team** to continue.

### Step 2 — Enter One Opponent

Search for a single opponent in the **Opponent** field.

Opponent search now uses a full cached Pokémon name index from PokéAPI.
You can type partial text to narrow suggestions, then select or complete an exact name to trigger matchup calculation.

### Step 3 — Check Matchups

Matchups run automatically once your opponent input is an exact Pokémon name.

---

## Reading the Results

Results display as grouped matchup cards for your saved team against the selected opponent.

### Effectiveness Labels

| Label | What it means |
|-------|--------------|
| **2×** | Super Effective — your type hits theirs hard |
| **1×** | Neutral — normal damage |
| **0.5×** | Not Very Effective — reduced damage |
| **0×** | No Effect — your attack does nothing |

Each card shows two values:
- **Attack effectiveness**: your team member into the selected opponent
- **Defensive risk**: selected opponent into your team member

### Summary Bar

Below the grid: a count of how many of your matchups are super effective, neutral, or not very effective.

---

## Example

Saved team includes Pikachu (Electric) and Charizard (Fire/Flying).
Selected opponent is Blastoise (Water).

- Pikachu might appear in **Best** (2× attack, low defensive risk).
- Charizard might appear in **Risky** (0.5× attack, higher defensive risk).

---

## Tips

- A **0×** matchup means complete immunity — switch out immediately, your attack does nothing.
- Dual-type Pokémon stack modifiers — a 2× against both types means 4× total damage.
- Use the summary bar to quickly identify your strongest team member against the opponent.

---

## Limitations

- Matchups are **type-only** — moves, abilities, held items, and stats are not considered.
- Data comes from PokéAPI v2 which covers official main-series games only.
- Fan-made Pokémon and ROM hacks are not supported.
