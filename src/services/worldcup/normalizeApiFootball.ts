import type {
  ApiFootballFixture,
  ApiFootballFixtureEvent,
  ApiFootballFixtureLineup,
  ApiFootballFixturePlayerStats,
  ApiFootballFixtureStatistic,
  ApiFootballStandingResponse,
  ApiFootballTeamResponse,
} from './apiFootballTypes'

export type WorldCup2026Snapshot = {
  tournamentYear: 2026
  season: 2026
  leagueId: number
  provider: 'api-football' | 'github-worldcup2026'
  dataMode: 'api_snapshot' | 'static_csv_snapshot'
  fetchedAt: string
  fixtureCount: number
  teamCount: number
  standingGroupCount: number
  detailFixtureCount: number
  detailFixtureIds: string[]
  disclaimer: string
}

export type NormalizedWorldCupFixture = {
  id: string
  date: string
  timezone?: string
  round?: string
  status: { long?: string; short?: string; elapsed?: number | null }
  venue: { id?: string | null; name?: string | null; city?: string | null }
  teams: {
    home: { id: string; name: string; code?: string | null; badgeText: string; winner?: boolean | null }
    away: { id: string; name: string; code?: string | null; badgeText: string; winner?: boolean | null }
  }
  goals: { home: number | null; away: number | null }
  score: {
    halftime?: { home: number | null; away: number | null } | null
    fulltime?: { home: number | null; away: number | null } | null
    extratime?: { home: number | null; away: number | null } | null
    penalty?: { home: number | null; away: number | null } | null
  }
}

export type NormalizedWorldCupTeam = { id: string; name: string; code?: string | null; country?: string | null; national?: boolean; badgeText: string }

export type NormalizedWorldCupStandingGroup = {
  group: string
  rows: Array<{
    rank: number
    team: { id: string; name: string; code?: string | null; badgeText: string }
    points: number
    goalsDiff: number
    form?: string | null
    status?: string | null
    description?: string | null
    all: { played: number; win: number; draw: number; lose: number; goalsFor: number; goalsAgainst: number }
  }>
}

export type NormalizedFixtureDetail = {
  fixtureId: string
  events: NormalizedFixtureEvent[]
  lineups: NormalizedFixtureLineup[]
  statistics: NormalizedFixtureStatistic[]
  playerStats: NormalizedFixturePlayerStats[]
}
export type NormalizedFixtureEvent = {
  fixtureId: string
  minute: number
  extraMinute?: number | null
  teamId: string
  teamName: string
  playerId?: string | null
  playerName?: string | null
  assistPlayerId?: string | null
  assistPlayerName?: string | null
  type: 'Goal' | 'Card' | 'subst' | 'Var' | string
  detail?: string | null
  comments?: string | null
}
export type NormalizedFixtureLineup = {
  fixtureId: string
  teamId: string
  teamName: string
  formation?: string | null
  startXI: Array<{ id: string; name: string; number?: number | null; pos?: string | null; grid?: string | null }>
  substitutes: Array<{ id: string; name: string; number?: number | null; pos?: string | null; grid?: string | null }>
}
export type NormalizedFixtureStatistic = { fixtureId: string; teamId: string; teamName: string; statistics: Record<string, string | number | null> }
export type NormalizedFixturePlayerStats = {
  fixtureId: string
  teamId: string
  teamName: string
  playerId: string
  playerName: string
  number?: number | null
  position?: string | null
  rating?: number | null
  minutes?: number | null
  shotsTotal?: number | null
  shotsOn?: number | null
  goals?: number | null
  assists?: number | null
  passesTotal?: number | null
  passesKey?: number | null
  tacklesTotal?: number | null
  dribblesAttempts?: number | null
  dribblesSuccess?: number | null
  duelsTotal?: number | null
  duelsWon?: number | null
  cardsYellow?: number | null
  cardsRed?: number | null
}

