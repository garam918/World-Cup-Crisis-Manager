import { forwardRef } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { useTacticEditorStore } from './tacticEditorStore'
import { PlayerToken } from './PlayerToken'

export const PitchBoard=forwardRef<HTMLDivElement>(function PitchBoard(_,forwardedRef){
  const players=useTacticEditorStore(s=>s.players),selected=useTacticEditorStore(s=>s.selectedPlayerId),select=useTacticEditorStore(s=>s.selectPlayer)
  const {setNodeRef,isOver}=useDroppable({id:'pitch',data:{location:'pitch'}})
  const setRef=(node:HTMLDivElement|null)=>{setNodeRef(node);if(typeof forwardedRef==='function')forwardedRef(node);else if(forwardedRef)forwardedRef.current=node}
  return <div><div ref={setRef} className={`pitch-lines relative mx-auto aspect-[68/92] w-full max-w-[560px] overflow-hidden rounded-2xl border-2 bg-green-800 shadow-2xl transition ${isOver?'border-green-300 ring-4 ring-green-400/20':'border-white/50'}`}><div className="absolute left-1/2 top-0 h-[16%] w-[48%] -translate-x-1/2 border border-t-0 border-white/50"/><div className="absolute bottom-0 left-1/2 h-[16%] w-[48%] -translate-x-1/2 border border-b-0 border-white/50"/>{players.map(p=><PlayerToken key={p.playerId} placement={p} selected={selected===p.playerId} onSelect={()=>select(p.playerId)}/>)}</div><p className="mt-3 text-center text-xs text-zinc-500">필드 선수는 원하는 위치에 자유롭게 배치할 수 있습니다.</p></div>
})
