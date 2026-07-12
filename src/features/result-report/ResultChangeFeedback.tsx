import type { Mission } from '../../entities/mission/types'
import type { SimulationResult } from '../../entities/simulation/types'
import type { SimulationInput } from '../../entities/tactic/types'

export type ChangeFeedback={title:string;reason:string;action:string}

export function matchesActualResult(mission:Mission,result:SimulationResult){const actual=mission.actualTimeline.at(-1);return Boolean(actual&&actual.homeScore===result.finalScore.home&&actual.awayScore===result.finalScore.away)}

export function buildResultChangeFeedback(input:SimulationInput,result:SimulationResult):ChangeFeedback[]{const current=input.expectedEffects,baseline=input.baselineEffects,items:ChangeFeedback[]=[];const coreDeltas=[current.attack-baseline.attack,current.chanceCreation-baseline.chanceCreation,current.midfieldControl-baseline.midfieldControl];const largestAttackChange=Math.max(...coreDeltas)
  if(result.followsActualBaseline||largestAttackChange<4)items.push({title:'경기 흐름을 바꿀 변화가 부족했습니다',reason:`공격력 ${signed(current.attack-baseline.attack)}, 찬스 생성력 ${signed(current.chanceCreation-baseline.chanceCreation)}, 중원 장악력 ${signed(current.midfieldControl-baseline.midfieldControl)}로 기준 전술과 차이가 작았습니다.`,action:'빠른 템포나 공격적 위험 감수를 선택하고, 포메이션·선수 역할 또는 교체 카드도 함께 변경해 전술 변화 폭을 키워보세요.'})
  if(current.chanceCreation-baseline.chanceCreation<5)items.push({title:'결정적인 기회를 더 만들어야 합니다',reason:`현재 찬스 생성력은 ${current.chanceCreation}로 기준 전술보다 ${signed(current.chanceCreation-baseline.chanceCreation)} 변했습니다.`,action:input.instructions.chanceCreation==='through_balls'?'전진형 미드필더와 침투형 공격수를 함께 배치해 침투 패스의 수신 지점을 늘려보세요.':'찬스 생성을 침투 패스로 바꾸거나, 넓은 공격 폭과 크로스를 함께 사용해 박스 진입 경로를 분명하게 만들어보세요.'})
  if(current.attack-baseline.attack<5)items.push({title:'마무리 구성을 더 공격적으로 바꿔야 합니다',reason:`현재 공격력은 ${current.attack}로 기준 전술보다 ${signed(current.attack-baseline.attack)} 변했습니다.`,action:'벤치 공격수를 투입하고 침투형 공격수·안쪽 침투 역할을 사용하세요. 빠른 템포와 직선적 빌드업을 함께 적용하면 득점 확률을 더 높일 수 있습니다.'})
  if(result.finalScore.away>0&&current.defensiveStability<baseline.defensiveStability)items.push({title:'득점을 노리면서 수비 균형도 회복해야 합니다',reason:`수비 안정성이 기준보다 ${baseline.defensiveStability-current.defensiveStability} 낮고 역습 위험은 ${current.counterRisk}입니다.`,action:'수비 라인을 한 단계 낮추거나 지역 수비를 적용하고, 수비형 미드필더 한 명을 남겨 상대 역습 경로를 차단하세요.'})
  if(input.substitutions.length===0)items.push({title:'교체 카드로 선수 구성을 바꿔보세요',reason:'선발 라인업을 그대로 유지해 선수 능력치와 역할 조합의 변화가 제한됐습니다.',action:'마무리·오프더볼·속도가 높은 공격수나 패스 능력이 좋은 미드필더를 투입한 뒤 역할까지 다시 지정하세요.'})
  if(items.length===0)items.push({title:'전술 방향보다 선수 역할 조합을 다시 조정해보세요',reason:'전체 전술 지표는 기준보다 개선됐지만 대표 경기의 최종 스코어까지 바꾸지는 못했습니다.',action:'공격수 한 명을 침투형으로, 미드필더 한 명을 전진형으로 지정해 패스 공급과 침투 타이밍을 연결하고 다른 교체 조합으로 다시 시도해보세요.'})
  return items.slice(0,3)
}

function signed(value:number){return `${value>=0?'+':''}${value}`}

export function ResultChangeFeedback({mission,result,input}:{mission:Mission;result:SimulationResult;input:SimulationInput}){if(!matchesActualResult(mission,result))return null;const feedback=buildResultChangeFeedback(input,result);return <section className="mt-6 rounded-3xl border border-amber-400/25 bg-amber-400/[.06] p-5 sm:p-7"><p className="text-xs font-black uppercase tracking-[.18em] text-amber-300">Next tactical move</p><h2 className="mt-1 text-2xl font-black">실제 결과와 같았습니다. 무엇을 바꿔야 할까요?</h2><p className="mt-2 text-sm leading-6 text-zinc-400">현재 전술과 실제 경기 기준 전술의 차이를 비교해 다음 도전에서 우선 조정할 항목을 골랐습니다.</p><div className="mt-5 grid gap-3 lg:grid-cols-3">{feedback.map((item,index)=><article key={item.title} className="rounded-2xl border border-white/10 bg-slate-950/70 p-5"><span className="grid size-7 place-items-center rounded-lg bg-amber-400/10 text-xs font-black text-amber-300">{index+1}</span><h3 className="mt-4 font-black text-zinc-100">{item.title}</h3><p className="mt-2 text-xs leading-5 text-zinc-500">{item.reason}</p><p className="mt-3 text-sm leading-6 text-zinc-300">{item.action}</p></article>)}</div></section>}
