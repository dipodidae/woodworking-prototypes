<script setup lang="ts">
import { Shape, ExtrudeGeometry, Vector2, CatmullRomCurve3, TubeGeometry } from 'three'
import { useDesignCompiler } from '~/composables/useDesignCompiler'
import type { PrototypeConfig, ResolvedCable } from '~/composables/useDesignEngine'

const props = defineProps<{
  config: PrototypeConfig
}>()

const { layout, score, diagnostics } = useDesignCompiler(computed(() => props.config))

const showCables = ref(true)
const beautyMode = ref(true)

const WOOD = '#c28a4a'
const POWER_STRIP_COLOR = '#333333'

// Build side-wall ExtrudeGeometry from profile points
function buildSideWallGeometry(points: Vector2[], thickness: number, _side: 'left' | 'right') {
  if (points.length < 3) return null

  const shape = new Shape()
  // Profile points are in cm in the Y-Z plane (Z = depth, Y = height)
  // Convert to metres and build shape
  const CM = 0.01
  const pts = points.map(p => new Vector2(p.x * CM, p.y * CM))

  shape.moveTo(pts[0]!.x, pts[0]!.y)
  for (let i = 1; i < pts.length; i++) {
    shape.lineTo(pts[i]!.x, pts[i]!.y)
  }
  shape.closePath()

  const geo = new ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.001,
    bevelSize: 0.0008,
    bevelSegments: 2
  })

  return geo
}

const leftWallGeo = computed(() => {
  const l = layout.value
  const T = l.config.constraints.thickness * 0.01
  return buildSideWallGeometry(l.sideProfilePoints, T, 'left')
})

const rightWallGeo = computed(() => {
  const l = layout.value
  const T = l.config.constraints.thickness * 0.01
  return buildSideWallGeometry(l.sideProfilePoints, T, 'right')
})

const leftWallPosition = computed<[number, number, number]>(() => {
  const W = layout.value.config.constraints.maxWidth * 0.01
  return [-W / 2, 0, 0]
})

const rightWallPosition = computed<[number, number, number]>(() => {
  const W = layout.value.config.constraints.maxWidth * 0.01
  const T = layout.value.config.constraints.thickness * 0.01
  return [W / 2 - T, 0, 0]
})

// Build TubeGeometry for cables
function buildCableGeometry(cable: ResolvedCable) {
  if (cable.points.length < 2) return null
  const curve = new CatmullRomCurve3(cable.points, false, 'catmullrom', 0.3)
  return new TubeGeometry(curve, 32, cable.thickness, 6, false)
}
</script>

