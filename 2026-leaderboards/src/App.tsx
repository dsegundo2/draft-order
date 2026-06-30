import { useCallback, useEffect, useState } from 'react'
import { Leaderboard } from './components/Leaderboard'
import { RefreshIcon } from './components/Icons'
import { TeamDetail } from './components/TeamDetail'
import { fetchStandings } from './data/espn'
import { seededStandings } from './data/teams'
import type { ManagerStanding } from './types'
import './styles.css'

const updateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })

export default function App() {
  const [standings, setStandings] = useState(seededStandings)
  const [selectedManager, setSelectedManager] = useState('Ryan L.')
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)
  const [updatedAt, setUpdatedAt] = useState(new Date('2026-06-07T08:41:00-05:00'))
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const next = await fetchStandings()
      setStandings(next)
      setUpdatedAt(new Date())
    } catch {
      // Keep the seeded standings visible when ESPN is unavailable.
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchStandings(controller.signal).then((next) => {
      setStandings(next)
      setUpdatedAt(new Date())
    }).catch(() => undefined)
    return () => controller.abort()
  }, [])

  const selected = standings.find((standing) => standing.manager === selectedManager) ?? standings[0]
  const selectStanding = (standing: ManagerStanding) => {
    setSelectedManager(standing.manager)
    setMobileDetailOpen(true)
    requestAnimationFrame(() => window.scrollTo({ top: 0 }))
  }

  const closeDetail = () => {
    setMobileDetailOpen(false)
    requestAnimationFrame(() => window.scrollTo({ top: 0 }))
  }

  return (
    <main className={mobileDetailOpen ? 'app detail-open' : 'app'}>
      <section className="standings-view">
        <header className="app-header">
          <div>
            <h1>World Cup 2026</h1>
            <p className="live-label"><span />Standings</p>
            <p className="updated">Updated: {updateFormatter.format(updatedAt)}</p>
          </div>
          <button className={loading ? 'refresh is-loading' : 'refresh'} onClick={refresh} type="button" disabled={loading}>
            <RefreshIcon /><span>{loading ? 'Updating' : 'Refresh'}</span>
          </button>
        </header>
        <Leaderboard standings={standings} selected={selected} onSelect={selectStanding} />
      </section>
      {selected ? <TeamDetail standing={selected} onBack={closeDetail} /> : null}
    </main>
  )
}
