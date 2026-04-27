import synthCabinet from '~/data/prototypes/synth-cabinet.json'
import synthAllinone from '~/data/prototypes/synth-allinone.json'

export interface Prototype {
  id: string
  label: string
  description: string
  to: string
}

const configs = [synthCabinet, synthAllinone]

const prototypes: Prototype[] = [
  {
    id: 'block',
    label: '01 — Block',
    description: 'A single 10 × 10 × 10 cm block.',
    to: '/prototypes/block'
  },
  ...configs.map(c => ({
    id: c.id,
    label: c.label,
    description: c.description,
    to: `/prototypes/${c.id}`
  }))
]

export const usePrototypes = () => prototypes
