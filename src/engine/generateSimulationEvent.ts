import type { MatchPeriod, Score } from '../entities/mission/types'
import type { SimulationEvent, SimulationEventType, TeamMetrics } from '../entities/simulation/types'
import type { SimulationInput } from '../entities/tactic/types'
import type { SeededRandom } from './random'
import { getWorldCupTeam as getTeam, worldCupPlayerById as playerById } from '../services/worldcup/worldCupRepository'

export interface GenerateEventContext { minute:number;endMinute:number;period:MatchPeriod;score:Score;input:SimulationInput;userMetrics:TeamMetrics;opponentMetrics:TeamMetrics;random:SeededRandom;eventIndex:number }
export interface MatchStateModifiers {
  userAttackShareDelta:number
  userCounterRiskMultiplier:number
  opponentCounterRiskMultiplier:number
  userUrgencyBonus:number
  opponentUrgencyBonus:number
  userLeadProtection:number
  opponentLeadProtection:number
}
const clamp01=(n:number)=>Math.max(.01,Math.min(.95,n))
export function calculateMatchStateModifiers(score:Score,minute:number,endMinute:number):MatchStateModifiers {
  const remaining=Math.max(0,endMinute-minute)
  const closingFactor=1-Math.min(1,remaining/30)
  const stabilizationMultiplier=.58-closingFactor*.18
  const urgency=.025+closingFactor*.035
  const protection=.018+closingFactor*.065
  if(score.home>score.away)return {userAttackShareDelta:-.075,userCounterRiskMultiplier:stabilizationMultiplier,opponentCounterRiskMultiplier:1,userUrgencyBonus:0,opponentUrgencyBonus:urgency,userLeadProtection:protection,opponentLeadProtection:0}
  if(score.home<score.away)return {userAttackShareDelta:.075,userCounterRiskMultiplier:1,opponentCounterRiskMultiplier:stabilizationMultiplier,userUrgencyBonus:urgency,opponentUrgencyBonus:0,userLeadProtection:0,opponentLeadProtection:protection}
  return {userAttackShareDelta:0,userCounterRiskMultiplier:1,opponentCounterRiskMultiplier:1,userUrgencyBonus:0,opponentUrgencyBonus:0,userLeadProtection:0,opponentLeadProtection:0}
}
export function generateSimulationEvent(c:GenerateEventContext):SimulationEvent{const state=calculateMatchStateModifiers(c.score,c.minute,c.endMinute);const control=c.userMetrics.midfieldControl/(c.userMetrics.midfieldControl+c.opponentMetrics.midfieldControl);const userAttacks=c.random.chance(clamp01(control+(c.userMetrics.pressingPower-c.opponentMetrics.pressingPower)/350+state.userAttackShareDelta));const attacking=userAttacks?c.userMetrics:c.opponentMetrics,defending=userAttacks?c.opponentMetrics:c.userMetrics;const attackingTeamId=userAttacks?c.input.teamId:c.input.opponentTeamId
  const chance=(attacking.chanceCreation*.55+attacking.attackPower*.25+attacking.transitionThreat*.2-defending.defenseStability*.35)/100
  const finishingEdge=Math.max(0,(attacking.attackPower+attacking.chanceCreation-defending.defenseStability*1.15)/100)
  const lateUrgency=userAttacks&&c.minute>=75&&c.input.instructions.riskLevel==='aggressive'?0.035:0
  const turnoverBoost=(userAttacks?c.input.instructions.tempo==='fast':false)?7:0;const counterBoost=userAttacks?c.opponentMetrics.counterRisk*.18*state.opponentCounterRiskMultiplier:c.userMetrics.counterRisk*.18*state.userCounterRiskMultiplier;const setPiece=attacking.setPieceThreat/100
  const selectedType=c.random.weighted<SimulationEventType>([
    {value:'build_up',weight:18},{value:'progressive_pass',weight:13+chance*8},{value:'wing_attack',weight:(c.input.instructions.attackDirection==='left'||c.input.instructions.attackDirection==='right')&&userAttacks?15:8},{value:'central_attack',weight:c.input.instructions.attackDirection==='center'&&userAttacks?15:8},
    {value:'box_entry',weight:4.3+chance*15+finishingEdge*2},{value:'shot',weight:5.4+chance*15+finishingEdge*2.5},{value:'big_chance',weight:2.2+chance*9+finishingEdge*3},{value:'turnover',weight:7+turnoverBoost},{value:'counter_attack',weight:4+counterBoost},{value:'foul',weight:5},{value:'card',weight:1.3},{value:'set_piece',weight:3+setPiece*6},{value:'defensive_block',weight:6+defending.defenseStability/16},{value:'save',weight:2+defending.defenseStability/28},{value:'stamina_drop',weight:c.minute>=75?4:1},{value:'goal',weight:1.45+Math.max(0,chance)*5.45+finishingEdge*2.8+(setPiece>.72?1.15:0)}
  ])
  const stateGoalAdjustment=userAttacks?state.userUrgencyBonus-state.opponentLeadProtection:state.opponentUrgencyBonus-state.userLeadProtection
  const goalProbability=clamp01(.045+attacking.attackPower/1025+attacking.chanceCreation/1160+attacking.transitionThreat/2100-defending.defenseStability/2450+finishingEdge*.06+lateUrgency+stateGoalAdjustment+(c.input.instructions.riskLevel==='aggressive'&&userAttacks?0.04:0)+(selectedType==='big_chance'?0.26:selectedType==='shot'?0.12:selectedType==='box_entry'?0.085:selectedType==='set_piece'?0.085:0))
  const type:SimulationEventType=selectedType==='goal'||(['big_chance','shot','box_entry','set_piece'].includes(selectedType)&&c.random.chance(goalProbability))?'goal':selectedType
  const isGoal=type==='goal';const score={...c.score};if(isGoal){if(userAttacks)score.home+=1;else score.away+=1}
  const probability=type==='goal'?goalProbability:clamp01(chance)
  const playerName=commentaryPlayer(c.input,userAttacks,type,c.eventIndex)
  return {id:`sim-${c.eventIndex}-${c.minute}`,minute:c.minute,period:c.period,teamId:attackingTeamId,type,text:eventText(type,userAttacks,c.input.instructions.attackDirection,playerName,score,c.minute,c.endMinute),score,momentumDelta:userAttacks?(isGoal?18:type==='big_chance'?9:3):(isGoal?-18:type==='big_chance'?-9:-3),probability,isKeyEvent:isGoal||type==='big_chance'||type==='card'||type==='stamina_drop'}
}

