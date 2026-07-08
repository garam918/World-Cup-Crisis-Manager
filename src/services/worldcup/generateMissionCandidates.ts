import type { ActualMatchTimelineEvent, MatchPeriod, Mission, MissionType } from '../../entities/mission/types'
import type { NormalizedFixtureDetail, NormalizedFixtureEvent, NormalizedWorldCupFixture } from './normalizeApiFootball'

type Candidate = {
  type: MissionType
  minute: number
  targetMinute: number
  userTeamId: string
  opponentTeamId: string
  title: string
  situation: string
  objective: string
  difficulty: 1 | 2 | 3 | 4 | 5
  minimumGoalsFor?: number
  maximumGoalsAgainst?: number
  confidence: 'high' | 'medium' | 'low'
}

export function generateMissionCandidates(
  fixtures: NormalizedWorldCupFixture[],
  fixtureDetails: NormalizedFixtureDetail[],
  fetchedAt?: string,
): Mission[] {
  const detailsByFixture = new Map(fixtureDetails.map((detail) => [detail.fixtureId, detail]))
  return fixtures.flatMap((fixture, index) => {
    const detail = detailsByFixture.get(fixture.id)
    const events = detail?.events ?? []
    const candidates = [
      detectRedCardSurvival(fixture, events),
      detectTrailingDraw(fixture, events),
      detectProtectLead(fixture, events),
      detectLateWinner(fixture, events),
      detectExtraTimeWinner(fixture, events),
      fallbackFromFinalScore(fixture, events),
    ].filter((candidate): candidate is Candidate => Boolean(candidate))

    const candidate = candidates[0]
    if (!candidate) return []
    const isHome = candidate.userTeamId === fixture.teams.home.id
    const score = scoreAt(events, candidate.minute, fixture.teams.home.id, fixture.goals)
    return [{
      id: `api-football-mission-${fixture.id}-${candidate.type}-${index}`,
      source: { provider: 'api-football' as const, matchExternalId: fixture.id },
      title: candidate.title,
      type: candidate.type,
      difficulty: candidate.difficulty,
      situation: candidate.situation,
      objective: { type: candidate.type, title: candidate.objective, description: candidate.objective, targetMinute: candidate.targetMinute, minimumGoalsFor: candidate.minimumGoalsFor, maximumGoalsAgainst: candidate.maximumGoalsAgainst },
      context: {
        matchId: `api-football-fixture-${fixture.id}`,
        competition: '2026 World Cup',
        season: '2026',
        stage: fixture.round ?? 'World Cup',
        period: periodFor(candidate.minute),
        minute: candidate.minute,
        score: isHome ? score : { home: score.away, away: score.home },
        userTeamId: candidate.userTeamId,
        opponentTeamId: candidate.opponentTeamId,
        availableSubstitutions: 5,
      },
      recommendedFormationId: candidate.type === 'protect_lead' || candidate.type === 'red_card_survival' ? 'formation-4231' : candidate.type === 'late_winner' || candidate.type === 'extra_time_winner' ? 'formation-343' : 'formation-433',
      opponentTraits: ['API-Football snapshot에서 생성한 경기 흐름', `${fixture.round ?? '2026 World Cup'} fixture 기반`],
      teamProblems: candidate.type === 'red_card_survival' ? ['퇴장 이후 수비 간격과 체력 저하'] : ['남은 시간이 제한되어 전술 선택의 위험도가 높음'],
      actualFlowSummary: `${fixture.teams.home.name} vs ${fixture.teams.away.name} API snapshot을 바탕으로 만든 IF 미션입니다.`,
      actualTimeline: toTimeline(events, fixture, scoreAt(events, candidate.minute, fixture.teams.home.id, fixture.goals)).slice(0, 8),
      relatedFixtureId: fixture.id,
      isGeneratedFromApi: true,
      confidence: candidate.confidence,
      dataSource: { provider: 'api-football' as const, fetchedAt, snapshotDate: fetchedAt },
    }]
  }).slice(0, 24)
}

function detectRedCardSurvival(fixture: NormalizedWorldCupFixture, events: NormalizedFixtureEvent[]): Candidate | null {
  const red = events.find((event) => event.type === 'Card' && /red|second yellow/i.test(event.detail ?? '') && event.minute >= 20 && event.minute <= 70)
  if (!red) return null
  const userTeamId = red.teamId
  return { type: 'red_card_survival', minute: red.minute, targetMinute: Math.min(90, red.minute + 25), userTeamId, opponentTeamId: opponentId(fixture, userTeamId), title: '퇴장 이후 버티기', situation: `${red.minute}분, ${red.teamName} 퇴장`, objective: '수적 열세 이후 실점 없이 버티기', difficulty: 4, maximumGoalsAgainst: 0, confidence: 'high' }
}

function detectTrailingDraw(fixture: NormalizedWorldCupFixture, events: NormalizedFixtureEvent[]): Candidate | null {
  for (const minute of [60, 65, 70, 75]) {
    const score = scoreAt(events, minute, fixture.teams.home.id, fixture.goals)
    if (score.home + 1 === score.away) return attackingCandidate(fixture, 'trailing_draw', minute, fixture.teams.home.id, '패배를 막아라', `후반 ${minute}분, 한 골 열세`, '남은 시간 안에 최소 무승부 만들기', 3, 'high')
    if (score.away + 1 === score.home) return attackingCandidate(fixture, 'trailing_draw', minute, fixture.teams.away.id, '패배를 막아라', `후반 ${minute}분, 한 골 열세`, '남은 시간 안에 최소 무승부 만들기', 3, 'high')
  }
  return null
}

