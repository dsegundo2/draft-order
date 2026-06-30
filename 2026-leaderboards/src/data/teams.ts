import type { ManagerStanding } from '../types'

export const seededStandings: ManagerStanding[] = [
  { manager: 'Ryan H.', team: 'Brazil', espnName: 'Brazil', flag: '🇧🇷', points: 18, wins: 6, goalsFor: 14, goalsAgainst: 4, eliminated: false, progress: [] },
  { manager: 'Ryan L.', team: 'Germany', espnName: 'Germany', flag: '🇩🇪', points: 16, wins: 5, goalsFor: 12, goalsAgainst: 3, eliminated: false, progress: [
    { round: 'Round of 16', opponent: 'Denmark', result: 'W 2–0', points: 3, complete: true },
    { round: 'Quarterfinals', opponent: 'Spain', result: 'W 1–0', points: 3, complete: true },
    { round: 'Semifinals', opponent: 'France', result: 'W 3–1', points: 3, complete: true },
    { round: 'Final', opponent: 'TBD', result: 'Jul 19', complete: false },
  ] },
  { manager: 'Diego', team: 'Argentina', espnName: 'Argentina', flag: '🇦🇷', points: 15, wins: 4, goalsFor: 11, goalsAgainst: 5, eliminated: false, progress: [] },
  { manager: 'Troy', team: 'England', espnName: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', points: 13, wins: 4, goalsFor: 9, goalsAgainst: 4, eliminated: false, progress: [] },
  { manager: 'Grant', team: 'Netherlands', espnName: 'Netherlands', flag: '🇳🇱', points: 12, wins: 3, goalsFor: 8, goalsAgainst: 3, eliminated: false, progress: [] },
  { manager: 'Jeff', team: 'France', espnName: 'France', flag: '🇫🇷', points: 11, wins: 3, goalsFor: 7, goalsAgainst: 4, eliminated: false, progress: [] },
  { manager: 'Cam', team: 'Portugal', espnName: 'Portugal', flag: '🇵🇹', points: 10, wins: 2, goalsFor: 7, goalsAgainst: 5, eliminated: false, progress: [] },
  { manager: 'Nolan', team: 'Spain', espnName: 'Spain', flag: '🇪🇸', points: 9, wins: 2, goalsFor: 6, goalsAgainst: 4, eliminated: true, progress: [] },
  { manager: 'Noah', team: 'Mexico', espnName: 'Mexico', flag: '🇲🇽', points: 6, wins: 1, goalsFor: 4, goalsAgainst: 6, eliminated: true, progress: [
    { round: 'Round of 16', opponent: 'Germany', result: 'L 0–2', complete: true },
    { round: 'Quarterfinals', opponent: '—', complete: false },
    { round: 'Semifinals', opponent: '—', complete: false },
    { round: 'Final', opponent: '—', complete: false },
  ] },
  { manager: 'Buck', team: 'Belgium', espnName: 'Belgium', flag: '🇧🇪', points: 6, wins: 1, goalsFor: 3, goalsAgainst: 4, eliminated: true, progress: [] },
  { manager: 'Will', team: 'Croatia', espnName: 'Croatia', flag: '🇭🇷', points: 4, wins: 0, goalsFor: 2, goalsAgainst: 5, eliminated: true, progress: [] },
  { manager: 'Ted', team: 'Japan', espnName: 'Japan', flag: '🇯🇵', points: 3, wins: 0, goalsFor: 1, goalsAgainst: 4, eliminated: true, progress: [] },
]