function commentaryPlayer(input:SimulationInput,user:boolean,type:SimulationEventType,index:number){const ids=user?input.players.map(player=>player.playerId):getTeam(input.opponentTeamId).startingPlayerIds;const players=ids.map(id=>playerById.get(id)).filter((player):player is NonNullable<typeof player>=>Boolean(player));const attacking=['goal','shot','big_chance','box_entry','wing_attack','counter_attack'].includes(type);const creative=['build_up','progressive_pass','central_attack','set_piece'].includes(type);const preferred=players.filter(player=>attacking?['ST','LW','RW','AM'].includes(player.primaryPosition):creative?['DM','CM','AM','LW','RW'].includes(player.primaryPosition):player.primaryPosition!=='GK');const pool=preferred.length?preferred:players;return pool[index%Math.max(1,pool.length)]?.name??(user?'우리 선수':'상대 선수')}

function eventText(type:SimulationEventType,user:boolean,direction:SimulationInput['instructions']['attackDirection'],player:string,score:Score,minute:number,endMinute:number){const side=user?'우리 팀':'상대 팀',lane=direction==='left'?'왼쪽':direction==='right'?'오른쪽':'측면',closing=endMinute-minute<=5?' 이제 남은 시간이 많지 않습니다.':'';const goalState=score.home===score.away?' 승부가 다시 원점입니다!':user&&score.home>score.away||!user&&score.away>score.home?' 마침내 리드를 잡습니다!':' 추격의 불씨를 살립니다!';const texts:Record<SimulationEventType,string>={build_up:`${player}, 후방에서 공을 받아 템포를 조절합니다. ${side}이 패스 길을 찾습니다.`,progressive_pass:`${player}의 전진 패스가 압박선 사이를 정확히 통과합니다.`,wing_attack:`${player}이 ${lane} 터치라인을 타고 전진합니다. 크로스 각도를 만듭니다.`,central_attack:`${player}이 중앙에서 원투 패스를 시도하며 수비 간격을 흔듭니다.`,box_entry:`${player}이 박스 안으로 파고듭니다. 수비가 급히 따라붙습니다!`,shot:`${player}, 지체하지 않고 슈팅! 수비가 몸을 던져 막아냅니다.`,big_chance:`결정적인 기회! ${player}이 골키퍼와 마주합니다!`,goal:`${player}의 슈팅—골! ${side}이 골망을 흔듭니다.${goalState}`,save:`${player}의 슈팅을 골키퍼가 선방합니다! 세컨드 볼이 아직 살아 있습니다.`,turnover:`${player}이 전진 패스를 시도했지만 차단당합니다. 공수 전환이 필요합니다.`,counter_attack:`빠른 역습! ${player}이 열린 공간으로 공을 몰고 질주합니다.`,foul:`${player}을 향한 강한 압박 과정에서 파울이 선언됩니다. 경기 흐름이 끊깁니다.`,card:`주심이 카드를 꺼냅니다. ${player}은 이후 경합에서 부담을 안게 됩니다.`,set_piece:`${player}이 좋은 위치의 세트피스를 준비합니다. 박스 안 선수들이 움직입니다.`,defensive_block:`${player}의 공격 전개가 촘촘한 수비 블록에 막힙니다.`,stamina_drop:`${side} 선수들의 간격이 벌어집니다. 체력 저하가 움직임에서 드러납니다.${closing}`};return texts[type]}
