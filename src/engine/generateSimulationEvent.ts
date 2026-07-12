import type { MatchPeriod, Score } from '../entities/mission/types'
import type { SimulationEvent, SimulationEventType, TeamMetrics } from '../entities/simulation/types'
import type { SimulationInput } from '../entities/tactic/types'
import type { SeededRandom } from './random'

export interface GenerateEventContext { minute:number;period:MatchPeriod;score:Score;input:SimulationInput;userMetrics:TeamMetrics;opponentMetrics:TeamMetrics;random:SeededRandom;eventIndex:number }
const clamp01=(n:number)=>Math.max(.01,Math.min(.95,n))
export function generateSimulationEvent(c:GenerateEventContext):SimulationEvent{const control=c.userMetrics.midfieldControl/(c.userMetrics.midfieldControl+c.opponentMetrics.midfieldControl);const userAttacks=c.random.chance(clamp01(control+(c.userMetrics.pressingPower-c.opponentMetrics.pressingPower)/350));const attacking=userAttacks?c.userMetrics:c.opponentMetrics,defending=userAttacks?c.opponentMetrics:c.userMetrics;const attackingTeamId=userAttacks?c.input.teamId:c.input.opponentTeamId
  const chance=(attacking.chanceCreation*.55+attacking.attackPower*.25+attacking.transitionThreat*.2-defending.defenseStability*.35)/100
  const finishingEdge=Math.max(0,(attacking.attackPower+attacking.chanceCreation-defending.defenseStability*1.15)/100)
  const lateUrgency=userAttacks&&c.minute>=75&&c.input.instructions.riskLevel==='aggressive'?0.035:0
  const turnoverBoost=(userAttacks?c.input.instructions.tempo==='fast':false)?7:0;const counterBoost=!userAttacks?c.userMetrics.counterRisk*.18:0;const setPiece=attacking.setPieceThreat/100
  const selectedType=c.random.weighted<SimulationEventType>([
    {value:'build_up',weight:18},{value:'progressive_pass',weight:13+chance*8},{value:'wing_attack',weight:(c.input.instructions.attackDirection==='left'||c.input.instructions.attackDirection==='right')&&userAttacks?15:8},{value:'central_attack',weight:c.input.instructions.attackDirection==='center'&&userAttacks?15:8},
    {value:'box_entry',weight:4.3+chance*15+finishingEdge*2},{value:'shot',weight:5.4+chance*15+finishingEdge*2.5},{value:'big_chance',weight:2.2+chance*9+finishingEdge*3},{value:'turnover',weight:7+turnoverBoost},{value:'counter_attack',weight:4+counterBoost},{value:'foul',weight:5},{value:'card',weight:1.3},{value:'set_piece',weight:3+setPiece*6},{value:'defensive_block',weight:6+defending.defenseStability/16},{value:'save',weight:2+defending.defenseStability/28},{value:'stamina_drop',weight:c.minute>=75?4:1},{value:'goal',weight:1.45+Math.max(0,chance)*5.45+finishingEdge*2.8+(setPiece>.72?1.15:0)}
  ])
  const goalProbability=clamp01(.045+attacking.attackPower/1025+attacking.chanceCreation/1160+attacking.transitionThreat/2100-defending.defenseStability/2450+finishingEdge*.06+lateUrgency+(c.input.instructions.riskLevel==='aggressive'&&userAttacks?0.04:0)+(selectedType==='big_chance'?0.26:selectedType==='shot'?0.12:selectedType==='box_entry'?0.085:selectedType==='set_piece'?0.085:0))
  const type:SimulationEventType=selectedType==='goal'||(['big_chance','shot','box_entry','set_piece'].includes(selectedType)&&c.random.chance(goalProbability))?'goal':selectedType
  const isGoal=type==='goal';const score={...c.score};if(isGoal){if(userAttacks)score.home+=1;else score.away+=1}
  const probability=type==='goal'?goalProbability:clamp01(chance)
  return {id:`sim-${c.eventIndex}-${c.minute}`,minute:c.minute,period:c.period,teamId:attackingTeamId,type,text:eventText(type,userAttacks,c.input.instructions.attackDirection),score,momentumDelta:userAttacks?(isGoal?18:type==='big_chance'?9:3):(isGoal?-18:type==='big_chance'?-9:-3),probability,isKeyEvent:isGoal||type==='big_chance'||type==='card'||type==='stamina_drop'}
}

function eventText(type:SimulationEventType,user:boolean,direction:SimulationInput['instructions']['attackDirection']){const side=user?'우리 팀':'상대 팀';const texts:Record<SimulationEventType,string>={build_up:`${side}이 후방에서 차분하게 공격을 시작합니다.`,progressive_pass:`${side}의 전진 패스가 압박 라인을 통과합니다.`,wing_attack:`${side}이 ${direction==='left'?'왼쪽':direction==='right'?'오른쪽':'측면'} 공간을 공략합니다.`,central_attack:`${side}이 중앙에서 짧은 패스로 틈을 만듭니다.`,box_entry:`${side}이 페널티 박스 안으로 진입합니다!`,shot:`${side}의 슈팅! 수비가 몸을 던집니다.`,big_chance:`결정적인 기회! ${side} 공격수가 골키퍼와 마주합니다.`,goal:`골! ${side}이 마침내 골망을 흔듭니다!`,save:`골키퍼의 선방! ${side}의 슈팅을 막아냅니다.`,turnover:`${side}이 전진 과정에서 공을 빼앗깁니다.`,counter_attack:`빠른 역습! ${side}이 열린 공간으로 질주합니다.`,foul:`중원에서 거친 파울로 흐름이 끊깁니다.`,card:`주심이 카드를 꺼냅니다. 이후 압박에 부담이 생깁니다.`,set_piece:`${side}에 좋은 위치의 세트피스 기회입니다.`,defensive_block:`수비 블록이 박스 앞 공간을 단단히 막아냅니다.`,stamina_drop:`선수들의 움직임이 무거워집니다. 체력 저하가 보입니다.`};return texts[type]}
