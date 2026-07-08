import { useAppStore } from './appStore'
import type { AppStep } from './routes'
import { LandingPage } from '../features/landing/LandingPage'
import { MissionSelectPage } from '../features/mission-select/MissionSelectPage'
import { MissionBriefingPage } from '../features/mission-briefing/MissionBriefingPage'
import { TacticEditorPage } from '../features/tactic-editor/TacticEditorPage'
import { SimulationPage } from '../features/simulation/SimulationPage'
import { ResultReportPage } from '../features/result-report/ResultReportPage'
import { AppShell } from '../shared/components/AppShell'

const pages: Record<AppStep, () => JSX.Element> = { landing:LandingPage, 'mission-select':MissionSelectPage, 'mission-briefing':MissionBriefingPage, 'tactic-editor':TacticEditorPage, simulation:SimulationPage, 'result-report':ResultReportPage }

export default function App() { const currentStep = useAppStore(s => s.currentStep); const Page = pages[currentStep]; return <AppShell><Page /></AppShell> }
