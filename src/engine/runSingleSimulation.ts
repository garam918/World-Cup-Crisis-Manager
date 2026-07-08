import { getWorldCupMission as getMission } from '../services/worldcup/worldCupRepository'
import type { MatchPeriod } from '../entities/mission/types'
import type { SingleSimulationResult } from '../entities/simulation/types'
import type { SimulationInput } from '../entities/tactic/types'
import { calculateOpponentMetrics, calculateTeamMetrics } from './calculateTeamMetrics'
import { evaluateMissionResult } from './evaluateMissionResult'
import { generateSimulationEvent } from './generateSimulationEvent'
import { createSeededRandom } from './random'

const periodFor=(minute:number):MatchPeriod=>minute<=45?'FIRST_HALF':minute<=90?'SECOND_HALF':minute<=105?'EXTRA_TIME_FIRST_HALF':'EXTRA_TIME_SECOND_HALF'
export function runSingleSimulation(input:SimulationInput,seed:number):SingleSimulationResult{const mission=getMission(input.missionId),random=createSeededRandom(seed);let minute=mission.context.minute,score={...mission.context.score},index=0;const timeline=[];const endMinute=mission.objective.targetMinute
  while(minute<endMinute){minute=Math.min(endMinute,minute+random.integer(1,3));const progress=(minute-mission.context.minute)/Math.max(1,endMinute-mission.context.minute);const pressDrain=input.instructions.pressingIntensity==='high'?.22:input.instructions.pressingIntensity==='low'?.08:.14;const tempoDrain=input.instructions.tempo==='fast'?.1:input.instructions.tempo==='slow'?-.02:.04;const staminaFactor=Math.max(.58,1-progress*(pressDrain+tempoDrain));const event=generateSimulationEvent({minute,period:periodFor(minute),score,input,userMetrics:calculateTeamMetrics(input,staminaFactor),opponentMetrics:calculateOpponentMetrics(input,Math.max(.65,1-progress*.16)),random,eventIndex:index++});score=event.score;timeline.push(event)}
  const missionSuccess=evaluateMissionResult(mission,score,timeline);return {seed,finalScore:score,missionSuccess,timeline,userGoals:score.home-mission.context.score.home,opponentGoals:score.away-mission.context.score.away}}
