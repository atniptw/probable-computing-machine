import type { Pokemon } from '../../services/pokeapi'
import { toTitleCase } from '../../utils/format'
import styles from './MatchupViewer.module.css'

interface PokemonCardProps {
  label: string
  pokemon: Pokemon
}

export default function PokemonCard({ label, pokemon }: PokemonCardProps) {
  return (
    <article
      className={styles.pokemonCard}
      aria-label={`${label} pokemon card`}
    >
      <div className={styles.pokemonMeta}>
        <p className={styles.cardLabel}>{label}</p>
        <h3 className={styles.pokemonName}>{toTitleCase(pokemon.name)}</h3>
        <div className={styles.typeBadgeRow}>
          {pokemon.types.map((typeName) => (
            <span className={styles.typeBadge} key={typeName}>
              {toTitleCase(typeName)}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.spriteWrap}>
        {pokemon.sprite ? (
          <img
            src={pokemon.sprite}
            alt={`${toTitleCase(pokemon.name)} sprite`}
          />
        ) : (
          <span className={styles.spriteFallback} aria-hidden="true">
            {toTitleCase(pokemon.name).charAt(0)}
          </span>
        )}
      </div>
    </article>
  )
}
