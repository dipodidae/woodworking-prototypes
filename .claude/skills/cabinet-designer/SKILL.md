---
name: cabinet-designer
description: Author a synth/pedal cabinet PrototypeConfig JSON for the woodworking-prototypes app. Use this whenever the user asks for a new cabinet, console, desk, rack, plinth, rig, or pedalboard layout for synths/drum machines/pedals/loopers/patchbays — even if they don't say "config" or "JSON" — including phrases like "design me a setup with…", "build a cabinet for my MS-20…", "lay out my pedals…", "I want a touring rig with…", or "compile this brief into a model." Authors a buildable JSON, validates it via `pnpm validate`, and iterates until the design score is ≥ 80 with no error-severity warnings.
---

# Cabinet designer

You're authoring **PrototypeConfig** JSON for a parametric 3D cabinet engine. The engine takes a config and produces a 3D woodworking model: side walls, shelves, tilted decks, devices placed on those decks, cable routing, power strip. Your job is to translate a user's brief ("warm home studio centered on the MS-20…") into a valid config that scores well, then validate it before claiming you're done.

## Why this matters

The engine is parametric, not generative. It can only render layouts it understands. If you author garbage, you get garbage — wonky tilts, devices clipping into walls, patchbays buried at the back, side walls disconnected from shelves. A *good* config respects the engine's grammar so the renderer produces a clean, readable design.

**The validator is your ground truth.** It runs the same engine the renderer uses and reports a numeric score plus warnings. Always run it. Don't claim a design is done until it scores ≥ 80 with no error-severity warnings.

## Workflow

1. **Read the brief.** Identify: which devices are involved, which is primary (the "heart of the desk"), how the user uses it (live/studio/touring/bedroom), any explicit style or composition cues.
2. **Pick a profile.** See `references/styles.md`. The profile drives tilts, mass distribution, and camera. Match the user's vibe — don't default to studio-console for everything.
3. **Lay out zones.** See `references/zones.md` for the zone vocabulary and stacking rules. Group synths together; patchbay goes on a spine or mid-shelf; pedals go on a deck or separate tray.
4. **Author connectivity.** See `references/connectivity.md` for port IDs and signal-flow patterns. Don't skip this — empty connectivity makes the render look like loose hardware on shelves.
5. **Size the cabinet.** Width = widest zone's total device width + ~10 cm margin. Depth = deepest device + ~5 cm rear clearance. Height grows from zone heights, the engine compresses if you overshoot.
6. **Save and validate.** Write the file under `app/app/data/prototypes/<slug>.json`. Run `pnpm validate app/data/prototypes/<slug>.json` from the repo's `app/` directory. Read the report.
7. **Iterate if needed.** If `ok` is false, score < 80, or there are `error`-severity warnings, fix and re-run. The most common fix is widening the cabinet or removing a primary focus from a zone with multiple devices.
8. **Wire it into the app.** If the user wants this as a permanent prototype page, add a Vue page under `app/app/pages/prototypes/<slug>.vue` (one-liner — copy any existing prototype page) and add the slug to the menu. If they only want a one-off, just place the JSON.

## Schema (authoritative)

The TypeScript types live in `app/app/composables/useDesignEngine.ts`. Match them exactly — the validator will reject unknown keys via the engine's behaviour, not via strict-schema rejection, so a wrong field is silently ignored. Re-read those types if anything is unclear.

```jsonc
{
  "id": "kebab-case-slug",                  // matches the filename
  "label": "Human Readable Name",
  "description": "One-sentence summary",

  "profile": {
    "style": "performance-wedge | studio-console | compact-block | brutalist",
    "aggressiveness": 0.0,                  // 0..1, see references/styles.md
    "smoothness": "stepped | angular | smooth"
  },

  "zones": [                                // see references/zones.md
    {
      "type": "synth | controller | rhythm | pedals | looper | routing",
      "devices": ["device-id", ...],        // see references/devices.md
      "focus": "primary | secondary | none",
      "mode": "deck | tray-separate",       // pedals only
      "mount": "spine-right | mid-shelf",   // routing only
      "pedals": {                            // pedals zones with mode "deck" or "tray-separate"
        "layout": "grid | staggered | hero-left",
        "anchor": "left | center",
        "density": "tight | medium | loose",
        "rows": 1
      }
    }
  ],

  "composition": {
    "align": "center | weighted-left | balanced",
    "spacing": "tight | breathing",
    "symmetry": 0.85                         // 0..1
  },

  "connectivity": [                          // see references/connectivity.md
    { "from": "device-id/port-id", "to": "device-id/port-id", "type": "midi | audio | cv | usb" }
  ],

  "power": {
    "strip": { "position": "rear-bottom", "outlets": 8 },
    "routing": "rear-trench | rear-drop"
  },

  "constraints": {
    "maxWidth": 100,                         // cm,  30..220
    "maxDepth": 35,                          // cm,  18..90
    "maxHeight": 55,                         // cm,  12..130
    "thickness": 1.8,                        // cm,  1.2..3.5 (panel thickness)
    "rearClearance": 5,                      // cm,  ≥ 0
    "maxReachDepth": 35,                     // cm,  20..60 (used for ergonomics warning)
    "minClearanceAboveDevice": 3,            // cm,  ≥ 1
    "cableDrop": true
  }
}
```

