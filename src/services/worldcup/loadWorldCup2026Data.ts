import {
  worldCup2026AppTeams,
  worldCup2026FixtureDetails,
  worldCup2026Fixtures,
  worldCup2026Missions,
  worldCup2026Players,
  worldCup2026Snapshot,
  worldCup2026Standings,
  worldCup2026Teams,
} from '../../data/worldCup2026Static'
import type { Mission } from '../../entities/mission/types'
import type { Player } from '../../entities/player/types'
import type { Team } from '../../entities/team/types'
import type {
  NormalizedFixtureDetail,
  NormalizedWorldCupFixture,
  NormalizedWorldCupStandingGroup,
  NormalizedWorldCupTeam,
  WorldCup2026Snapshot,
} from './normalizeApiFootball'

export type WorldCup2026DataSource = 'github-kaggle-static' | 'static-fallback'
export type LoadedWorldCup2026Data = {
  source: WorldCup2026DataSource
  snapshot: WorldCup2026Snapshot | null
  fixtures: NormalizedWorldCupFixture[]
  teams: NormalizedWorldCupTeam[]
  standings: NormalizedWorldCupStandingGroup[]
  fixtureDetails: NormalizedFixtureDetail[]
  missionCandidates: Mission[]
  appTeams: Team[]
  appPlayers: Player[]
}

export function loadWorldCup2026Data(): LoadedWorldCup2026Data {
  return {
    source: 'github-kaggle-static',
    snapshot: worldCup2026Snapshot,
    fixtures: worldCup2026Fixtures,
    teams: worldCup2026Teams,
    standings: worldCup2026Standings,
    fixtureDetails: worldCup2026FixtureDetails,
    missionCandidates: worldCup2026Missions,
    appTeams: worldCup2026AppTeams,
    appPlayers: worldCup2026Players,
  }
}
