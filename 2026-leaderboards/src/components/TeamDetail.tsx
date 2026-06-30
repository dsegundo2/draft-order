import type { ManagerStanding, ProgressStep } from '../types'
import { BackIcon, CheckIcon } from './Icons'

type Props = { standing: ManagerStanding; onBack: () => void }

export function TeamDetail({ standing, onBack }: Props) {
  const progress: ProgressStep[] = standing.progress
  const eliminationStep = progress.find((step) => step.outcome === 'loss')
  const completedWins = progress.filter((step) => step.outcome === 'win')
  const knockoutWinPoints = progress.reduce((sum, step) => sum + (step.points ?? 0), 0)
  const goalPoints = Math.max(standing.points - knockoutWinPoints, 0)
  const population = new Intl.NumberFormat('en-US').format(standing.population)

  return (
    <section className={standing.eliminated ? 'team-detail dark' : 'team-detail'} aria-label={`${standing.team} details`}>
      <button className="back-button" type="button" onClick={onBack} aria-label="Back to standings"><BackIcon /></button>
      <div className="detail-header panel">
        <span className="detail-flag" role="img" aria-label={`${standing.team} flag`}>{standing.flag}</span>
        <div><h2>{standing.team}</h2><p>Managed by {standing.manager}</p></div>
        <span className={standing.eliminated ? 'status-label out' : standing.gameToday ? 'status-label today' : 'status-label in'}>
          {standing.eliminated ? 'Eliminated' : standing.gameToday ? `Today vs ${standing.gameToday.opponent}` : 'In tournament'}
        </span>
      </div>

      <div className="stat-strip panel">
        <div><strong>{standing.points}</strong><span>Points</span></div>
        <div><strong>{standing.wins}</strong><span>{standing.wins === 1 ? 'Win' : 'Wins'}</span></div>
        <div><strong>{standing.goalsFor}</strong><span>Goals</span></div>
      </div>

      {eliminationStep ? (
        <div className="elimination panel">
          <strong>Elimination match</strong>
          <div><span>{eliminationStep.round}<small>vs {eliminationStep.opponent}</small></span><b>{eliminationStep.result}</b></div>
        </div>
      ) : null}

      {completedWins.length ? <div className="progress panel">
        <h3>Knockout wins</h3>
        <ol>
          {completedWins.map((step) => (
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
        <div><span>Goals for<strong>{standing.goalsFor}</strong></span><span>Goals against<strong>{standing.goalsAgainst}</strong></span><span>Population<strong>{population}</strong></span></div>
      </div>

      <div className="breakdown panel">
        <h3>Points breakdown</h3>
        <p><span>Goals × 0.5 points</span><strong>{goalPoints}</strong></p>
        <p><span>Knockout wins × 3 points</span><strong>{knockoutWinPoints}</strong></p>
        <p className="total"><span>Total</span><strong>{standing.points}</strong></p>
      </div>
    </section>
  )
}