const teamId = (id: unknown) => `api-football-team-${String(id)}`
const playerId = (id: unknown) => `api-football-player-${String(id)}`
const badge = (code?: string | null, name = 'TBD') => (code || name.slice(0, 3)).toUpperCase()
const n = (value: unknown): number | null => (Number.isFinite(Number(value)) ? Number(value) : null)
const score = (value?: { home?: number | null; away?: number | null } | null) => value ? { home: n(value.home), away: n(value.away) } : null

export function normalizeFixtures(fixtures: ApiFootballFixture[]): NormalizedWorldCupFixture[] {
  return fixtures.flatMap((item) => {
    const home = item.teams?.home
    const away = item.teams?.away
    if (!item.fixture?.id || !home?.id || !away?.id) return []
    const homeName = home.name ?? `Team ${home.id}`
    const awayName = away.name ?? `Team ${away.id}`
    return [{
      id: String(item.fixture.id),
      date: item.fixture.date ?? '',
      timezone: item.fixture.timezone,
      round: item.league?.round,
      status: item.fixture.status ?? {},
      venue: { id: item.fixture.venue?.id == null ? null : String(item.fixture.venue.id), name: item.fixture.venue?.name ?? null, city: item.fixture.venue?.city ?? null },
      teams: {
        home: { id: teamId(home.id), name: homeName, code: home.code ?? null, badgeText: badge(home.code, homeName), winner: home.winner },
        away: { id: teamId(away.id), name: awayName, code: away.code ?? null, badgeText: badge(away.code, awayName), winner: away.winner },
      },
      goals: { home: n(item.goals?.home), away: n(item.goals?.away) },
      score: { halftime: score(item.score?.halftime), fulltime: score(item.score?.fulltime), extratime: score(item.score?.extratime), penalty: score(item.score?.penalty) },
    }]
  })
}

export function normalizeTeams(teams: ApiFootballTeamResponse[]): NormalizedWorldCupTeam[] {
  return teams.flatMap((item) => {
    if (!item.team?.id) return []
    const name = item.team.name ?? `Team ${item.team.id}`
    return [{ id: teamId(item.team.id), name, code: item.team.code ?? null, country: item.team.country ?? null, national: item.team.national, badgeText: badge(item.team.code, name) }]
  })
}

export function normalizeStandings(records: ApiFootballStandingResponse[]): NormalizedWorldCupStandingGroup[] {
  return records.flatMap((record) => record.league?.standings ?? []).map((groupRows, index) => {
    const group = groupRows[0]?.group ?? `Group ${index + 1}`
    return {
      group,
      rows: groupRows.flatMap((row) => row.team?.id ? [{
        rank: row.rank ?? 0,
        team: { id: teamId(row.team.id), name: row.team.name ?? `Team ${row.team.id}`, code: row.team.code ?? null, badgeText: badge(row.team.code, row.team.name) },
        points: row.points ?? 0,
        goalsDiff: row.goalsDiff ?? 0,
        form: row.form ?? null,
        status: row.status ?? null,
        description: row.description ?? null,
        all: { played: row.all?.played ?? 0, win: row.all?.win ?? 0, draw: row.all?.draw ?? 0, lose: row.all?.lose ?? 0, goalsFor: row.all?.goals?.for ?? 0, goalsAgainst: row.all?.goals?.against ?? 0 },
      }] : []),
    }
  })
}

