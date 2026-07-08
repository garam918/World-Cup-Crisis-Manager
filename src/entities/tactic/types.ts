import type { PlayerPosition, PlayerRole } from '../player/types'

export interface FormationSlot { id:string; position:PlayerPosition; x:number; y:number; defaultRole:PlayerRole }
export interface Formation { id:string; name:string; label:string; slots:FormationSlot[] }
export interface TacticalInstructions {
  defensiveLine:'low'|'medium'|'high'
  pressingIntensity:'low'|'medium'|'high'
  tempo:'slow'|'balanced'|'fast'
  attackDirection:'left'|'center'|'right'|'balanced'
  riskLevel:'safe'|'balanced'|'aggressive'
}
export type TacticalOptionKey=keyof TacticalInstructions
export type TacticalOptionValue=TacticalInstructions[TacticalOptionKey]
export interface TacticalInstruction { key:TacticalOptionKey; label:string; description:string; options:{value:TacticalOptionValue;label:string}[] }
export type EditablePlayerRole='advanced_forward'|'link_forward'|'pressing_forward'|'wide_dribbler'|'inside_runner'|'defensive_winger'|'attacking_midfielder'|'balanced_midfielder'|'holding_midfielder'|'attacking_fullback'|'balanced_fullback'|'defensive_fullback'|'cover_defender'|'fighter_defender'|'sweeper_keeper'|'standard_keeper'
export interface PlayerPlacement { playerId:string;slotId:string;x:number;y:number;role:EditablePlayerRole }
export interface TacticalEffects { attack:number;defensiveStability:number;midfieldControl:number;chanceCreation:number;counterRisk:number;staminaCost:number;setPieceThreat:number }
export interface Tactic { formationId:string;instructions:TacticalInstructions;playerRoles:Record<string,PlayerRole> }
export interface SimulationInput { missionId:string;teamId:string;opponentTeamId:string;formationId:string;players:PlayerPlacement[];benchPlayerIds:string[];substitutions:{outPlayerId:string;inPlayerId:string}[];instructions:TacticalInstructions;expectedEffects:TacticalEffects }
