<script setup lang="ts">
const prototypes = usePrototypes()
</script>

<template>
  <UContainer class="py-12">
    <div class="mb-8">
      <h1 class="text-3xl font-semibold tracking-tight">
        Prototypes
      </h1>
      <p class="text-muted mt-2">
        Pick a prototype to view it in 3D.
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="p in prototypes"
        :key="p.id"
        :to="p.to"
        class="block"
      >
        <UCard class="hover:ring-2 hover:ring-primary/50 transition">
          <h2 class="font-semibold">
            {{ p.label }}
          </h2>
          <p class="text-muted text-sm mt-1">
            {{ p.description }}
          </p>
        </UCard>
      </NuxtLink>
    </div>
  </UContainer>
</template>
