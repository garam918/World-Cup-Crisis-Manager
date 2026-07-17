import { describe, expect, it } from 'vitest'
import type { Mission } from '../../entities/mission/types'
import { filterMissionOptions, knockoutRoundOptions, matchesStage } from './MissionSelectPage'

const mission = (id:string, stage:string, difficulty:Mission['difficulty']):Mission => ({
  id,
  source:{ provider:'manual' },
  title:id,
  type:'late_winner',
  difficulty,
  situation:'test',
  objective:{ type:'late_winner', title:'test', description:'test', targetMinute:90 },
  context:{ matchId:id, competition:'World Cup', season:'2026', stage, period:'SECOND_HALF', minute:80, score:{ home:0, away:0 }, userTeamId:'home', opponentTeamId:'away', availableSubstitutions:5 },
  recommendedFormationId:'formation-433',
  opponentTraits:[],
  teamProblems:[],
  actualFlowSummary:'test',
  actualTimeline:[],
})

describe('mission selection filters', () => {
  it('offers every knockout round from the round of 32 through the final', () => {
    expect(knockoutRoundOptions).toEqual(['all', '32강', '16강', '8강', '4강', '결승'])
  })

  it('filters knockout missions by the selected round', () => {
    const stages = ['조별리그', '32강', '16강', '8강', '4강', '결승']
    const items = stages.map((stage) => mission(stage, stage, 3))
    expect(items.filter((item) => matchesStage(item, 'knockout', '4강')).map((item) => item.context.stage)).toEqual(['4강'])
  })

  it('keeps only the matching team option when a grouped choice is filtered by difficulty', () => {
    const options = [mission('difficulty-2', '8강', 2), mission('difficulty-1', '8강', 1)]
    expect(filterMissionOptions(options, 'knockout', '8강', 1).map((item) => item.id)).toEqual(['difficulty-1'])
  })
})
