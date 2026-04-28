# Prototype configs

Each `*.json` here is a `PrototypeConfig` — the input to the parametric cabinet engine. The corresponding Vue page lives under `app/app/pages/prototypes/<slug>.vue` and is a one-liner that imports this JSON and renders it.

## Authoring

If you (AI agent or human) are about to write a new prototype here, **read the cabinet-designer skill first**:

`.claude/skills/cabinet-designer/SKILL.md`

It has the schema, device catalog, zone rules, profile styles, signal-flow templates, anti-patterns, and worked examples.

## Validating

From the `app/` directory:

```bash
pnpm validate app/data/prototypes/<slug>.json
```

Exit 0 = passes (`ok: true`, score ≥ 60, no error warnings). Exit 1 = fix the issues in the JSON report's `warnings` and `diagnostics`.

Aim for score ≥ 80 before committing. The existing prototypes here are 87–100.

## Engine source

`app/app/composables/useDesignEngine.ts` is the authoritative behaviour. If a field documented in the skill doesn't match the engine, the engine wins — fix the skill.
