import { create } from 'zustand'
import { getFormation } from '../../data/formations'
import { getLineupForMission, getWorldCupMission as getMission, worldCupPlayerById as playerById, getWorldCupTeam as getTeam } from '../../services/worldcup/worldCupRepository'
import { defaultInstructions, playerRoleOptions, roleGroupForPosition } from '../../data/tactics'
import { calculateTacticalEffects } from '../../engine/calculateTacticalEffects'
import type { EditablePlayerRole, PlayerPlacement, SimulationInput, TacticalInstructions } from '../../entities/tactic/types'

interface EditorState {
  missionId:string|null;formationId:string;players:PlayerPlacement[];benchPlayerIds:string[]
  substitutions:{outPlayerId:string;inPlayerId:string}[];instructions:TacticalInstructions
  selectedPlayerId:string|null
  initialize:(missionId:string)=>void;setFormation:(id:string)=>void;movePlayer:(id:string,x:number,y:number)=>void
  substitute:(outId:string,inId:string)=>void;swapPlayers:(a:string,b:string)=>void
  setInstruction:<K extends keyof TacticalInstructions>(key:K,value:TacticalInstructions[K])=>void
  selectPlayer:(id:string)=>void;setPlayerRole:(id:string,role:EditablePlayerRole)=>void
  toSimulationInput:()=>SimulationInput|null
}

const defaultRole=(playerId:string):EditablePlayerRole=>{const position=playerById.get(playerId)?.primaryPosition??'CM';return playerRoleOptions[roleGroupForPosition(position)][0].value}
const slotsFor=(formationId:string,count:number,dismissedPosition?:string)=>{const slots=[...getFormation(formationId).slots];if(count===10){const index=slots.map(s=>s.position).lastIndexOf((dismissedPosition??'CB') as never);if(index>=0)slots.splice(index,1);else slots.splice(3,1)}return slots.slice(0,count)}
const place=(ids:string[],formationId:string,dismissedPosition?:string)=>{const slots=slotsFor(formationId,ids.length,dismissedPosition);return ids.map((playerId,index)=>({playerId,slotId:slots[index].id,x:slots[index].x,y:slots[index].y,role:defaultRole(playerId)}))}

export const useTacticEditorStore=create<EditorState>((set,get)=>({
  missionId:null,formationId:'formation-433',players:[],benchPlayerIds:[],substitutions:[],instructions:{...defaultInstructions},selectedPlayerId:null,
  initialize:(missionId)=>{if(get().missionId===missionId)return;const mission=getMission(missionId),team=getTeam(mission.context.userTeamId),lineup=getLineupForMission(missionId);const startingIds=(lineup?.startXI.map(player=>player.id)??team.startingPlayerIds).filter(id=>id!==mission.context.dismissedPlayerId);const benchIds=lineup?.substitutes.map(player=>player.id)??team.benchPlayerIds;set({missionId,formationId:mission.recommendedFormationId,players:place(startingIds,mission.recommendedFormationId,mission.context.dismissedPosition),benchPlayerIds:[...benchIds],substitutions:[],instructions:{...defaultInstructions},selectedPlayerId:startingIds[0]??null})},
  setFormation:(formationId)=>set(state=>{const roles=new Map(state.players.map(p=>[p.playerId,p.role]));const players=place(state.players.map(p=>p.playerId),formationId,getMission(state.missionId).context.dismissedPosition).map(p=>({...p,role:roles.get(p.playerId)??p.role}));return {formationId,players}}),
  movePlayer:(playerId,x,y)=>set(state=>({players:state.players.map(p=>p.playerId===playerId?{...p,x:Math.max(4,Math.min(96,x)),y:Math.max(4,Math.min(96,y))}:p)})),
  substitute:(outPlayerId,inPlayerId)=>set(state=>{if(state.substitutions.length>=5||!state.benchPlayerIds.includes(inPlayerId))return state;const outgoing=state.players.find(p=>p.playerId===outPlayerId);if(!outgoing)return state;return {players:state.players.map(p=>p.playerId===outPlayerId?{...p,playerId:inPlayerId,role:defaultRole(inPlayerId)}:p),benchPlayerIds:state.benchPlayerIds.map(id=>id===inPlayerId?outPlayerId:id),substitutions:[...state.substitutions,{outPlayerId,inPlayerId}],selectedPlayerId:inPlayerId}}),
  swapPlayers:(a,b)=>set(state=>{const pa=state.players.find(p=>p.playerId===a),pb=state.players.find(p=>p.playerId===b);if(!pa||!pb)return state;return {players:state.players.map(p=>p.playerId===a?{...p,slotId:pb.slotId,x:pb.x,y:pb.y}:p.playerId===b?{...p,slotId:pa.slotId,x:pa.x,y:pa.y}:p)}}),
  setInstruction:(key,value)=>set(state=>({instructions:{...state.instructions,[key]:value}})),
  selectPlayer:(selectedPlayerId)=>set({selectedPlayerId}),
  setPlayerRole:(playerId,role)=>set(state=>({players:state.players.map(p=>p.playerId===playerId?{...p,role}:p)})),
  toSimulationInput:()=>{const state=get();if(!state.missionId)return null;const mission=getMission(state.missionId);return {missionId:state.missionId,teamId:mission.context.userTeamId,opponentTeamId:mission.context.opponentTeamId,formationId:state.formationId,players:state.players,benchPlayerIds:state.benchPlayerIds,substitutions:state.substitutions,instructions:state.instructions,expectedEffects:calculateTacticalEffects(state.players,state.instructions)}}
}))
