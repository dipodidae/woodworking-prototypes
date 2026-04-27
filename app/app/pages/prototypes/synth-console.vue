<script setup lang="ts">
import type { PrototypeConfig } from '~/composables/useDesignEngine'
import configRaw from '~/data/prototypes/synth-console.json'

const config = configRaw as unknown as PrototypeConfig
</script>

<template>
  <CabinetRenderer :config="config" />
</template>