export function normalizeFixtureDetail(
  fixtureId: string,
  events: ApiFootballFixtureEvent[],
  lineups: ApiFootballFixtureLineup[],
  statistics: ApiFootballFixtureStatistic[],
  players: ApiFootballFixturePlayerStats[],
): NormalizedFixtureDetail {
  return {
    fixtureId,
    events: events.map((event) => ({
      fixtureId,
      minute: event.time?.elapsed ?? 0,
      extraMinute: event.time?.extra ?? null,
      teamId: teamId(event.team?.id ?? 'unknown'),
      teamName: event.team?.name ?? 'Unknown team',
      playerId: event.player?.id == null ? null : playerId(event.player.id),
      playerName: event.player?.name ?? null,
      assistPlayerId: event.assist?.id == null ? null : playerId(event.assist.id),
      assistPlayerName: event.assist?.name ?? null,
      type: event.type ?? 'Event',
      detail: event.detail ?? null,
      comments: event.comments ?? null,
    })),
    lineups: lineups.map((lineup) => ({
      fixtureId,
      teamId: teamId(lineup.team?.id ?? 'unknown'),
      teamName: lineup.team?.name ?? 'Unknown team',
      formation: lineup.formation ?? null,
      startXI: (lineup.startXI ?? []).flatMap(({ player }) => player?.id ? [{ id: playerId(player.id), name: player.name ?? `Player ${player.id}`, number: player.number ?? null, pos: player.pos ?? null, grid: player.grid ?? null }] : []),
      substitutes: (lineup.substitutes ?? []).flatMap(({ player }) => player?.id ? [{ id: playerId(player.id), name: player.name ?? `Player ${player.id}`, number: player.number ?? null, pos: player.pos ?? null, grid: player.grid ?? null }] : []),
    })),
    statistics: statistics.map((stat) => ({
      fixtureId,
      teamId: teamId(stat.team?.id ?? 'unknown'),
      teamName: stat.team?.name ?? 'Unknown team',
      statistics: Object.fromEntries((stat.statistics ?? []).map((item) => [item.type ?? 'Unknown', item.value ?? null])),
    })),
    playerStats: players.flatMap((team) => (team.players ?? []).flatMap((entry) => {
      const stats = entry.statistics?.[0]
      if (!entry.player?.id) return []
      return [{
        fixtureId,
        teamId: teamId(team.team?.id ?? 'unknown'),
        teamName: team.team?.name ?? 'Unknown team',
        playerId: playerId(entry.player.id),
        playerName: entry.player.name ?? `Player ${entry.player.id}`,
        number: stats?.games?.number ?? null,
        position: stats?.games?.pos ?? null,
        rating: n(stats?.games?.rating),
        minutes: n(stats?.games?.minutes),
        shotsTotal: n(stats?.shots?.total),
        shotsOn: n(stats?.shots?.on),
        goals: n(stats?.goals?.total),
        assists: n(stats?.goals?.assists),
        passesTotal: n(stats?.passes?.total),
        passesKey: n(stats?.passes?.key),
        tacklesTotal: n(stats?.tackles?.total),
        dribblesAttempts: n(stats?.dribbles?.attempts),
        dribblesSuccess: n(stats?.dribbles?.success),
        duelsTotal: n(stats?.duels?.total),
        duelsWon: n(stats?.duels?.won),
        cardsYellow: n(stats?.cards?.yellow),
        cardsRed: n(stats?.cards?.red),
      }]
    })),
  }
}

export function createSnapshot(input: {
  leagueId: number
  fetchedAt: string
  fixtures: NormalizedWorldCupFixture[]
  teams: NormalizedWorldCupTeam[]
  standings: NormalizedWorldCupStandingGroup[]
  details: NormalizedFixtureDetail[]
}): WorldCup2026Snapshot {
  return {
    tournamentYear: 2026,
    season: 2026,
    leagueId: input.leagueId,
    provider: 'api-football',
    dataMode: 'api_snapshot',
    fetchedAt: input.fetchedAt,
    fixtureCount: input.fixtures.length,
    teamCount: input.teams.length,
    standingGroupCount: input.standings.length,
    detailFixtureCount: input.details.length,
    detailFixtureIds: input.details.map((detail) => detail.fixtureId),
    disclaimer: 'API snapshot for a tactical IF simulator. It is not live data, an official prediction, or an official World Cup product.',
  }
}
