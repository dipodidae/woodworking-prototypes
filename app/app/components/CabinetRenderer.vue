<script setup lang="ts">
import { Shape, ExtrudeGeometry, Vector2, CatmullRomCurve3, TubeGeometry } from 'three'
import { useDesignEngine, type PrototypeConfig, type ResolvedCable } from '~/composables/useDesignEngine'

const props = defineProps<{
  config: PrototypeConfig
}>()

const { layout } = useDesignEngine(computed(() => props.config))

const showCables = ref(true)

const WOOD = '#caa472'
const GHOST = '#ff00ff'
const GHOST_OPACITY = 0.38
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
    bevelEnabled: false
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
  <div class="h-[calc(100vh-var(--ui-header-height,4rem))] w-full relative">
    <ClientOnly>
      <TresCanvas
        clear-color="#0b0b0c"
        window-size
        shadows
        alpha
      >
        <TresPerspectiveCamera
          :position="layout.camera.position"
          :fov="layout.camera.fov"
          :near="0.01"
          :far="50"
          :look-at="layout.camera.target"
        />
        <OrbitControls :target="layout.camera.target" />

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
          <TresMeshStandardMaterial
            color="#1a1a1c"
            :roughness="1"
          />
        </TresMesh>

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
            :roughness="0.7"
          />
        </TresMesh>

        <!-- Shaped side walls -->
        <TresMesh
          v-if="leftWallGeo"
          :position="leftWallPosition"
          :rotation="[Math.PI / 2, -Math.PI / 2, 0]"
          cast-shadow
          receive-shadow
        >
          <primitive
            :object="leftWallGeo"
            attach="geometry"
          />
          <TresMeshStandardMaterial
            :color="WOOD"
            :roughness="0.7"
          />
        </TresMesh>

        <TresMesh
          v-if="rightWallGeo"
          :position="rightWallPosition"
          :rotation="[Math.PI / 2, -Math.PI / 2, 0]"
          cast-shadow
          receive-shadow
        >
          <primitive
            :object="rightWallGeo"
            attach="geometry"
          />
          <TresMeshStandardMaterial
            :color="WOOD"
            :roughness="0.7"
          />
        </TresMesh>

        <!-- Zone groups -->
        <template
          v-for="zone in layout.zones"
          :key="zone.id"
        >
          <!-- Spine-mounted devices (no group transform, world-space positions) -->
          <template v-if="zone.isSpine">
            <TresMesh
              v-for="dev in zone.devices"
              :key="dev.id"
              :position="dev.position"
              :rotation="dev.rotation"
            >
              <TresBoxGeometry :args="dev.size" />
              <TresMeshStandardMaterial
                :color="GHOST"
                :transparent="true"
                :opacity="GHOST_OPACITY"
              />
            </TresMesh>
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
                :roughness="0.7"
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
                :roughness="0.7"
              />
            </TresMesh>

            <!-- Sub-platform (primary focus) -->
            <template v-if="zone.subPlatform">
              <TresGroup
                :position="[0, 0, -0.03]"
                :rotation="[0.1745, 0.2094, 0]"
              >
                <TresMesh
                  :position="zone.subPlatform.deckPosition"
                  cast-shadow
                  receive-shadow
                >
                  <TresBoxGeometry :args="zone.subPlatform.deckSize" />
                  <TresMeshStandardMaterial
                    :color="WOOD"
                    :roughness="0.7"
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
                    :roughness="0.7"
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
                    :roughness="0.7"
                  />
                </TresMesh>

                <!-- Primary device ghost on sub-platform -->
                <TresMesh
                  v-for="dev in zone.devices"
                  :key="dev.id"
                  :position="dev.position"
                >
                  <TresBoxGeometry :args="dev.size" />
                  <TresMeshStandardMaterial
                    :color="GHOST"
                    :transparent="true"
                    :opacity="GHOST_OPACITY"
                  />
                </TresMesh>
              </TresGroup>
            </template>

            <!-- Regular devices (no sub-platform) -->
            <template v-if="!zone.subPlatform">
              <TresMesh
                v-for="dev in zone.devices"
                :key="dev.id"
                :position="dev.position"
              >
                <TresBoxGeometry :args="dev.size" />
                <TresMeshStandardMaterial
                  :color="GHOST"
                  :transparent="true"
                  :opacity="GHOST_OPACITY"
                />
              </TresMesh>
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

      <!-- Ergonomics warnings -->
      <div
        v-if="layout.warnings.length > 0"
        class="mt-2 border-t border-white/10 pt-2"
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

    <!-- Cable toggle -->
    <div class="absolute bottom-3 left-3">
      <UButton
        :label="showCables ? 'Hide cables' : 'Show cables'"
        size="xs"
        variant="subtle"
        :icon="showCables ? 'i-lucide-eye-off' : 'i-lucide-eye'"
        class="pointer-events-auto"
        @click="showCables = !showCables"
      />
    </div>
  </div>
</template>
