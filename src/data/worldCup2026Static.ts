import gamesCsv from './source/worldcup2026.games.csv?raw'
import teamsCsv from './source/worldcup2026.teams.csv?raw'
import groupsCsv from './source/worldcup2026.groups.csv?raw'
import stadiaCsv from './source/worldcup2026.stadia.csv?raw'
import playersCsv from './source/kaggle-fifa-wc-2026-players.csv?raw'
import matchSummaryCsv from './source/kaggle-fifa-wc-2026-matches.csv?raw'
import matchesCsv from './source/kaggle-mominul-wc2026-matches-detailed.csv?raw'
import matchEventsCsv from './source/kaggle-mominul-wc2026-match-events.csv?raw'
import matchLineupsCsv from './source/kaggle-mominul-wc2026-match-lineups.csv?raw'
import matchTeamStatsCsv from './source/kaggle-mominul-wc2026-match-team-stats.csv?raw'
import eventTeamsCsv from './source/kaggle-mominul-wc2026-teams.csv?raw'
import eventSquadsCsv from './source/kaggle-mominul-wc2026-squads-and-players.csv?raw'
import type { Mission, MissionObjective, MissionType, MatchContext, ActualMatchTimelineEvent } from '../entities/mission/types'
import type { Player, PlayerAttributes, PlayerPosition, PlayerRole } from '../entities/player/types'
import type { Team } from '../entities/team/types'
import type { NormalizedFixtureDetail, NormalizedWorldCupFixture, NormalizedWorldCupStandingGroup, NormalizedWorldCupTeam, WorldCup2026Snapshot } from '../services/worldcup/normalizeApiFootball'

type CsvRow = Record<string, string>
type ScenarioSeed = {
  id:string;fixtureId:string;userTeam:string;opponentTeam:string;title:string;type:MissionType;difficulty:1|2|3|4|5
  minute:number;period:MatchContext['period'];score:{home:number;away:number};situation:string;objective:MissionObjective
  recommendedFormationId:string;availableSubstitutions:number;dismissedPosition?:PlayerPosition
  opponentTraits:string[];teamProblems:string[];actualFlowSummary:string;timeline:Array<[number, ActualMatchTimelineEvent['type'], string, number, number, string?]>
}
type NumberedPlayerRow = CsvRow & { generatedShirtNumber:string }
type MatchEventRow = {
  event_id:string
  match_id:string
  minute:string
  event_type:string
  team_id:string
  player_id:string
  runningHome:number
  runningAway:number
}

const DATASET_FETCHED_AT = '2026-07-08T00:35:17.070Z'
const GITHUB_SOURCE_URL = 'https://github.com/rezarahiminia/worldcup2026'
const KAGGLE_PLAYERS_SOURCE_URL = 'https://www.kaggle.com/datasets/swaptr/fifa-wc-2026-players'
const KAGGLE_MATCH_EVENTS_SOURCE_URL = 'https://www.kaggle.com/datasets/mominullptr/fifa-world-cup-2026-dataset'

const teamAliases:Record<string,string> = {
  'Cabo Verde':'Cape Verde',
  "Côte d'Ivoire":'Ivory Coast',
  'IR Iran':'Iran',
  'Korea Republic':'South Korea',
  'Bosnia-Herzegovina':'Bosnia and Herzegovina',
  'Bosnia–Herz':'Bosnia and Herzegovina',
  'Congo DR':'DR Congo',
}

const teamKoreanNames:Record<string,string> = {
  Algeria:'알제리', Argentina:'아르헨티나', Australia:'호주', Austria:'오스트리아', Belgium:'벨기에', 'Bosnia and Herzegovina':'보스니아 헤르체고비나', Brazil:'브라질', 'Cape Verde':'카보베르데', Canada:'캐나다', Colombia:'콜롬비아', 'DR Congo':'콩고민주공화국', Croatia:'크로아티아', Curaçao:'퀴라소', Czechia:'체코', 'Ivory Coast':'코트디부아르', Ecuador:'에콰도르', Egypt:'이집트', England:'잉글랜드', France:'프랑스', Germany:'독일', Ghana:'가나', Haiti:'아이티', Iran:'이란', Iraq:'이라크', Japan:'일본', Jordan:'요르단', 'South Korea':'대한민국', Mexico:'멕시코', Morocco:'모로코', Netherlands:'네덜란드', 'New Zealand':'뉴질랜드', Norway:'노르웨이', Panama:'파나마', Paraguay:'파라과이', Portugal:'포르투갈', Qatar:'카타르', 'Saudi Arabia':'사우디아라비아', Scotland:'스코틀랜드', Senegal:'세네갈', 'South Africa':'남아프리카공화국', Spain:'스페인', Sweden:'스웨덴', Switzerland:'스위스', Tunisia:'튀니지', Türkiye:'튀르키예', 'United States':'미국', Uruguay:'우루과이', Uzbekistan:'우즈베키스탄',
}

const teamCodes:Record<string,string> = {
  'Bosnia and Herzegovina':'BIH', Czechia:'CZE', 'DR Congo':'COD', Sweden:'SWE', Iraq:'IRQ', Türkiye:'TUR', 'Cape Verde':'CPV', 'Ivory Coast':'CIV', Iran:'IRN', 'South Korea':'KOR',
}

const palette = ['#16a34a', '#2563eb', '#dc2626', '#f59e0b', '#7c3aed', '#0891b2', '#be123c', '#4f46e5']

const teamRows = parseCsv(teamsCsv)
const gameRows = parseCsv(gamesCsv)
const groupRows = parseCsv(groupsCsv)
const stadiumRows = parseCsv(stadiaCsv)
const eventTeamRows = parseCsv(eventTeamsCsv)
const eventTeamById = new Map(eventTeamRows.map((team) => [team.team_id, canonicalTeam(team.team_name)]))
const basePlayerRows = parseCsv(playersCsv).filter((row) => row.player && row.player !== 'player')
const eventSquadRows = parseCsv(eventSquadsCsv)
const eventSquadById = new Map(eventSquadRows.map((player) => [player.player_id, player]))
const squadNumberByPlayerId = new Map([...groupBy(eventSquadRows, (player) => player.team_id).values()].flatMap((rows) => rows.sort((a, b) => Number(a.player_id) - Number(b.player_id)).map((player, index) => [player.player_id, index + 1] as const)))
const squadNumberByNameTeam = new Map(eventSquadRows.map((player) => [`${slug(eventTeamName(player.team_id))}:${slug(player.player_name)}`, squadNumberByPlayerId.get(player.player_id) ?? 0]))
const actualPositionByPlayerId = new Map(eventSquadRows.map((player) => [playerId(eventTeamName(player.team_id), player.player_name), primaryPosition(player.position)]))
const basePlayerKeys = new Set(basePlayerRows.map((row) => playerKey(row)))
const supplementalPlayerRows = eventSquadRows.map(toSupplementalPlayerRow).filter((row) => row.player && !basePlayerKeys.has(playerKey(row)))
const playerRows = [...basePlayerRows, ...supplementalPlayerRows]
const matchEventRows = parseCsv(matchEventsCsv)
const matchSummaryRows = parseCsv(matchSummaryCsv)
const matchSummaryByKey = new Map(matchSummaryRows.map((row) => [matchSummaryKey(row), row]))
const actualMatchRows = parseCsv(matchesCsv).filter((row) => matchHome(row) && matchAway(row) && row.home_score !== '' && row.away_score !== '' && hasConsistentScoreData(row))
const matchLineupRows = parseCsv(matchLineupsCsv)
const matchTeamStatRows = parseCsv(matchTeamStatsCsv)
const teamBySourceId = new Map(teamRows.map((team) => [team.id, team]))
const stadiumBySourceId = new Map(stadiumRows.map((stadium) => [stadium.id, stadium]))
const matchStatsByKey = new Map(matchTeamStatRows.map((stat) => [`${stat.match_id}:${stat.team_id}`, stat]))
const lineupRowsByMatchTeam = groupBy(matchLineupRows, (row) => `${row.match_id}:${row.team_id}`)
const playersByTeam = groupBy(playerRows, (row) => canonicalTeam(row.team))
const numberedPlayerRows = [...playersByTeam.values()].flatMap(assignSquadNumbers)
const actualTeamNames = uniqueStrings(actualMatchRows.flatMap((row) => [matchHome(row), matchAway(row)]))
const actualMatchByFixtureId = new Map(actualMatchRows.map((row, index) => [actualFixtureId(row, index), row]))
const eventsByMatchId = groupBy(matchEventRows, (row) => row.match_id)


