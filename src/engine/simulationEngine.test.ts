import { beforeEach, describe, expect, it } from 'vitest'
import { getMission } from '../data/missions'
import { useTacticEditorStore } from '../features/tactic-editor/tacticEditorStore'
import { evaluateMissionResult } from './evaluateMissionResult'
import { runMonteCarloSimulation } from './runMonteCarloSimulation'
import { runSingleSimulation } from './runSingleSimulation'

const inputFor=(missionId:string)=>{useTacticEditorStore.setState({missionId:null});useTacticEditorStore.getState().initialize(missionId);const input=useTacticEditorStore.getState().toSimulationInput();if(!input)throw new Error('missing input');return input}

describe('simulation engine',()=>{
  beforeEach(()=>useTacticEditorStore.setState({missionId:null}))
  it('is deterministic for the same input and seed',()=>{const input=inputFor('trailing-draw');expect(runSingleSimulation(input,12345)).toEqual(runSingleSimulation(input,12345))})
  it('returns deterministic Monte Carlo probabilities and a representative timeline',()=>{const input=inputFor('late-winner'),a=runMonteCarloSimulation(input,100),b=runMonteCarloSimulation(input,100);expect(a).toEqual(b);expect(a.timeline.length).toBeGreaterThan(0);expect(a.successProbability).toBeGreaterThanOrEqual(0);expect(a.successProbability).toBeLessThanOrEqual(1);expect(a.winDrawLoseProbability.win+a.winDrawLoseProbability.draw+a.winDrawLoseProbability.loss).toBeCloseTo(1,2)})
  it('evaluates every mission objective rule',()=>{expect(evaluateMissionResult(getMission('trailing-draw'),{home:1,away:1},[])).toBe(true);expect(evaluateMissionResult(getMission('red-card-survival'),{home:0,away:0},[])).toBe(true);expect(evaluateMissionResult(getMission('protect-lead'),{home:1,away:0},[])).toBe(true);expect(evaluateMissionResult(getMission('extra-time-winner'),{home:2,away:1},[])).toBe(true);expect(evaluateMissionResult(getMission('late-winner'),{home:1,away:0},[])).toBe(true)})
  it('produces only documented event types',()=>{const allowed=new Set(['build_up','progressive_pass','wing_attack','central_attack','box_entry','shot','big_chance','goal','save','turnover','counter_attack','foul','card','set_piece','defensive_block','stamina_drop']);const result=runSingleSimulation(inputFor('extra-time-winner'),77);expect(result.timeline.every(event=>allowed.has(event.type))).toBe(true)})
})
