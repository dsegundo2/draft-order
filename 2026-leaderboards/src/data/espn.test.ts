import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildStandings, fetchStandings, SCOREBOARD_URL } from './espn'

const match = (home: string, homeScore: string, away: string, awayScore: string, options: { completed?: boolean; winner?: string; round?: string } = {}) => ({
  season: { slug: options.round ?? 'group-stage' },
  status: { type: { completed: options.completed ?? true } },
  competitions: [{ competitors: [
    { winner: options.winner === home, score: homeScore, team: { displayName: home } },
    { winner: options.winner === away, score: awayScore, team: { displayName: away } },
  ] }],
})

describe('buildStandings', () => {
  it('accumulates completed wins, draws, goals, and ignores scheduled matches', () => {
    const result = buildStandings([
      match('Brazil', '2', 'Germany', '1', { winner: 'Brazil' }),
      match('Brazil', '1', 'France', '1'),
      match('Brazil', '9', 'Spain', '0', { completed: false, winner: 'Brazil' }),
    ])
    expect(result.find((entry) => entry.team === 'Brazil')).toMatchObject({ points: 4, wins: 1, goalsFor: 3, goalsAgainst: 2 })
  })

  it('uses ESPN season.slug for a Round of 32 loss and handles a penalty tie', () => {
    const result = buildStandings([match('Germany', '1', 'Paraguay', '1', { winner: 'Paraguay', round: 'round-of-32' })])
    expect(result.find((entry) => entry.team === 'Germany')).toMatchObject({ points: 0, eliminated: true, progress: [{ round: 'Round of 32', opponent: 'Paraguay', result: 'L 1–1', complete: true }] })
  })

  it('marks managed teams absent from the bracket out after the group stage is complete', () => {
    const result = buildStandings([
      match('Brazil', '2', 'Germany', '0', { winner: 'Brazil' }),
      match('Brazil', '0', 'Paraguay', '0', { completed: false, round: 'round-of-32' }),
    ])
    expect(result.find((entry) => entry.team === 'Brazil')?.eliminated).toBe(false)
    expect(result.find((entry) => entry.team === 'Germany')?.eliminated).toBe(true)
  })

  it('sorts by points, goals, then manager and ignores unknown teams', () => {
    const result = buildStandings([match('Unknown FC', '8', 'Also Unknown', '0', { winner: 'Unknown FC' })])
    expect(result).toHaveLength(12)
    expect(result.every((entry) => entry.points === 0)).toBe(true)
    expect(result[0].manager.localeCompare(result[1].manager)).toBeLessThanOrEqual(0)
  })
})

describe('fetchStandings', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('requests the working ESPN URL and maps events', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ events: [match('Brazil', '2', 'Germany', '1', { winner: 'Brazil' })] }) })
    vi.stubGlobal('fetch', fetchMock)
    await expect(fetchStandings()).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ team: 'Brazil', points: 3 })]))
    expect(fetchMock).toHaveBeenCalledWith(SCOREBOARD_URL, { signal: undefined })
  })

  it('rejects non-OK and empty ESPN responses instead of supplying fallback scores', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: false, status: 503 }))
    await expect(fetchStandings()).rejects.toThrow('ESPN returned 503')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ events: [] }) }))
    await expect(fetchStandings()).rejects.toThrow('No World Cup events')
  })
})