export const worldCup2026Source = {
  github: GITHUB_SOURCE_URL,
  kaggle: KAGGLE_PLAYERS_SOURCE_URL,
  kaggleMatchEvents: KAGGLE_MATCH_EVENTS_SOURCE_URL,
  kaggleLicense: 'CC0: Public Domain',
  fetchedAt: DATASET_FETCHED_AT,
}

export const worldCup2026Players:Player[] = numberedPlayerRows.map(toPlayer)
const playerByNameTeam = new Map(worldCup2026Players.map((player) => [player.source.externalId, player]))

export const worldCup2026Fixtures:NormalizedWorldCupFixture[] = actualMatchRows.map(toActualFixture)
export const worldCup2026Teams:NormalizedWorldCupTeam[] = actualTeamNames.map((name) => ({
  id: teamIdByName(name),
  name: displayTeamName(name),
  code: codeForTeam(name),
  country: displayTeamName(name),
  national: true,
  badgeText: codeForTeam(name) || displayTeamName(name).slice(0, 3).toUpperCase(),
}))
export const worldCup2026Standings:NormalizedWorldCupStandingGroup[] = groupRows.map(toStanding)

export const missionScenarios:ScenarioSeed[] = actualMatchRows.flatMap((row, index) => scenarioFromActualMatch(row, index))

export const opponentProfiles = Object.fromEntries(missionScenarios.map((seed) => [seed.id, seed.opponentTraits]))
export const manualLineupPlans = Object.fromEntries(missionScenarios.map((seed) => [seed.id, { formationId: seed.recommendedFormationId, benchSize: 9 }]))

export const worldCup2026FixtureDetails:NormalizedFixtureDetail[] = missionScenarios.map(toFixtureDetail)
export const worldCup2026Missions:Mission[] = missionScenarios.map(toMission)

export const worldCup2026AppTeams:Team[] = actualTeamNames.map((name, index) => {
  const roster = rosterFor(name)
  return {
    id: teamIdByName(name),
    source: { provider: 'github-worldcup2026', externalId: slug(name) },
    name: displayTeamName(name),
    shortName: codeForTeam(name) || name.slice(0, 3).toUpperCase(),
    countryCode: codeForTeam(name) || name.slice(0, 2).toUpperCase(),
    primaryColor: palette[index % palette.length],
    secondaryColor: '#0f172a',
    startingPlayerIds: roster.startXI.map((player) => player.id),
    benchPlayerIds: roster.substitutes.map((player) => player.id),
  }
})

export const worldCup2026Snapshot:WorldCup2026Snapshot = {
  tournamentYear: 2026,
  season: 2026,
  leagueId: 1,
  provider: 'github-worldcup2026',
  dataMode: 'static_csv_snapshot',
  fetchedAt: DATASET_FETCHED_AT,
  fixtureCount: worldCup2026Fixtures.length,
  teamCount: worldCup2026Teams.length,
  standingGroupCount: worldCup2026Standings.length,
  detailFixtureCount: worldCup2026FixtureDetails.length,
  detailFixtureIds: worldCup2026FixtureDetails.map((detail) => detail.fixtureId),
  disclaimer: 'Actual match results, goal order, cards, team match statistics, and knockout stage context from Kaggle mominullptr/fifa-world-cup-2026-dataset. Team/group/stadium schedule context from rezarahiminia/worldcup2026. Player attributes generated from Kaggle swaptr/fifa-wc-2026-players players.csv. Tactical lineups and IF tactical states are generated seed data for simulation.',
}

function parseCsv(input:string):CsvRow[] {
  const rows:string[][] = []
  let row:string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]
    const next = input[i + 1]
    if (char === '"' && quoted && next === '"') { cell += '"'; i += 1; continue }
    if (char === '"') { quoted = !quoted; continue }
    if (char === ',' && !quoted) { row.push(cell); cell = ''; continue }
    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1
      row.push(cell); cell = ''
      if (row.some(Boolean)) rows.push(row)
      row = []
      continue
    }
    cell += char
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  const headers = rows[0] ?? []
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])))
}

function toFixture(row:CsvRow):NormalizedWorldCupFixture {
  const home = teamBySourceId.get(row.home_team_id)
  const away = teamBySourceId.get(row.away_team_id)
  const stadium = stadiumBySourceId.get(row.stadium_id)
  return {
    id: row.id,
    date: row.date,
    timezone: 'UTC',
    round: row.type === 'group' ? `Group ${row.group} · Matchday ${row.matchday}` : row.type,
    status: { long: row.finished === 'TRUE' ? 'Finished' : 'Not started', short: row.time_elapsed || 'NS', elapsed: null },
    venue: { id: row.stadium_id, name: stadium?.fifa_name || stadium?.name_en || null, city: stadium?.city_en || null },
    teams: { home: fixtureTeam(home), away: fixtureTeam(away) },
    goals: { home: numberOrNull(row.home_score), away: numberOrNull(row.away_score) },
    score: { fulltime: { home: numberOrNull(row.home_score), away: numberOrNull(row.away_score) } },
  }
}

function toActualFixture(row:CsvRow, index:number):NormalizedWorldCupFixture {
  const home = matchHome(row)
  const away = matchAway(row)
  const goals = actualGoals(row)
  return {
    id: actualFixtureId(row, index),
    date: `${row.date}T${row.kickoff_time_utc || row.start_time || '00:00'}:00Z`,
    timezone: 'UTC',
    round: displayRound(row.stage_name || row.round),
    status: { long: 'Finished', short: 'FT', elapsed: 90 },
    venue: { id: slug(row.stadium_name || row.venue), name: row.stadium_name || row.venue || null, city: row.city || venueCity(row.venue || '') },
    teams: { home: fixtureTeamByName(home), away: fixtureTeamByName(away) },
    goals,
    score: { fulltime: goals },
  }
}

function fixtureTeam(row?:CsvRow) {
  const name = row?.name_en ?? 'TBD'
  return { id: teamId(row?.id ?? 'tbd'), name, code: row?.fifa_code || null, badgeText: row?.fifa_code || name.slice(0, 3).toUpperCase(), winner: null }
}

