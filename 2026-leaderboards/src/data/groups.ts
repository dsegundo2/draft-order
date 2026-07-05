import registry from './groups.json'
import type { TeamAssignment } from '../types'

const worldBank2024 = { label: 'World Bank population data', url: 'https://data.worldbank.org/indicator/SP.POP.TOTL' }
const onsEngland2024 = { label: 'ONS England population estimate', url: 'https://www.ons.gov.uk/peoplepopulationandcommunity/populationestimates' }

type GroupEntry = {
  name: string
  title: string
  headerImage: string
  players: Array<Omit<TeamAssignment, 'populationYear' | 'populationSource'>>
}

export type Group = Omit<GroupEntry, 'players'> & { id: string; players: TeamAssignment[] }

const groups = registry.groups as Record<string, GroupEntry>

export function resolveGroup(pathname = typeof window === 'undefined' ? '/' : window.location.pathname): Group {
  const requested = pathname.split('/').filter(Boolean).at(-1)?.toLowerCase()
  const id = requested && groups[requested] ? requested : registry.defaultGroup
  const entry = groups[id]
  return {
    id,
    ...entry,
    players: entry.players.map((player) => ({
      ...player,
      populationYear: 2024,
      populationSource: player.team === 'England' ? onsEngland2024 : worldBank2024,
    })),
  }
}
