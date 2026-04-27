import synthCabinet from '~/data/prototypes/synth-cabinet.json'
import synthAllinone from '~/data/prototypes/synth-allinone.json'
import synthPlinth from '~/data/prototypes/synth-plinth.json'
import synthConsole from '~/data/prototypes/synth-console.json'
import synthTouring from '~/data/prototypes/synth-touring.json'

export interface Prototype {
  id: string
  label: string
  description: string
  to: string
}

const configs = [synthCabinet, synthAllinone, synthPlinth, synthConsole, synthTouring]

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
