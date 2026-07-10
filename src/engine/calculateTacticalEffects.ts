import { worldCupPlayerById as playerById } from '../services/worldcup/worldCupRepository'
import type { PlayerPlacement, TacticalEffects, TacticalInstructions } from '../entities/tactic/types'

const clamp=(value:number)=>Math.max(0,Math.min(100,Math.round(value)))
const avg=(players:PlayerPlacement[],key:keyof NonNullable<ReturnType<typeof playerById.get>>['attributes'])=>players.length?players.reduce((sum,p)=>sum+(playerById.get(p.playerId)?.attributes[key]??50),0)/players.length:50

export function calculateTacticalEffects(players:PlayerPlacement[],instructions:TacticalInstructions):TacticalEffects{
  const pace=avg(players,'pace'),finishing=avg(players,'finishing'),passing=avg(players,'passing'),crossing=avg(players,'crossing'),pressing=avg(players,'pressing'),defense=avg(players,'defense'),stamina=avg(players,'stamina'),height=avg(players,'heightPower')
  const highPress=instructions.pressingIntensity==='high'?10:instructions.pressingIntensity==='low'?-6:0
  const highLine=instructions.defensiveLine==='high'?8:instructions.defensiveLine==='low'?-5:0
  const fast=instructions.tempo==='fast'?8:instructions.tempo==='slow'?-5:0
  const risk=instructions.riskLevel==='aggressive'?12:instructions.riskLevel==='safe'?-9:0
  const center=instructions.attackDirection==='center'?4:0
  const wide=['left','right'].includes(instructions.attackDirection)?5:instructions.width==='wide'?6:instructions.width==='narrow'?-2:0
  const possession=instructions.buildUpStyle==='possession'?7:instructions.buildUpStyle==='direct'?-2:0
  const direct=instructions.buildUpStyle==='direct'?7:instructions.buildUpStyle==='possession'?-2:0
  const crosses=instructions.chanceCreation==='crosses'?7:0
  const through=instructions.chanceCreation==='through_balls'?7:0
  const man=instructions.defensiveApproach==='man_marking'?5:instructions.defensiveApproach==='zonal'?-2:0
  const zonal=instructions.defensiveApproach==='zonal'?5:0
  return {attack:clamp(finishing*.42+pace*.2+passing*.2+50*.18+fast+risk+direct*.35+through*.35),defensiveStability:clamp(defense*.55+stamina*.15+50*.3-highLine*.7-risk*.5-highPress*.2+zonal+man*.25),midfieldControl:clamp(passing*.48+pressing*.22+stamina*.15+50*.15+highPress*.3+center+possession),chanceCreation:clamp(passing*.38+crossing*.25+pace*.18+50*.19+fast*.5+risk*.6+wide+crosses*.45+through*.45+possession*.25),counterRisk:clamp(32+highLine*2+highPress*.8+risk*1.4-fast*.2+direct*.45+man*.55-zonal*.4),staminaCost:clamp(30+highPress*2+Math.max(0,fast)*1.5+Math.max(0,highLine)+Math.max(0,man)*.8-((stamina-70)*.3)),setPieceThreat:clamp(height*.55+crossing*.25+50*.2+crosses*.8+wide*.35)}
}
