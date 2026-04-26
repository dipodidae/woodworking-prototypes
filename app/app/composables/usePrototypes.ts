export interface Prototype {
  id: string
  label: string
  description: string
  to: string
}

const prototypes: Prototype[] = [
  {
    id: 'block',
    label: '01 — Block',
    description: 'A single 10 × 10 × 10 cm block.',
    to: '/prototypes/block'
  },
  {
    id: 'synth-cabinet',
    label: '02 — Synth cabinet',
    description: 'Wooden cabinet for MS20 Mini, TR8S, Beatstep Pro, Behringer M, patch bay, Ditto X4 and PolyTune.',
    to: '/prototypes/synth-cabinet'
  },
  {
    id: 'synth-allinone',
    label: '03 — All-in-one cabinet',
    description: '100 × 55 × 70 cm 4-tier cabinet with built-in pedal bay and right-wall patch spine.',
    to: '/prototypes/synth-allinone'
  }
]

export const usePrototypes = () => prototypes
