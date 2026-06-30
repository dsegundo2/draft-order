import { describe, expect, it } from 'vitest'
import { formatPacificTime, gameSummary } from './gameDisplay'

describe('Pacific game display', () => {
  it('formats both standard and daylight time with a concise PT suffix', () => {
    expect(formatPacificTime('2026-07-01T02:30:00Z')).toBe('7:30 PM PT')
    expect(formatPacificTime('2026-01-01T03:30:00Z')).toBe('7:30 PM PT')
    expect(formatPacificTime('invalid')).toBeNull()
  })

  it('shows reliable score states and falls back to time without a score', () => {
    expect(gameSummary({ opponent: 'France', kickoff: '2026-07-01T02:30:00Z', state: 'live', score: { team: 2, opponent: 1 } })).toBe('Live 2–1')
    expect(gameSummary({ opponent: 'France', kickoff: '2026-07-01T02:30:00Z', state: 'final' })).toBe('Final')
  })

  it('labels a Pacific-date game today and dates later games', () => {
    const game = { opponent: 'France', kickoff: '2026-07-01T02:30:00Z', state: 'scheduled' as const }
    expect(gameSummary(game, new Date('2026-06-30T18:00:00Z'))).toBe('Today · 7:30 PM PT')
    expect(gameSummary(game, new Date('2026-06-29T18:00:00Z'))).toBe('Tue, Jun 30 · 7:30 PM PT')
  })
})
