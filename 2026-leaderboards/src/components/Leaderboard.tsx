import type { ManagerStanding } from '../types'
import { splitFinalFourStandings } from '../data/espn'
import { gameSummary } from './gameDisplay'
import { ADJUSTED_RANKINGS_SOURCE, NFL_TEAM_LOGO_SOURCE, adjustedRankingForPick } from '../data/adjustedRankings'
import type { AdjustedRanking } from '../data/adjustedRankings'

type Props = {
  standings: ManagerStanding[]
  onSelect: (standing: ManagerStanding) => void
}

type RowProps = {
  standing: ManagerStanding
  rankLabel: string | number
  adjustedRanking?: AdjustedRanking
  onSelect: (standing: ManagerStanding) => void
}


function AdjustedRanking({ ranking, className = 'adjusted-ranking', label }: { ranking?: AdjustedRanking; className?: string; label?: string }) {
  if (!ranking) return <span className={className} aria-hidden="true">—</span>
  return (
    <span className={className}>
      {label ? <span className="data-label">{label}</span> : null}
      <span className="adjusted-ranking-main">
        <img className="nfl-team-logo" src={ranking.teamLogoUrl} alt={`${ranking.team} logo`} loading="lazy" />
        <b>{ranking.player}</b>
      </span>
      <small>{ranking.team} {ranking.positionRank}</small>
    </span>
  )
}

const placementIcon: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉', 4: '4' }
const placementClass: Record<number, string> = { 1: 'gold', 2: 'silver', 3: 'bronze', 4: 'fourth' }

function StandingRow({ standing, rankLabel, adjustedRanking, onSelect }: RowProps) {
  const upcoming = standing.gameToday ?? (!standing.eliminated ? standing.nextGame : undefined)
  const rowClass = [
    standing.eliminated ? 'is-eliminated' : '',
    standing.gameToday && ['scheduled', 'live'].includes(standing.gameToday.state) ? 'has-game-today' : '',
    upcoming ? 'has-match' : '',
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
        <AdjustedRanking ranking={adjustedRanking} />
        {upcoming ? <span className={standing.gameToday ? 'row-game today-match' : 'row-game next-match'}>vs {upcoming.opponent} · {gameSummary(upcoming)}</span> : null}
        <strong className="points">{standing.points}</strong>
        <span className="wins">{standing.wins}</span>
        <span className="goals">{standing.goalsFor}</span>
      </button>
    </li>
  )
}


function finalFourMatchLabel(source: NonNullable<ManagerStanding['finalFourPlacement']>['source']) {
  if (source === 'final') return 'Final game'
  if (source === 'third-place') return 'Third-place game'
  return 'Next game'
}

function finalFourMatchSummary(standing: ManagerStanding): { opponent: string; when: string; live: boolean } | undefined {
  const game = standing.gameToday ?? standing.nextGame
  if (!game) return undefined
  return { opponent: `vs ${game.opponent}`, when: gameSummary(game), live: game.state === 'live' || game.state === 'final' }
}

function FinalFourCard({ standing, adjustedRanking, onSelect }: { standing: ManagerStanding; adjustedRanking?: AdjustedRanking; onSelect: (standing: ManagerStanding) => void }) {
  const placement = standing.finalFourPlacement!
  const position = placement.position
  const marker = position ? placementIcon[position] : placement.source === 'final' ? '1' : placement.source === 'third-place' ? '3' : 'TBD'
  const placementClassName = position ? `placement-${placementClass[position]}` : placement.source === 'final' ? 'placement-gold' : placement.source === 'third-place' ? 'placement-bronze' : 'placement-pending'
  const showPlacementPill = Boolean(position) || placement.source === 'semifinal'
  const match = finalFourMatchSummary(standing)

  return (
    <li className={`final-four-item ${placementClassName}`}>
      <button
        type="button"
        className={match ? 'final-four-card has-match' : 'final-four-card'}
        onClick={() => onSelect(standing)}
        aria-label={`View ${standing.manager}, ${standing.team}, ${placement.label}, ${standing.points} points`}
      >
        <span className="placement-marker" aria-label={position ? `${placement.label}, place ${position}` : placement.label}>{marker}</span>
        <span className="final-four-identity">
          <span className="final-four-manager">{standing.manager}</span>
          <span className="final-four-team"><span className="flag" role="img" aria-label={`${standing.team} flag`}>{standing.flag}</span>{standing.team}</span>
        </span>
        {showPlacementPill ? <span className="placement-pill">{placement.label}</span> : null}
        {match ? <span className="final-four-match"><span className="data-label">{finalFourMatchLabel(placement.source)}</span><span>{match.opponent}</span><time className={match.live ? 'today-match' : ''}>{match.when}</time></span> : null}
        {adjustedRanking ? <AdjustedRanking ranking={adjustedRanking} className="final-four-adjusted-ranking" label="Adjusted ranking" /> : null}
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
            {finalFour.map((standing, index) => (
              <FinalFourCard key={standing.manager} standing={standing} adjustedRanking={adjustedRankingForPick(index + 1)} onSelect={onSelect} />
            ))}
          </ol>
          <div className="section-divider" role="separator"><span>Remaining standings</span></div>
        </section>
      ) : null}
      <div className="table-head" aria-hidden="true">
        <span className="rank">#</span><span className="player">Player</span><span className="adjusted-ranking">Adjusted Ranking</span><span className="points">Pts</span><span className="wins">W</span><span className="goals" title="Goals for">G</span>
      </div>
      <ol className="table-body">
        {remainingLeaderboard.map((standing, index) => (
          <StandingRow key={standing.manager} standing={standing} rankLabel={hasFinalFour ? index + finalFour.length + 1 : index + 1} adjustedRanking={adjustedRankingForPick(hasFinalFour ? index + finalFour.length + 1 : index + 1)} onSelect={onSelect} />
        ))}
      </ol>
      <div className="legend" aria-label="Status legend">
        <span><i className="status-dot active" />Game today</span>
        <span><i className="status-dot eliminated" />Eliminated</span>
        {hasFinalFour ? <span><i className="status-dot final-four" />Final Four official placement</span> : null}
      </div>
      <p className="ranking-source">Adjusted rankings are based on <a href={ADJUSTED_RANKINGS_SOURCE.url} target="_blank" rel="noreferrer">{ADJUSTED_RANKINGS_SOURCE.label}</a> · half-PPR overall · updated {ADJUSTED_RANKINGS_SOURCE.updated}. They are not actual picks, keepers, or draft predictions. Team logos use <a href={NFL_TEAM_LOGO_SOURCE.url} target="_blank" rel="noreferrer">{NFL_TEAM_LOGO_SOURCE.label}</a>.</p>
    </section>
  )
}