function fixtureTeamByName(name:string) {
  return { id: teamIdByName(name), name: displayTeamName(name), code: codeForTeam(name), badgeText: codeForTeam(name) || displayTeamName(name).slice(0, 3).toUpperCase(), winner: null }
}

function toStanding(row:CsvRow):NormalizedWorldCupStandingGroup {
  return {
    group: `Group ${row.name}`,
    rows: [0, 1, 2, 3].map((index) => {
      const sourceId = row[`teams[${index}].team_id`]
      const team = teamBySourceId.get(sourceId)
      return {
        rank: index + 1,
        team: fixtureTeam(team),
        points: num(row[`teams[${index}].pts`]),
        goalsDiff: num(row[`teams[${index}].gd`]),
        all: {
          played: num(row[`teams[${index}].mp`]),
          win: num(row[`teams[${index}].w`]),
          draw: num(row[`teams[${index}].d`]),
          lose: num(row[`teams[${index}].l`]),
          goalsFor: num(row[`teams[${index}].gf`]),
          goalsAgainst: num(row[`teams[${index}].ga`]),
        },
      }
    }),
  }
}

function toPlayer(row:NumberedPlayerRow):Player {
  const team = canonicalTeam(row.team)
  const position = primaryPosition(row.position)
  const externalId = `${slug(team)}:${slug(row.player)}`
  return {
    id: playerId(team, row.player),
    source: { provider: 'kaggle', externalId },
    name: row.player,
    shirtNumber: num(row.generatedShirtNumber) || actualShirtNumber(row) || 99,
    primaryPosition: position,
    positions: [{ position, rating: rating(row) }],
    roles: [{ role: roleFor(position, row), rating: rating(row) }],
    attributes: attributesFor(position, row),
  }
}

function toSupplementalPlayerRow(row:CsvRow):CsvRow {
  const team = eventTeamName(row.team_id)
  const caps = num(row.caps)
  const goals = num(row.goals)
  const marketValue = num(row.market_value_eur)
  return {
    player: row.player_name,
    sourcePlayerId: row.player_id,
    actualShirtNumber: String(squadNumberByPlayerId.get(row.player_id) ?? ''),
    team,
    position: row.position,
    minutes: String(Math.max(120, caps * 22)),
    games_starts: String(Math.min(7, Math.floor(caps / 15))),
    goals: String(goals),
    assists: '0',
    goals_assists: String(goals),
    shots: String(Math.max(1, goals * 3)),
    shots_on_target: String(Math.max(1, goals * 2)),
    shots_on_target_per90: String(Math.max(0.2, goals / 8)),
    shots_per90: String(Math.max(0.8, goals / 5)),
    goals_per_shot: String(goals > 0 ? 0.12 : 0.03),
    crosses: row.position === 'DEF' || row.position === 'MID' ? '6' : '3',
    fouled: '4',
    fouls: row.position === 'DEF' || row.position === 'MID' ? '8' : '4',
    tackles_won: row.position === 'DEF' ? '12' : row.position === 'MID' ? '9' : '3',
    interceptions: row.position === 'DEF' ? '10' : row.position === 'MID' ? '7' : '2',
    offsides: row.position === 'FWD' ? '3' : '0',
    gk_save_pct: row.position === 'GK' ? '70' : '0',
    gk_games: row.position === 'GK' ? '1' : '0',
    market_value_eur: String(marketValue),
  }
}

function actualShirtNumber(row:CsvRow) {
  const explicit = num(row.actualShirtNumber || row.shirt_number || row.jersey_number)
  if (explicit > 0 && explicit <= 99) return explicit
  const mapped = squadNumberByNameTeam.get(`${slug(canonicalTeam(row.team))}:${slug(row.player)}`)
  return mapped && mapped > 0 ? mapped : undefined
}

function attributesFor(position:PlayerPosition, row:CsvRow):PlayerAttributes {
  const minutes = num(row.minutes)
  const starts = num(row.games_starts)
  const base = clamp(62 + Math.min(16, minutes / 35) + starts)
  if (position === 'GK') {
    const save = num(row.gk_save_pct)
    return { pace:58, finishing:35, passing:clamp(base - 2), crossing:38, dribbling:45, pressing:48, defense:clamp(68 + save / 5), stamina:clamp(64 + minutes / 45), offBall:48, heightPower:78 }
  }
  return {
    pace: clamp(base + num(row.offsides) * 2 + num(row.fouled)),
    finishing: clamp(56 + num(row.goals) * 7 + num(row.shots_on_target_per90) * 5 + num(row.goals_per_shot) * 25),
    passing: clamp(base + num(row.assists) * 5 + num(row.crosses) * .3),
    crossing: clamp(58 + num(row.crosses) * .8 + (position === 'LB' || position === 'RB' || position === 'LW' || position === 'RW' ? 8 : 0)),
    dribbling: clamp(base + num(row.fouled) * 1.2 + num(row.shots_per90)),
    pressing: clamp(base + num(row.fouls) * .8 + num(row.tackles_won) * 1.4),
    defense: clamp(56 + num(row.interceptions) * 2 + num(row.tackles_won) * 2 + (['CB', 'LB', 'RB', 'DM'].includes(position) ? 10 : 0)),
    stamina: clamp(66 + minutes / 30),
    offBall: clamp(base + num(row.goals_assists) * 4 + num(row.shots_per90) * 2),
    heightPower: clamp(64 + (position === 'CB' || position === 'ST' ? 9 : 0) + num(row.shots_on_target) * .8),
  }
}

function toMission(seed:ScenarioSeed):Mission {
  const fixture = worldCup2026Fixtures.find((item) => item.id === seed.fixtureId)
  const match = actualMatchByFixtureId.get(seed.fixtureId)
  const userTeamId = teamIdByName(seed.userTeam)
  const dismissedPlayerId = seed.dismissedPosition ? (match ? actualLineupFor(match, seed.userTeam).startXI : rosterFor(seed.userTeam).startXI).find((player) => player.primaryPosition === seed.dismissedPosition)?.id : undefined
  return {
    id: seed.id,
    source: { provider: 'manual', matchExternalId: seed.fixtureId },
    title: seed.title,
    type: seed.type,
    difficulty: seed.difficulty,
    situation: seed.situation,
    objective: seed.objective,
    context: {
      matchId: `github-worldcup2026-match-${seed.fixtureId}`,
      competition: '2026 World Cup IF',
      season: '2026',
      stage: fixture?.round ?? 'Group stage',
      period: seed.period,
      minute: seed.minute,
      score: seed.score,
      userTeamId,
      opponentTeamId: teamIdByName(seed.opponentTeam),
      availableSubstitutions: seed.availableSubstitutions,
      dismissedPlayerId,
      dismissedPosition: seed.dismissedPosition,
    },
    recommendedFormationId: seed.recommendedFormationId,
    opponentTraits: seed.opponentTraits,
    teamProblems: seed.teamProblems,
    actualFlowSummary: seed.actualFlowSummary,
    actualTimeline: seed.timeline.map((event, index) => timelineEvent(seed, event, index)),
    relatedFixtureId: seed.fixtureId,
    confidence: 'medium',
    dataSource: { provider: 'github-worldcup2026', fetchedAt: DATASET_FETCHED_AT },
  }
}

