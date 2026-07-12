import type { Mission } from '../../entities/mission/types'
import { getWorldCupFixture as getFixture, getWorldCupTeam as getTeam } from '../../services/worldcup/worldCupRepository'
import { formatMatchTime, formatScore } from '../../shared/utils/matchFormat'

export function MissionCard({missions,onSelect}:{missions:Mission[];onSelect:(missionId:string)=>void}) {
  const mission = missions[0]
  const fixture = getFixture(mission.relatedFixtureId)
  const team = getTeam(mission.context.userTeamId)
  const opponent = getTeam(mission.context.opponentTeamId)
  const matchup = fixture ? `${fixture.teams.home.name} vs ${fixture.teams.away.name}` : `${team.name} vs ${opponent.name}`
  const hasTeamChoice = missions.length > 1

  return <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-zinc-900/70 p-6 transition hover:border-green-400/60">
    <div className="flex items-center justify-between text-xs text-zinc-500"><span>{mission.context.stage}</span><span className="flex gap-1" aria-label={`난이도 ${mission.difficulty}점`}>{[1,2,3,4,5].map(n=><i key={n} className={`size-1.5 rounded-full ${n<=mission.difficulty?'bg-green-400':'bg-zinc-700'}`}/>)}</span></div>
    <p className="mt-8 text-sm font-bold text-green-400">{matchup}</p>
    <h2 className="mt-2 text-2xl font-black leading-snug">{mission.objective.title}</h2>
    <p className="mt-3 flex-1 text-sm leading-6 text-zinc-400">{hasTeamChoice ? `동점인 ${formatMatchTime(mission.context)} 상황에서 지휘할 팀을 선택하세요.` : mission.objective.description}</p>
    {(mission.dataSource?.provider||mission.confidence)&&<div className="mt-5 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">{mission.dataSource?.provider&&<span className="rounded-full bg-slate-950 px-2 py-1">{mission.dataSource.provider}</span>}{mission.confidence&&<span className="rounded-full bg-slate-950 px-2 py-1">{mission.confidence}</span>}</div>}
    <div className="mt-7 border-t border-white/10 pt-4">
      <div className="flex items-center justify-between gap-3 text-sm"><span>{hasTeamChoice ? '지휘할 팀 선택' : `${team.shortName} vs ${opponent.shortName}`}</span><b className="font-mono">{formatMatchTime(mission.context)} · {formatScore(mission.context)}</b></div>
      <div className={`mt-4 grid gap-2 ${hasTeamChoice ? 'grid-cols-2' : ''}`}>
        {missions.map((option) => {
          const optionTeam = getTeam(option.context.userTeamId)
          return <button key={option.id} type="button" onClick={() => onSelect(option.id)} className="min-h-11 rounded-lg border border-green-400/30 bg-green-400/10 px-3 py-2 text-sm font-black text-green-200 transition hover:border-green-400 hover:bg-green-400 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300">{hasTeamChoice ? `${optionTeam.name} 지휘` : '이 미션 선택'}</button>
        })}
      </div>
    </div>
  </article>
}
