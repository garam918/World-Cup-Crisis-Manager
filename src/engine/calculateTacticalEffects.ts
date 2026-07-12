import type { PlayerPlacement, TacticalEffects, TacticalInstructions } from '../entities/tactic/types'
import { calculateLineupMetrics } from './calculateTeamMetrics'

const clamp=(value:number)=>Math.max(0,Math.min(100,Math.round(value)))

export function calculateTacticalEffects(players:PlayerPlacement[],instructions:TacticalInstructions):TacticalEffects{
  const metrics=calculateLineupMetrics(players,instructions)
  const pressCost=instructions.pressingIntensity==='high'?22:instructions.pressingIntensity==='low'?8:14
  const tempoCost=instructions.tempo==='fast'?10:instructions.tempo==='slow'?-2:4
  const staminaCost=30+pressCost+tempoCost-(metrics.staminaLevel-70)*.3
  return {attack:clamp(metrics.attackPower),defensiveStability:clamp(metrics.defenseStability),midfieldControl:clamp(metrics.midfieldControl),chanceCreation:clamp(metrics.chanceCreation),counterRisk:clamp(metrics.counterRisk),staminaCost:clamp(staminaCost),setPieceThreat:clamp(metrics.setPieceThreat)}
}
