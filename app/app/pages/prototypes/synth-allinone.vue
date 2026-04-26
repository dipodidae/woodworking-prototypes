<script setup lang="ts">
import { MathUtils } from 'three'

// All-in-one synth + pedals cabinet — concept prototype.
//
//   100 cm W × 55 cm D × 70 cm H carcass, 18 mm birch plywood, open back.
//   Four stacked tiers + a patch spine on the inside of the right wall.
//
// Devices (length × width × height in cm, sitting flat):
//   T1 perf      Arturia Beatstep Pro  41.5 × 15.3 × 4
//   T1 perf      Roland TR-8S          40.8 × 25.5 × 7   (own sub-platform: +10° X, +12° Y)
//   T2 looper    Ditto X4              23   × 13.5 × 6
//   T3 synth     Korg MS20 Mini        49   × 25.5 × 20.5
//   T3 synth     Behringer M           37   × 13.5 × 8
//   T4 pedals    (empty deck, 5 mm front lip)
//   spine        Patch bay             43.8 × 5.2  × 4.6
//   spine        PolyTune              6.4  × 12.4 × 3.2
//
// Tilt departures from spec (forced by 70 cm height budget):
//   T3 synth deck: 13° → 6° (full 13° leaves only 1.8 cm above MS20 top)
//   T4 pedal deck: 10° → 8° (keeps clearance above future ~6–8 cm pedals)
//   T1 perf deck:  5°  → 0° (TR-8S sub-platform's 10° tilt is preserved
//                  instead — compounding both blew the T1 ceiling)
// To restore the spec tilts, raise the carcass to ~76 cm.

const CM = 0.01
const T = 1.8 * CM // 18 mm birch plywood

// Carcass
const CAB_W = 100 * CM
const CAB_D = 55 * CM
const CAB_H = 70 * CM
const REAR_CLEARANCE = 6 * CM // open-back cable trench

// Internal usable widths/depths (between side panels and rear-clearance line)
const INNER_W = CAB_W - 2 * T
const INNER_D = CAB_D - REAR_CLEARANCE

// Tier clear heights (sum = 61 cm; + 9 cm wood = 70 cm exactly)
const T4_H = 12 * CM
const T3_H = 26 * CM
const T2_H = 10 * CM
const T1_H = 13 * CM

// Flat structural shelf y-positions (bottom face of each shelf)
const SHELF_43_Y = T + T4_H // top of T4 = bottom face of T4/T3 shelf
const SHELF_32_Y = SHELF_43_Y + T + T3_H
const SHELF_21_Y = SHELF_32_Y + T + T2_H
const TOP_PANEL_Y = SHELF_21_Y + T + T1_H

// Tier floors (top face of the shelf below = where decks/devices sit)
const T4_FLOOR_Y = T
const T3_FLOOR_Y = SHELF_43_Y + T
const T2_FLOOR_Y = SHELF_32_Y + T
const T1_FLOOR_Y = SHELF_21_Y + T

// Tier ceilings (bottom face of the shelf above)
const T3_CEILING_Y = SHELF_32_Y
const T1_CEILING_Y = TOP_PANEL_Y

// Tilt platforms (decks)
const T4_TILT = MathUtils.degToRad(8)
const T3_TILT = MathUtils.degToRad(6)
const TR_SUB_TILT_X = MathUtils.degToRad(10)
const TR_SUB_ROT_Y = MathUtils.degToRad(12)
const SPINE_ROT_Y = MathUtils.degToRad(10)

const DECK_T = 1 * CM // tilted deck thickness

// Pedal deck (T4): 96 W × 25 D, sits at front of T4
const PEDAL_DECK_W = INNER_W
const PEDAL_DECK_D = 25 * CM
const PEDAL_DECK_LEN = PEDAL_DECK_D / Math.cos(T4_TILT)

// Synth deck (T3): 96 W × 49 D, full usable depth
const SYNTH_DECK_W = INNER_W
const SYNTH_DECK_D = INNER_D
const SYNTH_DECK_LEN = SYNTH_DECK_D / Math.cos(T3_TILT)

// TR-8S sub-platform on T1
const TR_SUB_W = 44 * CM
const TR_SUB_D = 28 * CM
const TR_SUB_LEN = TR_SUB_D / Math.cos(TR_SUB_TILT_X)