function toFixtureDetail(seed:ScenarioSeed):NormalizedFixtureDetail {
  const teams = [seed.userTeam, seed.opponentTeam]
  const match = actualMatchByFixtureId.get(seed.fixtureId)
  return {
    fixtureId: seed.fixtureId,
    events: seed.timeline.map((event) => ({ fixtureId: seed.fixtureId, minute: event[0], teamId: teamIdByName(event[5] ?? seed.userTeam), teamName: displayTeamName(event[5] ?? seed.userTeam), type: event[1] === 'red_card' ? 'Card' : event[1] === 'substitution' ? 'subst' : event[1] === 'goal' ? 'Goal' : 'Event', detail: event[2] })),
    lineups: teams.map((teamName) => {
      const lineup = match ? actualLineupFor(match, teamName) : rosterFor(teamName)
      return { fixtureId: seed.fixtureId, teamId: teamIdByName(teamName), teamName: displayTeamName(teamName), formation: inferredFormation(match, teamName, seed), startXI: lineup.startXI.map(lineupPlayer), substitutes: lineup.substitutes.map(lineupPlayer) }
    }),
    statistics: teams.map((teamName) => ({ fixtureId: seed.fixtureId, teamId: teamIdByName(teamName), teamName: displayTeamName(teamName), statistics: match ? actualStatisticsFor(match, teamName) : { 'Data basis': 'Kaggle players.csv + generated IF lineup seed' } })),
    playerStats: [],
  }
}

function rosterFor(teamName:string) {
  const rows = uniqueRows([...(playersByTeam.get(canonicalTeam(teamName)) ?? [])]).sort((a, b) => num(b.minutes) - num(a.minutes))
  const byPosition = {
    GK: rows.filter((row) => row.position.includes('GK')),
    DF: rows.filter((row) => row.position.includes('DF') || row.position.includes('DEF')),
    MF: rows.filter((row) => row.position.includes('MF') || row.position.includes('MID')),
    FW: rows.filter((row) => row.position.includes('FW') || row.position.includes('FWD')),
  }
  const startRows = takeUnique([...byPosition.GK.slice(0, 1), ...byPosition.DF.slice(0, 4), ...byPosition.MF.slice(0, 3), ...byPosition.FW.slice(0, 3)], 11)
  const fallbackRows = rows.filter((row) => !startRows.includes(row)).slice(0, Math.max(0, 11 - startRows.length))
  const selectedStartRows = takeUnique([...startRows, ...fallbackRows], 11)
  const startXI = selectedStartRows.map(playerFromRow)
  const substitutes = takeUnique(rows.filter((row) => !selectedStartRows.includes(row)), 9).map(playerFromRow)
  return { startXI, substitutes }
}

function actualLineupFor(match:CsvRow, teamName:string) {
  const rows = lineupRowsByMatchTeam.get(`${match.match_id}:${teamSourceId(teamName)}`) ?? []
  if (!rows.length) return rosterFor(teamName)
  const startRows = rows.filter((row) => row.is_starting_xi === '1')
  if (startRows.filter((row) => primaryPosition(eventSquadById.get(row.player_id)?.position ?? '') === 'GK').length !== 1) return rosterFor(teamName)
  const startXI = startRows.map(playerFromLineupRow).filter((player):player is Player=>Boolean(player))
  const substitutes = rows.filter((row) => row.is_starting_xi !== '1').map(playerFromLineupRow).filter((player):player is Player=>Boolean(player))
  if (startXI.length !== 11) return rosterFor(teamName)
  const uniqueStartXI = uniquePlayers(startXI)
  if (uniqueStartXI.length !== 11) return rosterFor(teamName)
  return { startXI: uniqueStartXI, substitutes: uniquePlayers(substitutes) }
}

function playerFromLineupRow(row:CsvRow):Player|undefined {
  const squadPlayer = eventSquadById.get(row.player_id)
  if (!squadPlayer) return undefined
  return playerFromRow(toSupplementalPlayerRow(squadPlayer))
}

function uniquePlayers(players:Player[]) {
  const seen = new Set<string>()
  return players.filter((player) => {
    if (seen.has(player.id)) return false
    seen.add(player.id)
    return true
  })
}

function playerFromRow(row:CsvRow):Player {
  return playerByNameTeam.get(`${slug(canonicalTeam(row.team))}:${slug(row.player)}`) ?? toPlayer({ ...row, generatedShirtNumber: String(actualShirtNumber(row) ?? 99) })
}

function lineupPlayer(player:Player) {
  return { id: player.id, name: player.name, number: player.shirtNumber, pos: actualPositionByPlayerId.get(player.id) ?? player.primaryPosition, grid: null }
}

function inferredFormation(match:CsvRow|undefined, teamName:string, seed:ScenarioSeed) {
  if (teamName === seed.userTeam) return seed.recommendedFormationId.replace('formation-', '')
  if (match) {
    const formation = formationFor(match, teamName)
    if (formation) return formation
  }
  if (!match) return '4-2-3-1'
  const lineup = actualLineupFor(match, teamName).startXI
  const defenders = lineup.filter((player) => player.primaryPosition === 'CB').length
  const midfielders = lineup.filter((player) => player.primaryPosition === 'CM').length
  const forwards = lineup.filter((player) => player.primaryPosition === 'ST').length
  if (defenders <= 3 && forwards >= 3) return '3-4-3'
  if (midfielders >= 4) return '4-2-3-1'
  return '4-3-3'
}

function timelineEvent(seed:ScenarioSeed, event:[number, ActualMatchTimelineEvent['type'], string, number, number, string?], index:number):ActualMatchTimelineEvent {
  return { id: `${seed.id}-event-${index + 1}`, minute: event[0], period: event[0] > 105 ? 'EXTRA_TIME_SECOND_HALF' : event[0] > 90 ? 'EXTRA_TIME_FIRST_HALF' : event[0] > 45 ? 'SECOND_HALF' : 'FIRST_HALF', teamId: teamIdByName(event[5] ?? seed.userTeam), type: event[1], summary: event[2], homeScore: event[3], awayScore: event[4] }
}

function scenario(id:string, fixtureId:string, userTeam:string, opponentTeam:string, title:string, type:MissionType, difficulty:1|2|3|4|5, minute:number, period:MatchContext['period'], score:{home:number;away:number}, situation:string, objectiveValue:MissionObjective, recommendedFormationId:string, availableSubstitutions:number, dismissedPosition:PlayerPosition|undefined, opponentTraits:string[], teamProblems:string[], actualFlowSummary:string, timeline:ScenarioSeed['timeline']):ScenarioSeed {
  return { id, fixtureId, userTeam, opponentTeam, title, type, difficulty, minute, period, score, situation, objective: objectiveValue, recommendedFormationId, availableSubstitutions, dismissedPosition, opponentTraits, teamProblems, actualFlowSummary, timeline }
}

function objective(type:MissionType, title:string, description:string, targetMinute:number, extra:Partial<MissionObjective> = {}):MissionObjective {
  return { type, title, description, targetMinute, ...extra }
}

function teamIdByName(name:string) { return teamId(slug(canonicalTeam(name))) }

