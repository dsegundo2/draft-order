import type { TeamAssignment } from '../types'

const worldBank2024 = { label: 'World Bank population data', url: 'https://data.worldbank.org/indicator/SP.POP.TOTL' }
const onsEngland2024 = { label: 'ONS England population estimate', url: 'https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates' }

export const teamAssignments: TeamAssignment[] = [
  // 2024 population totals. World Bank SP.POP.TOTL, except England (ONS mid-2024 estimate).
  { manager: 'Ryan H.', team: 'Brazil', espnName: 'Brazil', flag: '🇧🇷', population: 211_998_573 },
  { manager: 'Ryan L.', team: 'Germany', espnName: 'Germany', flag: '🇩🇪', population: 83_516_593 },
  { manager: 'Diego', team: 'Argentina', espnName: 'Argentina', flag: '🇦🇷', population: 45_696_159 },
  { manager: 'Troy', team: 'England', espnName: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', population: 58_620_100 },
  { manager: 'Grant', team: 'Netherlands', espnName: 'Netherlands', flag: '🇳🇱', population: 18_044_027 },
  { manager: 'Jeff', team: 'France', espnName: 'France', flag: '🇫🇷', population: 68_551_653 },
  { manager: 'Cam', team: 'Portugal', espnName: 'Portugal', flag: '🇵🇹', population: 10_694_681 },
  { manager: 'Nolan', team: 'Spain', espnName: 'Spain', flag: '🇪🇸', population: 48_848_840 },
  { manager: 'Noah', team: 'Mexico', espnName: 'Mexico', flag: '🇲🇽', population: 130_861_007 },
  { manager: 'Buck', team: 'Belgium', espnName: 'Belgium', flag: '🇧🇪', population: 11_858_610 },
  { manager: 'Will', team: 'Croatia', espnName: 'Croatia', flag: '🇭🇷', population: 3_866_200 },
  { manager: 'Ted', team: 'Japan', espnName: 'Japan', flag: '🇯🇵', population: 123_975_371 },
]

for (const assignment of teamAssignments) {
  assignment.populationYear = 2024
  assignment.populationSource = assignment.team === 'England' ? onsEngland2024 : worldBank2024
}
