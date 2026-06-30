import { teamAssignments } from './teams'
import type { ManagerStanding, ProgressStep } from '../types'

export const SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=500&dates=20260628-20260719'
const KNOCKOUT_ROUNDS = new Set(['round-of-32', 'round-of-16', 'quarterfinals', 'semifinals', '3rd-place-match', 'final'])
const ROUND_NAMES: Record<string, string> = { 'round-of-32': 'Round of 32', 'round-of-16': 'Round of 16', quarterfinals: 'Quarterfinals', semifinals: 'Semifinals', '3rd-place-match': 'Third-place match', final: 'Final' }

type EspnCompetitor = { winner?: boolean; score?: string; team?: { displayName?: string } }
type EspnEvent = {
  name?: string
  status?: { type?: { completed?: boolean } }
  competitions?: Array<{ competitors?: EspnCompetitor[]; notes?: Array<{ headline?: string }> }>
  season?: { slug?: string }
}

export function buildStandings(events: EspnEvent[]): ManagerStanding[] {
  const byTeam = new Map(teamAssignments.map((entry) => [entry.espnName.toLowerCase(), { ...entry, points: 0, wins: 0, goalsFor: 0, goalsAgainst: 0, progress: [] as ProgressStep[], eliminated: false }]))
  const knockoutTeams = new Set<string>()
  const openingRoundEvents = events.filter((event) => event.season?.slug === 'round-of-32')
  const openingRoundScheduled = openingRoundEvents.length >= 16

  for (const event of events) {
    if (!KNOCKOUT_ROUNDS.has(event.season?.slug ?? '')) continue
    for (const competitor of event.competitions?.[0]?.competitors ?? []) {
      const name = competitor.team?.displayName?.toLowerCase()
      if (name && byTeam.has(name)) knockoutTeams.add(name)
    }
  }

  for (const event of events) {
    if (!event.status?.type?.completed) continue
    const competition = event.competitions?.[0]
    const competitors = competition?.competitors ?? []
    if (competitors.length !== 2) continue
    const roundSlug = event.season?.slug ?? ''
    const isKnockout = KNOCKOUT_ROUNDS.has(roundSlug)
    if (!isKnockout) continue
    const round = ROUND_NAMES[roundSlug] ?? competition?.notes?.[0]?.headline ?? 'Knockout round'

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
      } else {
        standing.eliminated = true
      }
      standing.progress.push({
        round: round || 'Knockout round',
        opponent: opponent?.team?.displayName ?? 'TBD',
        result: `${current.winner ? 'W' : 'L'} ${goalsFor}–${goalsAgainst}`,
        points: current.winner ? 3 : 0,
        complete: true,
      })
    }
  }

  if (openingRoundScheduled) {
    for (const [name, standing] of byTeam) {
      if (!knockoutTeams.has(name)) standing.eliminated = true
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
