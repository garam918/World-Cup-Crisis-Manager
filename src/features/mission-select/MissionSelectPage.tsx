import { useEffect, useMemo, useState } from 'react'
import type { Mission } from '../../entities/mission/types'
import { useAppStore } from '../../app/appStore'
import {
  getWorldCupTeam as getTeam,
  isGeneratedWorldCupSnapshot,
  worldCupMissions as missions,
  worldCupSnapshot,
} from '../../services/worldcup/worldCupRepository'
import { PageIntro } from '../../shared/components/PageIntro'
import { MissionCard } from './MissionCard'

type StageFilter = 'all' | 'group' | 'knockout'
type DifficultyFilter = 'all' | 1 | 2 | 3 | 4 | 5

const PAGE_SIZE = 9
const difficultyOptions:DifficultyFilter[] = ['all', 1, 2, 3, 4, 5]

export interface MissionChoice {
  key:string
  missions:Mission[]
}

export function groupMissionChoices(items:Mission[]):MissionChoice[] {
  const choices = new Map<string, Mission[]>()
  items.forEach((mission) => {
    const fixtureId = mission.relatedFixtureId ?? mission.context.matchId
    const key = `${fixtureId}:${mission.type}:${mission.context.minute}`
    choices.set(key, [...(choices.get(key) ?? []), mission])
  })
  return [...choices].map(([key, groupedMissions]) => ({ key, missions:groupedMissions }))
}

export function MissionSelectPage() {
  const select = useAppStore((state) => state.selectMission)
  const [stageFilter, setStageFilter] = useState<StageFilter>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all')
  const [countryQuery, setCountryQuery] = useState('')
  const [page, setPage] = useState(1)

  const missionChoices = useMemo(() => groupMissionChoices(missions), [])
  const filteredChoices = useMemo(
    () => missionChoices.filter(({ missions:options }) => options.some((mission) => matchesStage(mission, stageFilter) && matchesDifficulty(mission, difficultyFilter)) && matchesCountry(options, countryQuery)),
    [missionChoices, stageFilter, difficultyFilter, countryQuery],
  )
  const pageCount = Math.max(1, Math.ceil(filteredChoices.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visibleChoices = filteredChoices.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [stageFilter, difficultyFilter, countryQuery])

  return (
    <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
      <PageIntro
        eyebrow="Choose a moment"
        title="어떤 순간을 지휘하시겠습니까?"
        description="실제 2026 월드컵 경기 결과와 팀 스탯을 배경으로 짧고 선명한 위기 상황을 지휘합니다."
      />

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <span className={`rounded-full border px-3 py-1 text-xs font-black ${isGeneratedWorldCupSnapshot ? 'border-green-400/40 bg-green-400/10 text-green-300' : 'border-zinc-700 bg-zinc-900 text-zinc-400'}`}>
          {isGeneratedWorldCupSnapshot ? 'Kaggle actual match data' : 'Static fallback data'}
        </span>
        <span className="text-xs text-zinc-500">
          2026 World Cup{worldCupSnapshot?.fetchedAt ? ` · snapshot ${new Date(worldCupSnapshot.fetchedAt).toLocaleDateString()}` : ''}
        </span>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-900/70 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[auto_auto_minmax(220px,320px)]">
            <FilterGroup label="대회 단계">
              <SegmentButton active={stageFilter === 'all'} onClick={() => setStageFilter('all')}>전체</SegmentButton>
              <SegmentButton active={stageFilter === 'group'} onClick={() => setStageFilter('group')}>조별리그</SegmentButton>
              <SegmentButton active={stageFilter === 'knockout'} onClick={() => setStageFilter('knockout')}>토너먼트</SegmentButton>
            </FilterGroup>

            <FilterGroup label="난이도">
              {difficultyOptions.map((difficulty) => (
                <SegmentButton key={difficulty} active={difficultyFilter === difficulty} onClick={() => setDifficultyFilter(difficulty)}>
                  {difficulty === 'all' ? '전체' : `${difficulty}`}
                </SegmentButton>
              ))}
            </FilterGroup>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-500">나라 검색</span>
              <input
                value={countryQuery}
                onChange={(event) => setCountryQuery(event.target.value)}
                placeholder="대한민국, 독일, KOR..."
                className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-green-400/70"
              />
            </label>
          </div>

          <div className="flex items-center justify-between gap-4 lg:min-w-64 lg:justify-end">
            <p className="text-sm text-zinc-400">
              <b className="font-mono text-zinc-100">{filteredChoices.length}</b>개 경기 상황 · {currentPage}/{pageCount} 페이지
            </p>
            <div className="flex gap-2">
              <PageButton disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>이전</PageButton>
              <PageButton disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>다음</PageButton>
            </div>
          </div>
        </div>
      </div>

      {visibleChoices.length ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {visibleChoices.map((choice) => (
            <MissionCard key={choice.key} missions={choice.missions} onSelect={select} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-900/70 p-10 text-center">
          <p className="text-sm font-bold text-zinc-300">조건에 맞는 미션이 없습니다.</p>
          <p className="mt-2 text-xs text-zinc-500">필터를 줄이거나 다른 나라 이름으로 검색하세요.</p>
        </div>
      )}
    </section>
  )
}

function FilterGroup({ label, children }:{ label:string; children:React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wider text-zinc-500">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

function SegmentButton({ active, onClick, children }:{ active:boolean; onClick:()=>void; children:React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 rounded-xl border px-3 text-sm font-bold transition ${active ? 'border-green-400 bg-green-400 text-slate-950' : 'border-white/10 bg-slate-950 text-zinc-300 hover:border-green-400/50'}`}
    >
      {children}
    </button>
  )
}

function PageButton({ disabled, onClick, children }:{ disabled:boolean; onClick:()=>void; children:React.ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="h-10 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-bold text-zinc-200 transition hover:border-green-400/50 disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  )
}

function matchesStage(mission:Mission, filter:StageFilter) {
  if (filter === 'all') return true
  const isGroup = mission.context.stage.includes('조별리그') || mission.context.stage.toLowerCase().includes('group')
  return filter === 'group' ? isGroup : !isGroup
}

function matchesDifficulty(mission:Mission, filter:DifficultyFilter) {
  return filter === 'all' || mission.difficulty === filter
}

function matchesCountry(missions:Mission[], query:string) {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return true
  return missions.flatMap((mission) => {
    const team = getTeam(mission.context.userTeamId)
    const opponent = getTeam(mission.context.opponentTeamId)
    return [team.name, team.shortName, team.countryCode, opponent.name, opponent.shortName, opponent.countryCode]
  })
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(trimmed))
}
