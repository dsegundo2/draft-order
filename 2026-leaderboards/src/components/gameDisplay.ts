import type { GameInfo } from '../types'

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit',
})

export function formatPacificTime(kickoff: string): string | null {
  const date = new Date(kickoff)
  return Number.isNaN(date.getTime()) ? null : `${timeFormatter.format(date)} PT`
}

export function gameSummary(game: GameInfo): string {
  if (game.state === 'live' || game.state === 'final') {
    const label = game.state === 'live' ? 'Live' : 'Final'
    return game.score ? `${label} ${game.score.team}–${game.score.opponent}` : label
  }
  return formatPacificTime(game.kickoff) ?? ''
}
