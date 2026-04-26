<script setup lang="ts">
import { MathUtils } from 'three'

// Synth-cabinet concept prototype.
//
// All measurements come from docs/cabinet-concept.md
// (length × width × height, in cm, device sitting flat):
//
//   Arturia Beatstep Pro  41.5 × 15.3 × 4
//   Roland TR8S           40.8 × 25.5 × 7
//   Korg MS20 Mini        49   × 25.5 × 20.5
//   Ditto X4 looper       23   × 13.5 × 6
//   Behringer M           37   × 13.5 × 8
//   Patch bay             43.8 × 5.2  × 4.6 (anchored via side hinges)
//   PolyTune              6.4  × 12.4 × 3.2
//
// Concept (simpler, no drawer, full pedal access):
//   Lower bay (open front) — MS20 left, Behringer M right, with a divider
//     between them. Both keyboards face the player at floor height.
//   Mid shelf — caps the lower bay; the patch bay sits flat on it with
//     jacks facing up so its side hinges can screw into the shelf.
//   Angled top (12° toward the user) — Beatstep Pro on the left, TR8S
//     on the right. Both tilted for tweakability of pads/knobs.
//   Pedal tray (separate, on the floor in front of the cabinet, tilted
//     7°) — Ditto X4 + PolyTune, foot-accessible and easy to tweak.
//   Patch-bay routing — the back of the patch bay faces down/back,
//     cabling drops into the lower bay and out the back to the pedal
//     tray, matching the user's existing pedal-via-patch-bay routing.
//
// Three.js works in metres, so every cm value is multiplied by CM.

const CM = 0.01
const T = 1.8 * CM // 18 mm plywood

// Cabinet outer envelope.
const CAB_W = 100 * CM
const CAB_D = 30 * CM
const CAB_H = 48 * CM

// Internal divisions.
const LOWER_TOP = 23 * CM // top-of-lower-bay (= MS20 height + ~2 cm clearance)
const DIVIDER_X = 52 * CM // distance of vertical divider from the left wall

// Angled top.
const TOP_FRONT_Y = 40 * CM
const TOP_TILT = MathUtils.degToRad(12)
const TOP_LEN = CAB_D / Math.cos(TOP_TILT) // panel length along the slope
const TOP_RISE = CAB_D * Math.tan(TOP_TILT) // back-y minus front-y

// Separate pedal tray.
const TRAY_W = 36 * CM
const TRAY_D = 18 * CM
const TRAY_TILT = MathUtils.degToRad(7)
const TRAY_LEN = TRAY_D / Math.cos(TRAY_TILT)
const TRAY_FRONT_Y = 1.5 * CM // small foot under the front edge
const TRAY_FRONT_Z = 22 * CM // distance the front edge sits in front of the cabinet

const WOOD = '#caa472'
const GHOST = '#ff00ff'
const GHOST_OPACITY = 0.38

type Vec3 = [number, number, number]
type Box = { id: string, size: Vec3, position: Vec3 }

// Cabinet wood panels — sizes are [x, y, z], positions are box centres.
const cabinetPanels: Box[] = [
  { id: 'floor', size: [CAB_W, T, CAB_D], position: [0, T / 2, -CAB_D / 2] },
  { id: 'mid-shelf', size: [CAB_W, T, CAB_D], position: [0, LOWER_TOP + T / 2, -CAB_D / 2] },
  { id: 'side-l', size: [T, CAB_H, CAB_D], position: [-CAB_W / 2 + T / 2, CAB_H / 2, -CAB_D / 2] },
  { id: 'side-r', size: [T, CAB_H, CAB_D], position: [+CAB_W / 2 - T / 2, CAB_H / 2, -CAB_D / 2] },
  { id: 'back', size: [CAB_W, CAB_H, T], position: [0, CAB_H / 2, -CAB_D + T / 2] },
  { id: 'divider', size: [T, LOWER_TOP, CAB_D], position: [-CAB_W / 2 + DIVIDER_X, LOWER_TOP / 2, -CAB_D / 2] }
]

// Lower-bay clear-region centres (used to centre devices between divider/walls).
const ms20BayCenterX = (-CAB_W / 2 + T + (-CAB_W / 2 + DIVIDER_X - T / 2)) / 2
const behringerBayCenterX = ((-CAB_W / 2 + DIVIDER_X + T / 2) + (CAB_W / 2 - T)) / 2

// Devices in cabinet-world frame.
const ms20: Box = {
  id: 'ms20',
  size: [49 * CM, 20.5 * CM, 25.5 * CM],
  position: [ms20BayCenterX, T + 20.5 / 2 * CM, -25.5 / 2 * CM - 1 * CM]
}

const behringer: Box = {
  id: 'behringer',
  size: [37 * CM, 8 * CM, 13.5 * CM],
  position: [behringerBayCenterX, T + 8 / 2 * CM, -13.5 / 2 * CM - 1 * CM]
}

const patchbay: Box = {
  id: 'patchbay',
  size: [43.8 * CM, 4.6 * CM, 5.2 * CM],
  position: [0, LOWER_TOP + T + 4.6 / 2 * CM, -CAB_D + 5 * CM + 5.2 / 2 * CM]
}

const lowerDevices = [ms20, behringer, patchbay]

