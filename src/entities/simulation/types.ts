import type { MatchPeriod, MissionType, Score } from '../mission/types'

export type SimulationEventType='build_up'|'progressive_pass'|'wing_attack'|'central_attack'|'box_entry'|'shot'|'big_chance'|'goal'|'save'|'turnover'|'counter_attack'|'foul'|'card'|'set_piece'|'defensive_block'|'stamina_drop'
export interface TeamMetrics { attackPower:number;defenseStability:number;midfieldControl:number;chanceCreation:number;counterRisk:number;setPieceThreat:number;staminaLevel:number;pressingPower:number;transitionThreat:number }
export interface SimulationEvent { id:string;minute:number;period:MatchPeriod;teamId:string;type:SimulationEventType;text:string;score:Score;momentumDelta:number;probability:number;isKeyEvent:boolean }
export interface SingleSimulationResult { seed:number;finalScore:Score;missionSuccess:boolean;timeline:SimulationEvent[];userGoals:number;opponentGoals:number;followsActualBaseline:boolean }
export interface WinDrawLoseProbability { win:number;draw:number;loss:number }
export interface SimulationResult {
  missionId:string;objectiveType:MissionType;finalScore:Score;missionSuccess:boolean
  successProbability:number;winDrawLoseProbability:WinDrawLoseProbability;timeline:SimulationEvent[]
  keyDecisions:string[];tacticalSummary:string;riskSummary:string;actualComparisonSummary:string;recommendation:string
  monteCarloRuns:number;representativeSeed:number;followsActualBaseline:boolean
}
