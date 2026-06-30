import { describe, expect, it } from 'vitest'
import { buildStandings, SCOREBOARD_URL } from './espn'
import { teamAssignments } from './teams'

const runLive = (globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }).process?.env?.RUN_LIVE_ESPN === '1'
const live = runLive ? describe : describe.skip

live('live ESPN contract', () => {
  it('returns the knockout schedule and matches an independent knockout-only aggregation', async () => {
    const response = await fetch(SCOREBOARD_URL)
    expect(response.ok).toBe(true)
    const payload = await response.json() as { events?: Array<{ season?: { slug?: string }; status?: { type?: { completed?: boolean } }; competitions?: Array<{ competitors?: Array<{ winner?: boolean; score?: string; team?: { displayName?: string } }> }> }> }
    expect(payload.events?.length).toBeGreaterThanOrEqual(28)
    expect(payload.events?.every((event) => event.season?.slug !== 'group-stage')).toBe(true)
    const standings = buildStandings(payload.events ?? [])
    const managedNames = new Set(teamAssignments.map((team) => team.espnName))
    const independent = new Map([...managedNames].map((name) => [name, { points: 0, wins: 0, goalsFor: 0, goalsAgainst: 0 }]))

    for (const event of payload.events ?? []) {
      if (!event.status?.type?.completed || !['round-of-32', 'round-of-16', 'quarterfinals', 'semifinals', '3rd-place-match', 'final'].includes(event.season?.slug ?? '')) continue
      const competitors = event.competitions?.[0]?.competitors ?? []
      for (const competitor of competitors) {
        const name = competitor.team?.displayName
        const result = name ? independent.get(name) : undefined
        if (!result) continue
        const opponent = competitors.find((entry) => entry !== competitor)
        const goalsFor = Number.parseInt(competitor.score ?? '0', 10) || 0
        const goalsAgainst = Number.parseInt(opponent?.score ?? '0', 10) || 0
        result.goalsFor += goalsFor
        result.goalsAgainst += goalsAgainst
        result.points += goalsFor * 0.5
        if (competitor.winner) { result.wins += 1; result.points += 3 }
      }
    }

    for (const assignment of teamAssignments) {
      const actual = standings.find((entry) => entry.espnName === assignment.espnName)
      const expected = independent.get(assignment.espnName)
      expect(actual, assignment.espnName).toBeDefined()
      expect(actual).toMatchObject(expected!)
    }
  }, 30_000)
})
