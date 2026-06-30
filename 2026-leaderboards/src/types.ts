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
  population: number
  points: number
  wins: number
  goalsFor: number
  goalsAgainst: number
  eliminated: boolean
  gameToday?: {
    opponent: string
    kickoff: string
    completed: boolean
  }
  progress: ProgressStep[]
}

export type TeamAssignment = Pick<ManagerStanding, 'manager' | 'team' | 'espnName' | 'flag' | 'population'>
