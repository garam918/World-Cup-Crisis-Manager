export const APP_STEPS = ['landing', 'mission-select', 'mission-briefing', 'tactic-editor', 'simulation', 'result-report'] as const
export type AppStep = (typeof APP_STEPS)[number]
export const STEP_LABELS: Record<AppStep, string> = { landing:'시작', 'mission-select':'미션 선택', 'mission-briefing':'브리핑', 'tactic-editor':'전술 설정', simulation:'시뮬레이션', 'result-report':'결과' }
