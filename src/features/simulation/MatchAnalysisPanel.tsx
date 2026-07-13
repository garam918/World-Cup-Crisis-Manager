import type { Score } from '../../entities/mission/types'
import type { SimulationEvent } from '../../entities/simulation/types'

const shotTypes=new Set(['shot','big_chance','goal','save'])
const dangerousTypes=new Set(['box_entry','big_chance','goal'])

export function MatchAnalysisPanel({events,userTeamId,score}:{events:SimulationEvent[];userTeamId:string;score:Score}) {
  const user=matchStats(events,userTeamId,true)
  const opponent=matchStats(events,userTeamId,false)
  const possessionTotal=Math.max(1,user.events+opponent.events)
  const userPossession=events.length?Math.round(Math.max(35,Math.min(65,user.events/possessionTotal*100))):50
  const momentumDelta=events.slice(-6).reduce((sum,event)=>sum+event.momentumDelta,0)
  const userMomentum=Math.max(8,Math.min(92,50+momentumDelta))
  const phase=score.home>score.away?'리드 관리':score.home<score.away?'추격 모드':'균형 탐색'

  return <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
    <div className="flex items-center justify-between gap-3"><p className="text-[10px] font-black uppercase tracking-[.18em] text-zinc-500">Match analysis</p><span className={`rounded-full px-2 py-1 text-[10px] font-black ${score.home>score.away?'bg-green-400/15 text-green-300':score.home<score.away?'bg-red-400/15 text-red-300':'bg-zinc-800 text-zinc-300'}`}>{phase}</span></div>
    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
      <Stat label="점유율" user={`${userPossession}%`} opponent={`${100-userPossession}%`}/>
      <Stat label="슈팅 (유효)" user={`${user.shots} (${user.onTarget})`} opponent={`${opponent.shots} (${opponent.onTarget})`}/>
      <Stat label="위험 장면" user={user.dangerous} opponent={opponent.dangerous}/>
    </div>
    <div className="mt-4"><div className="flex justify-between text-[10px] font-bold text-zinc-500"><span>우리 팀 기세</span><span>상대 팀 기세</span></div><div className="mt-2 flex h-2 overflow-hidden rounded-full bg-red-400"><div className="bg-green-400 transition-all duration-500" style={{width:`${userMomentum}%`}}/></div></div>
  </div>
}

function matchStats(events:SimulationEvent[],userTeamId:string,user:boolean) {
  const selected=events.filter(event=>(event.teamId===userTeamId)===user)
  return {events:selected.length,shots:selected.filter(event=>shotTypes.has(event.type)).length,onTarget:selected.filter(event=>event.type==='goal'||event.type==='save').length,dangerous:selected.filter(event=>dangerousTypes.has(event.type)).length}
}

function Stat({label,user,opponent}:{label:string;user:string|number;opponent:string|number}) {return <div className="rounded-xl bg-white/[.035] px-2 py-3"><p className="text-[9px] font-bold text-zinc-600">{label}</p><p className="mt-1 font-mono text-xs font-black"><span className="text-green-300">{user}</span><span className="mx-1 text-zinc-700">·</span><span className="text-red-300">{opponent}</span></p></div>}
