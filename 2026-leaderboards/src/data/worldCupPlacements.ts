export type EspnCompetitor = { winner?: boolean; score?: string; team?: { displayName?: string } }
export type EspnEvent = {
  name?: string
  shortName?: string
  date?: string
  status?: { type?: { completed?: boolean; state?: string; name?: string; description?: string } }
  competitions?: Array<{ date?: string; competitors?: EspnCompetitor[]; notes?: Array<{ headline?: string }> }>
  season?: { slug?: string; type?: number; name?: string }
}

export type WorldCupPlacement = {
  teamName: string
  position?: 1 | 2 | 3 | 4
  label: string
  source: 'final' | 'third-place' | 'semifinal'
}

export function eventGameState(event: EspnEvent): 'scheduled' | 'live' | 'final' | 'postponed' | 'canceled' | 'unknown' {
  const type = event.status?.type
  const words = `${type?.name ?? ''} ${type?.description ?? ''}`.toLowerCase()
  if (words.includes('postpon')) return 'postponed'
  if (words.includes('cancel') || words.includes('abandon')) return 'canceled'
  if (type?.completed || type?.state === 'post') return 'final'
  if (type?.state === 'in') return 'live'
  if (type?.state === 'pre') return 'scheduled'
  return 'unknown'
}

function normalizedText(event: EspnEvent): string {
  return [
    event.season?.slug,
    event.season?.name,
    event.name,
    event.shortName,
    ...(event.competitions ?? []).flatMap((competition) => competition.notes?.map((note) => note.headline) ?? []),
  ]
    .filter((value): value is string => Boolean(value))
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function isWorldCupSemifinal(event: EspnEvent): boolean {
  const slug = event.season?.slug?.toLowerCase()
  if (slug === 'semifinals' || slug === 'semi-finals' || slug === 'semi-final' || slug === 'semifinal') return true
  const text = normalizedText(event)
  return /\bsemi\s?finals?\b/.test(text)
}

export function isWorldCupFinal(event: EspnEvent): boolean {
  const slug = event.season?.slug?.toLowerCase()
  if (slug === 'final') return true
  const text = normalizedText(event)
  if (/\b(semi\s?finals?|third|3rd|bronze)\b/.test(text)) return false
  return /\bfinal\b/.test(text)
}

export function isWorldCupThirdPlaceMatch(event: EspnEvent): boolean {
  const slug = event.season?.slug?.toLowerCase()
  if (slug === '3rd-place-match' || slug === 'third-place-match' || slug === 'third-place-playoff') return true
  const text = normalizedText(event)
  return /\b(third|3rd)\s?place\b/.test(text) || /\bbronze\s?medal\s?match\b/.test(text)
}

function eventTeams(event: EspnEvent): string[] {
  const names = event.competitions?.[0]?.competitors
    ?.map((competitor) => competitor.team?.displayName?.trim())
    .filter((name): name is string => Boolean(name)) ?? []
  return names.length === 2 ? names : []
}

function completedDecision(event: EspnEvent): { winner: string; loser: string } | undefined {
  if (eventGameState(event) !== 'final') return undefined
  const competitors = event.competitions?.[0]?.competitors ?? []
  if (competitors.length !== 2) return undefined
  if (competitors.filter((competitor) => competitor.winner === true).length !== 1) return undefined
  const winner = competitors.find((competitor) => competitor.winner === true)?.team?.displayName?.trim()
  const loser = competitors.find((competitor) => competitor.winner !== true)?.team?.displayName?.trim()
  return winner && loser ? { winner, loser } : undefined
}

function setIfPresent(placements: Map<string, WorldCupPlacement>, teamName: string, placement: WorldCupPlacement) {
  placements.set(teamName.toLowerCase(), placement)
}

export function getWorldCupFinalFourPlacements(events: EspnEvent[]): Map<string, WorldCupPlacement> {
  const semifinalTeams = new Set<string>()
  for (const event of events.filter(isWorldCupSemifinal)) {
    for (const team of eventTeams(event)) semifinalTeams.add(team)
  }

  const placements = new Map<string, WorldCupPlacement>()
  if (semifinalTeams.size < 4) return placements

  for (const teamName of [...semifinalTeams].sort((a, b) => a.localeCompare(b))) {
    setIfPresent(placements, teamName, { teamName, label: 'Final Four TBD', source: 'semifinal' })
  }

  const finalEvent = events.find(isWorldCupFinal)
  const thirdPlaceEvent = events.find(isWorldCupThirdPlaceMatch)
  const finalTeams = finalEvent ? eventTeams(finalEvent) : []
  const thirdPlaceTeams = thirdPlaceEvent ? eventTeams(thirdPlaceEvent) : []

  const semifinalDecisions = events.filter(isWorldCupSemifinal).map(completedDecision).filter((decision): decision is { winner: string; loser: string } => Boolean(decision))
  if (semifinalDecisions.length === 2) {
    for (const decision of semifinalDecisions) {
      setIfPresent(placements, decision.winner, { teamName: decision.winner, label: 'Tied for 1st', source: 'final' })
      setIfPresent(placements, decision.loser, { teamName: decision.loser, label: 'Tied for 3rd', source: 'third-place' })
    }
  }

  for (const teamName of finalTeams) setIfPresent(placements, teamName, { teamName, label: 'Tied for 1st', source: 'final' })
  for (const teamName of thirdPlaceTeams) setIfPresent(placements, teamName, { teamName, label: 'Tied for 3rd', source: 'third-place' })

  const finalDecision = finalEvent ? completedDecision(finalEvent) : undefined
  if (finalDecision) {
    setIfPresent(placements, finalDecision.winner, { teamName: finalDecision.winner, position: 1, label: 'World Cup champion', source: 'final' })
    setIfPresent(placements, finalDecision.loser, { teamName: finalDecision.loser, position: 2, label: 'World Cup runner-up', source: 'final' })
  }

  const thirdPlaceDecision = thirdPlaceEvent ? completedDecision(thirdPlaceEvent) : undefined
  if (thirdPlaceDecision) {
    setIfPresent(placements, thirdPlaceDecision.winner, { teamName: thirdPlaceDecision.winner, position: 3, label: 'Third-place winner', source: 'third-place' })
    setIfPresent(placements, thirdPlaceDecision.loser, { teamName: thirdPlaceDecision.loser, position: 4, label: 'Fourth place', source: 'third-place' })
  }

  return placements
}
