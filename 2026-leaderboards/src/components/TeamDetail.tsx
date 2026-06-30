import type { ManagerStanding, ProgressStep } from '../types'
import { BackIcon, CheckIcon } from './Icons'

type Props = { standing: ManagerStanding; onBack: () => void }

export function TeamDetail({ standing, onBack }: Props) {
  const progress: ProgressStep[] = standing.progress
  const knockoutWinPoints = progress.reduce((sum, step) => sum + (step.points ?? 0), 0)
  const goalPoints = Math.max(standing.points - knockoutWinPoints, 0)

  return (
    <section className={standing.eliminated ? 'team-detail dark' : 'team-detail'} aria-label={`${standing.team} details`}>
      <button className="back-button" type="button" onClick={onBack} aria-label="Back to standings"><BackIcon /></button>
      <div className="detail-header panel">
        <span className="detail-flag" role="img" aria-label={`${standing.team} flag`}>{standing.flag}</span>
        <div><h2>{standing.team}</h2><p>Managed by {standing.manager}</p></div>
        <span className={standing.eliminated ? 'status-label out' : 'status-label in'}>{standing.eliminated ? 'Eliminated' : 'Still in'}</span>
      </div>

      <div className="stat-strip panel">
        <div><strong>{standing.points}</strong><span>Points</span></div>
        <div><strong>{standing.wins}</strong><span>{standing.wins === 1 ? 'Win' : 'Wins'}</span></div>
        <div><strong>{standing.goalsFor}</strong><span>Goals</span></div>
      </div>

      {standing.eliminated ? (
        <div className="elimination panel">
          <strong>Elimination match</strong>
          <div><span>{progress.find((step) => step.result?.startsWith('L'))?.round ?? 'Knockout round'}<small>vs {progress.find((step) => step.result?.startsWith('L'))?.opponent ?? 'TBD'}</small></span><b>{progress.find((step) => step.result?.startsWith('L'))?.result ?? 'Eliminated'}</b></div>
        </div>
      ) : null}

      {progress.length ? <div className="progress panel">
        <h3>Knockout progress</h3>
        <ol>
          {progress.map((step) => (
            <li key={step.round} className={step.complete ? 'complete' : ''}>
              <span className="step-icon">{step.complete ? <CheckIcon /> : null}</span>
              <span className="step-name">{step.round}<small>vs {step.opponent}</small></span>
              <span className="step-result">{step.result ?? '—'}{step.points ? <small>+{step.points} pts</small> : null}</span>
            </li>
          ))}
        </ol>
      </div> : null}

      <div className="summary panel">
        <h3>Summary</h3>
        <div><span>Total Goals For<strong>{standing.goalsFor}</strong></span><span>Total Goals Against<strong>{standing.goalsAgainst}</strong></span></div>
      </div>

      <div className="breakdown panel">
        <h3>Points breakdown</h3>
        <p><span>Goal points</span><strong>{goalPoints}</strong></p>
        <p><span>Knockout wins</span><strong>{knockoutWinPoints}</strong></p>
        <p className="total"><span>Total</span><strong>{standing.points}</strong></p>
      </div>
    </section>
  )
}