function teamId(id:string) { return `github-worldcup2026-team-${id}` }
function playerId(team:string, player:string) { return `kaggle-player-${slug(team)}-${slug(player)}` }
function slug(value:string) { return value.normalize('NFKD').replace(/[^\w\s-]/g, '').trim().toLowerCase().replace(/[\s_]+/g, '-') || 'unknown' }
function canonicalTeam(value:string) { return teamAliases[value] ?? value }
function groupBy<T>(items:T[], key:(item:T)=>string) { return items.reduce((map, item) => map.set(key(item), [...(map.get(key(item)) ?? []), item]), new Map<string,T[]>()) }
function num(value:string|number|undefined|null) {
  if (typeof value === 'string') {
    const stoppage = value.trim().match(/^(\d+)\+(\d+)$/)
    if (stoppage) return Number(stoppage[1]) + Number(stoppage[2])
  }
  return Number.isFinite(Number(value)) ? Number(value) : 0
}
function numberOrNull(value:string) { return value === '' || value === 'null' ? null : num(value) }
function clamp(value:number) { return Math.max(35, Math.min(95, Math.round(value))) }
function rating(row:CsvRow) { return clamp(68 + num(row.minutes) / 45 + num(row.goals_assists) * 2 + num(row.tackles_won) * .7 + num(row.gk_save_pct) / 10) }

function primaryPosition(value:string):PlayerPosition {
  if (value.includes('GK')) return 'GK'
  if (value.includes('DF') || value.includes('DEF')) return 'CB'
  if (value.includes('FW') || value.includes('FWD')) return 'ST'
  if (value.includes('MF') || value.includes('MID')) return 'CM'
  return 'CM'
}

function roleFor(position:PlayerPosition, row:CsvRow):PlayerRole {
  if (position === 'GK') return num(row.gk_games) > 0 ? 'goalkeeper' : 'sweeper_keeper'
  if (position === 'CB') return num(row.crosses) > 2 ? 'full_back' : 'stopper'
  if (position === 'CM') return num(row.interceptions) > num(row.goals_assists) ? 'box_to_box' : 'advanced_playmaker'
  return num(row.crosses) > num(row.shots) ? 'winger' : 'pressing_forward'
}

