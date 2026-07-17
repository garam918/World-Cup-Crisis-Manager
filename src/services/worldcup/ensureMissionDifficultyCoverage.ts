import type { Mission } from '../../entities/mission/types'

type Difficulty = Mission['difficulty']
type DifficultyItem = { id:string; difficulty:Difficulty }

export const REQUIRED_MISSION_DIFFICULTIES:Difficulty[] = [1, 2, 3, 4, 5]

/**
 * Keeps generated difficulty values where possible, but deterministically
 * rebalances duplicate bands when a generated set is missing a level.
 */
export function ensureMissionDifficultyCoverage<T extends DifficultyItem>(items:T[]):T[] {
  if (items.length < REQUIRED_MISSION_DIFFICULTIES.length) return items

  const balanced = items.map((item) => ({ ...item }))
  const counts = countDifficulties(balanced)

  REQUIRED_MISSION_DIFFICULTIES.forEach((target) => {
    if ((counts.get(target) ?? 0) > 0) return

    const candidate = balanced
      .filter((item) => (counts.get(item.difficulty) ?? 0) > 1)
      .sort((a, b) => Math.abs(a.difficulty - target) - Math.abs(b.difficulty - target) || a.difficulty - b.difficulty || a.id.localeCompare(b.id))[0]

    if (!candidate) return
    counts.set(candidate.difficulty, (counts.get(candidate.difficulty) ?? 1) - 1)
    candidate.difficulty = target
    counts.set(target, 1)
  })

  return balanced
}

function countDifficulties(items:DifficultyItem[]) {
  return items.reduce((counts, item) => counts.set(item.difficulty, (counts.get(item.difficulty) ?? 0) + 1), new Map<Difficulty, number>())
}
