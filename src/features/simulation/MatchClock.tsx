import type { Score } from '../../entities/mission/types'
export function MatchClock({minute,score}:{minute:number;score:Score}){return <div className="text-center"><p className="font-mono text-5xl font-black">{minute}′</p><p className="mt-2 font-mono text-2xl">{score.home} : {score.away}</p></div>}
