import type { ReactNode } from 'react'
import { useAppStore } from '../../app/appStore'
import { StepIndicator } from './StepIndicator'

export function AppShell({ children }: { children: ReactNode }) {
  const step = useAppStore((state) => state.currentStep)
  const goBack = useAppStore((state) => state.goToPreviousStep)
  const canGoBack = step !== 'landing'

  return (
    <div className="min-h-screen bg-slate-950 text-zinc-100">
      <header className="border-b border-white/10 bg-slate-950/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            {canGoBack && (
              <button
                type="button"
                onClick={goBack}
                className="grid size-9 place-items-center rounded-lg border border-white/10 bg-zinc-900 text-lg font-black text-zinc-200 transition hover:border-green-400 hover:text-green-300"
                aria-label="이전 화면으로 이동"
              >
                ←
              </button>
            )}
            <span className="grid size-9 place-items-center rounded-lg bg-green-400 font-black text-slate-950">수</span>
            <div>
              <p className="font-black tracking-tight">감독의 한 수</p>
              <p className="hidden text-[10px] tracking-widest text-zinc-500 sm:block">WORLD CUP CRISIS MANAGER</p>
            </div>
          </div>
          {canGoBack && <StepIndicator />}
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
