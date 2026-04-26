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
  }
]

export const usePrototypes = () => prototypes
