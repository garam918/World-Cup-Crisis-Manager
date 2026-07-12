import { useEffect, useRef, useState } from 'react'
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { useAppStore } from '../../app/appStore'
import { getWorldCupMission as getMission } from '../../services/worldcup/worldCupRepository'
import { ActionButton } from '../../shared/components/ActionButton'
import { PageIntro } from '../../shared/components/PageIntro'
import { BenchPanel } from './BenchPanel'
import { PitchBoard } from './PitchBoard'
import { PlayerRolePanel } from './PlayerRolePanel'
import { TacticalImpactPanel } from './TacticalImpactPanel'
import { TacticalInstructionPanel } from './TacticalInstructionPanel'
import { useTacticEditorStore } from './tacticEditorStore'

export function TacticEditorPage(){
  const missionId=useAppStore(s=>s.selectedMissionId)??'trailing-draw',next=useAppStore(s=>s.goToNextStep),saveInput=useAppStore(s=>s.setSimulationInput)
  const initialize=useTacticEditorStore(s=>s.initialize),move=useTacticEditorStore(s=>s.movePlayer),substitute=useTacticEditorStore(s=>s.substitute),toInput=useTacticEditorStore(s=>s.toSimulationInput),subCount=useTacticEditorStore(s=>s.substitutions.length)
  const pitchRef=useRef<HTMLDivElement>(null),[message,setMessage]=useState('선수를 선택하거나 드래그해 전술을 조정하세요.')
  const sensors=useSensors(useSensor(PointerSensor,{activationConstraint:{distance:5}}),useSensor(KeyboardSensor))
  useEffect(()=>initialize(missionId),[initialize,missionId])
  const mission=getMission(missionId)

  const onDragEnd=({active,over,delta,activatorEvent}:DragEndEvent)=>{const playerId=String(active.data.current?.playerId??''),source=active.data.current?.location,target=String(over?.id??'')
    if(target.startsWith('field:')&&source==='bench'){const targetId=target.replace('field:','');if(subCount>=5){setMessage('교체 카드 5장을 모두 사용했습니다.');return}substitute(targetId,playerId);setMessage('교체가 적용됐습니다. 새 선수의 역할을 확인하세요.');return}
    if(source==='field'&&pitchRef.current){const rect=pitchRef.current.getBoundingClientRect(),placement=useTacticEditorStore.getState().players.find(player=>player.playerId===playerId);if(!placement)return;const pointer=activatorEvent instanceof MouseEvent?{x:activatorEvent.clientX+delta.x,y:activatorEvent.clientY+delta.y}:activatorEvent instanceof TouchEvent&&activatorEvent.touches[0]?{x:activatorEvent.touches[0].clientX+delta.x,y:activatorEvent.touches[0].clientY+delta.y}:null;move(playerId,pointer?(pointer.x-rect.left)/rect.width*100:placement.x+delta.x/rect.width*100,pointer?(pointer.y-rect.top)/rect.height*100:placement.y+delta.y/rect.height*100);setMessage('선수 위치를 조정했습니다.')}
  }
  const start=()=>{const input=toInput();if(!input)return;saveInput(input);next()}

  return <DndContext sensors={sensors} onDragEnd={onDragEnd}><section className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6"><div className="flex flex-wrap items-end justify-between gap-4"><PageIntro eyebrow="Tactical board" title="당신의 한 수를 설계하세요" description={`${mission.title} · ${mission.situation}`}/><div className="rounded-full border border-white/10 bg-zinc-900 px-4 py-2 text-xs text-zinc-400">필드 {mission.context.dismissedPlayerId?'10':'11'}명 · 교체 최대 5명</div></div><div className="mt-7 grid gap-5 xl:grid-cols-[210px_minmax(390px,1fr)_330px_270px]"><BenchPanel/><div><PitchBoard ref={pitchRef}/><div className="mt-3 rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-3 text-center text-xs text-zinc-400" role="status">{message}</div></div><div className="space-y-5"><TacticalInstructionPanel/><PlayerRolePanel/><ActionButton onClick={start} className="w-full">이 전술로 시뮬레이션 →</ActionButton></div><TacticalImpactPanel/></div></section></DndContext>
}
