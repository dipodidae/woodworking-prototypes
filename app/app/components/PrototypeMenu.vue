<script setup lang="ts">
const prototypes = usePrototypes()
const route = useRoute()

const items = computed(() =>
  prototypes.map(p => ({
    label: p.label,
    to: p.to,
    icon: route.path === p.to ? 'i-lucide-check' : undefined
  }))
)

const activeLabel = computed(() => {
  const match = prototypes.find(p => route.path === p.to)
  return match?.label ?? 'Prototypes'
})
</script>

<template>
  <UDropdownMenu
    v-slot="{ open }"
    :modal="false"
    :items="items"
    :content="{ align: 'start' }"
    :ui="{ content: 'min-w-fit' }"
    size="xs"
  >
    <UButton
      :label="activeLabel"
      variant="subtle"
      trailing-icon="i-lucide-chevron-down"
      size="xs"
      class="-mb-[6px] font-semibold rounded-full truncate"
      :class="[open && 'bg-primary/15']"
      :ui="{
        trailingIcon: ['transition-transform duration-200', open ? 'rotate-180' : undefined].filter(Boolean).join(' ')
      }"
    />
  </UDropdownMenu>
</template>
