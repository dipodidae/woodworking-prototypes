# Repo orientation for AI coding agents

This is a Nuxt 4 + Vue 3 + Three.js (via TresJS) app that compiles a JSON "intent" — a `PrototypeConfig` — into a 3D parametric model of a synth/pedal cabinet. Real woodworking project; the renders inform a real build.

The user works with this via two paths:

1. The in-app prompt UI at `/prototypes/generate` — calls OpenAI to translate a natural-language brief into JSON, then renders it.
2. **You.** When the user prompts you (in Claude Code, Windsurf, Cursor, etc.) for a new cabinet design, **read the `cabinet-designer` skill** at `.claude/skills/cabinet-designer/SKILL.md` and follow it. Don't free-style — the engine is parametric and only renders configs that respect its grammar.

## Where things live

- `app/app/composables/useDesignEngine.ts` — pure engine: types, layout resolver, profile generator, cable router. Vue-free, importable from Node.
- `app/app/composables/useDesignCompiler.ts` — Vue composable layer + scoring + diagnostics + normalisation.
- `app/app/components/CabinetRenderer.vue` — TresJS scene that renders a `ResolvedLayout`.
- `app/app/components/DeviceMesh.vue` — per-device mesh.
- `app/app/data/devices.json` — canonical device catalog (dimensions, ports, power).
- `app/app/data/prototypes/*.json` — committed prototype configs.
- `app/app/pages/prototypes/*.vue` — one Vue page per prototype, each a one-liner that imports its JSON and renders it.
- `app/server/api/generate-config.post.ts` — OpenAI bridge for the in-app generator.
- `app/scripts/validate-config.ts` — Node validator. Run via `pnpm validate <path>`.
- `.claude/skills/cabinet-designer/` — authoring skill + reference docs.

## When the user asks for a cabinet design

Always invoke the `cabinet-designer` skill. It contains the schema, device catalog, zone/style/connectivity rules, anti-patterns, and worked examples. The high-level flow:

1. Author the JSON under `app/app/data/prototypes/<slug>.json`.
2. Run `pnpm validate app/data/prototypes/<slug>.json` from the `app/` directory.
3. Iterate until the score is ≥ 80 and there are no `error`-severity warnings.
4. If the user wants it as a permanent route, also add `app/app/pages/prototypes/<slug>.vue` (copy any existing one).

## Tooling

- Package manager: pnpm (declared via `packageManager` in `app/package.json`).
- TS in Node: `tsx` (devDep). Validator runs through it.
- Lint: `pnpm lint`. Typecheck: `pnpm typecheck`.

## Don't

- Don't change `~/data/devices.json` to add fictional devices — the user has them physically. Adding new entries needs the user's input.
- Don't add a new `zone.type` or `profile.style` without also updating the engine to handle it. The engine has switch statements that silently fall through to defaults for unknown values, which produces janky output rather than an error.
- Don't skip validation. The score is genuinely informative.
