import { APP_STEPS, STEP_LABELS } from '../../app/routes'
import { useAppStore } from '../../app/appStore'

export function StepIndicator(){const step=useAppStore(s=>s.currentStep);const current=APP_STEPS.indexOf(step);return <div className="flex items-center gap-2" aria-label={`현재 단계: ${STEP_LABELS[step]}`}><span className="hidden text-xs text-zinc-500 md:block">{STEP_LABELS[step]}</span>{APP_STEPS.slice(1).map((item,index)=><span key={item} className={`h-1.5 rounded-full transition-all ${index+1<=current?'w-6 bg-green-400':'w-2 bg-zinc-700'}`}/>)}</div>}
