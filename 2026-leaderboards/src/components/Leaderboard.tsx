import type { ManagerStanding } from '../types'

type Props = {
  standings: ManagerStanding[]
  selected?: ManagerStanding
  onSelect: (standing: ManagerStanding) => void
}

export function Leaderboard({ standings, selected, onSelect }: Props) {
  return (
    <section className="leaderboard" aria-label="Manager standings">
      <div className="table-head" aria-hidden="true">
        <span className="rank">#</span><span className="manager">Manager</span><span className="team">Team</span><span className="points">Pts</span><span className="wins">W</span><span className="goals" title="Goals for">GF</span>
      </div>
      <ol className="table-body">
        {standings.map((standing, index) => (
          <li key={standing.manager} className={standing.eliminated ? 'is-eliminated' : ''}>
            <button
              type="button"
              className={selected?.manager === standing.manager ? 'row is-selected' : 'row'}
              onClick={() => onSelect(standing)}
              aria-label={`View ${standing.manager}, ${standing.team}, ${standing.points} points`}
            >
              <span className="rank">{index + 1}</span>
              <span className="manager">{standing.manager}</span>
              <span className="team"><span className="flag" role="img" aria-label={`${standing.team} flag`}>{standing.flag}</span><span>{standing.team}</span></span>
              <strong className="points">{standing.points}</strong>
              <span className="wins">{standing.wins}</span>
              <span className="goals">{standing.goalsFor}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="legend" aria-label="Status legend">
        <span><i className="status-dot active" />Still in the tournament</span>
        <span><i className="status-dot eliminated" />Eliminated</span>
      </div>
    </section>
  )
}
