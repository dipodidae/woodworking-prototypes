<script setup lang="ts">
// 10 cm cube. Three.js units are meters by default → 0.1.
const SIZE = 0.1
</script>

<template>
  <div class="h-[calc(100vh-var(--ui-header-height,4rem))] w-full">
    <ClientOnly>
      <TresCanvas
        clear-color="#0b0b0c"
        window-size
        shadows
        alpha
      >
        <TresPerspectiveCamera
          :position="[0.25, 0.2, 0.25]"
          :fov="45"
          :near="0.01"
          :far="50"
          :look-at="[0, 0, 0]"
        />
        <OrbitControls :target="[0, SIZE / 2, 0]" />

        <TresAmbientLight :intensity="0.35" />
        <TresDirectionalLight
          :position="[1, 2, 1]"
          :intensity="1.4"
          cast-shadow
        />

        <TresMesh
          :position="[0, SIZE / 2, 0]"
          cast-shadow
          receive-shadow
        >
          <TresBoxGeometry :args="[SIZE, SIZE, SIZE]" />
          <TresMeshStandardMaterial color="#deb887" :roughness="0.7" />
        </TresMesh>

        <TresMesh
          :rotation="[-Math.PI / 2, 0, 0]"
          receive-shadow
        >
          <TresPlaneGeometry :args="[2, 2]" />
          <TresMeshStandardMaterial color="#1a1a1c" :roughness="1" />
        </TresMesh>
      </TresCanvas>
    </ClientOnly>
  </div>
</template>
