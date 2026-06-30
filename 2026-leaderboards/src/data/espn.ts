import { teamAssignments } from './teams'
import type { GameInfo, ManagerStanding, ProgressStep } from '../types'

export const SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=500&dates=20260628-20260719'
const KNOCKOUT_ROUNDS = new Set(['round-of-32', 'round-of-16', 'quarterfinals', 'semifinals', '3rd-place-match', 'final'])
const ROUND_NAMES: Record<string, string> = { 'round-of-32': 'Round of 32', 'round-of-16': 'Round of 16', quarterfinals: 'Quarterfinals', semifinals: 'Semifinals', '3rd-place-match': 'Third-place match', final: 'Final' }

type EspnCompetitor = { winner?: boolean; score?: string; team?: { displayName?: string } }
type EspnEvent = {
  name?: string
  date?: string
  status?: { type?: { completed?: boolean; state?: string; name?: string; description?: string } }
  competitions?: Array<{ date?: string; competitors?: EspnCompetitor[]; notes?: Array<{ headline?: string }> }>
  season?: { slug?: string }
}

const PT_DATE = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' })

export function isSamePacificDay(isoDate: string, now: Date): boolean {
  const date = new Date(isoDate)
  return !Number.isNaN(date.getTime()) && PT_DATE.format(date) === PT_DATE.format(now)
}

function gameState(event: EspnEvent): GameInfo['state'] {
  const type = event.status?.type
  const words = `${type?.name ?? ''} ${type?.description ?? ''}`.toLowerCase()
  if (words.includes('postpon')) return 'postponed'
  if (words.includes('cancel')) return 'canceled'
  if (type?.completed || type?.state === 'post') return 'final'
  if (type?.state === 'in') return 'live'
  if (type?.state === 'pre') return 'scheduled'
  return 'unknown'
}

function parsedScore(value?: string): number | undefined {
  if (value == null || !/^\d+$/.test(value.trim())) return undefined
  return Number.parseInt(value, 10)
}

export function buildStandings(events: EspnEvent[], now = new Date()): ManagerStanding[] {
  const byTeam = new Map<string, ManagerStanding>(teamAssignments.map((entry) => [entry.espnName.toLowerCase(), { ...entry, points: 0, wins: 0, goalsFor: 0, goalsAgainst: 0, progress: [] as ProgressStep[], eliminated: false }]))
  const knockoutTeams = new Set<string>()
  const openingRoundFixtures = new Set(events.flatMap((event) => {
    if (event.season?.slug !== 'round-of-32') return []
    const names = event.competitions?.[0]?.competitors?.map((entry) => entry.team?.displayName?.trim().toLowerCase()).filter((name): name is string => Boolean(name)) ?? []
    return names.length === 2 ? [names.sort().join('|')] : []
  }))
  const openingRoundScheduled = openingRoundFixtures.size >= 16

  for (const event of events) {
    const competition = event.competitions?.[0]
    const kickoff = competition?.date ?? event.date
    const competitors = competition?.competitors ?? []
    if (!kickoff || competitors.length !== 2) continue
    const kickoffDate = new Date(kickoff)
    if (Number.isNaN(kickoffDate.getTime())) continue
    const state = gameState(event)

    for (const current of competitors) {
      const currentName = current.team?.displayName?.toLowerCase()
      const standing = currentName ? byTeam.get(currentName) : undefined
      const opponent = competitors.find((competitor) => competitor !== current)
      if (!standing || !opponent?.team?.displayName) continue
      const teamScore = parsedScore(current.score)
      const opponentScore = parsedScore(opponent.score)
      const game: GameInfo = {
        opponent: opponent.team.displayName,
        kickoff,
        state,
        ...(teamScore !== undefined && opponentScore !== undefined && (state === 'live' || state === 'final')
          ? { score: { team: teamScore, opponent: opponentScore } }
          : {}),
      }
      if (isSamePacificDay(kickoff, now)) standing.gameToday = game
      if (kickoffDate > now && state === 'scheduled') {
        const existing = standing.nextGame ? new Date(standing.nextGame.kickoff) : null
        if (!existing || kickoffDate < existing) standing.nextGame = game
      }
    }
  }

  for (const event of events) {
    if (!KNOCKOUT_ROUNDS.has(event.season?.slug ?? '')) continue
    for (const competitor of event.competitions?.[0]?.competitors ?? []) {
      const name = competitor.team?.displayName?.toLowerCase()
      if (name && byTeam.has(name)) knockoutTeams.add(name)
    }
  }

  // Count reliable live knockout goals immediately. Win points and elimination
  // still wait for ESPN to mark the match final.
  for (const event of events) {
    if (gameState(event) !== 'live' || !KNOCKOUT_ROUNDS.has(event.season?.slug ?? '')) continue
    const competitors = event.competitions?.[0]?.competitors ?? []
    if (competitors.length !== 2) continue
    for (const current of competitors) {
      const currentName = current.team?.displayName?.toLowerCase()
      const standing = currentName ? byTeam.get(currentName) : undefined
      const opponent = competitors.find((competitor) => competitor !== current)
      const goalsFor = parsedScore(current.score)
      const goalsAgainst = parsedScore(opponent?.score)
      if (!standing || goalsFor === undefined || goalsAgainst === undefined) continue
      standing.goalsFor += goalsFor
      standing.goalsAgainst += goalsAgainst
      standing.points += goalsFor * 0.5
    }
  }

  for (const event of events) {
    if (gameState(event) !== 'final') continue
    const competition = event.competitions?.[0]
    const competitors = competition?.competitors ?? []
    if (competitors.length !== 2) continue
    if (competitors.filter((competitor) => competitor.winner === true).length !== 1) continue
    const roundSlug = event.season?.slug ?? ''
    const isKnockout = KNOCKOUT_ROUNDS.has(roundSlug)
    if (!isKnockout) continue
    const round = ROUND_NAMES[roundSlug] ?? competition?.notes?.[0]?.headline ?? 'Knockout round'

    for (const current of competitors) {
      const currentName = current.team?.displayName?.toLowerCase()
      const standing = currentName ? byTeam.get(currentName) : undefined
      if (!standing) continue
      const opponent = competitors.find((competitor) => competitor !== current)
      const goalsFor = parsedScore(current.score)
      const goalsAgainst = parsedScore(opponent?.score)
      if (goalsFor === undefined || goalsAgainst === undefined) continue
      standing.goalsFor += goalsFor
      standing.goalsAgainst += goalsAgainst
      standing.points += goalsFor * 0.5
      if (current.winner) {
        standing.wins += 1
        standing.points += 3
      } else {
        standing.eliminated = true
      }
      standing.progress.push({
        round: round || 'Knockout round',
        opponent: opponent?.team?.displayName ?? 'TBD',
        outcome: current.winner ? 'win' : 'loss',
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

  return [...byTeam.values()].sort((a, b) => b.points - a.points || b.goalsFor - a.goalsFor || (b.population ?? -1) - (a.population ?? -1) || a.manager.localeCompare(b.manager))
}

export async function fetchStandings(signal?: AbortSignal): Promise<ManagerStanding[]> {
  const response = await fetch(SCOREBOARD_URL, { signal })
  if (!response.ok) throw new Error(`ESPN returned ${response.status}`)
  const payload = (await response.json()) as { events?: EspnEvent[] }
  if (!payload.events?.length) throw new Error('No World Cup events are available yet')
  return buildStandings(payload.events)
}
