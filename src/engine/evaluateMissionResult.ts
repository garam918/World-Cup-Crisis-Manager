import type { Mission } from '../entities/mission/types'
import type { SimulationEvent } from '../entities/simulation/types'

export function evaluateMissionResult(mission:Mission,finalScore:{home:number;away:number},timeline:SimulationEvent[]):boolean{const start=mission.context.score;const conceded=finalScore.away-start.away;const scored=finalScore.home-start.home;switch(mission.type){case'trailing_draw':return finalScore.home>=finalScore.away;case'red_card_survival':return conceded===0&&timeline.every(e=>e.minute<=mission.objective.targetMinute);case'protect_lead':return conceded===0&&finalScore.home>finalScore.away;case'extra_time_winner':return scored>0&&finalScore.home>finalScore.away;case'late_winner':return scored>0&&finalScore.home>finalScore.away}}
