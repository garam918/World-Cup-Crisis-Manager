import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from './appStore'

describe('appStore',()=>{
  beforeEach(()=>useAppStore.getState().restart())
  it('moves through the ordered app steps',()=>{useAppStore.getState().goToNextStep();expect(useAppStore.getState().currentStep).toBe('mission-select')})
  it('moves back through the ordered app steps',()=>{useAppStore.setState({currentStep:'tactic-editor'});useAppStore.getState().goToPreviousStep();expect(useAppStore.getState().currentStep).toBe('mission-briefing')})
  it('selects a mission and opens its briefing',()=>{useAppStore.getState().selectMission('late-winner');expect(useAppStore.getState()).toMatchObject({selectedMissionId:'late-winner',currentStep:'mission-briefing'})})
  it('supports retry and another mission actions',()=>{useAppStore.setState({currentStep:'result-report',selectedMissionId:'late-winner'});useAppStore.getState().retryMission();expect(useAppStore.getState().currentStep).toBe('tactic-editor');useAppStore.getState().chooseAnotherMission();expect(useAppStore.getState()).toMatchObject({currentStep:'mission-select',selectedMissionId:null})})
})
