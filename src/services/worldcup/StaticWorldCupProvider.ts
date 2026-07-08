import type { WorldCupDataProvider, WorldCupSnapshot } from './WorldCupDataProvider'

export class StaticWorldCupProvider implements WorldCupDataProvider {
  readonly name='static-snapshot'
  constructor(private readonly generated:WorldCupSnapshot,private readonly fallback:WorldCupSnapshot){}
  getSnapshotSync(){return isUsableSnapshot(this.generated)?this.generated:this.fallback}
  async getWorldCup2026(){return this.getSnapshotSync()}
}

export function isUsableSnapshot(snapshot:WorldCupSnapshot){if(!snapshot||snapshot.schemaVersion!==1||snapshot.missions.length===0||snapshot.teams.length===0||snapshot.players.length===0)return false;const teamsById=new Map(snapshot.teams.map(team=>[team.id,team])),playerIds=new Set(snapshot.players.map(player=>player.id)),referencedTeamIds=new Set(snapshot.missions.flatMap(m=>[m.context.userTeamId,m.context.opponentTeamId]));return [...referencedTeamIds].every(id=>{const team=teamsById.get(id);return Boolean(team&&team.startingPlayerIds.length>=10&&[...team.startingPlayerIds,...team.benchPlayerIds].every(playerId=>playerIds.has(playerId)))})}
