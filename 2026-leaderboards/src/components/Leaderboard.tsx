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
        <span className="rank">#</span><span className="manager">Manager</span><span className="team">Team</span><span className="points">Pts</span><span className="wins">W</span><span className="goals" title="Goals for">G</span>
      </div>
      <ol className="table-body">
        {standings.map((standing, index) => (
          <li key={standing.manager} className={[standing.eliminated ? 'is-eliminated' : '', standing.gameToday ? 'has-game-today' : ''].filter(Boolean).join(' ')}>
            <button
              type="button"
              className="row"
              onClick={() => onSelect(standing)}
              aria-label={`View ${standing.manager}, ${standing.team}, ${standing.points} points`}
            >
              <span className="rank">{index + 1}</span>
              <span className="manager">{standing.manager}</span>
              <span className="team">
                <span className="flag" role="img" aria-label={`${standing.team} flag`}>{standing.flag}</span>
                <span className="team-name">{standing.team}</span>
                {standing.gameToday ? <small className="today-match">vs {standing.gameToday.opponent} · {gameSummary(standing.gameToday)}</small>
                  : standing.nextGame && !standing.eliminated ? <small className="next-match">Next vs {standing.nextGame.opponent} · {gameSummary(standing.nextGame)}</small> : null}
              </span>
              <strong className="points">{standing.points}</strong>
              <span className="wins">{standing.wins}</span>
              <span className="goals">{standing.goalsFor}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="legend" aria-label="Status legend">
        <span><i className="status-dot active" />Game today (opponent shown)</span>
        <span><i className="status-dot eliminated" />Eliminated</span>
      </div>
    </section>
  )
}
