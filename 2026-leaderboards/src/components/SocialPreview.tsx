import type { ManagerStanding } from '../types'

type Props = { standings: ManagerStanding[]; updatedAt: Date }

export function SocialPreview({ standings, updatedAt }: Props) {
  const updated = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Los_Angeles',
  }).format(updatedAt)
  const columns = [standings.slice(0, 6), standings.slice(6, 12)]

  return (
    <main className="social-preview is-ready" aria-label="Fantasy Order leaderboard preview">
      <header className="preview-header">
        <h1>Fantasy Order 2026 <span aria-hidden="true">🏆</span></h1>
        <p>Updated {updated} PT</p>
      </header>
      <section className="preview-standings" aria-label="Current standings">
        {columns.map((column, columnIndex) => (
          <div className="preview-column" key={columnIndex}>
            <div className="preview-head"><span>#</span><span>Manager / Team</span><span>Points</span></div>
            {column.map((standing, index) => (
              <div className={standing.eliminated ? 'preview-row is-eliminated' : 'preview-row'} key={standing.manager}>
                <span>{columnIndex * 6 + index + 1}</span>
                <span className="preview-identity"><b>{standing.manager}</b><small>{standing.flag} {standing.team}</small></span>
                <strong className="preview-points">{standing.points}</strong>
              </div>
            ))}
          </div>
        ))}
      </section>
    </main>
  )
}
