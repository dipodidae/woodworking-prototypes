# Device catalog

The canonical catalog is at `app/app/data/devices.json`. If you add a device, put it there too — the engine and validator read from that file. This reference mirrors the catalog as of the time of writing; re-read the JSON if you suspect drift.

Dimensions are **width × depth × height** in centimetres. Width is the long edge as it faces you on a desk. Depth is front-to-back. Height is the device's vertical thickness.

## Synths

| ID            | Label             | W × D × H (cm)     | Notes |
| ------------- | ----------------- | ------------------ | ----- |
| `ms20-mini`   | Korg MS-20 Mini   | 49 × 25.5 × 20.5   | Big device — semi-modular synth with patch jacks on top. Tall (20.5 cm) so it dominates a synth row vertically. Often the "hero" of a setup. Has a `cv-in-total` port on the **top** face. |
| `behringer-m` | Behringer M       | 37 × 13.5 × 8      | Mini-Moog clone in a rack-style box. Pairs naturally with the MS-20 for bass duties. |

## Drum machines

| ID      | Label         | W × D × H        | Notes |
| ------- | ------------- | ---------------- | ----- |
| `tr-8s` | Roland TR-8S  | 40.8 × 25.5 × 7  | Wide and deep — give it its own zone (`type: "rhythm"`). Great primary-focus candidate for live rigs. |

## Controllers

| ID             | Label              | W × D × H        | Notes |
| -------------- | ------------------ | ---------------- | ----- |
| `beatstep-pro` | Arturia BeatStep Pro | 41.5 × 15.3 × 4 | Eight CV outs (`cv-1` … `cv-8`) and MIDI out. The brain of most setups. Put it on top: `type: "controller"`. |

## Loopers

| ID         | Label    | W × D × H       | Notes |
| ---------- | -------- | --------------- | ----- |
| `ditto-x4` | Ditto X4 | 23 × 13.5 × 6   | Small. Often appropriate as a `tray-separate` secondary deck or tucked into a non-primary stacked zone. |

## Routing

| ID         | Label     | W × D × H        | Notes |
| ---------- | --------- | ---------------- | ----- |
| `patchbay` | Patch Bay | 43.8 × 5.2 × 4.6 | Always use `type: "routing"` with `mount: "spine-right"` (vertical on right wall, angled outward) or `mount: "mid-shelf"` (lying flat on a middle shelf, near the front so you can see it from your chair). The patchbay has a `front-row` (top face) and a `rear-row` (back face). |
| `polytune` | PolyTune  | 6.4 × 12.4 × 3.2 | Small tuner. Mounts naturally on a spine alongside the patchbay, or sits on a pedal deck. |

## Pedals

| ID                  | Label             | W × D × H        | Use as |
| ------------------- | ----------------- | ---------------- | ------ |
| `boss-compact`      | Boss Compact      | 7.3 × 12.9 × 5.8 | Mid-size pedal — workhorse of `mode: "deck"` and `tray-separate` rows |
| `mxr-standard`      | MXR Standard      | 6.4 × 11.2 × 5.3 | Small standard |
| `ehx-nano`          | EHX Nano          | 7.0 × 11.2 × 5.5 | Small standard |
| `tc-mini`           | TC Mini           | 5.0 × 9.3 × 5.1  | Mini |
| `strymon-standard`  | Strymon Standard  | 10.4 × 12.7 × 5.7 | Wide pedal — anchor of a hero-left layout |

If the user has a generic pedal collection (e.g., "I have a few delays, a reverb, a tuner") and doesn't name specific models, use the procedural pedal-fill mechanism: provide a `pedals` sub-object on the zone but **omit `devices`**. The engine populates the deck with a representative mix automatically.

## Adding a new device

1. Add it to `app/app/data/devices.json` with `label`, `w`, `d`, `h`, `category`, `power`, and `ports`.
2. The engine picks it up automatically — there's no enum to update.
3. Re-run validation; the new ID is now usable in `zones[].devices`.

## Port IDs (used in `connectivity`)

The full port list per device is in `devices.json`. Most-used:

- BeatStep Pro: `midi-out`, `midi-in`, `cv-1`..`cv-8`, `usb`
- TR-8S: `midi-in`, `midi-out`, `midi-thru`, `mix-out-l`, `mix-out-r`, `assign-out`
- MS-20 Mini: `audio-out`, `phones`, `midi-in`, `cv-in-total`
- Behringer M: `audio-out`, `midi-in`, `cv-in`, `gate-in`
- Ditto X4: `in-l`, `in-r`, `out-l`, `out-r`, `midi-in`
- Patchbay: `front-row` (top), `rear-row` (back) — both have multiple slots; the engine treats them as a single point but visually they're rows
- Pedals (all): `in`, `out`
