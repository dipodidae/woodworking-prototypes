import { MathUtils, Vector2, Vector3 } from 'three'
import deviceCatalog from '../data/devices.json'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Vec3 = [number, number, number]

export interface DevicePort {
  id: string
  type: string
  face: string
  offset: number
  count?: number
}

export interface DevicePower {
  type: string
  face: string
  offset: number
}

export interface DeviceEntry {
  label: string
  w: number
  d: number
  h: number
  category: string
  power: DevicePower | null
  ports: DevicePort[]
}

export interface ZoneConfig {
  type: string
  devices?: string[]
  focus?: 'primary' | 'secondary' | 'none'
  mode?: 'deck' | 'tray-separate'
  mount?: 'spine-right' | 'mid-shelf'
  pedals?: {
    layout: 'grid' | 'staggered' | 'hero-left'
    anchor: 'left' | 'center'
    density: 'tight' | 'medium' | 'loose'
    rows: number
  }
}

export interface ProfileConfig {
  style: 'performance-wedge' | 'studio-console' | 'compact-block' | 'brutalist'
  aggressiveness: number
  smoothness: 'stepped' | 'angular' | 'smooth'
}

export interface CompositionConfig {
  align: 'center' | 'weighted-left' | 'balanced'
  spacing: 'tight' | 'breathing'
  symmetry: number
}

export type CableType = 'midi' | 'audio' | 'cv' | 'usb' | 'power'

export interface ConnectivityEntry {
  from: string
  to: string
  type: CableType
}

export interface PowerConfig {
  strip: { position: string, outlets: number }
  routing: 'rear-trench' | 'rear-drop'
}

export interface ConstraintsConfig {
  maxWidth: number
  maxDepth: number
  maxHeight: number
  thickness: number
  rearClearance: number
  maxReachDepth: number
  minClearanceAboveDevice: number
  cableDrop: boolean
}

export interface PrototypeConfig {
  id: string
  label: string
  description: string
  profile: ProfileConfig
  zones: ZoneConfig[]
  composition: CompositionConfig
  connectivity: ConnectivityEntry[]
  power: PowerConfig
  constraints: ConstraintsConfig
}

// ─── Resolved output types ───────────────────────────────────────────────────

export interface ResolvedDevice {
  id: string
  deviceId: string
  label: string
  size: Vec3
  position: Vec3
  rotation: Vec3
  category: string
  isGhost: boolean
  riserHeight: number
}

export interface ResolvedSubPlatform {
  deckSize: Vec3
  deckPosition: Vec3
  lipSize: Vec3
  lipPosition: Vec3
  sideStops: { size: Vec3, position: Vec3 }[]
}

export interface ResolvedZone {
  id: string
  type: string
  focus: 'primary' | 'secondary' | 'none'
  groupPosition: Vec3
  groupRotation: Vec3
  tiltDeg: number
  height: number
  deckSize: Vec3 | null
  deckPosition: Vec3 | null
  lipSize: Vec3 | null
  lipPosition: Vec3 | null
  devices: ResolvedDevice[]
  subPlatform: ResolvedSubPlatform | null
  isSeparateTray: boolean
  isSpine: boolean
}

export interface ResolvedPanel {
  id: string
  size: Vec3
  position: Vec3
}

export interface ResolvedCable {
  id: string
  type: string
  color: string
  thickness: number
  points: Vector3[]
}

export interface ResolvedPowerStrip {
  size: Vec3
  position: Vec3
}

export interface ErgonomicsWarning {
  severity: 'warn' | 'error'
  message: string
}

