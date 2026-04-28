import { computed, type Ref } from 'vue'
import {
  resolveLayout,
  type PrototypeConfig,
  type ResolvedLayout,
  type ZoneConfig
} from './useDesignEngine'

// ─── Score ────────────────────────────────────────────────────────────────────

export interface LayoutScore {
  total: number // 0–100 overall
  alignment: number // 0–1  devices on same Y within zone
  spacing: number // 0–1  gap consistency across devices
  symmetry: number // 0–1  left-right mass balance
  ergonomics: number // 0–1  reach + clearance
  feasibility: number // 0–1  in-bounds, no overflow
}

// ─── Diagnostics ──────────────────────────────────────────────────────────────

export type DiagnosticLevel = 'info' | 'warn' | 'error'

export interface CompilerDiagnostic {
  level: DiagnosticLevel
  code: string
  message: string
}

// ─── Limits ───────────────────────────────────────────────────────────────────

const PHYSICAL_LIMITS = {
  maxWidth: { min: 30, max: 220 },
  maxDepth: { min: 18, max: 90 },
  maxHeight: { min: 12, max: 130 },
  thickness: { min: 1.2, max: 3.5 }
}

const MAX_ZONE_TYPE_COUNT: Record<string, number> = {
  controller: 1,
  rhythm: 1,
  routing: 2
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

// ─── Normalize ────────────────────────────────────────────────────────────────

function enforceZoneRules(zones: ZoneConfig[]): ZoneConfig[] {
  const typeCounts: Record<string, number> = {}
  let primaryCount = 0

  return zones.map((z) => {
    typeCounts[z.type] = (typeCounts[z.type] ?? 0) + 1
    const overLimit = (MAX_ZONE_TYPE_COUNT[z.type] ?? Infinity) < typeCounts[z.type]!

    let focus = z.focus as ZoneConfig['focus']
    if (focus === 'primary') {
      focus = primaryCount > 0 ? 'secondary' : 'primary'
      if (focus === 'primary') primaryCount++
    }

    return { ...z, focus: overLimit ? 'none' : (focus ?? 'none') }
  })
}

export function normalizeIntent(raw: PrototypeConfig): PrototypeConfig {
  return {
    ...raw,
    profile: {
      ...raw.profile,
      aggressiveness: clamp(raw.profile.aggressiveness, 0, 1)
    },
    constraints: {
      ...raw.constraints,
      maxWidth: clamp(raw.constraints.maxWidth, PHYSICAL_LIMITS.maxWidth.min, PHYSICAL_LIMITS.maxWidth.max),
      maxDepth: clamp(raw.constraints.maxDepth, PHYSICAL_LIMITS.maxDepth.min, PHYSICAL_LIMITS.maxDepth.max),
      maxHeight: clamp(raw.constraints.maxHeight, PHYSICAL_LIMITS.maxHeight.min, PHYSICAL_LIMITS.maxHeight.max),
      thickness: clamp(raw.constraints.thickness, PHYSICAL_LIMITS.thickness.min, PHYSICAL_LIMITS.thickness.max),
      rearClearance: Math.max(0, raw.constraints.rearClearance),
      maxReachDepth: clamp(raw.constraints.maxReachDepth, 20, 60),
      minClearanceAboveDevice: Math.max(1, raw.constraints.minClearanceAboveDevice)
    },
    composition: {
      ...raw.composition,
      symmetry: clamp(raw.composition.symmetry, 0, 1)
    },
    zones: enforceZoneRules(raw.zones)
  }
}

// ─── Validate ─────────────────────────────────────────────────────────────────

export function validateIntent(config: PrototypeConfig): CompilerDiagnostic[] {
  const diags: CompilerDiagnostic[] = []
  const C = config.constraints

  const stackable = config.zones.filter(
    z => !z.mount && z.mode !== 'tray-separate'
  )

  if (stackable.length > 5) {
    diags.push({
      level: 'warn',
      code: 'TOO_MANY_ZONES',
      message: `${stackable.length} stacked zones — may exceed max height of ${C.maxHeight} cm`
    })
  }

  if (config.profile.aggressiveness > 0.8 && C.maxDepth < 25) {
    diags.push({
      level: 'warn',
      code: 'AGGRESSIVE_SHALLOW',
      message: 'High aggressiveness with shallow depth may produce inaccessible upper zones'
    })
  }

  if (C.rearClearance > C.maxDepth * 0.4) {
    diags.push({
      level: 'warn',
      code: 'EXCESSIVE_REAR_CLEARANCE',
      message: `Rear clearance ${C.rearClearance} cm is >40% of depth — usable deck area will be very limited`
    })
  }

  if (C.thickness < 1.5) {
    diags.push({
      level: 'warn',
      code: 'THIN_PANELS',
      message: `Panel thickness ${C.thickness} cm may be structurally weak under heavy devices`
    })
  }

  const primaryZones = config.zones.filter(z => z.focus === 'primary')
  if (primaryZones.length === 0 && stackable.length > 2) {
    diags.push({
      level: 'info',
      code: 'NO_PRIMARY_FOCUS',
      message: 'No primary focus zone — hierarchy will be flat; consider marking one zone as primary'
    })
  }

  if (C.maxWidth > 100 && config.composition.align === 'weighted-left') {
    diags.push({
      level: 'info',
      code: 'WIDE_WEIGHTED',
      message: 'Wide cabinet with weighted-left alignment may leave large empty right side'
    })
  }

  return diags
}

// ─── Score ────────────────────────────────────────────────────────────────────

function scoreAlignment(layout: ResolvedLayout): number {
  let penalty = 0
  let count = 0

  for (const zone of layout.zones) {
    if (zone.isSpine || zone.devices.length < 2) continue

    const ys = zone.devices.map(d => d.position[1])
    const mean = ys.reduce((s, y) => s + y, 0) / ys.length
    const variance = ys.reduce((s, y) => s + (y - mean) ** 2, 0) / ys.length
    const avgH = zone.devices.reduce((s, d) => s + d.size[1], 0) / zone.devices.length

    penalty += avgH > 0 ? Math.min(Math.sqrt(variance) / (avgH * 0.4), 1) : 0
    count++
  }

  return count > 0 ? Math.max(0, 1 - penalty / count) : 1
}

function scoreSpacing(layout: ResolvedLayout): number {
  let totalCV = 0
  let count = 0

  for (const zone of layout.zones) {
    if (zone.isSpine || zone.devices.length < 3) continue

    const sorted = [...zone.devices].sort((a, b) => a.position[0] - b.position[0])
    const gaps: number[] = []

    for (let i = 1; i < sorted.length; i++) {
      const left = sorted[i - 1]!.position[0] + sorted[i - 1]!.size[0] / 2
      const right = sorted[i]!.position[0] - sorted[i]!.size[0] / 2
      if (right - left > 0) gaps.push(right - left)
    }

    if (gaps.length < 2) continue

    const mean = gaps.reduce((s, g) => s + g, 0) / gaps.length
    const std = Math.sqrt(gaps.reduce((s, g) => s + (g - mean) ** 2, 0) / gaps.length)
    totalCV += mean > 0 ? std / mean : 1
    count++
  }

  return count > 0 ? Math.max(0, 1 - totalCV / count) : 1
}

function scoreSymmetry(layout: ResolvedLayout): number {
  const { align, symmetry } = layout.config.composition
  if (align !== 'balanced' && symmetry < 0.4) return 1

  let totalImbalance = 0
  let count = 0

  for (const zone of layout.zones) {
    if (zone.isSpine || zone.devices.length === 0) continue

    const totalMass = zone.devices.reduce((s, d) => s + d.size[0], 0)
    if (totalMass === 0) continue

    const com = zone.devices.reduce((s, d) => s + d.position[0] * d.size[0], 0) / totalMass
    const halfW = layout.config.constraints.maxWidth * 0.005
    totalImbalance += Math.abs(com) / halfW
    count++
  }

  return count > 0 ? Math.max(0, 1 - totalImbalance / count) : 1
}

function scoreErgonomics(layout: ResolvedLayout): number {
  const errors = layout.warnings.filter(w => w.severity === 'error').length
  const warns = layout.warnings.filter(w => w.severity === 'warn').length
  return Math.max(0, 1 - errors * 0.3 - warns * 0.08)
}

function scoreFeasibility(layout: ResolvedLayout): number {
  const halfW = layout.config.constraints.maxWidth * 0.005
  const maxH = layout.config.constraints.maxHeight * 0.01
  let penalty = 0

  for (const zone of layout.zones) {
    for (const dev of zone.devices) {
      if (Math.abs(dev.position[0]) + dev.size[0] / 2 > halfW + 0.005) penalty += 0.25
      if (dev.position[1] > maxH + 0.01) penalty += 0.25
    }
  }

  return Math.max(0, 1 - penalty)
}

export function scoreLayout(layout: ResolvedLayout): LayoutScore {
  const alignment = scoreAlignment(layout)
  const spacing = scoreSpacing(layout)
  const symmetry = scoreSymmetry(layout)
  const ergonomics = scoreErgonomics(layout)
  const feasibility = scoreFeasibility(layout)

  const weighted = alignment * 0.20 + spacing * 0.25 + symmetry * 0.20 + ergonomics * 0.20 + feasibility * 0.15
  const total = Math.round(weighted * 100)

  return { total, alignment, spacing, symmetry, ergonomics, feasibility }
}

// ─── Composable ───────────────────────────────────────────────────────────────

export function useDesignCompiler(rawConfig: Ref<PrototypeConfig> | PrototypeConfig) {
  const raw = computed<PrototypeConfig>(() => 'value' in rawConfig ? rawConfig.value : rawConfig)
  const normalized = computed(() => normalizeIntent(raw.value))
  const diags = computed(() => validateIntent(normalized.value))

  const layout = computed(() => resolveLayout(normalized.value))
  const score = computed(() => scoreLayout(layout.value))

  return { layout, score, diagnostics: diags, normalized }
}
