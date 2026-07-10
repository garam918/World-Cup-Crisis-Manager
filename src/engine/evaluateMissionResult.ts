import type { Mission } from '../entities/mission/types'
import type { SimulationEvent } from '../entities/simulation/types'

export function evaluateMissionResult(mission:Mission,finalScore:{home:number;away:number},timeline:SimulationEvent[]):boolean{const start=mission.context.score;const scored=finalScore.home-start.home;switch(mission.type){case'trailing_draw':return finalScore.home>=finalScore.away;case'late_winner':return scored>0&&finalScore.home>finalScore.away;case'penalty_order':return finalScore.home>finalScore.away;case'group_stage_escape':return scored>0&&finalScore.home>finalScore.away;case'extra_time_winner':return scored>0&&finalScore.home>finalScore.away}}
