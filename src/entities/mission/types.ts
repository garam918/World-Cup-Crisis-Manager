import type { PlayerPosition } from '../player/types'

export type MissionType='trailing_draw'|'red_card_survival'|'protect_lead'|'extra_time_winner'|'late_winner'
export type MatchPeriod='FIRST_HALF'|'SECOND_HALF'|'EXTRA_TIME_FIRST_HALF'|'EXTRA_TIME_SECOND_HALF'

export interface Score { home:number; away:number }
export interface MissionObjective { type:MissionType; title:string; description:string; targetMinute:number; minimumGoalsFor?:number; maximumGoalsAgainst?:number }
export interface MatchContext {
  matchId:string;competition:string;season:string;stage:string;period:MatchPeriod;minute:number
  score:Score;userTeamId:string;opponentTeamId:string;availableSubstitutions:number
  dismissedPlayerId?:string;dismissedPosition?:PlayerPosition
}
export interface ActualMatchTimelineEvent {
  id:string;minute:number;period:MatchPeriod;teamId:string;type:'kick_off'|'goal'|'shot'|'save'|'substitution'|'red_card'|'tactical_shift'|'full_time'
  summary:string;homeScore:number;awayScore:number;sourceEventId?:string
}
export interface Mission {
  id:string;source:{provider:'seed'|'statsbomb'|'api-football'|'manual';matchExternalId?:string};title:string;type:MissionType;difficulty:1|2|3|4|5
  situation:string;objective:MissionObjective;context:MatchContext;recommendedFormationId:string
  opponentTraits:string[];teamProblems:string[];actualFlowSummary:string;actualTimeline:ActualMatchTimelineEvent[]
  relatedFixtureId?:string
  isGeneratedFromApi?:boolean
  confidence?:'high'|'medium'|'low'
  dataSource?:{provider:'api-football'|'github-worldcup2026'|'kaggle'|'static'|'manual';fetchedAt?:string;snapshotDate?:string}
}
