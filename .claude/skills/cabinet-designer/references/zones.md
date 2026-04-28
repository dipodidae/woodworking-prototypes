# Zones — the cabinet's spatial vocabulary

A **zone** is a horizontal tier of the cabinet, or a special mount (vertical spine, separate front tray). Zones are the unit the engine stacks, tilts, and lays devices on.

## Zone types

| `type`       | Purpose                          | Default tilt         | Notes |
| ------------ | -------------------------------- | -------------------- | ----- |
| `synth`      | Synthesizers                     | 5–13° depending on style | Stacked. Multiple synths in one zone — don't split. |
| `controller` | Sequencers, keyboard controllers | 0–10°                | Stacked. Max 1 controller zone. |
| `rhythm`     | Drum machines                    | 0–10°                | Stacked. Max 1 rhythm zone. |
| `pedals`     | Effects pedals                   | 3–12°                | Either bottom of stack (`mode: "deck"`) or front of cabinet (`mode: "tray-separate"`). |
| `looper`     | Loopers, samplers                | 0°                   | Stacked, usually thin. |
| `routing`    | Patchbay, tuner                  | 0° (mid-shelf) or 10° (spine) | Special — use `mount: "spine-right"` or `mount: "mid-shelf"`. |

## Stack order (bottom → top)

The engine sorts stackable zones by:

1. Pedals (when `mode: "deck"`)
2. Synth
3. Looper
4. Controller / Rhythm

Spine and mid-shelf zones don't participate in stacking. Tray-separate zones don't either — they sit in front of the cabinet.

## Special mounts

### `mount: "spine-right"`

A vertical spine on the right inside wall. Devices are oriented so their long edge runs vertically, angled ~10° outward toward the user. Best for the patchbay and small tuners. Frees up valuable horizontal shelf real estate.

```jsonc
{
  "type": "routing",
  "mount": "spine-right",
  "devices": ["patchbay", "polytune"],
  "focus": "none"
}
```

### `mount: "mid-shelf"`

The patchbay sits flat on top of a middle shelf, pushed to the **front** edge of that shelf so the user can read every connection from their chair. Use this for studio-console / desk setups where the patchbay is part of the tabletop view, not hidden on the side.

```jsonc
{
  "type": "routing",
  "mount": "mid-shelf",
  "devices": ["patchbay"],
  "focus": "none"
}
```

### `mode: "tray-separate"`

A separate pedal tray that sits in front of the cabinet, tilted up like a typing tray. This is the desk-setup default for pedal access — pedals stay reachable while the cabinet body stays compact.

```jsonc
{
  "type": "pedals",
  "mode": "tray-separate",
  "devices": ["boss-compact", "mxr-standard", "strymon-standard"],
  "focus": "none"
}
```

You can also omit `devices` and pass a `pedals` sub-object to procedurally fill the tray:

```jsonc
{
  "type": "pedals",
  "mode": "tray-separate",
  "focus": "none",
  "pedals": { "layout": "grid", "anchor": "center", "density": "medium", "rows": 1 }
}
```

## Focus

Each zone may carry one of `primary | secondary | none`.

- **`primary`** is special: if the zone has *exactly one* device, the engine builds a sub-platform — a small raised stage with side stops — to elevate that device and signal "this is the hero." The zone gets +3° tilt and ~3 cm extra vertical space.
- **`secondary`** is a soft hint: the zone gets +1.5° tilt. Use it for "important but not the hero." Common for the synth row when the controller is the hero.
- **`none`** is structural. Use for utility zones (looper, pedals).

**At most one zone in the whole config should be `primary`.** The compiler enforces this — second `primary` is downgraded to `secondary` automatically — but it's better to author it correctly.

## How many stacked zones is too many?

The engine compresses heights when total stack height exceeds `maxHeight`. Compression flattens tilts, which destroys visual hierarchy. Rule of thumb:

- 2–3 stacked zones → safe in a 50–60 cm cabinet
- 4 stacked zones → comfortable in 65+ cm; compress-prone in 55 cm
- 5 stacked zones → only in 70–75 cm cabinets, or use `tray-separate` to drop one

If the user wants both a controller AND a rhythm zone, those don't have to be stacked — you can put them side by side in a single wider cabinet by giving them similar widths. But the current zone model doesn't let two zones share a tier; the trick is to put both devices into one composite zone (e.g., a wide "controller+rhythm" deck) and accept that the typing on it gets categorized as one zone — there's no syntax for side-by-side tiers yet.

The clean move when you have both: pick one as the top tier, put the other on a `tray-separate` (rare for rhythm) or accept the compressed stack.
