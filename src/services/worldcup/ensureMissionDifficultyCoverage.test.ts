import { describe, expect, it } from 'vitest'
import { ensureMissionDifficultyCoverage, REQUIRED_MISSION_DIFFICULTIES } from './ensureMissionDifficultyCoverage'

describe('ensureMissionDifficultyCoverage', () => {
  it('fills every difficulty band while preserving the number and identity of generated missions', () => {
    const generated = Array.from({ length:8 }, (_, index) => ({ id:`mission-${index}`, difficulty:3 as const, title:`Mission ${index}` }))
    const balanced = ensureMissionDifficultyCoverage(generated)

    expect(balanced).toHaveLength(generated.length)
    expect(balanced.map((mission) => mission.id)).toEqual(generated.map((mission) => mission.id))
    REQUIRED_MISSION_DIFFICULTIES.forEach((difficulty) => expect(balanced.some((mission) => mission.difficulty === difficulty)).toBe(true))
  })

  it('does not rewrite a set that already covers levels 1 through 5', () => {
    const generated = REQUIRED_MISSION_DIFFICULTIES.map((difficulty) => ({ id:`mission-${difficulty}`, difficulty }))
    expect(ensureMissionDifficultyCoverage(generated)).toEqual(generated)
  })
})
