---
trigger: model_decision
description: Apply whenever the user asks for a new cabinet, console, desk, rack, plinth, rig, or pedalboard layout for synths/drum machines/pedals/loopers/patchbays — even if they don't say "config" or "JSON". Phrases like "design me a setup with…", "build a cabinet for my MS-20…", "lay out my pedals…", "I want a touring rig…", or "compile this brief into a model" all qualify. Authors a buildable PrototypeConfig JSON for the parametric cabinet engine, validates it, and iterates until it's clean.
---

# Cabinet designer (Windsurf rule)

You're authoring **PrototypeConfig** JSON for the parametric 3D cabinet engine in this repo. The engine takes a JSON config and produces a 3D woodworking model: side walls, shelves, tilted decks, devices, cable routing, power strip. Your job is to translate a brief ("warm home studio centered on the MS-20…") into a valid config that scores well, then validate it before claiming you're done.

The full authoring guide lives at:

- [`.claude/skills/cabinet-designer/SKILL.md`](.claude/skills/cabinet-designer/SKILL.md)

It is the same skill Claude Code uses; treat it as ground truth and **read it before authoring**. Supporting references:

- [`references/devices.md`](.claude/skills/cabinet-designer/references/devices.md) — full device catalog
- [`references/zones.md`](.claude/skills/cabinet-designer/references/zones.md) — zone vocabulary
- [`references/styles.md`](.claude/skills/cabinet-designer/references/styles.md) — when to pick each profile style
- [`references/connectivity.md`](.claude/skills/cabinet-designer/references/connectivity.md) — signal flow
- [`references/examples.md`](.claude/skills/cabinet-designer/references/examples.md) — worked examples

## Workflow

1. Read the brief. Identify primary device, vibe (live / studio / touring / bedroom), explicit cues (style, composition, signal flow).
2. Read [`SKILL.md`](.claude/skills/cabinet-designer/SKILL.md) and the relevant reference files for any unfamiliar field.
3. Author a JSON file at `app/app/data/prototypes/<slug>.json`.
4. From the `app/` directory, run `pnpm validate app/data/prototypes/<slug>.json`.
5. Iterate until `ok: true`, score ≥ 80, and no `error`-severity warnings.
6. If the user wants this as a permanent route, also create `app/app/pages/prototypes/<slug>.vue` (one-liner — copy any existing one).

## Engine source of truth

`app/app/composables/useDesignEngine.ts` is the authoritative behaviour. If anything in the skill contradicts the engine, the engine wins — fix the skill.

## Hard rules (these come from the scoring code, not opinion)

- Group same-category devices in one zone (two synths → one synth zone).
- At most one zone with `focus: "primary"`. A primary zone with a *single* device gets a sub-platform; with multiple devices the sub-platform isn't built.
- `maxWidth` ≥ widest_zone_total_width + 8 cm (more for `breathing`, less for `tight`) — otherwise spacing collapses.
- 5 stacked zones in a 55 cm cabinet triggers compression that flattens tilts. Move pedals to `tray-separate` or widen the cabinet.
- Patchbay must be reachable: `mount: "mid-shelf"` for desk setups (sits on the front of a middle shelf), `mount: "spine-right"` for dense racks.
- Always populate `connectivity[]`. Empty connectivity = render looks like loose hardware on shelves.

## Anti-patterns

- Empty `connectivity: []`
- `focus: "primary"` on a multi-device zone
- `maxWidth` smaller than the widest zone needs
- Tiny `maxHeight` with many stacked zones
- `rearClearance > 40%` of `maxDepth`

## Validation contract

`pnpm validate <path>` exits 0 on pass (score ≥ 60, no error-severity warnings) and 1 on fail. The JSON report's `warnings` and `diagnostics` tell you what to fix. Don't claim a design is done until validate exits 0 with score ≥ 80.
