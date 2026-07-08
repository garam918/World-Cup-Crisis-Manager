import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { worldCupPlayerById as playerById } from '../../services/worldcup/worldCupRepository'
import type { PlayerPlacement } from '../../entities/tactic/types'

export function PlayerToken({placement,selected,onSelect}:{placement:PlayerPlacement;selected:boolean;onSelect:()=>void}){
  const drag=useDraggable({id:`player:${placement.playerId}`,data:{location:'field',playerId:placement.playerId}})
  const drop=useDroppable({id:`field:${placement.playerId}`,data:{location:'field',playerId:placement.playerId}})
  const player=playerById.get(placement.playerId);if(!player)return null
  return <button ref={node=>{drag.setNodeRef(node);drop.setNodeRef(node)}} {...drag.listeners} {...drag.attributes} onClick={onSelect} style={{left:`${placement.x}%`,top:`${placement.y}%`,transform:`translate(-50%,-50%) ${CSS.Translate.toString(drag.transform)}`,zIndex:drag.isDragging?30:2}} className="absolute touch-none select-none text-center">
    <span className={`mx-auto grid size-10 place-items-center rounded-full border-2 text-xs font-black shadow-xl transition sm:size-11 ${selected?'border-green-300 bg-green-400 text-slate-950':drop.isOver?'border-amber-300 bg-amber-400 text-slate-950':'border-white bg-slate-950 text-white'}`}>{player.shirtNumber}</span>
    <span className="mt-1 block max-w-20 truncate rounded bg-slate-950/90 px-1.5 py-0.5 text-[10px] font-bold">{player.name}</span>
  </button>
}
