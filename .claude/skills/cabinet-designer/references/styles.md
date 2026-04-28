# Profile styles

The `profile.style` choice drives tilts, mass distribution, side-wall taper, and the camera preset. Pick deliberately — not every cabinet should be `studio-console`.

## `performance-wedge`

Aggressive tilts (synth 10–13°, pedals 6–10°), bottom-heavy mass, lower camera elevation (25°). Reads as a stage rig — the kind of slope you want on a synth playing at chest height while standing.

Use when the user says: *live*, *gig*, *stage*, *touring*, *performance*, *standing*, *I need to see the controls from above*.

`aggressiveness`: 0.5–0.8.

## `studio-console`

Gentle tilts (synth 5–8°, controller 3–5°), even mass distribution, higher camera elevation (35°). Reads as a desk console — a fixed studio piece you sit at.

Use when the user says: *desk*, *studio*, *home*, *bedroom*, *seated*, *late-night writing*, *console*. Default for "warm home setup" briefs.

`aggressiveness`: 0.3–0.5.

## `compact-block`

Minimal tilts (2–4°), uniform mass, mid camera. Reads as a small block — everything tightly packed, almost no slope.

Use when the user says: *compact*, *minimal*, *small footprint*, *bedroom desk*, *no-frills*, *tight*.

`aggressiveness`: 0.3–0.5.

## `brutalist`

Steep tilts (synth 12–15°, controller 8–10°), heavy mass distribution, low elevation camera (20°), narrow FOV (32°). Reads as an aggressive monolithic plinth.

Use when the user says: *brutalist*, *plinth*, *monolithic*, *heavy*, *commanding*, *imposing*.

`aggressiveness`: 0.5–0.8.

## `aggressiveness`

A scalar 0..1 that interpolates within the style's tilt range and side-wall taper. Higher = steeper tilts, more pronounced front-edge taper on the cabinet's silhouette.

- **0.3** — neutral, conservative shape. Default if the brief is short.
- **0.5** — moderate slope, clear visual hierarchy.
- **0.8** — pronounced — almost as steep as the style allows.

If the user says *aggressive*, *steep*, *tilted*, push toward 0.7+. If they say *flat*, *level*, *clean*, push toward 0.3.

## `smoothness`

Affects only the side-wall profile generator. The engine branches on `"stepped"` vs everything else:

- `stepped` — small horizontal step at each shelf — reads as built-in tiers
- `angular` (and `smooth` — treated the same in current code) — straight tapered side wall

Default to `angular` unless the user wants explicit visible tiers.

## Camera

The camera preset is style-driven and not authored — the engine picks elevation, distance multiplier, and FOV. If the user complains the render looks "from above" or "looking down too much", that's a hint to switch from `studio-console` to `performance-wedge` or `compact-block`, which have lower elevations.
