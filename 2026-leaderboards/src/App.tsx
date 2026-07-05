import { useCallback, useEffect, useState } from 'react'
import { Leaderboard } from './components/Leaderboard'
import { RefreshIcon } from './components/Icons'
import { TeamDetail } from './components/TeamDetail'
import { SocialPreview } from './components/SocialPreview'
import { fetchStandings } from './data/espn'
import { resolveGroup } from './data/groups'
import type { ManagerStanding } from './types'
import './styles.css'

const updateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
const group = resolveGroup()
const headerStyle = { backgroundImage: `url(/${group.headerImage})` }

export default function App() {
  const socialPreview = new URLSearchParams(window.location.search).has('social-preview')
  const [standings, setStandings] = useState<ManagerStanding[] | null>(null)
  const [selectedManager, setSelectedManager] = useState('Ryan L.')
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const next = await fetchStandings()
      setStandings(next)
      setUpdatedAt(new Date())
    } catch {
      setError('Live ESPN data is temporarily unavailable. No fallback standings are being shown.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const load = () => fetchStandings(controller.signal).then((next) => {
      setStandings(next); setUpdatedAt(new Date()); setError(null)
    }).catch((reason: unknown) => {
      if (!(reason instanceof DOMException && reason.name === 'AbortError')) setError('Live ESPN data is temporarily unavailable. No fallback standings are being shown.')
    }).finally(() => setLoading(false))
    load()
    const interval = window.setInterval(load, 5 * 60 * 1000)
    return () => { controller.abort(); window.clearInterval(interval) }
  }, [])

  const selected = standings?.find((standing) => standing.manager === selectedManager) ?? standings?.[0]
  const selectStanding = (standing: ManagerStanding) => {
    setSelectedManager(standing.manager)
    setMobileDetailOpen(true)
    requestAnimationFrame(() => window.scrollTo({ top: 0 }))
  }

  const closeDetail = () => {
    setMobileDetailOpen(false)
    requestAnimationFrame(() => window.scrollTo({ top: 0 }))
  }

  if (socialPreview) {
    if (standings && updatedAt) return <SocialPreview standings={standings} updatedAt={updatedAt} title={group.title} headerStyle={headerStyle} />
    return <main className="social-preview preview-loading" aria-label="Fantasy Order leaderboard preview">Loading current standings…</main>
  }

  return (
    <main className={mobileDetailOpen ? 'app detail-open' : 'app'}>
      <section className="standings-view">
        <header className="app-header" style={headerStyle}>
          <div>
            <h1>{group.title} <span aria-hidden="true">🏆</span></h1>
            {updatedAt ? <p className="updated">Updated {updateFormatter.format(updatedAt)}</p> : null}
          </div>
          <button className={loading ? 'refresh is-loading' : 'refresh'} onClick={refresh} type="button" disabled={loading}>
            <RefreshIcon /><span>{loading ? 'Updating' : 'Refresh'}</span>
          </button>
        </header>
        {error && !standings ? <div className="data-state error-state" role="alert"><strong>We couldn't reach ESPN.</strong><span>{error}</span><button type="button" onClick={refresh}>Try again</button></div> : null}
        {loading && !standings ? <div className="data-state" role="status">Loading live ESPN results…</div> : null}
        {standings ? <Leaderboard standings={standings} onSelect={selectStanding} /> : null}
      </section>
      {selected ? <TeamDetail standing={selected} onBack={closeDetail} /> : null}
    </main>
  )
}
