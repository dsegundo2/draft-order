import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildStandings, fetchStandings, SCOREBOARD_URL, splitFinalFourStandings } from './espn'
import type { EspnEvent } from './worldCupPlacements'

const match = (home: string, homeScore: string, away: string, awayScore: string, options: { completed?: boolean; winner?: string; round?: string; date?: string } = {}): EspnEvent => ({
  date: options.date,
  season: { slug: options.round ?? 'group-stage' },
  status: { type: { completed: options.completed ?? true, state: (options.completed ?? true) ? 'post' : 'pre' } },
  competitions: [{ competitors: [
    { winner: options.winner === home, score: homeScore, team: { displayName: home } },
    { winner: options.winner === away, score: awayScore, team: { displayName: away } },
  ] }],
})

describe('buildStandings', () => {
  it('ignores group play and scheduled knockout matches', () => {
    const result = buildStandings([
      match('Brazil', '2', 'Germany', '1', { winner: 'Brazil' }),
      match('Brazil', '1', 'France', '1'),
      match('Brazil', '9', 'Spain', '0', { completed: false, winner: 'Brazil', round: 'round-of-32' }),
    ])
    expect(result.find((entry) => entry.team === 'Brazil')).toMatchObject({ points: 0, wins: 0, goalsFor: 0, goalsAgainst: 0, progress: [] })
  })

  it('uses ESPN season.slug for a Round of 32 loss and handles a penalty tie', () => {
    const result = buildStandings([match('Germany', '1', 'Paraguay', '1', { winner: 'Paraguay', round: 'round-of-32' })])
    expect(result.find((entry) => entry.team === 'Germany')).toMatchObject({ points: 0.5, eliminated: true, progress: [{ round: 'Round of 32', opponent: 'Paraguay', result: 'L 1–1', complete: true }] })
  })

  it('marks managed teams absent from a complete Round of 32 schedule eliminated', () => {
    const schedule = Array.from({ length: 16 }, (_, index) => match(index ? `Team ${index}` : 'Brazil', '0', `Opponent ${index}`, '0', { completed: false, round: 'round-of-32' }))
    const result = buildStandings(schedule)
    expect(result.find((entry) => entry.team === 'Brazil')?.eliminated).toBe(false)
    expect(result.find((entry) => entry.team === 'Germany')?.eliminated).toBe(true)
  })

  it('sorts tied teams by population and ignores unknown teams', () => {
    const result = buildStandings([match('Unknown FC', '8', 'Also Unknown', '0', { winner: 'Unknown FC' })])
    expect(result).toHaveLength(12)
    expect(result.every((entry) => entry.points === 0)).toBe(true)
    expect(result.slice(0, 2).map((entry) => entry.team)).toEqual(['Brazil', 'Mexico'])
  })

  it('awards three points per win plus half a point per goal', () => {
    const result = buildStandings([
      match('Brazil', '2', 'Scotland', '1', { winner: 'Brazil', round: 'round-of-32' }),
      match('Netherlands', '1', 'Morocco', '1', { winner: 'Morocco', round: 'round-of-32' }),
    ])
    expect(result.find((entry) => entry.team === 'Brazil')?.points).toBe(4)
    expect(result.find((entry) => entry.team === 'Netherlands')?.points).toBe(0.5)
  })

  it('breaks equal-point ties by goals for, then population, not goal difference', () => {
    const goalsResult = buildStandings([
      match('Brazil', '0', 'Scotland', '0', { winner: 'Brazil', round: 'round-of-32' }),
      match('Netherlands', '6', 'Morocco', '7', { winner: 'Morocco', round: 'round-of-32' }),
    ])
    expect(goalsResult.slice(0, 2).map((entry) => entry.team)).toEqual(['Netherlands', 'Brazil'])

    const alphabeticalResult = buildStandings([
      match('Brazil', '2', 'Scotland', '0', { winner: 'Brazil', round: 'round-of-32' }),
      match('Argentina', '2', 'Jordan', '1', { winner: 'Argentina', round: 'round-of-32' }),
    ])
    expect(alphabeticalResult.slice(0, 2).map((entry) => entry.team)).toEqual(['Brazil', 'Argentina'])
  })

  it('uses population as the final tiebreaker, with the larger country first', () => {
    const result = buildStandings([])
    expect(result.find((entry) => entry.team === 'Japan')?.population).toBe(123_975_371)
    expect(result.indexOf(result.find((entry) => entry.team === 'Japan')!)).toBeLessThan(result.indexOf(result.find((entry) => entry.team === 'Germany')!))
  })

  it("exposes today's opponent and kickoff without treating a selected row as state", () => {
    const result = buildStandings([
      match('Argentina', '0', 'Germany', '0', { completed: false, date: '2026-06-30T19:00:00Z', round: 'round-of-32' }),
      match('Brazil', '0', 'France', '0', { completed: false, date: '2026-07-01T19:00:00Z', round: 'round-of-32' }),
    ], new Date('2026-06-30T12:00:00Z'))
    expect(result.find((entry) => entry.team === 'Argentina')?.gameToday).toEqual({ opponent: 'Germany', kickoff: '2026-06-30T19:00:00Z', state: 'scheduled' })
    expect(result.find((entry) => entry.team === 'Germany')?.gameToday?.opponent).toBe('Argentina')
    expect(result.find((entry) => entry.team === 'Brazil')?.gameToday).toBeUndefined()
  })

  it('uses the Pacific calendar day and selects the earliest scheduled future game', () => {
    const result = buildStandings([
      match('Brazil', '0', 'France', '0', { completed: false, date: '2026-07-01T06:30:00Z', round: 'round-of-32' }),
      match('Brazil', '0', 'Spain', '0', { completed: false, date: '2026-07-03T19:00:00Z', round: 'round-of-16' }),
    ], new Date('2026-06-30T18:00:00Z'))
    expect(result.find((entry) => entry.team === 'Brazil')).toMatchObject({
      gameToday: { opponent: 'France', state: 'scheduled' },
      nextGame: { opponent: 'France', kickoff: '2026-07-01T06:30:00Z' },
    })
  })

  it('only exposes complete scores for live or final games', () => {
    const live = match('Brazil', '2', 'France', '1', { completed: false, date: '2026-06-30T19:00:00Z', round: 'round-of-32' })
    live.status!.type!.state = 'in'
    const missing = match('Germany', '', 'Spain', '1', { completed: false, date: '2026-06-30T21:00:00Z', round: 'round-of-32' })
    missing.status!.type!.state = 'in'
    const result = buildStandings([live, missing], new Date('2026-06-30T18:00:00Z'))
    expect(result.find((entry) => entry.team === 'Brazil')?.gameToday).toMatchObject({ state: 'live', score: { team: 2, opponent: 1 } })
    expect(result.find((entry) => entry.team === 'Brazil')).toMatchObject({ points: 1, goalsFor: 2, goalsAgainst: 1, wins: 0 })
    expect(result.find((entry) => entry.team === 'Germany')?.gameToday?.score).toBeUndefined()
    expect(result.find((entry) => entry.team === 'Germany')).toMatchObject({ points: 0, goalsFor: 0, goalsAgainst: 0 })
  })



  it('keeps points-and-wins order before all semifinalists are known', () => {
    const result = buildStandings([
      match('Mexico', '8', 'Poland', '0', { winner: 'Mexico', round: 'round-of-32' }),
      match('Brazil', '1', 'Germany', '0', { completed: false, round: 'semifinals' }),
    ])
    const sections = splitFinalFourStandings(result)
    expect(sections.finalFour).toHaveLength(0)
    expect(sections.remainingLeaderboard.slice(0, 2).map((entry) => entry.team)).toEqual(['Mexico', 'Brazil'])
  })

  it('derives complete final-four placements from final and third-place outcomes and removes duplicates from remaining standings', () => {
    const result = buildStandings([
      match('Mexico', '10', 'Poland', '0', { winner: 'Mexico', round: 'round-of-32' }),
      match('Brazil', '1', 'Germany', '0', { winner: 'Brazil', round: 'semifinals' }),
      match('Argentina', '1', 'France', '0', { winner: 'Argentina', round: 'semifinals' }),
      match('Brazil', '1', 'Argentina', '0', { winner: 'Brazil', round: 'final' }),
      match('Germany', '3', 'France', '2', { winner: 'Germany', round: '3rd-place-match' }),
    ])
    const sections = splitFinalFourStandings(result)
    expect(sections.finalFour.map((entry) => [entry.team, entry.finalFourPlacement?.position, entry.finalFourPlacement?.label])).toEqual([
      ['Brazil', 1, 'World Cup champion'],
      ['Argentina', 2, 'World Cup runner-up'],
      ['Germany', 3, 'Third-place winner'],
      ['France', 4, 'Fourth place'],
    ])
    expect(sections.finalFour[0].points).toBeLessThan(result.find((entry) => entry.team === 'Mexico')!.points)
    expect(sections.remainingLeaderboard.map((entry) => entry.team)).not.toEqual(expect.arrayContaining(['Brazil', 'Argentina', 'Germany', 'France']))
    expect(sections.remainingLeaderboard[0].team).toBe('Mexico')
  })

  it('handles the final completing before the third-place match', () => {
    const thirdPlace = match('Germany', '0', 'France', '0', { completed: false, round: '3rd-place-match' })
    thirdPlace.status!.type!.state = 'pre'
    const sections = splitFinalFourStandings(buildStandings([
      match('Brazil', '1', 'Germany', '0', { winner: 'Brazil', round: 'semifinals' }),
      match('Argentina', '1', 'France', '0', { winner: 'Argentina', round: 'semifinals' }),
      match('Brazil', '2', 'Argentina', '1', { winner: 'Brazil', round: 'final' }),
      thirdPlace,
    ]))
    expect(sections.finalFour.map((entry) => [entry.team, entry.finalFourPlacement?.position, entry.finalFourPlacement?.label])).toEqual([
      ['Brazil', 1, 'World Cup champion'],
      ['Argentina', 2, 'World Cup runner-up'],
      ['Germany', undefined, 'Tied for 3rd'],
      ['France', undefined, 'Tied for 3rd'],
    ])
  })

  it('handles the third-place match completing before the final', () => {
    const final = match('Brazil', '0', 'Argentina', '0', { completed: false, round: 'final' })
    final.status!.type!.state = 'pre'
    const sections = splitFinalFourStandings(buildStandings([
      match('Brazil', '1', 'Germany', '0', { winner: 'Brazil', round: 'semifinals' }),
      match('Argentina', '1', 'France', '0', { winner: 'Argentina', round: 'semifinals' }),
      final,
      match('Germany', '1', 'France', '0', { winner: 'Germany', round: '3rd-place-match' }),
    ]))
    expect(sections.finalFour.map((entry) => [entry.team, entry.finalFourPlacement?.position, entry.finalFourPlacement?.label])).toEqual([
      ['Brazil', undefined, 'Tied for 1st'],
      ['Argentina', undefined, 'Tied for 1st'],
      ['Germany', 3, 'Third-place winner'],
      ['France', 4, 'Fourth place'],
    ])
  })

  it('does not assign placements from live, postponed, canceled, or incomplete placement matches', () => {
    const liveFinal = match('Brazil', '2', 'Argentina', '1', { completed: false, winner: 'Brazil', round: 'final' })
    liveFinal.status!.type!.state = 'in'
    const canceledThird = match('Germany', '1', 'France', '0', { completed: false, winner: 'Germany', round: '3rd-place-match' })
    canceledThird.status!.type!.name = 'STATUS_CANCELED'
    canceledThird.status!.type!.description = 'Canceled'
    const sections = splitFinalFourStandings(buildStandings([
      match('Brazil', '1', 'Germany', '0', { winner: 'Brazil', round: 'semifinals' }),
      match('Argentina', '1', 'France', '0', { winner: 'Argentina', round: 'semifinals' }),
      liveFinal,
      canceledThird,
    ]))
    expect(sections.finalFour.map((entry) => entry.finalFourPlacement?.position)).toEqual([undefined, undefined, undefined, undefined])
  })

  it('normalizes provider naming variations and is deterministic after corrected results are reprocessed', () => {
    const semiA = match('Brazil', '1', 'Germany', '0', { winner: 'Brazil', round: 'group-stage' })
    semiA.season!.slug = 'Semi Final'
    const semiB = match('Argentina', '1', 'France', '0', { winner: 'Argentina', round: 'group-stage' })
    semiB.name = 'Semi-final'
    const final = match('Argentina', '2', 'Brazil', '1', { winner: 'Argentina', round: 'group-stage' })
    final.name = 'Final'
    const third = match('Germany', '1', 'France', '0', { winner: 'Germany', round: 'group-stage' })
    third.competitions![0].notes = [{ headline: 'Bronze Medal Match' }]
    const first = splitFinalFourStandings(buildStandings([semiA, semiB, final, third])).finalFour.map((entry) => `${entry.finalFourPlacement?.position}:${entry.team}`)
    const second = splitFinalFourStandings(buildStandings([semiB, third, semiA, final])).finalFour.map((entry) => `${entry.finalFourPlacement?.position}:${entry.team}`)
    expect(first).toEqual(['1:Argentina', '2:Brazil', '3:Germany', '4:France'])
    expect(second).toEqual(first)
  })

  it('does not score or eliminate from a malformed completed event', () => {
    const malformed = match('Brazil', '', 'France', '1', { completed: true, winner: 'France', round: 'round-of-32' })
    const noWinner = match('Germany', '1', 'Spain', '0', { completed: true, round: 'round-of-32' })
    const result = buildStandings([malformed, noWinner])
    expect(result.find((entry) => entry.team === 'Brazil')).toMatchObject({ points: 0, eliminated: false })
    expect(result.find((entry) => entry.team === 'Germany')).toMatchObject({ points: 0, eliminated: false })
  })
})

describe('fetchStandings', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('requests the working ESPN URL and maps events', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ events: [match('Brazil', '2', 'Germany', '1', { winner: 'Brazil', round: 'round-of-32' })] }) })
    vi.stubGlobal('fetch', fetchMock)
    await expect(fetchStandings()).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ team: 'Brazil', points: 4 })]))
    expect(fetchMock).toHaveBeenCalledWith(SCOREBOARD_URL, { signal: undefined })
    expect(SCOREBOARD_URL).toContain('dates=20260628-20260719')
  })

  it('rejects non-OK and empty ESPN responses instead of supplying fallback scores', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: false, status: 503 }))
    await expect(fetchStandings()).rejects.toThrow('ESPN returned 503')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ events: [] }) }))
    await expect(fetchStandings()).rejects.toThrow('No World Cup events')
  })
})
