import { create } from 'zustand'
import { getFormation } from '../../data/formations'
import { getLineupForMission, getWorldCupFixtureDetail, getWorldCupMission as getMission, worldCupPlayerById as playerById, getWorldCupTeam as getTeam } from '../../services/worldcup/worldCupRepository'
import { defaultInstructions, playerRoleOptions, roleGroupForPosition } from '../../data/tactics'
import { calculateTacticalEffects } from '../../engine/calculateTacticalEffects'
import type { EditablePlayerRole, PlayerPlacement, SimulationInput, TacticalEffects, TacticalInstructions } from '../../entities/tactic/types'

interface EditorState {
  missionId:string|null;formationId:string;players:PlayerPlacement[];benchPlayerIds:string[]
  substitutions:{outPlayerId:string;inPlayerId:string}[];instructions:TacticalInstructions
  selectedPlayerId:string|null;positionOverrides:Record<string,string>;baselineEffects:TacticalEffects|null
  initialize:(missionId:string)=>void;setFormation:(id:string)=>void;movePlayer:(id:string,x:number,y:number)=>void
  substitute:(outId:string,inId:string)=>void;swapPlayers:(a:string,b:string)=>void
  setInstruction:<K extends keyof TacticalInstructions>(key:K,value:TacticalInstructions[K])=>void
  selectPlayer:(id:string)=>void;setPlayerRole:(id:string,role:EditablePlayerRole)=>void
  toSimulationInput:()=>SimulationInput|null
}

const defaultRole=(playerId:string):EditablePlayerRole=>{const position=playerById.get(playerId)?.primaryPosition??'CM';return playerRoleOptions[roleGroupForPosition(position)][0].value}
const slotsFor=(formationId:string,count:number,dismissedPosition?:string)=>{const slots=[...getFormation(formationId).slots];if(count===10){const index=slots.map(s=>s.position).lastIndexOf((dismissedPosition??'CB') as never);if(index>=0)slots.splice(index,1);else slots.splice(3,1)}return slots.slice(0,count)}
const slotGroup=(position:string)=>position==='GK'?'GK':['LB','CB','RB','LWB','RWB'].includes(position)?'DF':['DM','CM','AM'].includes(position)?'MF':'FW'
const playerGroup=(playerId:string,overrides:Record<string,string>={})=>{const position=overrides[playerId]??playerById.get(playerId)?.primaryPosition??'CM';return position==='GK'?'GK':position==='CB'||position==='LB'||position==='RB'||position==='LWB'||position==='RWB'?'DF':position==='ST'||position==='LW'||position==='RW'?'FW':'MF'}
const groupRank:Record<string,number>={GK:0,DF:1,MF:2,FW:3}
const place=(ids:string[],formationId:string,dismissedPosition?:string,overrides:Record<string,string>={})=>{const available=slotsFor(formationId,ids.length,dismissedPosition);return [...ids].sort((a,b)=>groupRank[playerGroup(a,overrides)]-groupRank[playerGroup(b,overrides)]).map(playerId=>{const group=playerGroup(playerId,overrides);const index=available.findIndex(slot=>slotGroup(slot.position)===group);const [slot]=available.splice(index>=0?index:0,1);return {playerId,slotId:slot.id,x:slot.x,y:slot.y,role:defaultRole(playerId)}})}
const n=(value:unknown)=>Number.isFinite(Number(value))?Number(value):0
const realInstructions=(missionId:string):TacticalInstructions=>{const mission=getMission(missionId),detail=getWorldCupFixtureDetail(mission.relatedFixtureId),stats=detail?.statistics.find(item=>item.teamId===mission.context.userTeamId)?.statistics??{};const shots=n(stats['Total shots']),onTarget=n(stats['Shots on target']),corners=n(stats.Corners),fouls=n(stats.Fouls),possession=n(stats.Possession),offsides=n(stats.Offsides);return {...defaultInstructions,defensiveLine:offsides>=2?'high':possession<45?'low':'medium',pressingIntensity:fouls>=13?'high':fouls<=8?'low':'medium',tempo:shots>=14?'fast':possession>=55?'slow':'balanced',attackDirection:corners>=5?'left':'balanced',riskLevel:onTarget>=5?'aggressive':shots<=8?'safe':'balanced',width:corners>=5?'wide':possession>=55?'narrow':'balanced',buildUpStyle:possession>=55?'possession':shots>=14?'direct':'balanced',chanceCreation:corners>=5?'crosses':offsides>=2?'through_balls':'balanced',defensiveApproach:fouls>=13?'man_marking':possession>=55?'zonal':'balanced'}}

