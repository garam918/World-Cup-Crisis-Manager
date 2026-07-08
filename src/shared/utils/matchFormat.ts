import type { MatchContext } from '../../entities/mission/types'
export const formatScore=(context:MatchContext)=>`${context.score.home} : ${context.score.away}`
export const formatMatchTime=(context:MatchContext)=>context.period.startsWith('EXTRA_TIME')?`연장 ${context.minute-90}분`:`${context.minute}분`
