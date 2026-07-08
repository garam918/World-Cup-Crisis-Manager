import { getWorldCupMission as getMission } from '../services/worldcup/worldCupRepository'
import { getFormation } from '../data/formations'
import type { SimulationResult, SingleSimulationResult } from '../entities/simulation/types'
import type { SimulationInput } from '../entities/tactic/types'
import { seedFrom } from './random'
import { runSingleSimulation } from './runSingleSimulation'

const round=(n:number)=>Math.round(n*1000)/1000
export function runMonteCarloSimulation(input:SimulationInput,runs=300):SimulationResult{const count=Math.max(50,Math.min(1000,runs)),baseSeed=seedFrom(input),outcomes:SingleSimulationResult[]=[];let success=0,win=0,draw=0,loss=0
  for(let i=0;i<count;i++){const outcome=runSingleSimulation(input,(baseSeed+Math.imul(i+1,2654435761))>>>0);outcomes.push(outcome);if(outcome.missionSuccess)success++;const diff=outcome.finalScore.home-outcome.finalScore.away;if(diff>0)win++;else if(diff===0)draw++;else loss++}
  const targetSuccess=success/count>=.5,averageDiff=outcomes.reduce((sum,o)=>sum+o.finalScore.home-o.finalScore.away,0)/count;const candidates=outcomes.filter(o=>o.missionSuccess===targetSuccess);const representative=(candidates.length?candidates:outcomes).reduce((best,current)=>Math.abs((current.finalScore.home-current.finalScore.away)-averageDiff)<Math.abs((best.finalScore.home-best.finalScore.away)-averageDiff)?current:best)
  const mission=getMission(input.missionId),effects=input.expectedEffects,formation=getFormation(input.formationId)
  return {missionId:input.missionId,objectiveType:mission.type,finalScore:representative.finalScore,missionSuccess:representative.missionSuccess,successProbability:round(success/count),winDrawLoseProbability:{win:round(win/count),draw:round(draw/count),loss:round(loss/count)},timeline:representative.timeline,keyDecisions:buildKeyDecisions(input,formation.name),tacticalSummary:`${formation.name}에서 공격력 ${effects.attack}, 중원 장악력 ${effects.midfieldControl}로 계산됐습니다. ${input.instructions.tempo==='fast'?'빠른 템포가 찬스 빈도를 높였지만 턴오버도 늘렸습니다.':'공격 전개 속도와 점유 안정성의 균형을 선택했습니다.'}`,riskSummary:`역습 위험 ${effects.counterRisk}, 체력 소모 ${effects.staminaCost} 수준입니다. ${input.instructions.riskLevel==='aggressive'?'공격 숫자를 늘린 만큼 실점 가능성도 함께 상승했습니다.':input.instructions.riskLevel==='safe'?'실점 위험을 낮춘 대신 득점 기대치도 제한됐습니다.':'위험과 보상의 균형을 유지했습니다.'}`,actualComparisonSummary:`실제 흐름: ${mission.actualFlowSummary} IF 시뮬레이션에서는 같은 시작점에서 전술 선택에 따라 성공 가능성이 ${Math.round(success/count*100)}%로 계산됐습니다.`,recommendation:recommend(input),monteCarloRuns:count,representativeSeed:representative.seed}
}

export const runSimulation=runMonteCarloSimulation
function buildKeyDecisions(input:SimulationInput,formation:string){const direction={left:'왼쪽',center:'중앙',right:'오른쪽',balanced:'균형'}[input.instructions.attackDirection];return [`${formation} 포메이션 선택`,`${direction} 중심 공격과 ${input.instructions.tempo} 템포`,`${input.instructions.pressingIntensity} 압박 · ${input.instructions.defensiveLine} 수비 라인`,input.substitutions.length?`교체 카드 ${input.substitutions.length}장 활용`:'선발 라인업 유지']}
function recommend(input:SimulationInput){const e=input.expectedEffects;if(e.counterRisk>=65)return'수비 라인을 한 단계 낮추거나 위험 감수를 balanced로 조정하면 역습 노출을 줄일 수 있습니다.';if(e.staminaCost>=65)return'후반 체력 저하를 고려해 압박 강도나 템포를 한 단계 낮추는 선택을 검토하세요.';if(e.chanceCreation<60)return'공격 템포를 높이거나 창의적인 역할을 추가해 박스 진입 빈도를 높이세요.';return'현재 구조는 균형적입니다. 경기 상황에 따라 공격 방향을 상대 약점 쪽으로 조정하세요.'}