// Materials
const WOOD = '#caa472'
const GHOST = '#ff00ff'
const GHOST_OPACITY = 0.38

type Vec3 = [number, number, number]
type Box = { id: string, size: Vec3, position: Vec3, rotation?: Vec3 }

// ─── Carcass panels (cabinet world frame) ────────────────────────────────
// X centred on the cabinet, +Z = front (toward viewer), +Y = up.
const carcass: Box[] = [
  // Bottom panel
  { id: 'bottom', size: [CAB_W, T, CAB_D], position: [0, T / 2, -CAB_D / 2] },
  // Top panel
  { id: 'top', size: [CAB_W, T, CAB_D], position: [0, TOP_PANEL_Y + T / 2, -CAB_D / 2] },
  // Left side (full height)
  { id: 'side-l', size: [T, CAB_H, CAB_D], position: [-CAB_W / 2 + T / 2, CAB_H / 2, -CAB_D / 2] },
  // Right side (full height)
  { id: 'side-r', size: [T, CAB_H, CAB_D], position: [+CAB_W / 2 - T / 2, CAB_H / 2, -CAB_D / 2] },
  // Internal flat shelves
  { id: 'shelf-t4-t3', size: [CAB_W, T, CAB_D], position: [0, SHELF_43_Y + T / 2, -CAB_D / 2] },
  { id: 'shelf-t3-t2', size: [CAB_W, T, CAB_D], position: [0, SHELF_32_Y + T / 2, -CAB_D / 2] },
  { id: 'shelf-t2-t1', size: [CAB_W, T, CAB_D], position: [0, SHELF_21_Y + T / 2, -CAB_D / 2] }
]

// ─── T4 — pedal deck group (tilted 8°, empty deck) ──────────────────────
// Group origin = front-bottom centreline of the deck.
// Contains the deck panel and a 5 mm front lip strip.
const T4_GROUP_POS: Vec3 = [0, T4_FLOOR_Y, 0]
const T4_GROUP_ROT: Vec3 = [T4_TILT, 0, 0]

const pedalDeck: Box = {
  id: 'pedal-deck',
  size: [PEDAL_DECK_W, DECK_T, PEDAL_DECK_LEN],
  position: [0, DECK_T / 2, -PEDAL_DECK_LEN / 2]
}

// 5 mm tall front lip on the very front edge of the deck
const PEDAL_LIP_H = 0.5 * CM
const pedalLip: Box = {
  id: 'pedal-lip',
  size: [PEDAL_DECK_W, PEDAL_LIP_H, 1 * CM],
  position: [0, DECK_T + PEDAL_LIP_H / 2, -0.5 * CM]
}

// ─── T3 — synth deck group (tilted 6°) ──────────────────────────────────
const T3_GROUP_POS: Vec3 = [0, T3_FLOOR_Y, 0]
const T3_GROUP_ROT: Vec3 = [T3_TILT, 0, 0]

const synthDeck: Box = {
  id: 'synth-deck',
  size: [SYNTH_DECK_W, DECK_T, SYNTH_DECK_LEN],
  position: [0, DECK_T / 2, -SYNTH_DECK_LEN / 2]
}

// MS20 Mini — flush left. Local frame = synth deck local frame.
const MS20_W_X = 49 * CM
const MS20_W_Z = 25.5 * CM
const MS20_H_Y = 20.5 * CM
const ms20: Box = {
  id: 'ms20',
  size: [MS20_W_X, MS20_H_Y, MS20_W_Z],
  position: [
    -INNER_W / 2 + MS20_W_X / 2 + 0.5 * CM, // flush-left + 5 mm gap
    DECK_T + MS20_H_Y / 2,
    -1 * CM - MS20_W_Z / 2 // 1 cm front margin
  ]
}

// Behringer M — right of MS20.
const BHM_W_X = 37 * CM
const BHM_W_Z = 13.5 * CM
const BHM_H_Y = 8 * CM
const behringerLeftX = -INNER_W / 2 + MS20_W_X + 0.5 * CM + 1 * CM // 1 cm gap
const behringer: Box = {
  id: 'behringer',
  size: [BHM_W_X, BHM_H_Y, BHM_W_Z],
  position: [
    behringerLeftX + BHM_W_X / 2,
    DECK_T + BHM_H_Y / 2,
    -1 * CM - BHM_W_Z / 2
  ]
}

