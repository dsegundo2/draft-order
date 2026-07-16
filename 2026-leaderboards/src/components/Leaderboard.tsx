import type { ManagerStanding } from '../types'
import { splitFinalFourStandings } from '../data/espn'
import { gameSummary } from './gameDisplay'

type Props = {
  standings: ManagerStanding[]
  onSelect: (standing: ManagerStanding) => void
}

type RowProps = {
  standing: ManagerStanding
  rankLabel: string | number
  onSelect: (standing: ManagerStanding) => void
}

const placementIcon: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉', 4: '4' }
const placementClass: Record<number, string> = { 1: 'gold', 2: 'silver', 3: 'bronze', 4: 'fourth' }

function StandingRow({ standing, rankLabel, onSelect }: RowProps) {
  const rowClass = [
    standing.eliminated ? 'is-eliminated' : '',
    standing.gameToday && ['scheduled', 'live'].includes(standing.gameToday.state) ? 'has-game-today' : '',
    standing.gameToday || standing.nextGame && !standing.eliminated ? 'has-match' : '',
  ].filter(Boolean).join(' ')
  return (
    <li className={rowClass}>
      <button
        type="button"
        className="row"
        onClick={() => onSelect(standing)}
        aria-label={`View ${standing.manager}, ${standing.team}, ${standing.points} points`}
      >
        <span className="rank">{rankLabel}</span>
        <span className="player">
          <b>{standing.manager}</b>
          <small>
          <span className="flag" role="img" aria-label={`${standing.team} flag`}>{standing.flag}</span>
          <span className="team-name">{standing.team}</span>
          </small>
        </span>
        {standing.gameToday ? <span className="opponent today-match">vs {standing.gameToday.opponent}</span>
          : standing.nextGame && !standing.eliminated ? <span className="opponent next-match">vs {standing.nextGame.opponent}</span> : <span className="opponent" />}
        {standing.gameToday ? <time className="when today-match">{gameSummary(standing.gameToday)}</time>
          : standing.nextGame && !standing.eliminated ? <time className="when next-match">{gameSummary(standing.nextGame)}</time> : <span className="when" />}
        <strong className="points">{standing.points}</strong>
        <span className="wins">{standing.wins}</span>
        <span className="goals">{standing.goalsFor}</span>
      </button>
    </li>
  )
}


function finalFourMatchSummary(standing: ManagerStanding): { opponent: string; when: string; live: boolean } | undefined {
  const game = standing.gameToday ?? standing.nextGame
  if (game) return { opponent: `vs ${game.opponent}`, when: gameSummary(game), live: game.state === 'live' || game.state === 'final' }

  const placement = standing.finalFourPlacement
  const decidingRound = placement?.source === 'final' ? 'Final' : placement?.source === 'third-place' ? 'Third-place match' : undefined
  const completedStep = decidingRound ? standing.progress.find((step) => step.complete && step.round === decidingRound) : undefined
  if (completedStep) return { opponent: `vs ${completedStep.opponent}`, when: `${completedStep.round} ${completedStep.result ?? ''}`.trim(), live: true }

  const latestStep = [...standing.progress].reverse().find((step) => step.complete)
  if (latestStep) return { opponent: `vs ${latestStep.opponent}`, when: latestStep.round, live: false }
  return undefined
}

function FinalFourCard({ standing, onSelect }: { standing: ManagerStanding; onSelect: (standing: ManagerStanding) => void }) {
  const placement = standing.finalFourPlacement!
  const position = placement.position
  const marker = position ? placementIcon[position] : placement.source === 'final' ? 'T-1' : placement.source === 'third-place' ? 'T-3' : 'TBD'
  const placementClassName = position ? `placement-${placementClass[position]}` : 'placement-pending'
  const match = finalFourMatchSummary(standing)

  return (
    <li className={`final-four-item ${placementClassName}`}>
      <button
        type="button"
        className="final-four-card"
        onClick={() => onSelect(standing)}
        aria-label={`View ${standing.manager}, ${standing.team}, ${placement.label}, ${standing.points} points`}
      >
        <span className="placement-marker" aria-label={position ? `${placement.label}, place ${position}` : placement.label}>{marker}</span>
        <span className="final-four-identity">
          <span className="final-four-manager">{standing.manager}</span>
          <span className="final-four-team"><span className="flag" role="img" aria-label={`${standing.team} flag`}>{standing.flag}</span>{standing.team}</span>
        </span>
        <span className="placement-pill">{placement.label}</span>
        <span className="final-four-match">
          {match ? <><span>{match.opponent}</span><time className={match.live ? 'today-match' : ''}>{match.when}</time></> : <><span>Match TBD</span><time>Placement pending</time></>}
        </span>
      </button>
    </li>
  )
}

export function Leaderboard({ standings, onSelect }: Props) {
  const { finalFour, remainingLeaderboard } = splitFinalFourStandings(standings)
  const hasFinalFour = finalFour.length > 0

  return (
    <section className="leaderboard" aria-label="Manager standings">
      {hasFinalFour ? (
        <section className="final-four-section" aria-label="Final Four official placements">
          <div className="section-title">
            <div>
              <h2>Final Four</h2>
              <p>Official World Cup finish overrides fantasy points for these places.</p>
            </div>
          </div>
          <ol className="final-four-list">
            {finalFour.map((standing) => (
              <FinalFourCard key={standing.manager} standing={standing} onSelect={onSelect} />
            ))}
          </ol>
          <div className="section-divider" role="separator"><span>Remaining standings</span></div>
        </section>
      ) : null}
      <div className="table-head" aria-hidden="true">
        <span className="rank">#</span><span className="player">Player</span><span className="opponent">Opponent</span><span className="when">When</span><span className="points">Pts</span><span className="wins">W</span><span className="goals" title="Goals for">G</span>
      </div>
      <ol className="table-body">
        {remainingLeaderboard.map((standing, index) => (
          <StandingRow key={standing.manager} standing={standing} rankLabel={hasFinalFour ? index + finalFour.length + 1 : index + 1} onSelect={onSelect} />
        ))}
      </ol>
      <div className="legend" aria-label="Status legend">
        <span><i className="status-dot active" />Game today</span>
        <span><i className="status-dot eliminated" />Eliminated</span>
        {hasFinalFour ? <span><i className="status-dot final-four" />Final Four official placement</span> : null}
      </div>
    </section>
  )
}
