import type { Mission, MatchContext, ActualMatchTimelineEvent } from '../../entities/mission/types'
import type { Player } from '../../entities/player/types'
import type { Team } from '../../entities/team/types'

export const WORLD_CUP_2026_QUERY={league:1,season:2026} as const

export interface RawWorldCupData {
  provider:'api-football'|'static'
  league:number
  season:number
  fetchedAt:string
  matches:unknown[]
  teams:unknown[]
  standings:unknown[]
  players:unknown[]
}

export interface NormalizedWorldCupMatch { id:string;date:string;stage:string;homeTeamId:string;awayTeamId:string;context:MatchContext;timeline:ActualMatchTimelineEvent[] }
export interface WorldCupStanding { rank:number;teamId:string;group:string;played:number;won:number;drawn:number;lost:number;goalsFor:number;goalsAgainst:number;points:number }
export interface WorldCupSnapshot {
  schemaVersion:1
  generatedAt:string|null
  provider:'api-football'|'static-seed'
  league:number
  season:number
  missions:Mission[]
  teams:Team[]
  players:Player[]
  matches:NormalizedWorldCupMatch[]
  standings:WorldCupStanding[]
}

export interface WorldCupDataProvider { readonly name:string;getWorldCup2026():Promise<WorldCupSnapshot> }
