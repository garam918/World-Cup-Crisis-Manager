import { beforeEach, describe, expect, it } from 'vitest'
import { runMonteCarloSimulation } from '../../engine/runMonteCarloSimulation'
import { worldCupMissions } from '../../services/worldcup/worldCupRepository'
import { useTacticEditorStore } from '../tactic-editor/tacticEditorStore'
import { buildResultChangeFeedback, matchesActualResult } from './ResultChangeFeedback'

describe('result change feedback',()=>{
  beforeEach(()=>useTacticEditorStore.setState({missionId:null,substitutions:[]}))
  it('explains how to change a result that followed the actual match',()=>{const mission=worldCupMissions[0];useTacticEditorStore.getState().initialize(mission.id);const input=useTacticEditorStore.getState().toSimulationInput();expect(input).toBeTruthy();const result=runMonteCarloSimulation(input!,50);expect(matchesActualResult(mission,result)).toBe(true);const feedback=buildResultChangeFeedback(input!,result);expect(feedback.length).toBeGreaterThan(0);expect(feedback.some(item=>item.action.length>20)).toBe(true)})
  it('does not classify a different score as unchanged',()=>{const mission=worldCupMissions[0],actual=mission.actualTimeline.at(-1);expect(matchesActualResult(mission,{finalScore:{home:(actual?.homeScore??0)+1,away:actual?.awayScore??0}} as never)).toBe(false)})
})
