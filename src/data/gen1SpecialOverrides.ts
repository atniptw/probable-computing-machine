/**
 * Pokémon whose Gen 1 Special stat differs from their modern `special-attack` value.
 * Key = PokéAPI lowercase name. Value = correct Gen 1 Special base stat.
 *
 * PokéAPI returns the modern `special-attack`/`special-defense` split for every
 * Pokémon. For most Gen 1 species `special-attack` equals the original Special, but
 * a few were changed when Game Freak split the stat in Gen 2. This table records the
 * confirmed exceptions; the damage calculator (#97/B1) uses it for Gen 1 only.
 *
 * Verify each entry against a reference Gen 1 calculator (e.g. Pokémon Showdown's calc).
 */
export const GEN1_SPECIAL_OVERRIDES: Record<string, number> = {
  gengar: 100, // modern SpAtk = 130; Gen 1 Special = 100
}