// Devices on the angled top — local frame: origin at the front-top edge of
// the lid, +Z pointing back into the cabinet, +X pointing right.
const beatstep: Box = {
  id: 'beatstep',
  size: [41.5 * CM, 4 * CM, 15.3 * CM],
  position: [-CAB_W / 4, 4 / 2 * CM, -15.3 / 2 * CM - 2 * CM]
}

const tr8s: Box = {
  id: 'tr8s',
  size: [40.8 * CM, 7 * CM, 25.5 * CM],
  position: [+CAB_W / 4, 7 / 2 * CM, -25.5 / 2 * CM - 2 * CM]
}

const topDevices = [beatstep, tr8s]

// Devices on the pedal tray — local frame: origin at the front-top edge of
// the tray, +Z pointing back (toward the cabinet), +X pointing right.
const dittoLeft = -TRAY_W / 2 + 1 * CM
const ditto: Box = {
  id: 'ditto',
  size: [23 * CM, 6 * CM, 13.5 * CM],
  position: [dittoLeft + 23 / 2 * CM, 6 / 2 * CM, -TRAY_LEN / 2]
}

const polytune: Box = {
  id: 'polytune',
  size: [6.4 * CM, 3.2 * CM, 12.4 * CM],
  position: [dittoLeft + 23 * CM + 1 * CM + 6.4 / 2 * CM, 3.2 / 2 * CM, -TRAY_LEN / 2]
}

const trayDevices = [ditto, polytune]

const camTarget: Vec3 = [0, 0.22, 0]
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
          :position="[1.05, 0.85, 1.35]"
          :fov="40"
          :near="0.01"
          :far="50"
          :look-at="camTarget"
        />
        <OrbitControls :target="camTarget" />

        <TresAmbientLight :intensity="0.4" />
        <TresDirectionalLight
          :position="[1.5, 2, 1.5]"
          :intensity="1.2"
          cast-shadow
        />
        <TresDirectionalLight
          :position="[-1.2, 1.5, 0.8]"
          :intensity="0.4"
        />

        <!-- Floor -->
        <TresMesh
          :rotation="[-Math.PI / 2, 0, 0]"
          receive-shadow
        >
          <TresPlaneGeometry :args="[6, 6]" />
          <TresMeshStandardMaterial color="#1a1a1c" :roughness="1" />
        </TresMesh>

        <!-- Cabinet wood panels -->
        <TresMesh
          v-for="p in cabinetPanels"
          :key="p.id"
          :position="p.position"
          cast-shadow
          receive-shadow
        >
          <TresBoxGeometry :args="p.size" />
          <TresMeshStandardMaterial :color="WOOD" :roughness="0.7" />
        </TresMesh>

        <!-- Lower-bay & mid-shelf devices -->
        <TresMesh
          v-for="d in lowerDevices"
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

        <!-- Angled top: tilted lid + Beatstep + TR8S -->
        <TresGroup
          :position="[0, TOP_FRONT_Y, 0]"
          :rotation="[TOP_TILT, 0, 0]"
        >
          <TresMesh
            :position="[0, -T / 2, -TOP_LEN / 2]"
            cast-shadow
            receive-shadow
          >
            <TresBoxGeometry :args="[CAB_W, T, TOP_LEN]" />
            <TresMeshStandardMaterial :color="WOOD" :roughness="0.7" />
          </TresMesh>

          <TresMesh
            v-for="d in topDevices"
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

        <!-- Pedal tray: tilted board with Ditto X4 + PolyTune -->
        <TresGroup
          :position="[0, TRAY_FRONT_Y, TRAY_FRONT_Z]"
          :rotation="[TRAY_TILT, 0, 0]"
        >
          <TresMesh
            :position="[0, -T / 2, -TRAY_LEN / 2]"
            cast-shadow
            receive-shadow
          >
            <TresBoxGeometry :args="[TRAY_W, T, TRAY_LEN]" />
            <TresMeshStandardMaterial :color="WOOD" :roughness="0.7" />
          </TresMesh>

          <TresMesh
            v-for="d in trayDevices"
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
      </TresCanvas>
    </ClientOnly>

    <div class="pointer-events-none absolute top-3 left-3 max-w-xs rounded-md bg-black/55 p-3 text-xs text-white/90 leading-relaxed backdrop-blur-sm">
      <div class="mb-1 font-semibold tracking-tight">
        Synth cabinet — concept
      </div>
      <div class="opacity-80">
        100 × 30 × 48 cm carcass · 18 mm plywood · 12° top, 7° pedal tray.
      </div>
      <ul class="mt-2 space-y-0.5 opacity-90">
        <li><span class="text-fuchsia-300">●</span> Lower-left: Korg MS20 Mini</li>
        <li><span class="text-fuchsia-300">●</span> Lower-right: Behringer M</li>
        <li><span class="text-fuchsia-300">●</span> Mid shelf: patch bay (jacks up)</li>
        <li><span class="text-fuchsia-300">●</span> Top-left: Beatstep Pro</li>
        <li><span class="text-fuchsia-300">●</span> Top-right: Roland TR8S</li>
        <li><span class="text-fuchsia-300">●</span> Tray: Ditto X4 + PolyTune</li>
      </ul>
    </div>
  </div>
</template>
