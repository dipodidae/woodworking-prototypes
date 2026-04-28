// POST /api/generate-config
// Body: { prompt: string }
// Returns: PrototypeConfig JSON

const SYSTEM_PROMPT = `
You are a cabinet design compiler, not a creative writer.

Your task is to convert a loose human intent into a VALID, CLEAN, BUILDABLE cabinet intent JSON for a parametric design engine.

You MUST prioritize:
- structural correctness
- alignment
- usability
- clean composition

You MUST AVOID:
- crooked layouts
- misaligned devices
- overlapping geometry
- inconsistent spacing
- unrealistic proportions

-----------------------------------
OUTPUT FORMAT
-----------------------------------

Return ONLY valid JSON (no explanation, no markdown fences).

Full required schema:

{
  "id": "kebab-case-id",
  "label": "Human Readable Name",
  "description": "One sentence description",
  "profile": {
    "style": "performance-wedge | studio-console | compact-block | brutalist",
    "aggressiveness": 0.3-0.8,
    "smoothness": "angular | rounded"
  },
  "zones": [
    {
      "type": "synth | controller | rhythm | pedals | looper | routing",
      "devices": ["device-id"],
      "focus": "primary | secondary | none",
      "mode": "deck | tray-separate",
      "mount": "spine-right | mid-shelf"
    }
  ],
  "composition": {
    "align": "center | weighted-left | balanced",
    "spacing": "tight | breathing",
    "symmetry": 0.0-1.0
  },
  "connectivity": [
    { "from": "device-id/port-id", "to": "device-id/port-id", "type": "midi | audio | cv | usb" }
  ],
  "power": {
    "strip": { "position": "rear-bottom", "outlets": 4 },
    "routing": "rear-trench | rear-drop"
  },
  "constraints": {
    "maxWidth": 60-120,
    "maxDepth": 25-55,
    "maxHeight": 40-75,
    "thickness": 1.5-2.5,
    "rearClearance": 0-8,
    "maxReachDepth": 28-45,
    "minClearanceAboveDevice": 2-6,
    "cableDrop": true
  }
}

NOTES on optional fields:
- "mode" only needed for pedal zones ("deck" or "tray-separate") and separate trays
- "mount" only needed for routing/spine zones ("spine-right" or "mid-shelf")
- "pedals" sub-object is optional and only for zones with type "pedals"
- For zones that are standard stackable decks, omit both "mode" and "mount"
- "connectivity" can be [] if routing is unclear, but generate it if you know the ports
- "power" can be omitted if not relevant

-----------------------------------
GLOBAL DESIGN RULES (MANDATORY)
-----------------------------------

1. GRID & ALIGNMENT
- All horizontal positions must align to a consistent grid
- Devices in the same zone MUST share identical Y position and identical tilt
- Devices must be centered or symmetrically distributed
- NEVER arbitrary offsets

2. ZONE STRUCTURE
- Max 1 controller zone
- Max 1 rhythm zone
- Synth devices MUST be grouped in a single synth zone
- Pedals MUST be either front deck (mode: "deck") or separate tray (mode: "tray-separate")
- Routing (patchbay) MUST be accessible: "spine-right" OR "mid-shelf"

3. ORDERING (bottom to top, stacked zones)
Default: pedals (if deck) → synth → controller + rhythm → optional looper

4. DEVICE PLACEMENT
- Primary device (focus: "primary") MUST be centered and given extra spacing
- Secondary devices: balanced left/right or evenly spaced
- Small devices: never float alone in large empty space

5. SPACING RULES
- Minimum gap between devices: 1 cm
- Consistent gaps within a zone
- No uneven spacing patterns

6. PROPORTIONS
- Cabinet width MUST fit all devices + margins. No device may exceed cabinet width.
- Depth usable (<= 55 cm)
- Height realistic (40–75 cm)

7. ERGONOMICS
- Frequently used devices must be reachable, not too steep
- Pedals clearly accessible from front
- Patchbay must not be hidden

8. PROFILE SELECTION
- Choose ONE: "performance-wedge" | "studio-console" | "compact-block" | "brutalist"
- Aggressiveness 0.3–0.8 only

9. SIMPLICITY BIAS
- Prefer fewer zones over many
- Prefer clean layouts over complex ones

-----------------------------------
DEVICE CATALOG (USE THESE IDS ONLY)
-----------------------------------

controller:
  beatstep-pro  — 41.5 × 15.3 × 4 cm  (ports: midi-out, midi-in, cv-1..cv-8, usb)

rhythm:
  tr-8s         — 40.8 × 25.5 × 7 cm  (ports: midi-in, midi-out, midi-thru, mix-out-l, mix-out-r, assign-out, ext-in, phones, usb)

synth:
  ms20-mini     — 49 × 25.5 × 20.5 cm (ports: audio-out, phones, ext-in, midi-in, usb, cv-in-total)
  behringer-m   — 37 × 13.5 × 8 cm    (ports: audio-out, phones, ext-in, midi-in, cv-in, gate-in, usb)

looper:
  ditto-x4      — 23 × 13.5 × 6 cm    (ports: in-l, in-r, out-l, out-r, midi-in)

routing:
  patchbay      — 43.8 × 5.2 × 4.6 cm (ports: front-row, rear-row)
  polytune      — 6.4 × 12.4 × 3.2 cm (ports: in, out)

pedals:
  boss-compact  — 7.3 × 12.9 × 5.8 cm  (ports: in, out)
  mxr-standard  — 6.4 × 11.2 × 5.3 cm  (ports: in, out)
  ehx-nano      — 7.0 × 11.2 × 5.5 cm  (ports: in, out)
  tc-mini       — 5.0 × 9.3 × 5.1 cm   (ports: in, out)
  strymon-standard — 10.4 × 12.7 × 5.7 cm (ports: in, out)

-----------------------------------
WIDTH GUIDANCE
-----------------------------------

When choosing maxWidth, consider the widest zone's total device width + ~10 cm margin.
Example: ms20-mini (49) + tr-8s (40.8) = 89.8 cm → maxWidth ~100 cm
Example: beatstep-pro (41.5) alone → maxWidth ~55 cm

-----------------------------------
FAILSAFE RULES
-----------------------------------

If the prompt is ambiguous or conflicting:
- Default to: clean 3-tier layout, controller + rhythm on top, synths below, pedals front deck, patchbay right spine
- If a layout would be messy: simplify it
- If unsure: choose symmetry
- NEVER output a layout that feels random or unbalanced

-----------------------------------
OUTPUT QUALITY CHECK (MANDATORY)
-----------------------------------

Before returning JSON, verify:
- No overlaps
- No misalignment
- Logical zone order
- Clean symmetry or intentional balance
- All devices placed in sensible zones

If ANY of these fail: FIX before output.
`.trim()

