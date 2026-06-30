export type ProgressStep = {
  round: string
  opponent: string
  result?: string
  points?: number
  complete: boolean
}

export type ManagerStanding = {
  manager: string
  team: string
  espnName: string
  flag: string
  points: number
  wins: number
  goalsFor: number
  goalsAgainst: number
  eliminated: boolean
  progress: ProgressStep[]
}