// ─── T2 — Ditto X4 (flat, sits directly on the T3/T2 shelf) ─────────────
const DITTO_W_X = 23 * CM
const DITTO_W_Z = 13.5 * CM
const DITTO_H_Y = 6 * CM
const ditto: Box = {
  id: 'ditto',
  size: [DITTO_W_X, DITTO_H_Y, DITTO_W_Z],
  position: [0, T2_FLOOR_Y + DITTO_H_Y / 2, -CAB_D / 2 + 5 * CM]
}

// ─── T1 — performance tier (flat) ───────────────────────────────────────
// Beatstep flat on the T2/T1 shelf, flush-left.
const BS_W_X = 41.5 * CM
const BS_W_Z = 15.3 * CM
const BS_H_Y = 4 * CM
const beatstep: Box = {
  id: 'beatstep',
  size: [BS_W_X, BS_H_Y, BS_W_Z],
  position: [
    -INNER_W / 2 + BS_W_X / 2 + 0.5 * CM,
    T1_FLOOR_Y + BS_H_Y / 2,
    -2 * CM - BS_W_Z / 2 // 2 cm front margin
  ]
}

// TR-8S sub-platform group: tilted 10° around X then rotated 12° around Y.
// Group origin = where the sub-platform's front-bottom-centre rests on T1.
const TR_W_X = 40.8 * CM
const TR_W_Z = 25.5 * CM
const TR_H_Y = 7 * CM
const TR_SUB_POS: Vec3 = [
  +INNER_W / 2 - TR_SUB_W / 2 - 4 * CM, // pushed away from right wall to clear spine
  T1_FLOOR_Y,
  -3 * CM // 3 cm front margin
]
const TR_SUB_ROT: Vec3 = [TR_SUB_TILT_X, TR_SUB_ROT_Y, 0]

const trSubPlatform: Box = {
  id: 'tr-subplatform',
  size: [TR_SUB_W, DECK_T, TR_SUB_LEN],
  position: [0, DECK_T / 2, -TR_SUB_LEN / 2]
}
const tr8s: Box = {
  id: 'tr8s',
  size: [TR_W_X, TR_H_Y, TR_W_Z],
  position: [0, DECK_T + TR_H_Y / 2, -TR_SUB_LEN / 2]
}

// Front lip + two side stops so the TR-8S can't slide off
const TR_STOP_H = 0.6 * CM
const TR_STOP_T = 0.8 * CM
const trFrontLip: Box = {
  id: 'tr-front-lip',
  size: [TR_W_X + 2 * CM, TR_STOP_H, TR_STOP_T],
  position: [0, DECK_T + TR_STOP_H / 2, -1 * CM]
}
const trSideStopL: Box = {
  id: 'tr-side-l',
  size: [TR_STOP_T, TR_STOP_H, TR_W_Z + 2 * CM],
  position: [-TR_W_X / 2 - 1 * CM, DECK_T + TR_STOP_H / 2, -TR_SUB_LEN / 2]
}
const trSideStopR: Box = {
  id: 'tr-side-r',
  size: [TR_STOP_T, TR_STOP_H, TR_W_Z + 2 * CM],
  position: [+TR_W_X / 2 + 1 * CM, DECK_T + TR_STOP_H / 2, -TR_SUB_LEN / 2]
}

// ─── Patch spine — right side panel, upper-T3 region ────────────────────
// Long axis (43.8) runs along Z, width (5.2) is vertical, height (4.6)
// protrudes -X into the cabinet. Tilted +10° around Y so jacks (which
// face -X) angle slightly toward the player.
const PB_X_PROTRUDE = 4.6 * CM
const PB_W_Y = 5.2 * CM
const PB_W_Z = 43.8 * CM
const PB_CENTER_X = +CAB_W / 2 - T - PB_X_PROTRUDE / 2
const PB_CENTER_Y = T3_CEILING_Y - 2 * CM - PB_W_Y / 2 // 2 cm clearance below T3 ceiling
const PB_CENTER_Z = -CAB_D / 2 + 1 * CM // pulled forward 1 cm of cabinet centre

