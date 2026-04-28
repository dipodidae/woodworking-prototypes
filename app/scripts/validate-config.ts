#!/usr/bin/env node
// Validate a PrototypeConfig JSON without booting Nuxt.
// Usage:
//   node --experimental-strip-types scripts/validate-config.ts <path>
//   cat config.json | node --experimental-strip-types scripts/validate-config.ts -
//
// Exits 0 if the config compiles to a feasible layout (score >= 60 and no
// `error`-severity warnings), 1 otherwise. Always prints a JSON report so an
// AI agent can parse it.

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { resolveLayout, type PrototypeConfig } from '../app/composables/useDesignEngine'
import {
  normalizeIntent,
  validateIntent,
  scoreLayout
} from '../app/composables/useDesignCompiler'

const arg = process.argv[2]
if (!arg) {
  console.error('Usage: validate-config.ts <path-to-json> | -')
  process.exit(2)
}

const raw = arg === '-'
  ? readFileSync(0, 'utf8')
  : readFileSync(resolve(process.cwd(), arg), 'utf8')

let parsed: PrototypeConfig
try {
  parsed = JSON.parse(raw) as PrototypeConfig
} catch (err) {
  console.error(JSON.stringify({ ok: false, stage: 'parse', error: (err as Error).message }, null, 2))
  process.exit(1)
}

const required = ['profile', 'zones', 'composition', 'constraints'] as const
const missing = required.filter(k => !(k in parsed))
if (missing.length > 0) {
  console.error(JSON.stringify({ ok: false, stage: 'shape', missing }, null, 2))
  process.exit(1)
}

const normalized = normalizeIntent(parsed)
const diagnostics = validateIntent(normalized)

let layout
try {
  layout = resolveLayout(normalized)
} catch (err) {
  console.error(JSON.stringify({
    ok: false,
    stage: 'resolve',
    error: (err as Error).message,
    diagnostics
  }, null, 2))
  process.exit(1)
}

const score = scoreLayout(layout)
const errors = layout.warnings.filter(w => w.severity === 'error')

const report = {
  ok: score.total >= 60 && errors.length === 0,
  id: normalized.id,
  label: normalized.label,
  score,
  diagnostics,
  warnings: layout.warnings,
  cabinet: {
    width: normalized.constraints.maxWidth,
    depth: normalized.constraints.maxDepth,
    maxHeight: normalized.constraints.maxHeight,
    style: normalized.profile.style
  },
  zones: layout.zones.map(z => ({
    id: z.id,
    type: z.type,
    focus: z.focus,
    tiltDeg: Number(z.tiltDeg.toFixed(1)),
    devices: z.devices.map(d => d.deviceId)
  })),
  cableCount: layout.cables.length
}

console.log(JSON.stringify(report, null, 2))
process.exit(report.ok ? 0 : 1)
