export type ProgressStep = {
  round: string
  opponent: string
  outcome: 'win' | 'loss'
  result?: string
  points?: number
  complete: boolean
}

export type ManagerStanding = {
  manager: string
  team: string
  espnName: string
  flag: string
  population?: number
  populationYear?: number
  populationSource?: { label: string; url: string }
  points: number
  wins: number
  goalsFor: number
  goalsAgainst: number
  eliminated: boolean
  gameToday?: GameInfo
  nextGame?: GameInfo
  progress: ProgressStep[]
}

export type GameInfo = {
    opponent: string
    kickoff: string
    state: 'scheduled' | 'live' | 'final' | 'postponed' | 'canceled' | 'unknown'
    score?: { team: number; opponent: number }
}

export type TeamAssignment = Pick<ManagerStanding, 'manager' | 'team' | 'espnName' | 'flag' | 'population'>
  & Pick<ManagerStanding, 'populationYear' | 'populationSource'>