export interface ResolvedLayout {
  panels: ResolvedPanel[]
  sideProfilePoints: Vector2[]
  zones: ResolvedZone[]
  cables: ResolvedCable[]
  powerStrip: ResolvedPowerStrip | null
  powerCables: ResolvedCable[]
  camera: { position: Vec3, target: Vec3, fov: number }
  warnings: ErgonomicsWarning[]
  config: PrototypeConfig
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CM = 0.01
const DEVICES = deviceCatalog as Record<string, DeviceEntry>

const CABLE_STYLES: Record<string, { color: string, thickness: number }> = {
  midi: { color: '#4488ff', thickness: 0.002 },
  audio: { color: '#ff4444', thickness: 0.0025 },
  cv: { color: '#44dd88', thickness: 0.0015 },
  usb: { color: '#888888', thickness: 0.002 },
  power: { color: '#ffcc00', thickness: 0.003 }
}

const DENSITY_GAP: Record<string, number> = {
  tight: 0.5,
  medium: 1.5,
  loose: 3
}

// Profile style modifiers — profile drives zones
interface StyleModifiers {
  synthTiltRange: [number, number]
  controllerTiltRange: [number, number]
  pedalTiltRange: [number, number]
  compressionFactor: number
  massDistribution: 'bottom-heavy' | 'even' | 'uniform' | 'heavy'
}

const STYLE_MODIFIERS: Record<string, StyleModifiers> = {
  'performance-wedge': {
    synthTiltRange: [10, 13],
    controllerTiltRange: [0, 3],
    pedalTiltRange: [6, 10],
    compressionFactor: 0.7,
    massDistribution: 'bottom-heavy'
  },
  'studio-console': {
    synthTiltRange: [5, 8],
    controllerTiltRange: [3, 5],
    pedalTiltRange: [5, 7],
    compressionFactor: 0.3,
    massDistribution: 'even'
  },
  'compact-block': {
    synthTiltRange: [2, 4],
    controllerTiltRange: [0, 2],
    pedalTiltRange: [3, 5],
    compressionFactor: 0.5,
    massDistribution: 'uniform'
  },
  'brutalist': {
    synthTiltRange: [12, 15],
    controllerTiltRange: [8, 10],
    pedalTiltRange: [8, 12],
    compressionFactor: 0,
    massDistribution: 'heavy'
  }
}

// Zone sort order (bottom to top)
const ZONE_ORDER: Record<string, number> = {
  pedals: 1,
  synth: 2,
  looper: 3,
  controller: 4,
  rhythm: 4
}

// ─── Utility functions ───────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t))
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function getDevice(id: string): DeviceEntry {
  const d = DEVICES[id]
  if (!d) throw new Error(`Unknown device: ${id}`)
  return d
}

// ─── 3a. Profile-driven zone resolver ────────────────────────────────────────

interface ResolvedZoneSpec {
  config: ZoneConfig
  tiltDeg: number
  height: number
  depth: number
  order: number
  focus: 'primary' | 'secondary' | 'none'
}

function resolveZones(config: PrototypeConfig): ResolvedZoneSpec[] {
  const mods = (STYLE_MODIFIERS[config.profile.style] ?? STYLE_MODIFIERS['studio-console'])!
  const a = config.profile.aggressiveness
  const T = config.constraints.thickness

  // Separate stackable zones from special zones (routing/spine, separate tray)
  const stackableZones: ZoneConfig[] = []
  const specialZones: ZoneConfig[] = []

  for (const z of config.zones) {
    if (z.mount === 'spine-right' || z.mount === 'mid-shelf') {
      specialZones.push(z)
    } else if (z.mode === 'tray-separate') {
      specialZones.push(z)
    } else {
      stackableZones.push(z)
    }
  }

  // Sort stackable zones by type order
  const sorted = [...stackableZones].sort((a, b) => {
    const oa = ZONE_ORDER[a.type] ?? 3
    const ob = ZONE_ORDER[b.type] ?? 3
    return oa - ob
  })

  const specs: ResolvedZoneSpec[] = []

  // Compute heights and tilts for stackable zones
  for (const z of sorted) {
    const focus = (z.focus || 'none') as 'primary' | 'secondary' | 'none'
    let tiltDeg = 0
    let baseHeight = 0
    const clearance = config.constraints.minClearanceAboveDevice

    // Collect device heights
    const deviceIds = z.devices || []
    const devices = deviceIds.map(id => getDevice(id))
    const maxDevH = devices.length > 0 ? Math.max(...devices.map(d => d.h)) : 8

    // Compute tilt from profile style
    switch (z.type) {
      case 'synth':
        tiltDeg = lerp(mods.synthTiltRange[0], mods.synthTiltRange[1], a)
        break
      case 'controller':
        tiltDeg = lerp(mods.controllerTiltRange[0], mods.controllerTiltRange[1], a)
        break
      case 'rhythm':
        tiltDeg = lerp(mods.controllerTiltRange[0], mods.controllerTiltRange[1], a)
        break
      case 'pedals':
        tiltDeg = lerp(mods.pedalTiltRange[0], mods.pedalTiltRange[1], a)
        break
      case 'looper':
        tiltDeg = 0
        break
      default:
        tiltDeg = 0
    }

    // Focus adjustments
    if (focus === 'primary') {
      tiltDeg += 3
    } else if (focus === 'secondary') {
      tiltDeg += 1.5
    }

    // Physical clamp: max 18°
    tiltDeg = clamp(tiltDeg, 0, 18)

    // Compute zone height: device height + clearance + deck thickness
    if (z.type === 'pedals' && z.mode === 'deck') {
      baseHeight = 10 + clearance + 0.5
    } else {
      baseHeight = maxDevH + clearance
    }

    // Primary focus gets extra vertical space
    if (focus === 'primary') {
      baseHeight += 3
    }

    // Determine depth
    const usableDepth = config.constraints.maxDepth - config.constraints.rearClearance
    const depth = Math.min(usableDepth, config.constraints.maxReachDepth)

    specs.push({
      config: z,
      tiltDeg,
      height: baseHeight,
      depth,
      order: ZONE_ORDER[z.type] ?? 3,
      focus
    })
  }

  // Compression: if total height exceeds maxHeight, compress
  const totalWoodHeight = (specs.length + 1) * T
  const totalZoneHeight = specs.reduce((s, z) => s + z.height, 0)
  const totalNeeded = (totalZoneHeight + totalWoodHeight) * CM / CM // in cm
  const available = config.constraints.maxHeight

  if (totalNeeded > available) {
    const excess = totalNeeded - available
    const compressionPerZone = excess / specs.length
    for (const s of specs) {
      s.height = Math.max(s.height - compressionPerZone, 8)
      // Also reduce tilts if compressing
      const tiltReduction = compressionPerZone * mods.compressionFactor * 0.5
      s.tiltDeg = clamp(s.tiltDeg - tiltReduction, 0, 18)
    }
  }

  // Add special zones with no height contribution
  for (const z of specialZones) {
    specs.push({
      config: z,
      tiltDeg: z.mount === 'spine-right' ? 10 : 0,
      height: 0,
      depth: 0,
      order: 99,
      focus: (z.focus || 'none') as 'primary' | 'secondary' | 'none'
    })
  }

  return specs
}

// ─── 3b/3c. Compositional layout ─────────────────────────────────────────────

function layoutDevicesInZone(
  deviceIds: string[],
  zoneWidthCm: number,
  composition: CompositionConfig,
  focus: 'primary' | 'secondary' | 'none',
  deckThicknessCm: number
): ResolvedDevice[] {
  if (deviceIds.length === 0) return []

  const gap = composition.spacing === 'tight' ? 1 : 3
  const edgeMargin = composition.spacing === 'tight' ? 0.5 : 2
  const devices = deviceIds.map(id => ({ id, ...getDevice(id) }))

  // Sort: widest first for balanced, as-is for weighted-left
  if (composition.align === 'balanced') {
    devices.sort((a, b) => b.w - a.w)
  }

  const totalDevW = devices.reduce((s, d) => s + d.w, 0)
  const totalGaps = (devices.length - 1) * gap
  const totalNeeded = totalDevW + totalGaps + edgeMargin * 2
  const actualGap = totalNeeded > zoneWidthCm
    ? Math.max(0.3, gap - (totalNeeded - zoneWidthCm) / Math.max(1, devices.length - 1))
    : gap

  const result: ResolvedDevice[] = []

  if (devices.length === 1) {
    const d = devices[0]!
    let xCm = 0

    if (focus === 'primary') {
      xCm = 0
    } else if (composition.align === 'weighted-left') {
      xCm = -zoneWidthCm / 2 + edgeMargin + d.w / 2
    } else {
      xCm = 0
    }

    result.push({
      id: d.id,
      deviceId: d.id,
      label: d.label,
      size: [d.w * CM, d.h * CM, d.d * CM],
      position: [xCm * CM, deckThicknessCm * CM + (d.h / 2) * CM, -(1 + d.d / 2) * CM],
      rotation: [0, 0, 0],
      category: d.category,
      isGhost: true,
      riserHeight: 0
    })
  } else if (devices.length === 2) {
    const d1 = devices[0]!
    const d2 = devices[1]!
    const widthRatio = Math.min(d1.w, d2.w) / Math.max(d1.w, d2.w)
    const balanced = widthRatio > 0.8

    let x1: number, x2: number

    if (balanced || composition.align === 'balanced') {
      // Evenly distribute
      const block = d1.w + d2.w + actualGap
      const startX = -block / 2
      x1 = startX + d1.w / 2
      x2 = startX + d1.w + actualGap + d2.w / 2
    } else if (composition.align === 'weighted-left') {
      // Anchor larger left
      x1 = -zoneWidthCm / 2 + edgeMargin + d1.w / 2
      x2 = x1 + d1.w / 2 + actualGap + d2.w / 2
    } else {
      // Center
      const block = d1.w + d2.w + actualGap
      const startX = -block / 2
      x1 = startX + d1.w / 2
      x2 = startX + d1.w + actualGap + d2.w / 2
    }

    // Apply symmetry nudge: pull toward center by symmetry factor
    const center = 0
    x1 = lerp(x1, center - (d1.w + actualGap / 2) / 2, composition.symmetry * 0.3)
    x2 = lerp(x2, center + (d2.w + actualGap / 2) / 2, composition.symmetry * 0.3)

    for (const [d, xCm] of [[d1, x1], [d2, x2]] as [typeof d1, number][]) {
      result.push({
        id: d.id,
        deviceId: d.id,
        label: d.label,
        size: [d.w * CM, d.h * CM, d.d * CM],
        position: [xCm * CM, deckThicknessCm * CM + (d.h / 2) * CM, -(1 + d.d / 2) * CM],
        rotation: [0, 0, 0],
        category: d.category,
        isGhost: true,
        riserHeight: 0
      })
    }
  } else {
    // 3+ devices: group by size, distribute left to right
    let cursor = -zoneWidthCm / 2 + edgeMargin
    for (const d of devices) {
      const xCm = cursor + d.w / 2
      result.push({
        id: d.id,
        deviceId: d.id,
        label: d.label,
        size: [d.w * CM, d.h * CM, d.d * CM],
        position: [xCm * CM, deckThicknessCm * CM + (d.h / 2) * CM, -(1 + d.d / 2) * CM],
        rotation: [0, 0, 0],
        category: d.category,
        isGhost: true,
        riserHeight: 0
      })
      cursor += d.w + actualGap
    }
  }

  return result
}

// ─── 3d. Constrained pedal fill ──────────────────────────────────────────────

function fillPedals(
  pedalConfig: NonNullable<ZoneConfig['pedals']>,
  zoneWidthCm: number,
  deckThicknessCm: number
): ResolvedDevice[] {
  const gapCm = DENSITY_GAP[pedalConfig.density] ?? 1.5
  // Build the mix: 1 large + 2 medium + 1-2 mini
  const mix: string[] = ['strymon-standard', 'boss-compact', 'mxr-standard', 'ehx-nano', 'tc-mini']

  const result: ResolvedDevice[] = []
  const maxH = Math.max(...mix.map(id => getDevice(id).h))

  let cursor = pedalConfig.anchor === 'left'
    ? -zoneWidthCm / 2 + 1
    : -(mix.reduce((s, id) => s + getDevice(id).w + gapCm, -gapCm)) / 2

  for (const id of mix) {
    const d = getDevice(id)
    if (cursor + d.w > zoneWidthCm / 2 - 0.5) break

    const riserH = maxH - d.h
    const xCm = cursor + d.w / 2
    result.push({
      id: `pedal-${id}`,
      deviceId: id,
      label: d.label,
      size: [d.w * CM, d.h * CM, d.d * CM],
      position: [xCm * CM, deckThicknessCm * CM + riserH * CM + (d.h / 2) * CM, -(1 + d.d / 2) * CM],
      rotation: [0, 0, 0],
      category: 'pedal',
      isGhost: true,
      riserHeight: riserH * CM
    })
    cursor += d.w + gapCm
  }

  // Staggered: offset every other pedal in Z
  if (pedalConfig.layout === 'staggered') {
    for (let i = 0; i < result.length; i++) {
      if (i % 2 === 1) {
        const p = result[i]!.position
        result[i]!.position = [p[0], p[1], p[2] - 1.5 * CM]
      }
    }
  }

  return result
}

// ─── 3e. Profile → side-wall geometry ────────────────────────────────────────

function generateProfile(
  zones: ResolvedZoneSpec[],
  config: PrototypeConfig
): Vector2[] {
  const T = config.constraints.thickness
  const maxD = config.constraints.maxDepth
  const rearC = config.constraints.rearClearance
  const a = config.profile.aggressiveness

  // Collect stackable zones (ordered bottom to top)
  const stackable = zones.filter(z =>
    z.config.mount !== 'spine-right' && z.config.mount !== 'mid-shelf' && z.config.mode !== 'tray-separate'
  ).sort((a, b) => a.order - b.order)

  // Build Y positions (cumulative) and front-edge depths
  const points: Vector2[] = []
  let currentY = 0 // in cm from bottom

  // Bottom-left of cabinet (front-bottom)
  points.push(new Vector2(0, 0))

  for (let i = 0; i < stackable.length; i++) {
    const z = stackable[i]!
    const shelfY = currentY + T // top of shelf

    // Front edge offset: taper based on zone index and aggressiveness
    const taperFactor = (i / Math.max(1, stackable.length - 1)) * a
    const frontOffset = taperFactor * maxD * 0.3 // max 30% of depth inset

    // Clamp: min tier depth 18 cm
    const effectiveDepth = Math.max(18, maxD - rearC - frontOffset)
    const frontZ = maxD - rearC - effectiveDepth

    // Clamp: min 8 cm at top
    const clampedFrontZ = Math.min(frontZ, maxD - rearC - 8)

    if (config.profile.smoothness === 'stepped') {
      // Horizontal at shelf, then angled deck front edge
      points.push(new Vector2(clampedFrontZ, shelfY))
      points.push(new Vector2(clampedFrontZ, shelfY + 0.5)) // small step up for deck
    } else {
      // Angular: straight line to front edge
      points.push(new Vector2(clampedFrontZ, shelfY))
    }

    currentY = shelfY + z.height
  }

  // Top shelf — must be at least as inset as the last stacked shelf,
  // otherwise the side-wall polygon kinks back outward and self-intersects.
  const lastFrontZ = points.length > 1 ? points[points.length - 1]!.x : 0
  const topY = currentY + T
  const topFrontZ = Math.max(lastFrontZ, a * maxD * 0.25)
  const clampedTopZ = Math.min(topFrontZ, maxD - rearC - 8)
  points.push(new Vector2(clampedTopZ, topY))

  // Back edge at top
  points.push(new Vector2(maxD, topY))

  // Back edge at bottom
  points.push(new Vector2(maxD, 0))

  // Close the polygon
  // Already starts at (0, 0)

  return points
}

// ─── 3f. Cable routing ───────────────────────────────────────────────────────

interface DeviceWorldPosition {
  deviceId: string
  center: Vector3
  size: Vec3
}

function resolvePortWorldPosition(
  deviceId: string,
  portId: string,
  devicePositions: Map<string, DeviceWorldPosition>
): Vector3 | null {
  const devPos = devicePositions.get(deviceId)
  if (!devPos) return null

  const dev = DEVICES[deviceId]
  if (!dev) return null

  const port = dev.ports.find(p => p.id === portId)
  if (!port) return null

  const [cx, cy, cz] = [devPos.center.x, devPos.center.y, devPos.center.z]
  const [hw, hh, hd] = [devPos.size[0] / 2, devPos.size[1] / 2, devPos.size[2] / 2]

  switch (port.face) {
    case 'back':
      return new Vector3(
        cx - hw + port.offset * devPos.size[0],
        cy,
        cz - hd
      )
    case 'left':
      return new Vector3(cx - hw, cy, cz - hd + port.offset * devPos.size[2])
    case 'right':
      return new Vector3(cx + hw, cy, cz - hd + port.offset * devPos.size[2])
    case 'top':
      return new Vector3(
        cx - hw + port.offset * devPos.size[0],
        cy + hh,
        cz
      )
    default:
      return new Vector3(cx, cy, cz)
  }
}

function routeCable(
  from: Vector3,
  to: Vector3,
  rearZ: number,
  floorY: number
): Vector3[] {
  // Route: exit port → drop to rear → travel horizontally → rise to target
  const rearFromZ = rearZ - 0.02 // 2 cm behind rear clearance line
  const rearToZ = rearFromZ

  const waypoints: Vector3[] = [
    from.clone(),
    new Vector3(from.x, from.y, rearFromZ),
    new Vector3(from.x, Math.max(floorY + 0.02, Math.min(from.y, to.y) - 0.03), rearFromZ),
    new Vector3(to.x, Math.max(floorY + 0.02, Math.min(from.y, to.y) - 0.03), rearToZ),
    new Vector3(to.x, to.y, rearToZ),
    to.clone()
  ]

  return waypoints
}

function resolveCables(
  connectivity: ConnectivityEntry[],
  devicePositions: Map<string, DeviceWorldPosition>,
  rearZ: number,
  floorY: number
): ResolvedCable[] {
  const cables: ResolvedCable[] = []
  const usedLanes = new Map<string, number>()

  for (let i = 0; i < connectivity.length; i++) {
    const conn = connectivity[i]!
    const [fromDev = '', fromPort = ''] = conn.from.split('/')
    const [toDev = '', toPort = ''] = conn.to.split('/')

    const fromPos = resolvePortWorldPosition(fromDev, fromPort, devicePositions)
    const toPos = resolvePortWorldPosition(toDev, toPort, devicePositions)

    if (!fromPos || !toPos) continue

    const style = CABLE_STYLES[conn.type] ?? { color: '#ff4444', thickness: 0.0025 }
    const points = routeCable(fromPos, toPos, rearZ, floorY)

    // Collision avoidance: offset overlapping cables laterally
    const laneKey = `${Math.round(fromPos.y * 100)}-${Math.round(toPos.y * 100)}`
    const laneCount = usedLanes.get(laneKey) || 0
    usedLanes.set(laneKey, laneCount + 1)

    if (laneCount > 0) {
      const offset = laneCount * 0.005 // 0.5 cm per cable
      for (const p of points) {
        p.x += offset
      }
    }

    cables.push({
      id: `cable-${i}`,
      type: conn.type,
      color: style.color,
      thickness: style.thickness,
      points
    })
  }

  return cables
}

// ─── 3g. Power supply resolver ───────────────────────────────────────────────

function resolvePower(
  config: PrototypeConfig,
  devicePositions: Map<string, DeviceWorldPosition>,
  rearZ: number
): { strip: ResolvedPowerStrip | null, cables: ResolvedCable[] } {
  if (!config.power) return { strip: null, cables: [] }

  const W = 30 * CM
  const H = 4 * CM
  const D = 5 * CM
  const stripY = 1 * CM + H / 2
  const stripZ = rearZ - 0.02

  const strip: ResolvedPowerStrip = {
    size: [W, H, D],
    position: [0, stripY, stripZ]
  }

  const cables: ResolvedCable[] = []
  let idx = 0

  for (const [devId, devPos] of devicePositions) {
    const dev = DEVICES[devId]
    if (!dev || !dev.power) continue

    // Use the power face/offset from device catalog
    const portFace = dev.power.face
    const portOffset = dev.power.offset
    const [cx, cy, cz] = [devPos.center.x, devPos.center.y, devPos.center.z]
    const [hw, _hh, hd] = [devPos.size[0] / 2, devPos.size[1] / 2, devPos.size[2] / 2]

    let fromPos: Vector3
    if (portFace === 'back') {
      fromPos = new Vector3(cx - hw + portOffset * devPos.size[0], cy, cz - hd)
    } else {
      fromPos = new Vector3(cx, cy, cz - hd)
    }

    const toPos = new Vector3(
      clamp(fromPos.x, -W / 2, W / 2),
      stripY,
      stripZ
    )

    let waypoints: Vector3[]

    if (config.power.routing === 'rear-trench') {
      waypoints = routeCable(fromPos, toPos, rearZ, 0)
    } else {
      // rear-drop: straight down then to strip
      waypoints = [
        fromPos.clone(),
        new Vector3(fromPos.x, fromPos.y, stripZ),
        new Vector3(fromPos.x, stripY, stripZ),
        new Vector3(toPos.x, stripY, stripZ)
      ]
    }

    const powerStyle = CABLE_STYLES.power ?? { color: '#ffcc00', thickness: 0.003 }
    cables.push({
      id: `power-${idx++}`,
      type: 'power',
      color: powerStyle.color,
      thickness: powerStyle.thickness,
      points: waypoints
    })
  }

  return { strip, cables }
}

// ─── 3h. Ergonomics validation ───────────────────────────────────────────────

function validateErgonomics(
  zones: ResolvedZone[],
  config: PrototypeConfig,
  _cables: ResolvedCable[]
): ErgonomicsWarning[] {
  const warnings: ErgonomicsWarning[] = []

  for (const zone of zones) {
    if (zone.isSpine || zone.isSeparateTray) continue

    for (const dev of zone.devices) {
      // Depth check
      const devDepthCm = Math.abs(dev.position[2]) / CM
      if (devDepthCm > config.constraints.maxReachDepth) {
        warnings.push({
          severity: 'warn',
          message: `${dev.label} may be hard to reach (${devDepthCm.toFixed(0)} cm deep, max ${config.constraints.maxReachDepth} cm)`
        })
      }

      // Tilt stability
      if (zone.tiltDeg > 18 && !zone.subPlatform) {
        warnings.push({
          severity: 'error',
          message: `${dev.label} on ${zone.tiltDeg.toFixed(0)}° tilt without stops — risk of sliding`
        })
      }
    }
  }

  // Port accessibility: check if any port faces a wall with < 3 cm clearance
  // (simplified: check if device is within 3 cm of side wall)
  const halfW = (config.constraints.maxWidth / 2) * CM
  for (const zone of zones) {
    for (const dev of zone.devices) {
      const devRight = dev.position[0] + dev.size[0] / 2
      const devLeft = dev.position[0] - dev.size[0] / 2
      if (halfW - devRight < 3 * CM) {
        warnings.push({
          severity: 'warn',
          message: `${dev.label} right side very close to wall — ports may be hard to access`
        })
      }
      if (devLeft + halfW < 3 * CM) {
        warnings.push({
          severity: 'warn',
          message: `${dev.label} left side very close to wall — ports may be hard to access`
        })
      }
    }
  }

  return warnings
}

// ─── 3i. Style-aware camera ──────────────────────────────────────────────────

interface CameraPreset {
  elevation: number
  distMultiplier: number
  fov: number
}

const CAMERA_PRESETS: Record<string, CameraPreset> = {
  'performance-wedge': { elevation: 25, distMultiplier: 1.7, fov: 38 },
  'studio-console': { elevation: 35, distMultiplier: 1.8, fov: 36 },
  'compact-block': { elevation: 30, distMultiplier: 1.6, fov: 40 },
  'brutalist': { elevation: 20, distMultiplier: 2.0, fov: 32 }
}

function computeCamera(
  config: PrototypeConfig,
  bboxMin: Vector3,
  bboxMax: Vector3
): { position: Vec3, target: Vec3, fov: number } {
  const preset = CAMERA_PRESETS[config.profile.style] ?? CAMERA_PRESETS['studio-console']!

  const center = new Vector3().addVectors(bboxMin, bboxMax).multiplyScalar(0.5)
  const diag = new Vector3().subVectors(bboxMax, bboxMin).length()
  const dist = diag * preset.distMultiplier

  const elevRad = MathUtils.degToRad(preset.elevation)
  const azimuthRad = MathUtils.degToRad(35) // slight angle from front-right

  const camPos = new Vector3(
    center.x + dist * Math.cos(elevRad) * Math.sin(azimuthRad),
    center.y + dist * Math.sin(elevRad),
    center.z + dist * Math.cos(elevRad) * Math.cos(azimuthRad)
  )

  // Shift target slightly toward front
  const target = new Vector3(center.x, center.y, center.z + 0.05)

  return {
    position: [camPos.x, camPos.y, camPos.z],
    target: [target.x, target.y, target.z],
    fov: preset.fov
  }
}

// ─── Main resolve function ───────────────────────────────────────────────────

export function resolveLayout(config: PrototypeConfig): ResolvedLayout {
  const T = config.constraints.thickness
  const CAB_W = config.constraints.maxWidth
  const CAB_D = config.constraints.maxDepth
  const REAR_C = config.constraints.rearClearance
  const INNER_W = CAB_W - 2 * T
  const DECK_T = 1 // 1 cm deck thickness

  // ── Resolve zones ──
  const zoneSpecs = resolveZones(config)
  const stackable = zoneSpecs.filter(z =>
    z.config.mount !== 'spine-right' && z.config.mount !== 'mid-shelf' && z.config.mode !== 'tray-separate'
  )

  // ── Build panels (carcass) ──
  const panels: ResolvedPanel[] = []

  // Bottom panel
  panels.push({
    id: 'bottom',
    size: [CAB_W * CM, T * CM, CAB_D * CM],
    position: [0, (T / 2) * CM, -(CAB_D / 2) * CM]
  })

  // Build shelf Y positions from zone heights
  let currentYCm = T // top of bottom panel
  const shelfYPositions: number[] = [0] // bottom

  for (let i = 0; i < stackable.length; i++) {
    currentYCm += stackable[i]!.height
    shelfYPositions.push(currentYCm)
    // Add shelf between zones
    if (i < stackable.length - 1) {
      panels.push({
        id: `shelf-${i}`,
        size: [CAB_W * CM, T * CM, CAB_D * CM],
        position: [0, (currentYCm + T / 2) * CM, -(CAB_D / 2) * CM]
      })
      currentYCm += T
    }
  }

  // Top panel
  const topY = currentYCm + T
  panels.push({
    id: 'top',
    size: [CAB_W * CM, T * CM, CAB_D * CM],
    position: [0, (topY - T / 2) * CM, -(CAB_D / 2) * CM]
  })

  // Back panel (if no rear clearance, add back; otherwise open back)
  if (REAR_C === 0) {
    panels.push({
      id: 'back',
      size: [CAB_W * CM, topY * CM, T * CM],
      position: [0, (topY / 2) * CM, -(CAB_D - T / 2) * CM]
    })
  }

  // ── Resolve each zone into renderable data ──
  const resolvedZones: ResolvedZone[] = []
  const devicePositions = new Map<string, DeviceWorldPosition>()
  let zoneYCm = T // start above bottom panel

  for (let i = 0; i < stackable.length; i++) {
    const spec = stackable[i]!
    const z = spec.config
    const usableD = CAB_D - REAR_C
    const deckLen = usableD / Math.cos(MathUtils.degToRad(spec.tiltDeg))

    let devices: ResolvedDevice[] = []
    let subPlatform: ResolvedSubPlatform | null = null

    if (z.type === 'pedals' && z.mode === 'deck' && z.pedals && !(z.devices && z.devices.length > 0)) {
      // Fill with generated pedals
      devices = fillPedals(z.pedals, INNER_W, DECK_T)
    } else if (z.devices && z.devices.length > 0) {
      // Check if any device in this zone has primary focus
      const primaryDeviceId = spec.focus === 'primary' && z.devices.length === 1 ? z.devices[0] : null

      if (primaryDeviceId) {
        // Create sub-platform for primary focus device
        const d = getDevice(primaryDeviceId)
        const subW = d.w + 4 // 2 cm margin each side
        const subD = d.d + 4
        const subLen = subD / Math.cos(10 * Math.PI / 180)

        subPlatform = {
          deckSize: [subW * CM, DECK_T * CM, subLen * CM],
          deckPosition: [0, (DECK_T / 2) * CM, -(subLen / 2) * CM],
          lipSize: [(d.w + 2) * CM, 0.6 * CM, 0.8 * CM],
          lipPosition: [0, (DECK_T + 0.3) * CM, -0.5 * CM],
          sideStops: [
            {
              size: [0.8 * CM, 0.6 * CM, (d.d + 2) * CM],
              position: [-(d.w / 2 + 1) * CM, (DECK_T + 0.3) * CM, -(subLen / 2) * CM]
            },
            {
              size: [0.8 * CM, 0.6 * CM, (d.d + 2) * CM],
              position: [(d.w / 2 + 1) * CM, (DECK_T + 0.3) * CM, -(subLen / 2) * CM]
            }
          ]
        }

        devices.push({
          id: primaryDeviceId,
          deviceId: primaryDeviceId,
          label: d.label,
          size: [d.w * CM, d.h * CM, d.d * CM],
          position: [0, (DECK_T + d.h / 2) * CM, -(subLen / 2) * CM],
          rotation: [0, 0, 0],
          category: d.category,
          isGhost: true,
          riserHeight: 0
        })
      } else {
        devices = layoutDevicesInZone(z.devices, INNER_W, config.composition, spec.focus, DECK_T)
      }
    }

    // Register device world positions for cable routing
    for (const dev of devices) {
      const groupY = zoneYCm * CM
      const groupTiltRad = MathUtils.degToRad(spec.tiltDeg)

      // Transform local position to world: apply tilt rotation then translate
      const localX = dev.position[0]
      const localY = dev.position[1]
      const localZ = dev.position[2]

      // Rotation around X axis at group origin
      const cosT = Math.cos(groupTiltRad)
      const sinT = Math.sin(groupTiltRad)
      const worldX = localX
      const worldY = groupY + localY * cosT - localZ * sinT
      const worldZ = localY * sinT + localZ * cosT

      devicePositions.set(dev.deviceId, {
        deviceId: dev.deviceId,
        center: new Vector3(worldX, worldY, worldZ),
        size: dev.size
      })
    }

    const rz: ResolvedZone = {
      id: `zone-${i}-${z.type}`,
      type: z.type,
      focus: spec.focus,
      groupPosition: [0, zoneYCm * CM, 0],
      groupRotation: [MathUtils.degToRad(spec.tiltDeg), 0, 0],
      tiltDeg: spec.tiltDeg,
      height: spec.height * CM,
      deckSize: [INNER_W * CM, DECK_T * CM, deckLen * CM],
      deckPosition: [0, (DECK_T / 2) * CM, -(deckLen / 2) * CM],
      lipSize: z.type === 'pedals' ? [INNER_W * CM, 0.5 * CM, 1 * CM] : null,
      lipPosition: z.type === 'pedals' ? [0, (DECK_T + 0.25) * CM, -0.5 * CM] : null,
      devices,
      subPlatform,
      isSeparateTray: false,
      isSpine: false
    }

    resolvedZones.push(rz)
    zoneYCm += spec.height
    if (i < stackable.length - 1) {
      zoneYCm += T // shelf thickness
    }
  }

  // ── Handle special zones ──
  for (const spec of zoneSpecs) {
    const z = spec.config

    if (z.mount === 'spine-right' && z.devices) {
      // Spine-mounted devices on right wall
      const devices: ResolvedDevice[] = []
      let spineCursorY = (topY - 5) * CM // start near top, descend

      for (const devId of z.devices) {
        const d = getDevice(devId)
        const protrude = d.h // protrudes into cabinet
        const centerX = (CAB_W / 2 - T - protrude / 2) * CM
        const centerY = spineCursorY - (d.d / 2) * CM
        const centerZ = -(CAB_D / 2) * CM

        const dev: ResolvedDevice = {
          id: devId,
          deviceId: devId,
          label: d.label,
          size: [protrude * CM, d.d * CM, d.w * CM],
          position: [centerX, centerY, centerZ],
          rotation: [0, MathUtils.degToRad(10), 0],
          category: d.category,
          isGhost: true,
          riserHeight: 0
        }
        devices.push(dev)

        devicePositions.set(devId, {
          deviceId: devId,
          center: new Vector3(centerX, centerY, centerZ),
          size: dev.size
        })

        spineCursorY = centerY - (d.d / 2) * CM - 2 * CM
      }

      resolvedZones.push({
        id: `zone-spine`,
        type: 'routing',
        focus: 'none',
        groupPosition: [0, 0, 0],
        groupRotation: [0, 0, 0],
        tiltDeg: 0,
        height: 0,
        deckSize: null,
        deckPosition: null,
        lipSize: null,
        lipPosition: null,
        devices,
        subPlatform: null,
        isSeparateTray: false,
        isSpine: true
      })
    }

    if (z.mount === 'mid-shelf' && z.devices) {
      // Mid-shelf mounted (e.g., patchbay sitting on top of a middle shelf,
      // angled like a reading stand toward the user — front of cabinet).
      // shelfYPositions[i] is the TOP of shelf i. Index 0 = bottom panel top,
      // last = top panel top. We want a shelf above ~half the stack.
      const midShelfIdx = Math.max(1, Math.min(shelfYPositions.length - 2, Math.floor(stackable.length / 2)))
      const shelfY = shelfYPositions[midShelfIdx] ?? 0

      // Lay the device flat on that shelf, centered, near the FRONT (chair side)
      // with a small front margin so it doesn't cantilever off the shelf edge.
      const FRONT_MARGIN_CM = 2

      const devices: ResolvedDevice[] = []
      for (const devId of z.devices) {
        const d = getDevice(devId)
        const dev: ResolvedDevice = {
          id: devId,
          deviceId: devId,
          label: d.label,
          size: [d.w * CM, d.h * CM, d.d * CM],
          position: [0, (shelfY + d.h / 2) * CM, -(FRONT_MARGIN_CM + d.d / 2) * CM],
          rotation: [0, 0, 0],
          category: d.category,
          isGhost: true,
          riserHeight: 0
        }
        devices.push(dev)

        devicePositions.set(devId, {
          deviceId: devId,
          center: new Vector3(dev.position[0], dev.position[1], dev.position[2]),
          size: dev.size
        })
      }

      resolvedZones.push({
        id: `zone-midshelf`,
        type: 'routing',
        focus: 'none',
        groupPosition: [0, 0, 0],
        groupRotation: [0, 0, 0],
        tiltDeg: 0,
        height: 0,
        deckSize: null,
        deckPosition: null,
        lipSize: null,
        lipPosition: null,
        devices,
        subPlatform: null,
        isSeparateTray: false,
        isSpine: false
      })
    }

    if (z.mode === 'tray-separate') {
      // Separate pedal tray in front of cabinet
      const trayW = 36
      const trayD = 18
      const trayTilt = lerp(5, 10, config.profile.aggressiveness)
      const trayLen = trayD / Math.cos(MathUtils.degToRad(trayTilt))
      const trayFrontZ = 22 * CM

      const devices: ResolvedDevice[] = []
      if (z.devices) {
        let cursor = -trayW / 2 + 1
        for (const devId of z.devices) {
          const d = getDevice(devId)
          const xCm = cursor + d.w / 2
          const dev: ResolvedDevice = {
            id: devId,
            deviceId: devId,
            label: d.label,
            size: [d.w * CM, d.h * CM, d.d * CM],
            position: [xCm * CM, (DECK_T + d.h / 2) * CM, -(trayLen / 2) * CM],
            rotation: [0, 0, 0],
            category: d.category,
            isGhost: true,
            riserHeight: 0
          }
          devices.push(dev)
          cursor += d.w + 1

          // World position for cables
          const tiltRad = MathUtils.degToRad(trayTilt)
          const cosT = Math.cos(tiltRad)
          const sinT = Math.sin(tiltRad)
          const ly = dev.position[1]
          const lz = dev.position[2]
          devicePositions.set(devId, {
            deviceId: devId,
            center: new Vector3(dev.position[0], 1.5 * CM + ly * cosT - lz * sinT, trayFrontZ + ly * sinT + lz * cosT),
            size: dev.size
          })
        }
      }

      // Also fill with pedals if pedal config exists and no explicit devices cover the deck
      if (z.pedals && !(z.devices && z.devices.length > 0)) {
        const pedalDevs = fillPedals(z.pedals, trayW, DECK_T)
        devices.push(...pedalDevs)
      }

      resolvedZones.push({
        id: `zone-tray`,
        type: 'pedals',
        focus: 'none',
        groupPosition: [0, 1.5 * CM, trayFrontZ],
        groupRotation: [MathUtils.degToRad(trayTilt), 0, 0],
        tiltDeg: trayTilt,
        height: trayD * CM,
        deckSize: [trayW * CM, DECK_T * CM, trayLen * CM],
        deckPosition: [0, (DECK_T / 2) * CM, -(trayLen / 2) * CM],
        lipSize: null,
        lipPosition: null,
        devices,
        subPlatform: null,
        isSeparateTray: true,
        isSpine: false
      })
    }
  }

  // ── Side-wall profile ──
  const sideProfilePoints = generateProfile(zoneSpecs, config)

  // ── Cables ──
  const rearZ = -(CAB_D - REAR_C) * CM
  const cables = resolveCables(config.connectivity, devicePositions, rearZ, 0)

  // ── Power ──
  const { strip: powerStrip, cables: powerCables } = resolvePower(config, devicePositions, rearZ)

  // ── Bounding box for camera ──
  const bboxMin = new Vector3(-CAB_W / 2 * CM, 0, -CAB_D * CM)
  const bboxMax = new Vector3(CAB_W / 2 * CM, topY * CM, 0.3) // include tray area

  // Check if there's a separate tray
  const hasTray = resolvedZones.some(z => z.isSeparateTray)
  if (hasTray) {
    bboxMax.z = 0.4
  }

  // ── Camera ──
  const camera = computeCamera(config, bboxMin, bboxMax)

  // ── Ergonomics ──
  const warnings = validateErgonomics(resolvedZones, config, cables)

  return {
    panels,
    sideProfilePoints,
    zones: resolvedZones,
    cables,
    powerStrip,
    powerCables,
    camera,
    warnings,
    config
  }
}