## Authoring rules that consistently produce good scores

These come from reading the scoring code in `useDesignCompiler.ts`. Internalize them — they're not arbitrary.

- **Group same-category devices in one zone.** Two synths → one synth zone with two devices, not two synth zones. The scorer rewards alignment within a zone (same Y, same tilt) and penalizes split groups.
- **At most one zone with `focus: "primary"`.** A primary zone with a *single* device gets a sub-platform with side stops and extra elevation — that's the visual "hero" treatment. If you put two devices in a primary zone, the sub-platform isn't built and the focus signal is wasted.
- **Wide-enough cabinet.** If the widest zone's device widths + gaps don't fit, the engine tightens spacing toward zero. The spacing score collapses. Always size `maxWidth` ≥ widest_zone_total_width + 8 cm (more for `breathing`, less for `tight`).
- **Don't overstack.** Five stacked zones in a 55 cm tall cabinet triggers compression that flattens tilts and squeezes clearances. Either widen the cabinet to put rhythm next to controller, or use `tray-separate` for pedals to drop a zone from the stack.
- **Patchbay must be reachable.** If the user mentions seeing connections "from the chair", use `mount: "mid-shelf"` (engine now lays it on the front edge of a middle shelf). For dense racks where space is tight, `mount: "spine-right"` is fine — it angles the patchbay outward on the right wall.
- **Looper, when small and incidental, deserves a `tray-separate` or a non-primary stacked zone.** Don't burn a stack tier on a looper if the user said "tucked in to the right." Use a thin stacked zone with `focus: "none"` and just one device.
- **Pedals on a `tray-separate` is the user-facing default for "desk" setups.** It puts the pedal deck out front, tilted up, like a typing tray. Use `mode: "deck"` only for performance rigs where pedals are integrated into the cabinet front.

## Anti-patterns (these produce the janky outputs)

- **Empty `connectivity: []`** — render looks like devices floating on shelves with no signal path. Always populate at least the MIDI thru chain and the audio path to the patchbay (or main out).
- **`focus: "primary"` on a multi-device zone** — wastes the sub-platform and confuses the layout sorter.
- **`maxWidth` smaller than the widest zone needs** — spacing collapses, devices look smushed.
- **Tiny `maxHeight` with many stacked zones** — engine compresses tilts toward zero, you lose all visual hierarchy.
- **`rearClearance > 40% of maxDepth`** — diagnostic warns, usable deck is too shallow for mid-depth devices.
- **`smoothness: "smooth"` (not allowed)** — only `stepped` / `angular` / `smooth` are accepted by the runtime, but the engine's profile generator only branches on `"stepped"` vs not. The schema says `angular | rounded` in some older docs — those are wrong. Use `stepped` for pronounced step-tier looks, `angular` (or anything else) for straight tapered side walls.

## Validation

From the repo's `app/` directory:

```bash
pnpm validate app/data/prototypes/<your-slug>.json
```

The script prints a JSON report and exits with code 0 (pass) or 1 (fail). On failure, the report's `warnings` and `diagnostics` arrays tell you what to fix. Common fixes:

| Warning / failure                                                | Fix                                                          |
| ---------------------------------------------------------------- | ------------------------------------------------------------ |
| `<device> may be hard to reach (X cm deep, max Y cm)`            | Increase `maxReachDepth`, or shrink `maxDepth`, or move device to a less-deep zone |
| `<device> right/left side very close to wall — ports hard to access` | Increase `maxWidth`, or remove a device from that zone       |
| `TOO_MANY_ZONES`                                                 | Move a zone to `tray-separate` or merge two zones            |
| `AGGRESSIVE_SHALLOW`                                             | Lower `aggressiveness` or increase `maxDepth`                |
| `THIN_PANELS`                                                    | Bump `thickness` to ≥ 1.5 (≥ 1.8 if synths > 5 kg)           |
| Score below 80 with no obvious warning                           | Check `score.alignment` and `score.spacing` first — usually fixed by re-grouping zones or widening the cabinet |

## When the user wants a permanent prototype page

After validating, also create the route file. Copy `app/app/pages/prototypes/synth-console.vue` and replace the import. One-line page. Then add the slug to whatever menu structure exists (check `app/app/components/PrototypeMenu.vue` and `app/app/data` if there's a registry).

## Where to look for more detail

- `references/devices.md` — full device catalog with dimensions and port IDs
- `references/zones.md` — zone types, stacking order, special mounts
- `references/styles.md` — when to pick each profile style
- `references/connectivity.md` — signal-flow templates (MIDI thru chain, CV mod, audio to patchbay)
- `references/examples.md` — three worked examples from real prompts to validated JSON

When in doubt, read the engine source at `app/app/composables/useDesignEngine.ts`. It's the ground truth. Anything in this skill that contradicts the source is a bug in this skill — fix the skill.
