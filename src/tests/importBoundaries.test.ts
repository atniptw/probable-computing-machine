// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Resolve the src/ directory relative to this test file (src/tests/).
const SRC_DIR = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')

// ─── Helpers ──────────────────────────────────────────────────────────────────

function walkDir(dir: string): string[] {
  const result: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      result.push(...walkDir(full))
    } else if (full.endsWith('.ts') || full.endsWith('.tsx')) {
      result.push(full)
    }
  }
  return result
}

function extractImportPaths(filePath: string): string[] {
  const content = readFileSync(filePath, 'utf-8')
  return [...content.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(
    ([, path]) => path,
  )
}

/** Returns true if `importPath` resolves into the given layer directory. */
function importsFromLayer(importPath: string, layer: string): boolean {
  return importPath.includes(`/${layer}/`) || importPath.endsWith(`/${layer}`)
}

function findViolations(layerDir: string, forbiddenLayers: string[]): string[] {
  const violations: string[] = []
  for (const file of walkDir(join(SRC_DIR, layerDir))) {
    for (const imp of extractImportPaths(file)) {
      for (const layer of forbiddenLayers) {
        if (importsFromLayer(imp, layer)) {
          const shortFile = file.replace(SRC_DIR, 'src')
          violations.push(`${shortFile}: imports from ${layer} (${imp})`)
        }
      }
    }
  }
  return violations
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Import boundaries', () => {
  it('src/hooks/ does not import from src/components/', () => {
    expect(findViolations('hooks', ['components'])).toEqual([])
  })

  it('src/data/ does not import from src/hooks/ or src/services/', () => {
    expect(findViolations('data', ['hooks', 'services'])).toEqual([])
  })

  it('src/services/ does not import from src/hooks/ or src/components/', () => {
    expect(findViolations('services', ['hooks', 'components'])).toEqual([])
  })
})
