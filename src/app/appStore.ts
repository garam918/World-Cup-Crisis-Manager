import { create } from 'zustand'
import { APP_STEPS, type AppStep } from './routes'
import type { SimulationInput } from '../entities/tactic/types'
import type { SimulationResult } from '../entities/simulation/types'

interface AppState {
  currentStep: AppStep
  selectedMissionId: string | null
  simulationInput: SimulationInput | null
  simulationResult: SimulationResult | null
  goToStep: (step: AppStep) => void
  goToNextStep: () => void
  goToPreviousStep: () => void
  selectMission: (missionId: string) => void
  setSimulationInput: (input: SimulationInput) => void
  setSimulationResult: (result: SimulationResult) => void
  retryMission: () => void
  chooseAnotherMission: () => void
  restart: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  currentStep: 'landing', selectedMissionId: null, simulationInput:null, simulationResult:null,
  goToStep: (currentStep) => set({ currentStep }),
  goToNextStep: () => { const index = APP_STEPS.indexOf(get().currentStep); set({ currentStep: APP_STEPS[Math.min(index + 1, APP_STEPS.length - 1)] }) },
  goToPreviousStep: () => { const index = APP_STEPS.indexOf(get().currentStep); set({ currentStep: APP_STEPS[Math.max(index - 1, 0)] }) },
  selectMission: (selectedMissionId) => set({ selectedMissionId, currentStep: 'mission-briefing' }),
  setSimulationInput:(simulationInput)=>set({simulationInput,simulationResult:null}),
  setSimulationResult:(simulationResult)=>set({simulationResult}),
  retryMission:()=>set({currentStep:'tactic-editor',simulationInput:null,simulationResult:null}),
  chooseAnotherMission:()=>set({currentStep:'mission-select',selectedMissionId:null,simulationInput:null,simulationResult:null}),
  restart: () => set({ currentStep: 'landing', selectedMissionId: null, simulationInput:null, simulationResult:null }),
}))
