# Worked examples

Three examples taken from the prototypes already in the repo, paired with the kind of brief that produces them. Use these as scaffolds for new designs — don't copy verbatim, adapt to the brief.

## Example 1 — Studio console (warm home setup)

**Brief:** "Wide low desk-style console with breathing space, full pedalboard deck and right-spine routing. Late-night writing. MS-20 + Behringer M as the main synths, BeatStep Pro on top, TR-8S as the focal point."

**Approach:**
- `studio-console` style, low aggressiveness (0.3), `smoothness: smooth`
- Wide cabinet (130 cm) so synths and rhythm fit comfortably
- TR-8S is `primary` (one device, gets sub-platform)
- Patchbay on `spine-right` — saves shelf real estate
- Pedals integrated into the cabinet front (`mode: deck`)
- Symmetry 0.85, balanced alignment

**Result:** see `app/app/data/prototypes/synth-console.json`. Validates with score 88/100.

## Example 2 — Performance wedge (touring rig)

**Brief:** "Tight portable rig — TR-8S as the heart, BeatStep Pro for sequencing, no pedals, just the essentials, steep tilts so I can see everything from chest height while standing."

**Approach:**
- `performance-wedge` style, aggressiveness 0.7
- Compact cabinet (~85 cm wide, low maxDepth)
- TR-8S `primary` with sub-platform
- BeatStep Pro `secondary` on top
- No pedal zone, no separate tray
- Patchbay optional — for a touring rig, often dropped in favour of a small mixer

**Result:** see `app/app/data/prototypes/synth-touring.json`. Validates with score 93/100.

## Example 3 — Compact block (bedroom desk)

**Brief:** "Bedroom producer desk: everything close together, MS-20 mini centered, ditto looper tucked in, compact, no flair, just functional."

**Approach:**
- `compact-block` style, aggressiveness 0.4
- Small cabinet width (~80 cm)
- MS-20 `primary`
- BeatStep Pro on top, no rhythm zone
- Looper as a thin non-primary stacked zone
- Tight spacing, center alignment, high symmetry
- Pedals on `tray-separate` if any, else omit

This pattern matches the user's "Warm home studio" brief from the original prompt that was generating janky output. The right config for that brief looks roughly like:

```jsonc
{
  "id": "warm-home-studio",
  "label": "Warm Home Studio",
  "description": "Compact desk console centered on the MS-20 with a separate pedal tray and front-facing patchbay.",
  "profile": { "style": "studio-console", "aggressiveness": 0.35, "smoothness": "angular" },
  "zones": [
    { "type": "synth", "devices": ["ms20-mini", "behringer-m"], "focus": "primary" },
    { "type": "looper", "devices": ["ditto-x4"], "focus": "none" },
    { "type": "controller", "devices": ["beatstep-pro"], "focus": "secondary" },
    { "type": "routing", "devices": ["patchbay"], "mount": "mid-shelf", "focus": "none" }
  ],
  "composition": { "align": "balanced", "spacing": "breathing", "symmetry": 0.9 },
  "connectivity": [
    { "from": "beatstep-pro/midi-out",   "to": "ms20-mini/midi-in",   "type": "midi" },
    { "from": "ms20-mini/midi-in",       "to": "behringer-m/midi-in", "type": "midi" },
    { "from": "beatstep-pro/cv-1",       "to": "ms20-mini/cv-in-total","type": "cv" },
    { "from": "beatstep-pro/cv-2",       "to": "behringer-m/cv-in",   "type": "cv" },
    { "from": "ms20-mini/audio-out",     "to": "patchbay/rear-row",   "type": "audio" },
    { "from": "behringer-m/audio-out",   "to": "patchbay/rear-row",   "type": "audio" },
    { "from": "patchbay/front-row",      "to": "ditto-x4/in-l",       "type": "audio" },
    { "from": "ditto-x4/out-l",          "to": "patchbay/front-row",  "type": "audio" }
  ],
  "power": { "strip": { "position": "rear-bottom", "outlets": 6 }, "routing": "rear-trench" },
  "constraints": {
    "maxWidth": 100,
    "maxDepth": 35,
    "maxHeight": 60,
    "thickness": 1.8,
    "rearClearance": 4,
    "maxReachDepth": 35,
    "minClearanceAboveDevice": 4,
    "cableDrop": true
  }
}
```

Notice:
- The synth zone is `primary` because the user said the MS-20 is the heart — but it has TWO devices, which means the sub-platform won't trigger. If the user really wants a hero stage just for the MS-20, split: `synth` with MS-20 as `primary`, second `synth` with Behringer M as `secondary`. That overrides the "single synth zone" rule but is a deliberate trade-off.
- Patchbay is `mid-shelf`, not `spine-right`, because the user said "see every connection from my chair."
- No pedal zone — the brief explicitly says "no pedal deck, this is a desk."
- Width 100 cm because the synth row needs to fit MS-20 (49) + gap + Behringer M (37) = ~88 cm + edge margin.