function detectProtectLead(fixture: NormalizedWorldCupFixture, events: NormalizedFixtureEvent[]): Candidate | null {
  for (const minute of [70, 75, 80]) {
    const score = scoreAt(events, minute, fixture.teams.home.id, fixture.goals)
    if (score.home === score.away + 1) return defensiveCandidate(fixture, minute, fixture.teams.home.id, '리드를 지켜라', `후반 ${minute}분, 한 골 리드`, '실점 없이 경기 종료', 'high')
    if (score.away === score.home + 1) return defensiveCandidate(fixture, minute, fixture.teams.away.id, '리드를 지켜라', `후반 ${minute}분, 한 골 리드`, '실점 없이 경기 종료', 'high')
  }
  return null
}

function detectLateWinner(fixture: NormalizedWorldCupFixture, events: NormalizedFixtureEvent[]): Candidate | null {
  for (const minute of [75, 80]) {
    const score = scoreAt(events, minute, fixture.teams.home.id, fixture.goals)
    if (score.home === score.away) return attackingCandidate(fixture, 'late_winner', minute, fixture.teams.home.id, '마지막 승부수', `후반 ${minute}분, 동점 상황`, '종료 전 결승골 만들기', 4, 'high')
  }
  return null
}

function detectExtraTimeWinner(fixture: NormalizedWorldCupFixture, events: NormalizedFixtureEvent[]): Candidate | null {
  const knockout = /round|quarter|semi|final|16/i.test(fixture.round ?? '')
  if (!knockout && !fixture.score.extratime) return null
  const score90 = scoreAt(events, 90, fixture.teams.home.id, fixture.goals)
  if (score90.home !== score90.away && !fixture.score.extratime) return null
  return attackingCandidate(fixture, 'extra_time_winner', 90, fixture.teams.home.id, '연장전의 한 수', '연장전 시작, 동점 상황', '승부차기 전에 득점하기', 5, events.length ? 'medium' : 'low')
}

function fallbackFromFinalScore(fixture: NormalizedWorldCupFixture, events: NormalizedFixtureEvent[]): Candidate | null {
  const completed = ['FT', 'AET', 'PEN'].includes(fixture.status.short ?? '')
  if (!completed) return null
  if (fixture.goals.home === fixture.goals.away) return attackingCandidate(fixture, 'late_winner', 80, fixture.teams.home.id, '마지막 10분', '후반 80분, 균형을 깨야 하는 상황', '종료 전 결승골 만들기', 3, events.length ? 'medium' : 'low')
  const homeWon = (fixture.goals.home ?? 0) > (fixture.goals.away ?? 0)
  const teamId = homeWon ? fixture.teams.home.id : fixture.teams.away.id
  return defensiveCandidate(fixture, 75, teamId, '리드를 지켜라', '후반 75분, 한 골 리드 가정', '실점 없이 경기 종료', events.length ? 'medium' : 'low')
}

function attackingCandidate(fixture: NormalizedWorldCupFixture, type: 'trailing_draw' | 'late_winner' | 'extra_time_winner', minute: number, userTeamId: string, title: string, situation: string, objective: string, difficulty: 1 | 2 | 3 | 4 | 5, confidence: 'high' | 'medium' | 'low'): Candidate {
  return { type, minute, targetMinute: type === 'extra_time_winner' ? 120 : 90, userTeamId, opponentTeamId: opponentId(fixture, userTeamId), title, situation, objective, difficulty, minimumGoalsFor: 1, confidence }
}

function defensiveCandidate(fixture: NormalizedWorldCupFixture, minute: number, userTeamId: string, title: string, situation: string, objective: string, confidence: 'high' | 'medium' | 'low'): Candidate {
  return { type: 'protect_lead', minute, targetMinute: 90, userTeamId, opponentTeamId: opponentId(fixture, userTeamId), title, situation, objective, difficulty: 3, maximumGoalsAgainst: 0, confidence }
}

function opponentId(fixture: NormalizedWorldCupFixture, userTeamId: string) {
  return userTeamId === fixture.teams.home.id ? fixture.teams.away.id : fixture.teams.home.id
}

function scoreAt(events: NormalizedFixtureEvent[], minute: number, homeTeamId: string, finalScore: { home: number | null; away: number | null }) {
  if (!events.length) return { home: finalScore.home ?? 0, away: finalScore.away ?? 0 }
  return events.filter((event) => event.type === 'Goal' && event.minute <= minute).reduce((score, event) => event.teamId === homeTeamId ? { ...score, home: score.home + 1 } : { ...score, away: score.away + 1 }, { home: 0, away: 0 })
}

function toTimeline(events: NormalizedFixtureEvent[], fixture: NormalizedWorldCupFixture, initial: { home: number; away: number }): ActualMatchTimelineEvent[] {
  let homeScore = initial.home
  let awayScore = initial.away
  return events.map((event, index) => {
    if (event.type === 'Goal') {
      if (event.teamId === fixture.teams.home.id) homeScore += 1
      else awayScore += 1
    }
    return { id: `api-football-event-${fixture.id}-${index}`, minute: event.minute, period: periodFor(event.minute), teamId: event.teamId, type: event.type === 'Goal' ? 'goal' : event.type === 'Card' && /red/i.test(event.detail ?? '') ? 'red_card' : event.type === 'subst' ? 'substitution' : 'tactical_shift', summary: `${event.teamName} · ${event.detail ?? event.type}`, homeScore, awayScore, sourceEventId: event.playerId ?? undefined }
  })
}

function periodFor(minute: number): MatchPeriod {
  return minute <= 45 ? 'FIRST_HALF' : minute <= 90 ? 'SECOND_HALF' : minute <= 105 ? 'EXTRA_TIME_FIRST_HALF' : 'EXTRA_TIME_SECOND_HALF'
}
