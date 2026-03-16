# User Guide

## What This Does

The Pokémon Matchup Advisor shows which of your Pokémon are strong or weak against an opponent's team based on type effectiveness. Useful when playing a newer generation you haven't memorised the type chart for yet.

## How to Use It

### Step 1 — Enter Your Team

Type each of your Pokémon's names into the "Your Team" slots. Names are not case-sensitive.

```
Examples: pikachu, charizard, blastoise, gengar, machamp, snorlax
```

You can fill 1–6 slots. Empty slots are ignored.

### Step 2 — Enter the Opponent's Team

Type the opponent's Pokémon names into the "Opponent Team" slots.

Opponent search now uses a full cached Pokémon name index from PokéAPI.
You can type partial text to narrow suggestions, then select or complete an exact name to trigger matchup calculation.

### Step 3 — Check Matchups

Click the **Check Matchups** button. Results appear within 1–2 seconds.

---

## Reading the Results

Results display as a grid: your team along the rows, opponent's team along the columns.

### Effectiveness Labels

| Label | What it means |
|-------|--------------|
| **2×** | Super Effective — your type hits theirs hard |
| **1×** | Neutral — normal damage |
| **0.5×** | Not Very Effective — reduced damage |
| **0×** | No Effect — your attack does nothing |

Each cell shows two values:
- **You → Them**: effectiveness of your Pokémon's type against theirs
- **Them → You**: effectiveness of their type against yours

### Summary Bar

Below the grid: a count of how many of your matchups are super effective, neutral, or not very effective.

---

## Example

You have Pikachu (Electric) and Charizard (Fire/Flying).
Opponent has Blastoise (Water) and Venusaur (Grass/Poison).

| | Blastoise (Water) | Venusaur (Grass/Poison) |
|---|---|---|
| **Pikachu (Electric)** | You: 2× / Them: 0.5× ✅ | You: 1× / Them: 0.5× |
| **Charizard (Fire/Flying)** | You: 0.5× / Them: 2× ⚠️ | You: 2× / Them: 0.5× ✅ |

Reading row 1, col 1: Pikachu is super effective against Blastoise, and Blastoise is not very effective against Pikachu. Strong matchup — favour this one.

Reading row 2, col 1: Charizard is not very effective against Blastoise, and Blastoise hits Charizard for 2× damage. Avoid this matchup.

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
