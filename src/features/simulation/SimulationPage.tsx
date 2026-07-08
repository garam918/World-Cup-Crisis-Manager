import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '../../app/appStore'
import { getWorldCupMission as getMission } from '../../services/worldcup/worldCupRepository'
import { runSimulation } from '../../engine/runMonteCarloSimulation'
import { ActionButton } from '../../shared/components/ActionButton'
import { CommentaryFeed } from './CommentaryFeed'
import { MatchClock } from './MatchClock'

export function SimulationPage(){const input=useAppStore(s=>s.simulationInput),saved=useAppStore(s=>s.simulationResult),save=useAppStore(s=>s.setSimulationResult),next=useAppStore(s=>s.goToNextStep);const result=useMemo(()=>input?(saved?.missionId===input.missionId?saved:runSimulation(input,300)):null,[input,saved]);const [shown,setShown]=useState(1)
  useEffect(()=>{if(result&&!saved)save(result)},[result,saved,save]);useEffect(()=>{setShown(1);if(!result)return;const timer=window.setInterval(()=>setShown(n=>{if(n>=result.timeline.length){window.clearInterval(timer);return n}return n+1}),420);return()=>window.clearInterval(timer)},[result])
  if(!input||!result)return <section className="mx-auto max-w-3xl px-5 py-20 text-center"><h1 className="text-2xl font-black">전술 입력이 없습니다</h1><p className="mt-3 text-zinc-400">미션을 다시 선택해 전술을 저장해주세요.</p></section>
  const mission=getMission(input.missionId),events=result.timeline.slice(0,shown),current=events[events.length-1],complete=shown>=result.timeline.length
  return <section className="mx-auto max-w-4xl px-5 py-12 sm:px-8"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.2em] text-green-400">Live IF simulation</p><h1 className="mt-2 text-2xl font-black">{mission.title}</h1><p className="mt-1 text-xs text-zinc-500">Monte Carlo {result.monteCarloRuns}회 · 대표 타임라인</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${complete?'bg-zinc-800 text-zinc-300':'bg-red-400/10 text-red-300'}`}>{complete?'● FULL TIME':'● LIVE'}</span></div><div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/70"><div className="border-b border-white/10 py-8"><MatchClock minute={current?.minute??mission.context.minute} score={current?.score??mission.context.score}/></div><div className="max-h-[460px] overflow-y-auto p-5 sm:p-8"><CommentaryFeed events={events}/></div></div><div className="mt-5 flex items-center justify-between gap-4"><p className="text-xs text-zinc-500">같은 전술 입력은 항상 같은 결과와 확률을 생성합니다.</p><ActionButton onClick={next}>{complete?'결과 확인 →':'결과 바로 보기 →'}</ActionButton></div></section>}
