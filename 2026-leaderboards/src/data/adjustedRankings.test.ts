import { describe, expect, it } from 'vitest'
import { ADJUSTED_RANKINGS_SOURCE, adjustedRankings, adjustedRankingForPick } from './adjustedRankings'

describe('adjusted rankings', () => {
  it('uses Hayden Winks\' Yahoo half-PPR list as its current source', () => {
    expect(ADJUSTED_RANKINGS_SOURCE.url).toContain('sports.yahoo.com')
    expect(ADJUSTED_RANKINGS_SOURCE.label).toContain('Hayden Winks')
    expect(adjustedRankings).toHaveLength(12)
    expect(adjustedRankingForPick(1)?.player).toBe('Jahmyr Gibbs')
    expect(adjustedRankingForPick(12)?.player).toBe('Kenneth Walker III')
  })
})
