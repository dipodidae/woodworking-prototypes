<script setup lang="ts">
import type { ResolvedDevice } from '~/composables/useDesignEngine'

const props = defineProps<{
  device: ResolvedDevice
  beauty: boolean
}>()

const DEVICE_BASE: Record<string, string> = {
  synth: '#18181b',
  rhythm: '#1c1917',
  controller: '#1e1e21',
  pedal: '#222222',
  routing: '#1d1d20'
}

const baseColor = computed(() => DEVICE_BASE[props.device.category] ?? '#1c1c1e')

interface KnobSpec { position: [number, number, number], r: number, h: number }
interface PadSpec { position: [number, number, number], size: [number, number, number] }

const knobs = computed((): KnobSpec[] => {
  if (!props.beauty) return []
  const [w, h, d] = props.device.size
  const cat = props.device.category

  const cfgMap: Record<string, { cols: number, rows: number, xRange: [number, number], zRange: [number, number] }> = {
    synth: { cols: 9, rows: 2, xRange: [0.08, 0.92], zRange: [0.12, 0.52] },
    rhythm: { cols: 5, rows: 2, xRange: [0.50, 0.95], zRange: [0.10, 0.46] },
    controller: { cols: 8, rows: 1, xRange: [0.05, 0.95], zRange: [0.25, 0.40] },
    pedal: { cols: 2, rows: 1, xRange: [0.20, 0.80], zRange: [0.30, 0.45] }
  }

  const cfg = cfgMap[cat]
  if (!cfg) return []

  const { cols, rows, xRange, zRange } = cfg
  const knobR = Math.min(w / cols * 0.28, 0.009)
  const knobH = knobR * 1.2

  const items: KnobSpec[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const tx = cols > 1 ? col / (cols - 1) : 0.5
      const tz = rows > 1 ? row / (rows - 1) : 0.5
      const x = -w / 2 + w * (xRange[0] + tx * (xRange[1] - xRange[0]))
      const y = h / 2 + knobH / 2
      const z = d / 2 - d * (zRange[0] + tz * (zRange[1] - zRange[0]))
      items.push({ position: [x, y, z], r: knobR, h: knobH })
    }
  }
  return items
})

const pads = computed((): PadSpec[] => {
  if (!props.beauty || props.device.category !== 'rhythm') return []
  const [w, h, d] = props.device.size
  const cols = 4
  const rows = 4
  const areaW = w * 0.42
  const areaD = d * 0.46
  const padW = (areaW / cols) * 0.87
  const padD = (areaD / rows) * 0.87
  const padH = 0.003
  const stepX = areaW / cols
  const stepZ = areaD / rows
  const startX = -w / 2 + w * 0.05
  const startZ = d / 2 - d * 0.12 - areaD

  const items: PadSpec[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      items.push({
        position: [startX + col * stepX + padW / 2, h / 2 + padH / 2, startZ + row * stepZ + padD / 2],
        size: [padW, padH, padD]
      })
    }
  }
  return items
})

const ledPos = computed<[number, number, number]>(() => {
  const [w, h, d] = props.device.size
  return [w * 0.32, h / 2 + 0.003, d * 0.28]
})
</script>

<template>
  <TresGroup
    :position="device.position"
    :rotation="device.rotation"
  >
    <!-- Body -->
    <TresMesh
      cast-shadow
      receive-shadow
    >
      <TresBoxGeometry :args="device.size" />
      <TresMeshStandardMaterial
        :color="beauty ? baseColor : '#ff00ff'"
        :transparent="!beauty"
        :opacity="beauty ? 1 : 0.35"
        :roughness="0.42"
        :metalness="0.08"
      />
    </TresMesh>

    <!-- Knobs -->
    <TresMesh
      v-for="(k, i) in knobs"
      :key="`k${i}`"
      :position="k.position"
      cast-shadow
    >
      <TresCylinderGeometry :args="[k.r, k.r * 0.78, k.h, 8]" />
      <TresMeshStandardMaterial
        color="#0b0b0b"
        :roughness="0.28"
        :metalness="0.22"
      />
    </TresMesh>

    <!-- Pads (rhythm only) -->
    <TresMesh
      v-for="(p, i) in pads"
      :key="`p${i}`"
      :position="p.position"
      cast-shadow
    >
      <TresBoxGeometry :args="p.size" />
      <TresMeshStandardMaterial
        color="#2c1e1e"
        :roughness="0.7"
        :metalness="0"
      />
    </TresMesh>

    <!-- LED indicator (pedal / routing) -->
    <TresMesh
      v-if="beauty && (device.category === 'pedal' || device.category === 'routing')"
      :position="ledPos"
    >
      <TresSphereGeometry :args="[0.003, 6, 6]" />
      <TresMeshStandardMaterial
        color="#00ff55"
        :emissive="'#00ff55'"
        :emissive-intensity="1.2"
        :roughness="0.1"
        :metalness="0"
      />
    </TresMesh>
  </TresGroup>
</template>
