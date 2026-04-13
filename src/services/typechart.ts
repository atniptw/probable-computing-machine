import {
  BASE_URL,
  fetchWithRetry,
  NetworkError,
  type Effectiveness,
  type PokeApiTypeListResponse,
  type PokeApiTypeResponse,
  type TypeMapOptions,
  type TypeRelations,
} from './pokeapiClient'

// --- Module-level type map cache ---

const typeMapCache = new Map<number, Map<string, TypeRelations>>()

// --- Type map helpers ---

function cloneTypeMap(
  source: Map<string, TypeRelations>,
): Map<string, TypeRelations> {
  return new Map(
    [...source.entries()].map(([typeName, relations]) => [
      typeName,
      {
        doubleDamageTo: [...relations.doubleDamageTo],
        halfDamageTo: [...relations.halfDamageTo],
        noDamageTo: [...relations.noDamageTo],
      },
    ]),
  )
}

function removeType(map: Map<string, TypeRelations>, typeName: string): void {
  map.delete(typeName)
  for (const relations of map.values()) {
    relations.doubleDamageTo = relations.doubleDamageTo.filter(
      (name) => name !== typeName,
    )
    relations.halfDamageTo = relations.halfDamageTo.filter(
      (name) => name !== typeName,
    )
    relations.noDamageTo = relations.noDamageTo.filter(
      (name) => name !== typeName,
    )
  }
}

function ensureHalfDamageTo(
  map: Map<string, TypeRelations>,
  attackerType: string,
  defenderType: string,
): void {
  const relations = map.get(attackerType)
  if (!relations) return
  if (!relations.halfDamageTo.includes(defenderType)) {
    relations.halfDamageTo.push(defenderType)
  }
  relations.doubleDamageTo = relations.doubleDamageTo.filter(
    (name) => name !== defenderType,
  )
  relations.noDamageTo = relations.noDamageTo.filter(
    (name) => name !== defenderType,
  )
}

function ensureNoDamageTo(
  map: Map<string, TypeRelations>,
  attackerType: string,
  defenderType: string,
): void {
  const relations = map.get(attackerType)
  if (!relations) return
  if (!relations.noDamageTo.includes(defenderType)) {
    relations.noDamageTo.push(defenderType)
  }
  relations.doubleDamageTo = relations.doubleDamageTo.filter(
    (name) => name !== defenderType,
  )
  relations.halfDamageTo = relations.halfDamageTo.filter(
    (name) => name !== defenderType,
  )
}

function applyGenerationTypeRules(
  map: Map<string, TypeRelations>,
  generation: number,
): void {
  if (generation < 6) {
    removeType(map, 'fairy')
    ensureHalfDamageTo(map, 'ghost', 'steel')
    ensureHalfDamageTo(map, 'dark', 'steel')
  }

  if (generation < 2) {
    removeType(map, 'dark')
    removeType(map, 'steel')
    ensureNoDamageTo(map, 'ghost', 'psychic')

    const iceRelations = map.get('ice')
    if (iceRelations) {
      iceRelations.halfDamageTo = iceRelations.halfDamageTo.filter(
        (type) => type !== 'fire',
      )
    }
  }
}

async function buildBaseTypeMap(): Promise<Map<string, TypeRelations>> {
  const listRes = await fetchWithRetry(`${BASE_URL}/type?limit=100`)
  if (!listRes.ok) throw new NetworkError()
  const listJson = (await listRes.json()) as PokeApiTypeListResponse

  const typeNames = listJson.results
    .map((t) => t.name)
    .filter((n) => n !== 'unknown' && n !== 'shadow')

  const baseMap = new Map<string, TypeRelations>()

  await Promise.all(
    typeNames.map(async (typeName) => {
      const res = await fetchWithRetry(`${BASE_URL}/type/${typeName}`)
      if (!res.ok) return
      const json = (await res.json()) as PokeApiTypeResponse
      const dr = json.damage_relations
      baseMap.set(typeName, {
        doubleDamageTo: dr.double_damage_to.map((t) => t.name),
        halfDamageTo: dr.half_damage_to.map((t) => t.name),
        noDamageTo: dr.no_damage_to.map((t) => t.name),
      })
    }),
  )

  return baseMap
}

export async function getTypeMap(
  options?: TypeMapOptions,
): Promise<Map<string, TypeRelations>> {
  const generation = options?.generation ?? 9

  const cached = typeMapCache.get(generation)
  if (cached) return cached

  const baseTypeMap = typeMapCache.get(9) ?? (await buildBaseTypeMap())
  if (!typeMapCache.has(9)) {
    typeMapCache.set(9, baseTypeMap)
  }

  const generationTypeMap = cloneTypeMap(baseTypeMap)
  applyGenerationTypeRules(generationTypeMap, generation)
  typeMapCache.set(generation, generationTypeMap)

  return generationTypeMap
}

export function calcEffectiveness(
  attackerTypes: string[],
  defenderTypes: string[],
  typeMap: Map<string, TypeRelations>,
): number {
  let modifier = 1
  for (const atkType of attackerTypes) {
    const relations = typeMap.get(atkType)
    if (!relations) continue
    for (const defType of defenderTypes) {
      if (relations.doubleDamageTo.includes(defType)) modifier *= 2
      else if (relations.halfDamageTo.includes(defType)) modifier *= 0.5
      else if (relations.noDamageTo.includes(defType)) modifier *= 0
    }
  }
  return modifier
}

export function modifierLabel(modifier: number): Effectiveness {
  if (modifier >= 2) return '2x'
  if (modifier === 1) return '1x'
  if (modifier > 0) return '0.5x'
  return '0x'
}
