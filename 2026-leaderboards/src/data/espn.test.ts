import { describe, expect, it } from 'vitest'
import { buildStandings } from './espn'

describe('buildStandings', () => {
  it('awards three points for a completed win and records goals', () => {
    const result = buildStandings([{ status: { type: { completed: true } }, competitions: [{ competitors: [
      { winner: true, score: '2', team: { displayName: 'Brazil' } },
      { winner: false, score: '1', team: { displayName: 'Germany' } },
    ] }] }])
    const brazil = result.find((entry) => entry.team === 'Brazil')
    expect(brazil).toMatchObject({ points: 3, wins: 1, goalsFor: 2, goalsAgainst: 1 })
  })

  it('marks a team eliminated after a completed knockout loss', () => {
    const result = buildStandings([{ status: { type: { completed: true } }, competitions: [{ notes: [{ headline: 'Round of 16' }], competitors: [
      { winner: false, score: '0', team: { displayName: 'Mexico' } },
      { winner: true, score: '2', team: { displayName: 'Germany' } },
    ] }] }])
    expect(result.find((entry) => entry.team === 'Mexico')?.eliminated).toBe(true)
  })
})
