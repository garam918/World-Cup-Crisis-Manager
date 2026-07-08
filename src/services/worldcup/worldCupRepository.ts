import { loadWorldCup2026Data } from './loadWorldCup2026Data'

const loadedWorldCupData = loadWorldCup2026Data()

// Browser runtime is intentionally snapshot/static only. API credentials are used exclusively by scripts/syncWorldCup2026.ts.
export const worldCupData = loadedWorldCupData
export const worldCupDataMode = loadedWorldCupData.source
export const worldCupFixtures = loadedWorldCupData.fixtures
export const worldCupFixtureDetails = loadedWorldCupData.fixtureDetails
export const worldCupSnapshot = loadedWorldCupData.snapshot
export const worldCupMissions = loadedWorldCupData.missionCandidates
export const worldCupTeams = loadedWorldCupData.appTeams
export const worldCupPlayers = loadedWorldCupData.appPlayers
export const worldCupPlayerById = new Map(worldCupPlayers.map((player) => [player.id, player]))
export const getWorldCupMission = (id: string | null) => worldCupMissions.find((mission) => mission.id === id) ?? worldCupMissions[0]
export const getWorldCupTeam = (id: string) => worldCupTeams.find((team) => team.id === id) ?? worldCupTeams[0]
export const isGeneratedWorldCupSnapshot = loadedWorldCupData.source === 'github-kaggle-static'
export const getWorldCupFixture = (id?: string) => loadedWorldCupData.fixtures.find((fixture) => fixture.id === id)
export const getWorldCupFixtureDetail = (id?: string) => loadedWorldCupData.fixtureDetails.find((detail) => detail.fixtureId === id)
export const getLineupForMission = (missionId: string | null) => {
  const mission = getWorldCupMission(missionId)
  const detail = getWorldCupFixtureDetail(mission.relatedFixtureId)
  return detail?.lineups.find((lineup) => lineup.teamId === mission.context.userTeamId)
}
