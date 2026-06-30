import type { GameInfo } from '../types'

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit',
})
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Los_Angeles', weekday: 'short', month: 'short', day: 'numeric',
})
const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
})

export function formatPacificTime(kickoff: string): string | null {
  const date = new Date(kickoff)
  return Number.isNaN(date.getTime()) ? null : `${timeFormatter.format(date)} PT`
}

export function gameSummary(game: GameInfo, now = new Date()): string {
  if (game.state === 'live' || game.state === 'final') {
    const label = game.state === 'live' ? 'Live' : 'Final'
    return game.score ? `${label} ${game.score.team}–${game.score.opponent}` : label
  }
  const kickoff = new Date(game.kickoff)
  const time = formatPacificTime(game.kickoff)
  if (Number.isNaN(kickoff.getTime()) || !time) return ''
  const day = dayFormatter.format(kickoff) === dayFormatter.format(now) ? 'Today' : dateFormatter.format(kickoff)
  return `${day} · ${time}`
}
