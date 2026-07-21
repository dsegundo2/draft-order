export type AdjustedRanking = {
  rank: number
  player: string
  team: string
  positionRank: string
  teamLogoUrl: string
}

export const ADJUSTED_RANKINGS_SOURCE = {
  label: "Yahoo Sports / Hayden Winks' 2026 half-PPR top 300",
  url: 'https://sports.yahoo.com/fantasy/article/2026-fantasy-football-rankings-hayden-winks-top-300-overall-players-for-half-ppr-143555896.html',
  updated: '2026-07-20',
}

export const NFL_TEAM_LOGO_SOURCE = {
  label: 'ESPN NFL team logo assets',
  url: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/sea',
}

function espnTeamLogoUrl(team: string): string {
  return `https://a.espncdn.com/i/teamlogos/nfl/500/${team.toLowerCase()}.png`
}

const rankings = [
  { rank: 1, player: 'Jahmyr Gibbs', team: 'DET', positionRank: 'RB1' },
  { rank: 2, player: 'Bijan Robinson', team: 'ATL', positionRank: 'RB2' },
  { rank: 3, player: "Ja'Marr Chase", team: 'CIN', positionRank: 'WR1' },
  { rank: 4, player: 'Puka Nacua', team: 'LAR', positionRank: 'WR2' },
  { rank: 5, player: 'Christian McCaffrey', team: 'SF', positionRank: 'RB3' },
  { rank: 6, player: 'Jaxon Smith-Njigba', team: 'SEA', positionRank: 'WR3' },
  { rank: 7, player: 'Jonathan Taylor', team: 'IND', positionRank: 'RB4' },
  { rank: 8, player: 'Amon-Ra St. Brown', team: 'DET', positionRank: 'WR4' },
  { rank: 9, player: 'Justin Jefferson', team: 'MIN', positionRank: 'WR5' },
  { rank: 10, player: 'Saquon Barkley', team: 'PHI', positionRank: 'RB5' },
  { rank: 11, player: 'CeeDee Lamb', team: 'DAL', positionRank: 'WR6' },
  { rank: 12, player: 'Kenneth Walker III', team: 'KC', positionRank: 'RB6' },
] satisfies Array<Omit<AdjustedRanking, 'teamLogoUrl'>>

export const adjustedRankings: AdjustedRanking[] = rankings.map((ranking) => ({
  ...ranking,
  teamLogoUrl: espnTeamLogoUrl(ranking.team),
}))

export function adjustedRankingForPick(pick: number): AdjustedRanking | undefined {
  return adjustedRankings.find((ranking) => ranking.rank === pick)
}