<template>
  <div class="cabinet-stage h-[calc(100vh-var(--ui-header-height,4rem))] w-full relative">
    <ClientOnly>
      <TresCanvas
        clear-color="#3d3631"
        window-size
        shadows
      >
        <TresPerspectiveCamera
          :position="layout.camera.position"
          :fov="layout.camera.fov"
          :near="0.01"
          :far="50"
          :look-at="layout.camera.target"
        />
        <OrbitControls :target="layout.camera.target" />

        <TresAmbientLight :intensity="0.15" />
        <TresDirectionalLight
          :position="[2.0, 3.8, 2.2]"
          :intensity="1.6"
          cast-shadow
        />
        <TresDirectionalLight
          :position="[-2.5, 1.2, 1.5]"
          :intensity="0.32"
        />
        <TresDirectionalLight
          :position="[-0.8, 2.2, -2.8]"
          :intensity="0.55"
        />

        <!-- Carcass panels (bottom, top, shelves, back) -->
        <TresMesh
          v-for="p in layout.panels"
          :key="p.id"
          :position="p.position"
          cast-shadow
          receive-shadow
        >
          <TresBoxGeometry :args="p.size" />
          <TresMeshStandardMaterial
            :color="WOOD"
            :roughness="0.82"
            :metalness="0.01"
          />
        </TresMesh>

        <!-- Shaped side walls -->
        <TresMesh
          v-if="leftWallGeo"
          :position="leftWallPosition"
          :rotation="[0, Math.PI / 2, 0]"
          cast-shadow
          receive-shadow
        >
          <primitive
            :object="leftWallGeo"
            attach="geometry"
          />
          <TresMeshStandardMaterial
            :color="WOOD"
            :roughness="0.82"
            :metalness="0.01"
          />
        </TresMesh>

        <TresMesh
          v-if="rightWallGeo"
          :position="rightWallPosition"
          :rotation="[0, Math.PI / 2, 0]"
          cast-shadow
          receive-shadow
        >
          <primitive
            :object="rightWallGeo"
            attach="geometry"
          />
          <TresMeshStandardMaterial
            :color="WOOD"
            :roughness="0.82"
            :metalness="0.01"
          />
        </TresMesh>

        <!-- Zone groups -->
        <template
          v-for="zone in layout.zones"
          :key="zone.id"
        >
          <!-- Spine-mounted devices (no group transform, world-space positions) -->
          <template v-if="zone.isSpine">
            <DeviceMesh
              v-for="dev in zone.devices"
              :key="dev.id"
              :device="dev"
              :beauty="beautyMode"
            />
          </template>

          <!-- Regular stacked zones & separate trays -->
          <TresGroup
            v-else
            :position="zone.groupPosition"
            :rotation="zone.groupRotation"
          >
            <!-- Deck panel -->
            <TresMesh
              v-if="zone.deckSize && zone.deckPosition"
              :position="zone.deckPosition"
              cast-shadow
              receive-shadow
            >
              <TresBoxGeometry :args="zone.deckSize" />
              <TresMeshStandardMaterial
                :color="WOOD"
                :roughness="0.82"
                :metalness="0.01"
              />
            </TresMesh>

            <!-- Front lip (pedal zones) -->
            <TresMesh
              v-if="zone.lipSize && zone.lipPosition"
              :position="zone.lipPosition"
              cast-shadow
              receive-shadow
            >
              <TresBoxGeometry :args="zone.lipSize" />
              <TresMeshStandardMaterial
                :color="WOOD"
                :roughness="0.82"
                :metalness="0.01"
              />
            </TresMesh>

            <!-- Sub-platform (primary focus) -->
            <template v-if="zone.subPlatform">
              <TresGroup
                :position="[0, 0, -0.03]"
              >
                <TresMesh
                  :position="zone.subPlatform.deckPosition"
                  cast-shadow
                  receive-shadow
                >
                  <TresBoxGeometry :args="zone.subPlatform.deckSize" />
                  <TresMeshStandardMaterial
                    :color="WOOD"
                    :roughness="0.82"
                    :metalness="0.01"
                  />
                </TresMesh>

                <!-- Front lip -->
                <TresMesh
                  :position="zone.subPlatform.lipPosition"
                  cast-shadow
                  receive-shadow
                >
                  <TresBoxGeometry :args="zone.subPlatform.lipSize" />
                  <TresMeshStandardMaterial
                    :color="WOOD"
                    :roughness="0.82"
                    :metalness="0.01"
                  />
                </TresMesh>

                <!-- Side stops -->
                <TresMesh
                  v-for="(stop, si) in zone.subPlatform.sideStops"
                  :key="`stop-${si}`"
                  :position="stop.position"
                  cast-shadow
                  receive-shadow
                >
                  <TresBoxGeometry :args="stop.size" />
                  <TresMeshStandardMaterial
                    :color="WOOD"
                    :roughness="0.82"
                    :metalness="0.01"
                  />
                </TresMesh>

                <!-- Primary device ghost on sub-platform -->
                <DeviceMesh
                  v-for="dev in zone.devices"
                  :key="dev.id"
                  :device="dev"
                  :beauty="beautyMode"
                />
              </TresGroup>
            </template>

            <!-- Regular devices (no sub-platform) -->
            <template v-if="!zone.subPlatform">
              <DeviceMesh
                v-for="dev in zone.devices"
                :key="dev.id"
                :device="dev"
                :beauty="beautyMode"
              />
            </template>
          </TresGroup>
        </template>

        <!-- Cables -->
        <template v-if="showCables">
          <TresMesh
            v-for="cable in layout.cables"
            :key="cable.id"
          >
            <primitive
              :object="buildCableGeometry(cable)"
              attach="geometry"
            />
            <TresMeshStandardMaterial
              :color="cable.color"
              :roughness="0.4"
              :metalness="0.1"
            />
          </TresMesh>

          <!-- Power strip -->
          <TresMesh
            v-if="layout.powerStrip"
            :position="layout.powerStrip.position"
          >
            <TresBoxGeometry :args="layout.powerStrip.size" />
            <TresMeshStandardMaterial
              :color="POWER_STRIP_COLOR"
              :roughness="0.8"
            />
          </TresMesh>

          <!-- Power cables -->
          <TresMesh
            v-for="cable in layout.powerCables"
            :key="cable.id"
          >
            <primitive
              :object="buildCableGeometry(cable)"
              attach="geometry"
            />
            <TresMeshStandardMaterial
              :color="cable.color"
              :roughness="0.4"
              :metalness="0.1"
            />
          </TresMesh>
        </template>
      </TresCanvas>
    </ClientOnly>

    <!-- HUD Overlay -->
    <div class="pointer-events-none absolute top-3 left-3 max-w-sm rounded-md bg-black/60 p-3 text-xs text-white/90 leading-relaxed backdrop-blur-sm">
      <div class="mb-1 font-semibold tracking-tight">
        {{ layout.config.label }}
      </div>
      <div class="opacity-80">
        {{ layout.config.description }}
      </div>
      <ul class="mt-2 space-y-0.5">
        <template
          v-for="zone in layout.zones"
          :key="zone.id"
        >
          <li
            v-for="dev in zone.devices"
            :key="dev.id"
          >
            <span class="text-fuchsia-300">●</span>
            {{ dev.label }}
            <span
              v-if="zone.focus === 'primary'"
              class="text-amber-300 ml-1"
            >★</span>
          </li>
        </template>
      </ul>

      <!-- Design score -->
      <div class="mt-2 border-t border-white/10 pt-2">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-semibold">Design score</span>
          <span
            class="text-[11px] font-mono font-bold"
            :class="score.total >= 80 ? 'text-emerald-400' : score.total >= 60 ? 'text-amber-300' : 'text-red-400'"
          >{{ score.total }}/100</span>
        </div>
        <div class="mt-0.5 flex gap-2 flex-wrap text-[10px] text-white/50">
          <span>align {{ Math.round(score.alignment * 100) }}%</span>
          <span>spacing {{ Math.round(score.spacing * 100) }}%</span>
          <span>sym {{ Math.round(score.symmetry * 100) }}%</span>
          <span>ergo {{ Math.round(score.ergonomics * 100) }}%</span>
        </div>
      </div>

      <!-- Compiler diagnostics -->
      <div
        v-if="diagnostics.length > 0"
        class="mt-1.5 space-y-0.5"
      >
        <div
          v-for="(d, i) in diagnostics"
          :key="i"
          class="text-[10px] leading-snug"
          :class="d.level === 'error' ? 'text-red-300' : d.level === 'warn' ? 'text-amber-200/80' : 'text-sky-300/70'"
        >
          {{ d.level === 'error' ? '✖' : d.level === 'warn' ? '△' : 'ℹ' }} {{ d.message }}
        </div>
      </div>

      <!-- Ergonomics warnings -->
      <div
        v-if="layout.warnings.length > 0"
        class="mt-1.5 border-t border-white/10 pt-1.5"
      >
        <div
          v-for="(w, i) in layout.warnings"
          :key="i"
          class="text-[11px] leading-snug"
          :class="w.severity === 'error' ? 'text-red-300' : 'text-amber-200/90'"
        >
          {{ w.severity === 'error' ? '⚠' : '⚡' }} {{ w.message }}
        </div>
      </div>
    </div>

    <!-- View controls -->
    <div class="absolute bottom-3 left-3 flex gap-2">
      <UButton
        :label="showCables ? 'Hide cables' : 'Show cables'"
        size="xs"
        variant="subtle"
        :icon="showCables ? 'i-lucide-eye-off' : 'i-lucide-eye'"
        class="pointer-events-auto"
        @click="showCables = !showCables"
      />
      <UButton
        :label="beautyMode ? 'Debug view' : 'Beauty view'"
        size="xs"
        variant="subtle"
        icon="i-lucide-sparkles"
        class="pointer-events-auto"
        @click="beautyMode = !beautyMode"
      />
    </div>
  </div>
</template>

<style scoped>
/* Subtle vignette layered above the canvas. The canvas itself paints a warm
   slate via clear-color (#3d3631); this overlay just darkens the corners so
   the cabinet sits in a soft "spotlight" without the rest going pure black. */
.cabinet-stage::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse 75% 70% at 55% 55%, transparent 40%, rgba(0, 0, 0, 0.45) 100%);
}
</style>
