import 'dotenv/config'
import { mkdir, rename, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { requestApiFootball } from '../src/services/worldcup/apiFootballClient'
import type {
  ApiFootballFixture,
  ApiFootballFixtureEvent,
  ApiFootballFixtureLineup,
  ApiFootballFixturePlayerStats,
  ApiFootballFixtureStatistic,
  ApiFootballStandingResponse,
  ApiFootballTeamResponse,
} from '../src/services/worldcup/apiFootballTypes'
import { generateMissionCandidates } from '../src/services/worldcup/generateMissionCandidates'
import {
  createSnapshot,
  normalizeFixtureDetail,
  normalizeFixtures,
  normalizeStandings,
  normalizeTeams,
  type NormalizedWorldCupFixture,
} from '../src/services/worldcup/normalizeApiFootball'

const leagueId = Number(process.env.API_FOOTBALL_LEAGUE_ID ?? 1)
const season = Number(process.env.API_FOOTBALL_SEASON ?? 2026)
const fetchedAt = new Date().toISOString()
const directory = resolve(process.cwd(), 'src/data/generated')

const [rawFixtures, rawTeams, rawStandings] = await Promise.all([
  requestApiFootball<ApiFootballFixture[]>('/fixtures', { league: leagueId, season }),
  requestApiFootball<ApiFootballTeamResponse[]>('/teams', { league: leagueId, season }),
  requestApiFootball<ApiFootballStandingResponse[]>('/standings', { league: leagueId, season }),
])

const fixtures = normalizeFixtures(rawFixtures)
const teams = normalizeTeams(rawTeams)
const standings = normalizeStandings(rawStandings)
const detailFixtures = selectDetailFixtures(fixtures)
const details = []

for (const fixture of detailFixtures) {
  try {
    const [events, lineups, statistics, players] = await Promise.all([
      requestApiFootball<ApiFootballFixtureEvent[]>('/fixtures/events', { fixture: fixture.id }),
      requestApiFootball<ApiFootballFixtureLineup[]>('/fixtures/lineups', { fixture: fixture.id }),
      requestApiFootball<ApiFootballFixtureStatistic[]>('/fixtures/statistics', { fixture: fixture.id }),
      requestApiFootball<ApiFootballFixturePlayerStats[]>('/fixtures/players', { fixture: fixture.id }),
    ])
    details.push(normalizeFixtureDetail(fixture.id, events, lineups, statistics, players))
  } catch (error) {
    console.warn(`Skipping fixture detail ${fixture.id}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

const snapshot = createSnapshot({ leagueId, fetchedAt, fixtures, teams, standings, details })
const missionCandidates = generateMissionCandidates(fixtures, details, fetchedAt)

await mkdir(directory, { recursive: true })
await Promise.all([
  writeJson('worldCup2026Snapshot.generated.json', snapshot),
  writeJson('worldCup2026Fixtures.generated.json', fixtures),
  writeJson('worldCup2026Teams.generated.json', teams),
  writeJson('worldCup2026Standings.generated.json', standings),
  writeJson('worldCup2026FixtureDetails.generated.json', details),
  writeJson('worldCup2026MissionCandidates.generated.json', missionCandidates),
])

console.log(`World Cup 2026 API snapshot synced at ${fetchedAt}`)
console.log(`fixtures=${fixtures.length}, teams=${teams.length}, standingGroups=${standings.length}, details=${details.length}, missionCandidates=${missionCandidates.length}`)
console.log(`detailFixtureIds=${details.map((detail) => detail.fixtureId).join(',') || 'none'}`)

function selectDetailFixtures(fixtures: NormalizedWorldCupFixture[]) {
  const configuredIds = (process.env.SYNC_FIXTURE_IDS ?? '').split(',').map((id) => id.trim()).filter(Boolean)
  if (configuredIds.length) return fixtures.filter((fixture) => configuredIds.includes(fixture.id))
  const completed = fixtures.filter((fixture) => ['FT', 'AET', 'PEN'].includes(fixture.status.short ?? '')).slice(0, 8)
  if (completed.length) return completed
  const live = fixtures.filter((fixture) => ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE'].includes(fixture.status.short ?? '')).slice(0, 8)
  if (live.length) return live
  const now = Date.now()
  return [...fixtures].sort((a, b) => Math.abs(Date.parse(a.date) - now) - Math.abs(Date.parse(b.date) - now)).slice(0, 3)
}

async function writeJson(filename: string, data: unknown) {
  const target = resolve(directory, filename)
  const temporary = `${target}.tmp`
  await writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  await rename(temporary, target)
}
