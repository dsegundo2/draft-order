import { seededStandings } from './teams'
import type { ManagerStanding, ProgressStep } from '../types'

const SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/fifa-world-cup/scoreboard?limit=500&dates=2026'
const KNOCKOUT_ROUNDS = ['round of 16', 'quarterfinal', 'semifinal', 'final']

type EspnCompetitor = { winner?: boolean; score?: string; team?: { displayName?: string } }
type EspnEvent = {
  name?: string
  status?: { type?: { completed?: boolean } }
  competitions?: Array<{ competitors?: EspnCompetitor[]; notes?: Array<{ headline?: string }> }>
}

export function buildStandings(events: EspnEvent[]): ManagerStanding[] {
  const byTeam = new Map(seededStandings.map((entry) => [entry.espnName.toLowerCase(), { ...entry, points: 0, wins: 0, goalsFor: 0, goalsAgainst: 0, progress: [] as ProgressStep[], eliminated: false }]))

  for (const event of events) {
    if (!event.status?.type?.completed) continue
    const competition = event.competitions?.[0]
    const competitors = competition?.competitors ?? []
    if (competitors.length !== 2) continue
    const round = competition?.notes?.[0]?.headline ?? ''
    const isKnockout = KNOCKOUT_ROUNDS.some((label) => round.toLowerCase().includes(label))

    for (const current of competitors) {
      const currentName = current.team?.displayName?.toLowerCase()
      const standing = currentName ? byTeam.get(currentName) : undefined
      if (!standing) continue
      const opponent = competitors.find((competitor) => competitor !== current)
      const goalsFor = Number.parseInt(current.score ?? '0', 10) || 0
      const goalsAgainst = Number.parseInt(opponent?.score ?? '0', 10) || 0
      standing.goalsFor += goalsFor
      standing.goalsAgainst += goalsAgainst
      if (current.winner) {
        standing.wins += 1
        standing.points += 3
      } else if (goalsFor === goalsAgainst) {
        standing.points += 1
      } else if (isKnockout) {
        standing.eliminated = true
      }
      if (isKnockout) {
        standing.progress.push({
          round: round || 'Knockout round',
          opponent: opponent?.team?.displayName ?? 'TBD',
          result: `${current.winner ? 'W' : 'L'} ${goalsFor}–${goalsAgainst}`,
          points: current.winner ? 3 : 0,
          complete: true,
        })
      }
    }
  }

  return [...byTeam.values()].sort((a, b) => b.points - a.points || b.goalsFor - a.goalsFor || a.manager.localeCompare(b.manager))
}

export async function fetchStandings(signal?: AbortSignal): Promise<ManagerStanding[]> {
  const response = await fetch(SCOREBOARD_URL, { signal })
  if (!response.ok) throw new Error(`ESPN returned ${response.status}`)
  const payload = (await response.json()) as { events?: EspnEvent[] }
  if (!payload.events?.length) throw new Error('No World Cup events are available yet')
  return buildStandings(payload.events)
}