const patchbay: Box = {
  id: 'patchbay',
  size: [PB_X_PROTRUDE, PB_W_Y, PB_W_Z],
  position: [PB_CENTER_X, PB_CENTER_Y, PB_CENTER_Z],
  rotation: [0, SPINE_ROT_Y, 0]
}

// PolyTune mounted directly below the patch bay on the same spine.
const PT_X_PROTRUDE = 3.2 * CM
const PT_W_Y = 12.4 * CM
const PT_W_Z = 6.4 * CM
const polytune: Box = {
  id: 'polytune',
  size: [PT_X_PROTRUDE, PT_W_Y, PT_W_Z],
  position: [
    +CAB_W / 2 - T - PT_X_PROTRUDE / 2,
    PB_CENTER_Y - PB_W_Y / 2 - 2 * CM - PT_W_Y / 2, // 2 cm gap below patch bay
    PB_CENTER_Z
  ],
  rotation: [0, SPINE_ROT_Y, 0]
}

const camTarget: Vec3 = [0, 0.32, 0]
const camPos: Vec3 = [1.25, 1.0, 1.55]
</script>

<template>
  <div class="h-[calc(100vh-var(--ui-header-height,4rem))] w-full relative">
    <ClientOnly>
      <TresCanvas
        clear-color="#0b0b0c"
        window-size
        shadows
        alpha
      >
        <TresPerspectiveCamera
          :position="camPos"
          :fov="38"
          :near="0.01"
          :far="50"
          :look-at="camTarget"
        />
        <OrbitControls :target="camTarget" />

        <TresAmbientLight :intensity="0.4" />
        <TresDirectionalLight
          :position="[1.6, 2.2, 1.5]"
          :intensity="1.15"
          cast-shadow
        />
        <TresDirectionalLight
          :position="[-1.4, 1.6, 0.9]"
          :intensity="0.4"
        />

        <!-- Floor -->
        <TresMesh
          :rotation="[-Math.PI / 2, 0, 0]"
          receive-shadow
        >
          <TresPlaneGeometry :args="[8, 8]" />
          <TresMeshStandardMaterial color="#1a1a1c" :roughness="1" />
        </TresMesh>

        <!-- Carcass (open back, no rear panel) -->
        <TresMesh
          v-for="p in carcass"
          :key="p.id"
          :position="p.position"
          cast-shadow
          receive-shadow
        >
          <TresBoxGeometry :args="p.size" />
          <TresMeshStandardMaterial :color="WOOD" :roughness="0.7" />
        </TresMesh>

        <!-- T4 — pedal deck (empty, 5 mm front lip strip) -->
        <TresGroup :position="T4_GROUP_POS" :rotation="T4_GROUP_ROT">
          <TresMesh
            :position="pedalDeck.position"
            cast-shadow
            receive-shadow
          >
            <TresBoxGeometry :args="pedalDeck.size" />
            <TresMeshStandardMaterial :color="WOOD" :roughness="0.7" />
          </TresMesh>
          <TresMesh
            :position="pedalLip.position"
            cast-shadow
            receive-shadow
          >
            <TresBoxGeometry :args="pedalLip.size" />
            <TresMeshStandardMaterial :color="WOOD" :roughness="0.7" />
          </TresMesh>
        </TresGroup>

        <!-- T3 — synth deck + MS20 + Behringer M -->
        <TresGroup :position="T3_GROUP_POS" :rotation="T3_GROUP_ROT">
          <TresMesh
            :position="synthDeck.position"
            cast-shadow
            receive-shadow
          >
            <TresBoxGeometry :args="synthDeck.size" />
            <TresMeshStandardMaterial :color="WOOD" :roughness="0.7" />
          </TresMesh>
          <TresMesh
            v-for="d in [ms20, behringer]"
            :key="d.id"
            :position="d.position"
          >
            <TresBoxGeometry :args="d.size" />
            <TresMeshStandardMaterial
              :color="GHOST"
              :transparent="true"
              :opacity="GHOST_OPACITY"
            />
          </TresMesh>
        </TresGroup>

        <!-- T2 — Ditto X4 (flat, free standing on the T3/T2 shelf) -->
        <TresMesh :position="ditto.position">
          <TresBoxGeometry :args="ditto.size" />
          <TresMeshStandardMaterial
            :color="GHOST"
            :transparent="true"
            :opacity="GHOST_OPACITY"
          />
        </TresMesh>

        <!-- T1 — performance tier: Beatstep flat + TR-8S sub-platform -->
        <TresMesh :position="beatstep.position">
          <TresBoxGeometry :args="beatstep.size" />
          <TresMeshStandardMaterial
            :color="GHOST"
            :transparent="true"
            :opacity="GHOST_OPACITY"
          />
        </TresMesh>

        <TresGroup :position="TR_SUB_POS" :rotation="TR_SUB_ROT">
          <TresMesh
            :position="trSubPlatform.position"
            cast-shadow
            receive-shadow
          >
            <TresBoxGeometry :args="trSubPlatform.size" />
            <TresMeshStandardMaterial :color="WOOD" :roughness="0.7" />
          </TresMesh>
          <TresMesh
            v-for="s in [trFrontLip, trSideStopL, trSideStopR]"
            :key="s.id"
            :position="s.position"
            cast-shadow
            receive-shadow
          >
            <TresBoxGeometry :args="s.size" />
            <TresMeshStandardMaterial :color="WOOD" :roughness="0.7" />
          </TresMesh>
          <TresMesh :position="tr8s.position">
            <TresBoxGeometry :args="tr8s.size" />
            <TresMeshStandardMaterial
              :color="GHOST"
              :transparent="true"
              :opacity="GHOST_OPACITY"
            />
          </TresMesh>
        </TresGroup>

        <!-- Patch spine — patch bay + PolyTune on inside of right wall -->
        <TresMesh
          :position="patchbay.position"
          :rotation="patchbay.rotation"
        >
          <TresBoxGeometry :args="patchbay.size" />
          <TresMeshStandardMaterial
            :color="GHOST"
            :transparent="true"
            :opacity="GHOST_OPACITY"
          />
        </TresMesh>
        <TresMesh
          :position="polytune.position"
          :rotation="polytune.rotation"
        >
          <TresBoxGeometry :args="polytune.size" />
          <TresMeshStandardMaterial
            :color="GHOST"
            :transparent="true"
            :opacity="GHOST_OPACITY"
          />
        </TresMesh>
      </TresCanvas>
    </ClientOnly>

    <div class="pointer-events-none absolute top-3 left-3 max-w-sm rounded-md bg-black/60 p-3 text-xs text-white/90 leading-relaxed backdrop-blur-sm">
      <div class="mb-1 font-semibold tracking-tight">
        All-in-one synth + pedals cabinet — concept
      </div>
      <div class="opacity-80">
        100 × 55 × 70 cm carcass · 18 mm birch ply · open back, 6 cm cable trench.
      </div>
      <ul class="mt-2 space-y-0.5">
        <li><span class="inline-block size-2 rounded-full bg-orange-400 mr-1.5 align-middle" />T1 perf — Beatstep Pro · TR-8S (10° X, 12° Y sub-platform)</li>
        <li><span class="inline-block size-2 rounded-full bg-teal-300 mr-1.5 align-middle" />T2 looper — Ditto X4 (flat, generous space)</li>
        <li><span class="inline-block size-2 rounded-full bg-violet-400 mr-1.5 align-middle" />T3 synth — MS20 Mini · Behringer M (6° tilt)</li>
        <li><span class="inline-block size-2 rounded-full bg-amber-300 mr-1.5 align-middle" />T4 pedals — empty deck · 5 mm front lip (8° tilt)</li>
        <li><span class="inline-block size-2 rounded-full bg-sky-400 mr-1.5 align-middle" />Routing — patch bay + PolyTune on right-wall spine</li>
      </ul>
      <div class="mt-2 text-[11px] text-amber-200/90 leading-snug">
        <span class="font-semibold">Tilt departures (forced by 70 cm budget):</span>
        T3 13°→6°, T4 10°→8°, T1 5°→0°.
        Restore originals by raising carcass to ~76 cm.
      </div>
    </div>
  </div>
</template>

