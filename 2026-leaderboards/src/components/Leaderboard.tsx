import type { ManagerStanding } from '../types'
import { gameSummary } from './gameDisplay'

type Props = {
  standings: ManagerStanding[]
  onSelect: (standing: ManagerStanding) => void
}

export function Leaderboard({ standings, onSelect }: Props) {
  return (
    <section className="leaderboard" aria-label="Manager standings">
      <div className="table-head" aria-hidden="true">
        <span className="rank">#</span><span className="player">Player</span><span className="opponent">Opponent</span><span className="when">When</span><span className="points">Pts</span><span className="wins">W</span><span className="goals" title="Goals for">G</span>
      </div>
      <ol className="table-body">
        {standings.map((standing, index) => (
          <li key={standing.manager} className={[standing.eliminated ? 'is-eliminated' : '', standing.gameToday && ['scheduled', 'live'].includes(standing.gameToday.state) ? 'has-game-today' : '', standing.gameToday || standing.nextGame && !standing.eliminated ? 'has-match' : ''].filter(Boolean).join(' ')}>
            <button
              type="button"
              className="row"
              onClick={() => onSelect(standing)}
              aria-label={`View ${standing.manager}, ${standing.team}, ${standing.points} points`}
            >
              <span className="rank">{index + 1}</span>
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
        ))}
      </ol>
      <div className="legend" aria-label="Status legend">
        <span><i className="status-dot active" />Game today</span>
        <span><i className="status-dot eliminated" />Eliminated</span>
      </div>
    </section>
  )
}