function uniqueRows(rows:CsvRow[]) {
  const seen = new Set<string>()
  return rows.filter((row) => {
    const key = playerKey(row)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function playerKey(row:CsvRow) {
  return `${canonicalTeam(row.team)}:${slug(row.player)}`
}

function takeUnique(rows:CsvRow[], count:number) {
  return uniqueRows(rows).slice(0, count)
}

function assignSquadNumbers(rows:CsvRow[]):NumberedPlayerRow[] {
  const sorted = uniqueRows(rows).sort((a, b) => positionRank(a.position) - positionRank(b.position) || num(b.minutes) - num(a.minutes) || a.player.localeCompare(b.player))
  const used = new Set<number>()
  return sorted.map((row, index) => {
    const preferred = actualShirtNumber(row) ?? preferredNumber(row, index)
    const generatedShirtNumber = String(nextAvailable(preferred, used))
    return { ...row, generatedShirtNumber }
  })
}

function preferredNumber(row:CsvRow, index:number) {
  if (row.position.includes('GK')) return index === 0 ? 1 : 12 + index
  if (row.position.includes('DF') || row.position.includes('DEF')) return 2 + index
  if (row.position.includes('MF') || row.position.includes('MID')) return 6 + index
  if (row.position.includes('FW') || row.position.includes('FWD')) return 9 + index
  return 20 + index
}

function nextAvailable(start:number, used:Set<number>) {
  let value = ((start - 1) % 99) + 1
  while (used.has(value)) value = (value % 99) + 1
  used.add(value)
  return value
}

function positionRank(position:string) {
  if (position.includes('GK')) return 0
  if (position.includes('DF') || position.includes('DEF')) return 1
  if (position.includes('MF') || position.includes('MID')) return 2
  if (position.includes('FW') || position.includes('FWD')) return 3
  return 4
}

function scenarioFromActualMatch(row:CsvRow, index:number):ScenarioSeed[] {
  const fixtureId = actualFixtureId(row, index)
  const home = matchHome(row)
  const away = matchAway(row)
  const { home: homeGoals, away: awayGoals } = actualGoals(row)
  const events = enrichedEventsForMatch(row)
  const comeback = comebackScenario(fixtureId, row, events)
  if (comeback) return [comeback]
  const tiedPair = pairedTieScenarios(fixtureId, row, events)
  if (tiedPair.length) return tiedPair
  if (row.result_type === 'Penalties') {
    const shootoutTeam = penaltyWinner(row) ?? home
    return [penaltyOrderScenario(fixtureId, row, shootoutTeam, shootoutTeam === home ? away : home, events)]
  }
  if (displayRound(row.stage_name || row.round) === '조별리그') {
    // A qualification mission only makes sense from a tied state. Large deficits
    // (for example 0-3) cannot honestly be described as “score once and advance”.
    return []
  }
  if (displayRound(row.stage_name || row.round) !== '조별리그' && ['AET', 'Penalties'].includes(row.result_type)) return [extraTimeScenario(fixtureId, row, home, away, events)]
  return []
}

function pairedTieScenarios(fixtureId:string, row:CsvRow, events:MatchEventRow[]):ScenarioSeed[] {
  const home = matchHome(row)
  const away = matchAway(row)
  if (displayRound(row.stage_name || row.round) === '조별리그') {
    const [homeAt75, awayAt75] = homeAwayScoreAt(events, 75)
    if (homeAt75 === awayAt75) return [
      groupStageEscapeScenario(fixtureId, row, home, away, events),
      groupStageEscapeScenario(fixtureId, row, away, home, events),
    ]
  }
  const [homeAt80, awayAt80] = homeAwayScoreAt(events, 80)
  const finalGoals = actualGoals(row)
  if (homeAt80 === awayAt80 && finalGoals.home === finalGoals.away) return [
    lateWinnerScenario(fixtureId, row, home, away, homeAt80, awayAt80),
    lateWinnerScenario(fixtureId, row, away, home, awayAt80, homeAt80),
  ]
  const [homeAt90, awayAt90] = homeAwayScoreAt(events, 90)
  if (displayRound(row.stage_name || row.round) !== '조별리그' && ['AET', 'Penalties'].includes(row.result_type) && homeAt90 === awayAt90) return [
    extraTimeScenario(fixtureId, row, home, away, events),
    extraTimeScenario(fixtureId, row, away, home, events),
  ]
  return []
}

function comebackScenario(fixtureId:string, row:CsvRow, events:MatchEventRow[]):ScenarioSeed|undefined {
  const finalGoals = actualGoals(row)
  const winner = finalGoals.home > finalGoals.away ? matchHome(row) : finalGoals.away > finalGoals.home ? matchAway(row) : ''
  if (!winner) return undefined
  const opponent = winner === matchHome(row) ? matchAway(row) : matchHome(row)
  const goals = events.filter((event) => event.event_type === 'Goal')
  const firstTrailingGoal = goals.find((event) => scoreForTeam(row, winner, event.runningHome, event.runningAway).home < scoreForTeam(row, winner, event.runningHome, event.runningAway).away)
  if (!firstTrailingGoal) return undefined
  const equalizer = goals.find((event) => num(event.minute) > num(firstTrailingGoal.minute) && eventTeamName(event.team_id) === winner && scoreForTeam(row, winner, event.runningHome, event.runningAway).home >= scoreForTeam(row, winner, event.runningHome, event.runningAway).away)
  if (!equalizer) return undefined
  const minute = Math.max(num(firstTrailingGoal.minute) + 5, Math.min(num(equalizer.minute) - 10, num(firstTrailingGoal.minute) + 28))
  const startScore = scoreForTeam(row, winner, ...homeAwayScoreAt(events, minute))
  const userName = displayTeamName(winner)
  const opponentName = displayTeamName(opponent)
  const firstMinute = num(firstTrailingGoal.minute)
  const equalizerMinute = num(equalizer.minute)
  const winnerGoals = scoreForTeam(row, winner, finalGoals.home, finalGoals.away).home
  const opponentGoals = scoreForTeam(row, winner, finalGoals.home, finalGoals.away).away
  return scenario(
    `actual-${fixtureId}-comeback-${slug(winner)}`,
    fixtureId,
    winner,
    opponent,
    `${userName}의 역전 설계`,
    'trailing_draw',
    4,
    minute,
    periodForMinute(minute),
    startScore,
    `${matchTimeLabel(minute)}, ${userName}이 ${opponentName}에 ${startScore.home}-${startScore.away}로 끌려갑니다.`,
    objective('trailing_draw', '경기를 원점으로 돌리기', `실제 경기에서는 ${opponentName}이 먼저 득점한 뒤 ${userName}이 동점을 만들었습니다. 경기 종료 전 동점 이상을 만드세요.`, 90, { minimumGoalsFor:1 }),
    formationId(''),
    5,
    undefined,
    opponentProfileFromStats(row, opponent),
    [`${firstMinute}분 선제 실점 이후 공격 전환 속도를 높여야 함`, ...teamProblemsFromStats(row, winner).slice(0, 1)],
    `${actualScoreText(row)}. 실제 골 흐름은 ${opponentName} ${firstMinute}분 선제골, ${userName} ${equalizerMinute}분 동점골 이후 ${winnerGoals > opponentGoals ? `${winnerGoals}-${opponentGoals}로 역전승` : `${winnerGoals}-${opponentGoals} 무승부`}입니다.`,
    timelineFromEvents(row, events, winner),
  )
}

function groupStageEscapeScenario(fixtureId:string, row:CsvRow, userTeam:string, opponentTeam:string, events:MatchEventRow[]):ScenarioSeed {
  const minute = 75
  const userName = displayTeamName(userTeam)
  const opponentName = displayTeamName(opponentTeam)
  const startScore = scoreForTeam(row, userTeam, ...homeAwayScoreAt(events, minute))
  const needs = startScore.home > startScore.away ? '한 골을 더 넣어 조 2위 경쟁의 여지를 넓혀야 합니다.' : startScore.home === startScore.away ? '무승부로는 부족합니다. 결승골이 필요합니다.' : '패배 흐름을 뒤집어야 토너먼트 진출 가능성이 생깁니다.'
  return scenario(
    `actual-${fixtureId}-group-escape-${slug(userTeam)}`,
    fixtureId,
    userTeam,
    opponentTeam,
    `${userName} 조별리그 생존전`,
    'group_stage_escape',
    4,
    minute,
    periodForMinute(minute),
    startScore,
    `${matchTimeLabel(minute)}, ${userName}은 ${opponentName}전 ${startScore.home}-${startScore.away} 흐름을 바꿔야 합니다.`,
    objective('group_stage_escape', '결승골로 토너먼트 진출', `실제 경기는 ${actualScoreText(row)}로 끝났습니다. 남은 시간에 결승골을 만들어 토너먼트 진출 가능성을 살리세요.`, 90, { minimumGoalsFor:1 }),
    formationId(formationFor(row, userTeam)),
    5,
    undefined,
    opponentProfileFromStats(row, opponentTeam),
    [needs, ...teamProblemsFromStats(row, userTeam).slice(0, 1)],
    `${actualSummary(row)} ${matchTimeLabel(minute)} 스코어는 ${startScore.home}-${startScore.away}였습니다. 같은 시점에서 결승골을 만들어 조별리그 탈락 위기를 벗어나는 상황입니다.`,
    timelineFromEvents(row, events, userTeam, [[75, 'tactical_shift', `${userName} 벤치가 조별리그 통과를 위해 공격 숫자를 늘릴 타이밍을 검토합니다.`, startScore.home, startScore.away, userTeam]]),
  )
}

function lateWinnerScenario(fixtureId:string, row:CsvRow, userTeam:string, opponentTeam:string, userGoals:number, opponentGoals:number):ScenarioSeed {
  const userName = displayTeamName(userTeam)
  const opponentName = displayTeamName(opponentTeam)
  return scenario(
    `actual-${fixtureId}-late-${slug(userTeam)}`,
    fixtureId,
    userTeam,
    opponentTeam,
    `${userName} 마지막 10분`,
    'late_winner',
    4,
    80,
    'SECOND_HALF',
    { home: userGoals, away: opponentGoals },
    `후반 80분, ${userName}과 ${opponentName}이 ${userGoals}-${opponentGoals}로 맞서고 있습니다.`,
    objective('late_winner', '정규 시간 안에 결승골', `실제 경기는 ${actualScoreText(row)}로 끝났습니다. 남은 시간에 균형을 깨고 승리를 만들어 보세요.`, 90, { minimumGoalsFor:1 }),
    formationId(formationFor(row, userTeam)),
    5,
    undefined,
    opponentProfileFromStats(row, opponentTeam),
    teamProblemsFromStats(row, userTeam),
    actualSummary(row),
    timelineFromEvents(row, enrichedEventsForMatch(row), userTeam, [
      [80, 'tactical_shift', `${userName}이 실제 경기 막판 공격 숫자를 조정합니다.`, userGoals, opponentGoals, userTeam],
      [87, 'shot', `양 팀이 마지막 득점 기회를 만들었지만 승부를 가르지 못했습니다.`, userGoals, opponentGoals, userTeam],
    ]),
  )
}

function lateWinnerFromActualScenario(fixtureId:string, row:CsvRow, events:MatchEventRow[]):ScenarioSeed|undefined {
  const [homeAt80, awayAt80] = homeAwayScoreAt(events, 80)
  if (homeAt80 !== awayAt80) return undefined
  const finalGoals = actualGoals(row)
  if (finalGoals.home !== finalGoals.away) return undefined
  return lateWinnerScenario(fixtureId, row, matchHome(row), matchAway(row), homeAt80, awayAt80)
}

function extraTimeScenario(fixtureId:string, row:CsvRow, userTeam:string, opponentTeam:string, events:MatchEventRow[]):ScenarioSeed {
  const userName = displayTeamName(userTeam)
  const opponentName = displayTeamName(opponentTeam)
  const finalGoals = actualGoals(row)
  const finalScore = scoreForTeam(row, userTeam, finalGoals.home, finalGoals.away)
  const startScore = scoreForTeam(row, userTeam, ...homeAwayScoreAt(events, 90))
  return scenario(
    `actual-${fixtureId}-extra-${slug(userTeam)}`,
    fixtureId,
    userTeam,
    opponentTeam,
    `${userName} 연장전 승부수`,
    'extra_time_winner',
    5,
    90,
    'EXTRA_TIME_FIRST_HALF',
    startScore,
    `연장 전반 시작, ${userName}과 ${opponentName}이 ${startScore.home}-${startScore.away}로 맞서고 있습니다.`,
    objective('extra_time_winner', '승부차기 전에 득점', '승부차기 전에 추가 득점을 만들어 경기를 끝내세요.', 120, { minimumGoalsFor:1 }),
    formationId(''),
    2,
    undefined,
    opponentProfileFromStats(row, opponentTeam),
    ['연장전 체력 저하로 전방 압박 지속 시간이 짧아짐', ...teamProblemsFromStats(row, userTeam).slice(0, 1)],
    actualSummary(row),
    timelineFromEvents(row, events, userTeam, [[120, 'full_time', `실제 경기는 ${actualScoreText(row)} 이후 ${row.result_type === 'Penalties' ? '승부차기' : '연장 흐름'}로 마무리됐습니다.`, finalScore.home, finalScore.away, userTeam]]),
  )
}

function penaltyOrderScenario(fixtureId:string, row:CsvRow, userTeam:string, opponentTeam:string, events:MatchEventRow[]):ScenarioSeed {
  const userName = displayTeamName(userTeam)
  const opponentName = displayTeamName(opponentTeam)
  const finalGoals = actualGoals(row)
  const finalScore = scoreForTeam(row, userTeam, finalGoals.home, finalGoals.away)
  const penalties = penaltyScoreForTeam(row, userTeam)
  return scenario(
    `actual-${fixtureId}-penalty-order-${slug(userTeam)}`,
    fixtureId,
    userTeam,
    opponentTeam,
    `${userName} 승부차기 순서 변경`,
    'penalty_order',
    5,
    120,
    'EXTRA_TIME_SECOND_HALF',
    finalScore,
    `연장 종료 ${finalScore.home}-${finalScore.away}, 승부차기 ${penalties.home}-${penalties.away} 흐름을 다시 설계합니다.`,
    objective('penalty_order', '키커 순서로 승부차기 승리', `${opponentName} 골키퍼의 읽기 패턴을 고려해 남은 키커 순서를 바꾸고 승부차기를 이기세요.`, 120),
    formationId(''),
    0,
    undefined,
    opponentProfileFromStats(row, opponentTeam),
    ['기존 키커 순서가 체력과 압박 내성을 충분히 반영하지 못함', ...teamProblemsFromStats(row, userTeam).slice(0, 1)],
    `${actualSummary(row)} 연장 종료 실제 스코어는 ${finalScore.home}-${finalScore.away}, 실제 승부차기 스코어는 ${penalties.home}-${penalties.away}입니다. IF 기준 상황에서는 키커 순서 변경이 승부차기 결과를 바꾸는 핵심 선택입니다.`,
    timelineFromEvents(row, events, userTeam, [[120, 'full_time', `연장전은 실제로 ${finalScore.home}-${finalScore.away}로 끝났고 승부차기에 돌입했습니다.`, finalScore.home, finalScore.away, userTeam], [121, 'tactical_shift', `${userName} 벤치가 승부차기 키커 순서를 재검토합니다. 실제 승부차기 스코어는 ${penalties.home}-${penalties.away}였습니다.`, finalScore.home, finalScore.away, userTeam]]),
  )
}

function actualFixtureId(row:CsvRow, index:number) {
  return `kaggle-match-${row.match_id || String(index + 1).padStart(2, '0')}-${slug(matchHome(row))}-${slug(matchAway(row))}`
}

function actualScoreText(row:CsvRow) {
  const goals = actualGoals(row)
  return `${displayTeamName(matchHome(row))} ${goals.home}-${goals.away} ${displayTeamName(matchAway(row))}`
}

function actualSummary(row:CsvRow) {
  const homeStats = statsForTeam(row, matchHome(row))
  const awayStats = statsForTeam(row, matchAway(row))
  return `실제 경기 데이터 기준 ${actualScoreText(row)}. 점유율 ${homeStats.possession_pct}-${awayStats.possession_pct}, 유효슈팅 ${homeStats.shots_on_target}-${awayStats.shots_on_target}, 총슈팅 ${homeStats.total_shots}-${awayStats.total_shots}, 코너 ${homeStats.corners}-${awayStats.corners}.`
}

function actualStatisticsFor(row:CsvRow, teamName:string):Record<string, string | number | null> {
  const stats = statsForTeam(row, teamName)
  return {
    Possession: num(stats.possession_pct),
    'Shots on target': num(stats.shots_on_target),
    'Total shots': num(stats.total_shots),
    Corners: num(stats.corners),
    Fouls: num(stats.fouls),
    Offsides: num(stats.offsides),
    Saves: num(stats.saves),
    'Player of the match': stats.player_of_the_match || null,
    Source: stats.data_source || 'Kaggle match_team_stats.csv',
  }
}

function opponentProfileFromStats(row:CsvRow, opponentTeam:string) {
  const stats = statsForTeam(row, opponentTeam)
  const traits = [`점유율 ${num(stats.possession_pct)}% · 총슈팅 ${num(stats.total_shots)}회`, `유효슈팅 ${num(stats.shots_on_target)}회 · 코너 ${num(stats.corners)}회`]
  if (num(stats.corners) >= 5) traits.push('코너킥과 세트피스 위협')
  if (num(stats.fouls) >= 13) traits.push('파울로 템포를 끊는 강한 경합')
  if (num(stats.offsides) >= 2) traits.push('라인 뒤 공간을 반복적으로 노리는 침투')
  return traits
}

function teamProblemsFromStats(row:CsvRow, userTeam:string) {
  const stats = statsForTeam(row, userTeam)
  const problems = [`실제 유효슈팅 ${num(stats.shots_on_target)}회 · 파울 ${num(stats.fouls)}회`]
  if (num(stats.saves) >= 4) problems.push('골키퍼 선방 의존도가 높았던 흐름')
  if (num(stats.total_shots) <= 8) problems.push('슈팅 생산량 부족')
  if (num(stats.possession_pct) <= 45) problems.push('볼 점유 시간이 짧아 수비 시간이 길었음')
  return problems
}

function formationId(value:string) {
  if (value === '3-4-3') return 'formation-343'
  if (value === '4-2-3-1') return 'formation-4231'
  return 'formation-433'
}

function codeForTeam(name:string) {
  const canonical = canonicalTeam(name)
  return teamCodes[canonical] || eventTeamRows.find((row) => canonicalTeam(row.team_name) === canonical)?.fifa_code || teamRows.find((row) => canonicalTeam(row.name_en) === canonical)?.fifa_code || canonical.slice(0, 3).toUpperCase()
}

function venueCity(venue:string) {
  const parts = venue.split(',')
  return parts.length > 1 ? parts.slice(1).join(',').trim() : null
}

function uniqueStrings(values:string[]) {
  return [...new Set(values.filter(Boolean))]
}

function displayTeamName(name:string) {
  const canonical = canonicalTeam(name)
  return teamKoreanNames[canonical] ?? canonical
}

function displayRound(round:string) {
  if (round === 'Group stage' || round === 'Group Stage') return '조별리그'
  if (round === 'Round of 32') return '32강'
  if (round === 'Round of 16') return '16강'
  if (round === 'Quarter-finals') return '8강'
  if (round === 'Semi-finals') return '4강'
  if (round === 'Third-place match') return '3위 결정전'
  if (round === 'Final') return '결승'
  return round || '월드컵'
}

function hasConsistentScoreData(row:CsvRow) {
  const finalScore = actualGoals(row)
  const eventGoals = matchEventRows.filter((event) => event.match_id === row.match_id && event.event_type === 'Goal')
  const eventScore = eventGoals.reduce((score, event) => {
    const team = eventTeamName(event.team_id)
    if (team === matchHome(row)) return { ...score, home: score.home + 1 }
    if (team === matchAway(row)) return { ...score, away: score.away + 1 }
    return score
  }, { home: 0, away: 0 })
  if (eventScore.home !== finalScore.home || eventScore.away !== finalScore.away) return false
  const summary = matchSummaryByKey.get(matchSummaryKeyFromDetailed(row))
  if (!summary) return true
  return num(summary.home_score) === finalScore.home && num(summary.away_score) === finalScore.away
}

function matchSummaryKey(row:CsvRow) {
  return `${row.date}:${canonicalTeam(row.home_team)}:${canonicalTeam(row.away_team)}`
}

function matchSummaryKeyFromDetailed(row:CsvRow) {
  return `${row.date}:${matchHome(row)}:${matchAway(row)}`
}

function matchSummaryFor(row:CsvRow) {
  return matchSummaryByKey.get(matchSummaryKeyFromDetailed(row))
}

function formationFor(row:CsvRow, teamName:string) {
  const summary = matchSummaryFor(row)
  if (!summary) return ''
  return teamName === matchHome(row) ? summary.home_formation : summary.away_formation
}

function actualGoals(row:CsvRow) {
  if (row.home_score !== '' && row.away_score !== '') return { home: num(row.home_score), away: num(row.away_score) }
  const scores = [...row.score.matchAll(/(\d+)\s*[\u2013-]\s*(\d+)/g)]
  const match = scores.at(-1)
  return { home: match ? Number(match[1]) : 0, away: match ? Number(match[2]) : 0 }
}

function penaltyWinner(row:CsvRow) {
  const homePenalties = num(row.home_penalty_score)
  const awayPenalties = num(row.away_penalty_score)
  if (homePenalties === awayPenalties) return undefined
  return homePenalties > awayPenalties ? matchHome(row) : matchAway(row)
}

function penaltyScoreForTeam(row:CsvRow, userTeam:string) {
  const home = num(row.home_penalty_score)
  const away = num(row.away_penalty_score)
  return userTeam === matchHome(row) ? { home, away } : { home: away, away: home }
}

function finalMinute(row:CsvRow) {
  return row.result_type === 'AET' || row.result_type === 'Penalties' ? 120 : 90
}

function matchHome(row:CsvRow) {
  return canonicalTeam(row.home_team_name || row.home_team || '')
}

function matchAway(row:CsvRow) {
  return canonicalTeam(row.away_team_name || row.away_team || '')
}

function eventTeamName(teamId:string|number|undefined) {
  return eventTeamById.get(String(teamId ?? '')) ?? 'Unknown'
}

function eventType(type:string):ActualMatchTimelineEvent['type'] {
  if (type === 'Goal' || type === 'Penalty Shootout Goal') return 'goal'
  if (type === 'Red Card') return 'red_card'
  if (type === 'Yellow Card' || type === 'VAR Review') return 'tactical_shift'
  return 'shot'
}

function enrichedEventsForMatch(row:CsvRow):MatchEventRow[] {
  const events = [...(eventsByMatchId.get(row.match_id) ?? [])].sort((a, b) => num(a.minute) - num(b.minute) || num(a.event_id) - num(b.event_id))
  let runningHome = 0
  let runningAway = 0
  return events.map((event) => {
    if (event.event_type === 'Goal') {
      const team = eventTeamName(event.team_id)
      if (team === matchHome(row)) runningHome += 1
      if (team === matchAway(row)) runningAway += 1
    }
    return { event_id: event.event_id, match_id: event.match_id, minute: event.minute, event_type: event.event_type, team_id: event.team_id, player_id: event.player_id, runningHome, runningAway }
  })
}

function homeAwayScoreAt(events:MatchEventRow[], minute:number):[number, number] {
  const last = [...events].reverse().find((event) => event.event_type === 'Goal' && num(event.minute) <= minute)
  return last ? [last.runningHome, last.runningAway] : [0, 0]
}

function scoreForTeam(row:CsvRow, userTeam:string, homeScore:number, awayScore:number) {
  return userTeam === matchHome(row) ? { home: homeScore, away: awayScore } : { home: awayScore, away: homeScore }
}

function timelineFromEvents(row:CsvRow, events:MatchEventRow[], userTeam:string, extra:ScenarioSeed['timeline'] = []):ScenarioSeed['timeline'] {
  const mappedEvents = events
    .filter((event) => ['Goal', 'Red Card', 'Yellow Card', 'Penalty Shootout Goal', 'Penalty Shootout Miss'].includes(event.event_type))
    .map((event):ScenarioSeed['timeline'][number] => {
      const team = eventTeamName(event.team_id)
      const score = scoreForTeam(row, userTeam, event.runningHome, event.runningAway)
      return [num(event.minute), eventType(event.event_type), eventSummary(event, team), score.home, score.away, team]
    })
  const finalGoals = actualGoals(row)
  const finalScore = scoreForTeam(row, userTeam, finalGoals.home, finalGoals.away)
  const finalEvent:ScenarioSeed['timeline'][number] = [finalMinute(row), 'full_time', `실제 최종 스코어는 ${actualScoreText(row)}입니다.`, finalScore.home, finalScore.away, userTeam]
  return [...mappedEvents, ...extra, finalEvent]
    .sort((a, b) => a[0] - b[0])
    .filter((event, index, all) => index === all.findIndex((candidate) => candidate[0] === event[0] && candidate[1] === event[1] && candidate[2] === event[2]))
}

function eventSummary(event:{ event_type:string; minute:string }, team:string) {
  const teamName = displayTeamName(team)
  if (event.event_type === 'Goal') return `${teamName}이 ${event.minute}분 득점했습니다.`
  if (event.event_type === 'Red Card') return `${teamName}에 ${event.minute}분 퇴장이 나왔습니다.`
  if (event.event_type === 'Yellow Card') return `${teamName}에 ${event.minute}분 경고가 나왔습니다.`
  if (event.event_type === 'Penalty Shootout Goal') return `${teamName}이 승부차기에서 성공했습니다.`
  if (event.event_type === 'Penalty Shootout Miss') return `${teamName}이 승부차기에서 실축했습니다.`
  return `${teamName}의 주요 이벤트입니다.`
}

function statsForTeam(row:CsvRow, teamName:string) {
  const teamId = teamSourceId(teamName)
  return matchStatsByKey.get(`${row.match_id}:${teamId}`) ?? ({} as CsvRow)
}

function teamSourceId(teamName:string) {
  return eventTeamRows.find((team) => canonicalTeam(team.team_name) === canonicalTeam(teamName))?.team_id ?? ''
}

function periodForMinute(minute:number):MatchContext['period'] {
  if (minute > 105) return 'EXTRA_TIME_SECOND_HALF'
  if (minute > 90) return 'EXTRA_TIME_FIRST_HALF'
  return minute > 45 ? 'SECOND_HALF' : 'FIRST_HALF'
}

function matchTimeLabel(minute:number) {
  if (minute > 90) return `연장 ${minute - 90}분`
  return minute > 45 ? `후반 ${minute}분` : `전반 ${minute}분`
}