export const useTacticEditorStore=create<EditorState>((set,get)=>({
  missionId:null,formationId:'formation-433',players:[],benchPlayerIds:[],substitutions:[],instructions:{...defaultInstructions},selectedPlayerId:null,positionOverrides:{},baselineEffects:null,
  initialize:(missionId)=>{if(get().missionId===missionId)return;const mission=getMission(missionId),team=getTeam(mission.context.userTeamId),lineup=getLineupForMission(missionId);const startingIds=(lineup?.startXI.map(player=>player.id)??team.startingPlayerIds).filter(id=>id!==mission.context.dismissedPlayerId);const benchIds=(lineup?.substitutes.map(player=>player.id)??team.benchPlayerIds).filter(id=>id!==mission.context.dismissedPlayerId&&!startingIds.includes(id));const positionOverrides=[...(lineup?.startXI??[]),...(lineup?.substitutes??[])].reduce<Record<string,string>>((map,player)=>map[player.id]?map:{...map,[player.id]:player.pos??''},{});const players=place(startingIds,mission.recommendedFormationId,mission.context.dismissedPosition,positionOverrides),instructions=realInstructions(missionId);set({missionId,formationId:mission.recommendedFormationId,players,benchPlayerIds:[...benchIds],substitutions:[],instructions,selectedPlayerId:startingIds[0]??null,positionOverrides,baselineEffects:calculateTacticalEffects(players,instructions)})},
  setFormation:(formationId)=>set(state=>{const roles=new Map(state.players.map(p=>[p.playerId,p.role]));const players=place(state.players.map(p=>p.playerId),formationId,getMission(state.missionId).context.dismissedPosition,state.positionOverrides).map(p=>({...p,role:roles.get(p.playerId)??p.role}));return {formationId,players}}),
  movePlayer:(playerId,x,y)=>set(state=>({players:state.players.map(p=>p.playerId===playerId?{...p,x:Math.max(4,Math.min(96,x)),y:Math.max(4,Math.min(96,y))}:p)})),
  substitute:(outPlayerId,inPlayerId)=>set(state=>{if(state.substitutions.length>=5||!state.benchPlayerIds.includes(inPlayerId))return state;const outgoing=state.players.find(p=>p.playerId===outPlayerId);if(!outgoing)return state;return {players:state.players.map(p=>p.playerId===outPlayerId?{...p,playerId:inPlayerId,role:defaultRole(inPlayerId)}:p),benchPlayerIds:state.benchPlayerIds.map(id=>id===inPlayerId?outPlayerId:id),substitutions:[...state.substitutions,{outPlayerId,inPlayerId}],selectedPlayerId:inPlayerId}}),
  swapPlayers:(a,b)=>set(state=>{const pa=state.players.find(p=>p.playerId===a),pb=state.players.find(p=>p.playerId===b);if(!pa||!pb)return state;return {players:state.players.map(p=>p.playerId===a?{...p,slotId:pb.slotId,x:pb.x,y:pb.y}:p.playerId===b?{...p,slotId:pa.slotId,x:pa.x,y:pa.y}:p)}}),
  setInstruction:(key,value)=>set(state=>({instructions:{...state.instructions,[key]:value}})),
  selectPlayer:(selectedPlayerId)=>set({selectedPlayerId}),
  setPlayerRole:(playerId,role)=>set(state=>({players:state.players.map(p=>p.playerId===playerId?{...p,role}:p)})),
  toSimulationInput:()=>{const state=get();if(!state.missionId)return null;const mission=getMission(state.missionId),expectedEffects=calculateTacticalEffects(state.players,state.instructions);return {missionId:state.missionId,teamId:mission.context.userTeamId,opponentTeamId:mission.context.opponentTeamId,formationId:state.formationId,players:state.players,benchPlayerIds:state.benchPlayerIds,substitutions:state.substitutions,instructions:state.instructions,expectedEffects,baselineEffects:state.baselineEffects??expectedEffects}}
}))
