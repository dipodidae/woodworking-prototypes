<script setup lang="ts">
import type { PrototypeConfig } from '~/composables/useDesignEngine'

useHead({ title: 'Design Compiler' })

type Status = 'idle' | 'loading' | 'error' | 'success'

const prompt = ref('')
const status = ref<Status>('idle')
const config = ref<PrototypeConfig | null>(null)
const errorMsg = ref('')
const showRaw = ref(false)
const rawJson = ref('')

const EXAMPLES = [
  'Live performance rig: MS20 mini front-center, TR-8S for rhythm, BeatStep Pro for sequencing, compact pedal tray at the front',
  'Studio console: MS20 mini + Behringer M paired as main synths, patchbay on the spine, BeatStep Pro on top shelf',
  'Minimal touring setup: TR-8S as primary with BeatStep Pro — tight, portable, no pedals',
  'Bedroom producer desk: everything close together, MS20 mini centered, ditto looper tucked in, compact block style'
]

async function generate() {
  const p = prompt.value.trim()
  if (!p) return

  status.value = 'loading'
  errorMsg.value = ''
  config.value = null

  try {
    const result = await $fetch<PrototypeConfig>('/api/generate-config', {
      method: 'POST',
      body: { prompt: p }
    })
    config.value = result
    rawJson.value = JSON.stringify(result, null, 2)
    status.value = 'success'
  } catch (err: unknown) {
    const msg = (err as { data?: { message?: string }, message?: string })?.data?.message
      ?? (err instanceof Error ? err.message : 'Unknown error')
    errorMsg.value = msg
    status.value = 'error'
  }
}

function useExample(ex: string) {
  prompt.value = ex
  generate()
}
</script>

<template>
  <div class="flex h-[calc(100vh-var(--ui-header-height,4rem))] overflow-hidden">
    <!-- ── Left panel ─────────────────────────────────────────────── -->
    <div class="w-[420px] shrink-0 flex flex-col gap-4 overflow-y-auto border-r border-white/8 bg-[#0d0d0f] p-5">
      <div>
        <h2 class="text-base font-semibold tracking-tight">
          Design Compiler
        </h2>
        <p class="mt-0.5 text-xs text-white/40">
          Describe your instrument setup in plain language.
        </p>
      </div>

      <!-- Textarea -->
      <UTextarea
        v-model="prompt"
        placeholder="e.g. Live synth rig with MS20 mini centered, TR-8S for beats, BeatStep Pro for sequencing…"
        :rows="5"
        autoresize
        :disabled="status === 'loading'"
        class="font-mono text-xs"
        @keydown.meta.enter="generate"
        @keydown.ctrl.enter="generate"
      />

      <!-- Generate button -->
      <UButton
        :loading="status === 'loading'"
        :disabled="!prompt.trim() || status === 'loading'"
        block
        icon="i-lucide-cpu"
        label="Generate design"
        @click="generate"
      />

      <!-- Examples -->
      <div>
        <p class="mb-1.5 text-[11px] font-medium text-white/30 uppercase tracking-wider">
          Examples
        </p>
        <div class="flex flex-col gap-1.5">
          <button
            v-for="ex in EXAMPLES"
            :key="ex"
            class="rounded-md border border-white/8 bg-white/3 px-3 py-2 text-left text-[11px] text-white/60 hover:bg-white/6 hover:text-white/90 transition cursor-pointer"
            :disabled="status === 'loading'"
            @click="useExample(ex)"
          >
            {{ ex }}
          </button>
        </div>
      </div>

      <!-- Error -->
      <UAlert
        v-if="status === 'error'"
        color="error"
        variant="soft"
        icon="i-lucide-alert-triangle"
        :description="errorMsg"
      />

      <!-- Raw JSON toggle -->
      <template v-if="status === 'success'">
        <div class="border-t border-white/8 pt-3">
          <button
            class="flex w-full items-center justify-between text-[11px] text-white/40 hover:text-white/70 transition"
            @click="showRaw = !showRaw"
          >
            <span>Raw JSON output</span>
            <UIcon
              :name="showRaw ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              class="size-3.5"
            />
          </button>
          <pre
            v-if="showRaw"
            class="mt-2 max-h-72 overflow-auto rounded-md bg-black/40 p-3 text-[10px] text-white/50 leading-relaxed"
          >{{ rawJson }}</pre>
        </div>
      </template>
    </div>

    <!-- ── Right panel: 3D render ─────────────────────────────────── -->
    <div class="flex-1 relative">
      <!-- Idle / loading state -->
      <div
        v-if="status === 'idle' || status === 'loading'"
        class="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white/20"
      >
        <template v-if="status === 'loading'">
          <div class="size-8 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
          <span class="text-sm">Compiling design…</span>
        </template>
        <template v-else>
          <UIcon
            name="i-lucide-box"
            class="size-12 opacity-20"
          />
          <span class="text-sm">Enter a description to generate a 3D design</span>
        </template>
      </div>

      <!-- Renderer -->
      <CabinetRenderer
        v-if="config"
        :config="config"
      />
    </div>
  </div>
</template>
