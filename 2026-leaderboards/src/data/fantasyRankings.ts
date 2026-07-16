export type FantasyRanking = {
  rank: number
  player: string
  team: string
  positionRank: string
  teamLogoUrl: string
}

export const FANTASY_RANKINGS_SOURCE = {
  label: 'FantasyPros 2026 PPR rankings via Yahoo Sports / Justin Boone',
  url: 'https://partners.fantasypros.com/api/v1/consensus-rankings.php?position=ALL&sport=NFL&year=2026&week=0&experts=show&type=ST&scoring=PPR&filters=317&widget=ST',
  updated: '2026-07-14 16:06:39 UTC',
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
  { rank: 5, player: 'Jaxon Smith-Njigba', team: 'SEA', positionRank: 'WR3' },
  { rank: 6, player: 'CeeDee Lamb', team: 'DAL', positionRank: 'WR4' },
  { rank: 7, player: 'Amon-Ra St. Brown', team: 'DET', positionRank: 'WR5' },
  { rank: 8, player: 'Christian McCaffrey', team: 'SF', positionRank: 'RB3' },
  { rank: 9, player: 'Justin Jefferson', team: 'MIN', positionRank: 'WR6' },
  { rank: 10, player: 'Jonathan Taylor', team: 'IND', positionRank: 'RB4' },
  { rank: 11, player: 'Ashton Jeanty', team: 'LV', positionRank: 'RB5' },
  { rank: 12, player: 'Brock Bowers', team: 'LV', positionRank: 'TE1' },
] satisfies Array<Omit<FantasyRanking, 'teamLogoUrl'>>

export const fantasyRankings: FantasyRanking[] = rankings.map((ranking) => ({
  ...ranking,
  teamLogoUrl: espnTeamLogoUrl(ranking.team),
}))

export function fantasyRankingForPick(pick: number): FantasyRanking | undefined {
  return fantasyRankings.find((ranking) => ranking.rank === pick)
}