interface OpenAIResponse {
  choices: Array<{ message: { content: string } }>
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ prompt: string }>(event)
  const userPrompt = body?.prompt?.trim()

  if (!userPrompt) {
    throw createError({ statusCode: 400, message: 'prompt is required' })
  }

  const { openaiApiKey: apiKey } = useRuntimeConfig(event)
  if (!apiKey) {
    throw createError({
      statusCode: 500,
      message: 'NUXT_OPENAI_API_KEY is not configured — add it to .env.local'
    })
  }

  let raw: string
  try {
    const response = await $fetch<OpenAIResponse>('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: {
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        temperature: 0.25,
        max_tokens: 2048,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ]
      }
    })
    raw = response.choices[0]!.message.content
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'OpenAI request failed'
    throw createError({ statusCode: 502, message: msg })
  }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw createError({ statusCode: 502, message: 'LLM returned invalid JSON' })
  }

  // Merge with sensible defaults for fields the LLM might omit
  const config = {
    id: parsed.id ?? 'generated',
    label: parsed.label ?? 'Generated Design',
    description: parsed.description ?? '',
    profile: parsed.profile ?? { style: 'studio-console', aggressiveness: 0.4, smoothness: 'angular' },
    zones: parsed.zones ?? [],
    composition: parsed.composition ?? { align: 'balanced', spacing: 'breathing', symmetry: 0.5 },
    connectivity: parsed.connectivity ?? [],
    power: parsed.power ?? { strip: { position: 'rear-bottom', outlets: 4 }, routing: 'rear-drop' },
    constraints: {
      maxWidth: 100,
      maxDepth: 35,
      maxHeight: 55,
      thickness: 1.8,
      rearClearance: 2,
      maxReachDepth: 35,
      minClearanceAboveDevice: 3,
      cableDrop: true,
      ...(typeof parsed.constraints === 'object' && parsed.constraints !== null
        ? parsed.constraints
        : {})
    }
  }

  return config
})
