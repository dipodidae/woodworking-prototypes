# Connectivity — signal flow as visual cabling

`connectivity[]` declares which port on which device connects to which. The engine routes a Catmull-Rom curve from each declared connection through a rear cable trench and renders it as a coloured tube. Empty connectivity = no cables = the render looks like loose hardware on shelves.

**Always populate connectivity.** Even a minimal four-cable graph reads way better than empty.

## Cable types and colours

| `type`  | Colour     | Use for                         |
| ------- | ---------- | ------------------------------- |
| `midi`  | blue       | MIDI in/out/thru                |
| `audio` | red        | Line-level audio between devices and to the patchbay |
| `cv`    | green      | CV/gate from BeatStep Pro into synth CV inputs |
| `usb`   | grey       | USB to the host (rarely worth visualising) |

Power cables are computed automatically from each device's `power` definition in `devices.json` — don't author them in `connectivity`.

## Signal-flow templates

### Standard MIDI thru chain (BSP → TR-8S → MS-20 → Behringer M)

```jsonc
{ "from": "beatstep-pro/midi-out", "to": "tr-8s/midi-in",      "type": "midi" },
{ "from": "tr-8s/midi-thru",       "to": "ms20-mini/midi-in",  "type": "midi" },
{ "from": "ms20-mini/midi-in",     "to": "behringer-m/midi-in","type": "midi" }
```

### CV mod from BeatStep Pro (pitch + gate to a synth)

```jsonc
{ "from": "beatstep-pro/cv-1", "to": "ms20-mini/cv-in-total", "type": "cv" },
{ "from": "beatstep-pro/cv-2", "to": "behringer-m/cv-in",    "type": "cv" },
{ "from": "beatstep-pro/cv-3", "to": "behringer-m/gate-in",  "type": "cv" }
```

### Audio to patchbay (everything terminates at the patchbay's rear row)

```jsonc
{ "from": "ms20-mini/audio-out",  "to": "patchbay/rear-row", "type": "audio" },
{ "from": "behringer-m/audio-out","to": "patchbay/rear-row", "type": "audio" },
{ "from": "tr-8s/mix-out-l",      "to": "patchbay/rear-row", "type": "audio" },
{ "from": "tr-8s/mix-out-r",      "to": "patchbay/rear-row", "type": "audio" }
```

### Pedal chain through the patchbay's front row

The patchbay's front row is the patch point for inserting pedals into the audio path. A typical chain:

```jsonc
{ "from": "patchbay/front-row",      "to": "boss-compact/in",     "type": "audio" },
{ "from": "boss-compact/out",        "to": "mxr-standard/in",     "type": "audio" },
{ "from": "mxr-standard/out",        "to": "ehx-nano/in",         "type": "audio" },
{ "from": "ehx-nano/out",            "to": "strymon-standard/in", "type": "audio" },
{ "from": "strymon-standard/out",    "to": "polytune/in",         "type": "audio" },
{ "from": "polytune/out",            "to": "patchbay/front-row",  "type": "audio" }
```

### Looper send/return

```jsonc
{ "from": "ditto-x4/out-l", "to": "patchbay/rear-row", "type": "audio" }
```

The user's brief often spells out the signal flow ("BSP → MS-20 → patchbay → looper send/return → main out"). Translate it directly. Don't editorialize — match what they wrote.

## Visual budget

Each declared connection adds a tube to the render. 12–18 cables read well; 25+ start to clutter. Skip USB unless the user specifically wants it visualised. If the user says "minimal cabling", drop USB and any redundant audio paths.

## Port doesn't exist?

If you reference `from: "ms20-mini/some-fake-port"`, the engine silently skips that cable (no error). The validator doesn't catch this either. So the only safety net is reading `devices.json` carefully. Re-check port IDs against the catalog before claiming you're done.
