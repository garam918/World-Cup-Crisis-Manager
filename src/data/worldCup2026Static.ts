import gamesCsv from './source/worldcup2026.games.csv?raw'
import teamsCsv from './source/worldcup2026.teams.csv?raw'
import groupsCsv from './source/worldcup2026.groups.csv?raw'
import stadiaCsv from './source/worldcup2026.stadia.csv?raw'
import playersCsv from './source/kaggle-fifa-wc-2026-players.csv?raw'
import matchesCsv from './source/kaggle-mominul-wc2026-matches-detailed.csv?raw'
import matchEventsCsv from './source/kaggle-mominul-wc2026-match-events.csv?raw'
import matchTeamStatsCsv from './source/kaggle-mominul-wc2026-match-team-stats.csv?raw'
import eventTeamsCsv from './source/kaggle-mominul-wc2026-teams.csv?raw'
import eventSquadsCsv from './source/kaggle-mominul-wc2026-squads-and-players.csv?raw'
import type { Mission, MissionObjective, MissionType, MatchContext, ActualMatchTimelineEvent } from '../entities/mission/types'
import type { Player, PlayerAttributes, PlayerPosition, PlayerRole } from '../entities/player/types'
import type { Team } from '../entities/team/types'
import type { NormalizedFixtureDetail, NormalizedWorldCupFixture, NormalizedWorldCupStandingGroup, NormalizedWorldCupTeam, WorldCup2026Snapshot } from '../services/worldcup/normalizeApiFootball'

type CsvRow = Record<string, string>
type ScenarioSeed = {
  id:string;fixtureId:string;userTeam:string;opponentTeam:string;title:string;type:MissionType;difficulty:1|2|3|4|5
  minute:number;period:MatchContext['period'];score:{home:number;away:number};situation:string;objective:MissionObjective
  recommendedFormationId:string;availableSubstitutions:number;dismissedPosition?:PlayerPosition
  opponentTraits:string[];teamProblems:string[];actualFlowSummary:string;timeline:Array<[number, ActualMatchTimelineEvent['type'], string, number, number, string?]>
}
type NumberedPlayerRow = CsvRow & { generatedShirtNumber:string }
type MatchEventRow = {
  event_id:string
  match_id:string
  minute:string
  event_type:string
  team_id:string
  player_id:string
  runningHome:number
  runningAway:number
}

const DATASET_FETCHED_AT = '2026-07-08T00:35:17.070Z'
const GITHUB_SOURCE_URL = 'https://github.com/rezarahiminia/worldcup2026'
const KAGGLE_PLAYERS_SOURCE_URL = 'https://www.kaggle.com/datasets/swaptr/fifa-wc-2026-players'
const KAGGLE_MATCH_EVENTS_SOURCE_URL = 'https://www.kaggle.com/datasets/mominullptr/fifa-world-cup-2026-dataset'

const teamAliases:Record<string,string> = {
  'Cabo Verde':'Cape Verde',
  "Côte d'Ivoire":'Ivory Coast',
  'IR Iran':'Iran',
  'Korea Republic':'South Korea',
  'Bosnia-Herzegovina':'Bosnia and Herzegovina',
  'Bosnia–Herz':'Bosnia and Herzegovina',
  'Congo DR':'DR Congo',
}

const teamKoreanNames:Record<string,string> = {
  Algeria:'알제리', Argentina:'아르헨티나', Australia:'호주', Austria:'오스트리아', Belgium:'벨기에', 'Bosnia and Herzegovina':'보스니아 헤르체고비나', Brazil:'브라질', 'Cape Verde':'카보베르데', Canada:'캐나다', Colombia:'콜롬비아', 'DR Congo':'콩고민주공화국', Croatia:'크로아티아', Curaçao:'퀴라소', Czechia:'체코', 'Ivory Coast':'코트디부아르', Ecuador:'에콰도르', Egypt:'이집트', England:'잉글랜드', France:'프랑스', Germany:'독일', Ghana:'가나', Haiti:'아이티', Iran:'이란', Iraq:'이라크', Japan:'일본', Jordan:'요르단', 'South Korea':'대한민국', Mexico:'멕시코', Morocco:'모로코', Netherlands:'네덜란드', 'New Zealand':'뉴질랜드', Norway:'노르웨이', Panama:'파나마', Paraguay:'파라과이', Portugal:'포르투갈', Qatar:'카타르', 'Saudi Arabia':'사우디아라비아', Scotland:'스코틀랜드', Senegal:'세네갈', 'South Africa':'남아프리카공화국', Spain:'스페인', Sweden:'스웨덴', Switzerland:'스위스', Tunisia:'튀니지', Türkiye:'튀르키예', 'United States':'미국', Uruguay:'우루과이', Uzbekistan:'우즈베키스탄',
}

const teamCodes:Record<string,string> = {
  'Bosnia and Herzegovina':'BIH', Czechia:'CZE', 'DR Congo':'COD', Sweden:'SWE', Iraq:'IRQ', Türkiye:'TUR', 'Cape Verde':'CPV', 'Ivory Coast':'CIV', Iran:'IRN', 'South Korea':'KOR',
}

const palette = ['#16a34a', '#2563eb', '#dc2626', '#f59e0b', '#7c3aed', '#0891b2', '#be123c', '#4f46e5']

const teamRows = parseCsv(teamsCsv)
const gameRows = parseCsv(gamesCsv)
const groupRows = parseCsv(groupsCsv)
const stadiumRows = parseCsv(stadiaCsv)
const eventTeamRows = parseCsv(eventTeamsCsv)
const eventTeamById = new Map(eventTeamRows.map((team) => [team.team_id, canonicalTeam(team.team_name)]))
const basePlayerRows = parseCsv(playersCsv).filter((row) => row.player && row.player !== 'player')
const eventSquadRows = parseCsv(eventSquadsCsv)
const basePlayerKeys = new Set(basePlayerRows.map((row) => playerKey(row)))
const supplementalPlayerRows = eventSquadRows.map(toSupplementalPlayerRow).filter((row) => row.player && !basePlayerKeys.has(playerKey(row)))
const playerRows = [...basePlayerRows, ...supplementalPlayerRows]
const actualMatchRows = parseCsv(matchesCsv).filter((row) => matchHome(row) && matchAway(row) && row.home_score !== '' && row.away_score !== '')
const matchEventRows = parseCsv(matchEventsCsv)
const matchTeamStatRows = parseCsv(matchTeamStatsCsv)
const teamBySourceId = new Map(teamRows.map((team) => [team.id, team]))
const stadiumBySourceId = new Map(stadiumRows.map((stadium) => [stadium.id, stadium]))
const matchStatsByKey = new Map(matchTeamStatRows.map((stat) => [`${stat.match_id}:${stat.team_id}`, stat]))
const playersByTeam = groupBy(playerRows, (row) => canonicalTeam(row.team))
const numberedPlayerRows = [...playersByTeam.values()].flatMap(assignSquadNumbers)
const actualTeamNames = uniqueStrings(actualMatchRows.flatMap((row) => [matchHome(row), matchAway(row)]))
const actualMatchByFixtureId = new Map(actualMatchRows.map((row, index) => [actualFixtureId(row, index), row]))
const eventsByMatchId = groupBy(matchEventRows, (row) => row.match_id)

export const worldCup2026Source = {
  github: GITHUB_SOURCE_URL,
  kaggle: KAGGLE_PLAYERS_SOURCE_URL,
  kaggleMatchEvents: KAGGLE_MATCH_EVENTS_SOURCE_URL,
  kaggleLicense: 'CC0: Public Domain',
  fetchedAt: DATASET_FETCHED_AT,
}

export const worldCup2026Players:Player[] = numberedPlayerRows.map(toPlayer)
const playerByNameTeam = new Map(worldCup2026Players.map((player) => [player.source.externalId, player]))

export const worldCup2026Fixtures:NormalizedWorldCupFixture[] = actualMatchRows.map(toActualFixture)
export const worldCup2026Teams:NormalizedWorldCupTeam[] = actualTeamNames.map((name) => ({
  id: teamIdByName(name),
  name: displayTeamName(name),
  code: codeForTeam(name),
  country: displayTeamName(name),
  national: true,
  badgeText: codeForTeam(name) || displayTeamName(name).slice(0, 3).toUpperCase(),
}))
export const worldCup2026Standings:NormalizedWorldCupStandingGroup[] = groupRows.map(toStanding)

const handcraftedScenarios:ScenarioSeed[] = [
  scenario('trailing-draw', '1', 'Mexico', 'South Africa', '패배를 막아라', 'trailing_draw', 3, 70, 'SECOND_HALF', { home:0, away:1 }, '후반 70분, 멕시코가 0-1로 끌려갑니다.', objective('trailing_draw', '최소 무승부 만들기', '남은 시간 안에 한 골 이상을 넣어 개막전 패배를 피하세요.', 90, { minimumGoalsFor:1 }), 'formation-433', 5, undefined, ['낮은 블록 뒤 빠른 전환', '중앙 압박보다 측면 차단 우선'], ['오른쪽 측면 전진 후 복귀가 늦음', '박스 안 슈팅 수가 부족함'], 'GitHub 경기 일정 위에 구성한 수동 IF 기준 흐름입니다. 실제 이벤트 데이터가 부족해 위기 상황과 타임라인은 seed로 보강했습니다.', [[52, 'goal', 'South Africa가 역습 뒤 컷백으로 선제골을 기록했습니다.', 0, 1, 'South Africa'], [73, 'tactical_shift', 'Mexico가 풀백 한 명을 높이고 4-2-3-1처럼 공격 숫자를 늘렸습니다.', 0, 1, 'Mexico'], [84, 'shot', '박스 안 슈팅이 수비 블록에 막혔습니다.', 0, 1, 'Mexico'], [90, 'full_time', '추가 득점 없이 기준 흐름이 종료됐습니다.', 0, 1, 'South Africa']]),
  scenario('red-card-survival', '2', 'South Korea', 'UEFA Path D Winner', '10명으로 버텨라', 'red_card_survival', 4, 35, 'FIRST_HALF', { home:0, away:0 }, '전반 35분, 한국 센터백 퇴장 후 0-0입니다.', objective('red_card_survival', '후반 60분까지 무실점', '수적 열세 이후 25분 동안 실점하지 마세요.', 60, { maximumGoalsAgainst:0 }), 'formation-4231', 5, 'CB', ['수적 우위를 이용한 넓은 폭', '하프스페이스 침투와 크로스 반복'], ['센터백 한 자리 공백', '공격형 미드필더의 수비 전환 부담'], '라인업, 카드, 전술 상황은 수동 seed입니다. 경기 배경은 GitHub 2026 조별 일정입니다.', [[35, 'red_card', 'South Korea 센터백이 결정적 기회를 저지해 퇴장당했습니다.', 0, 0, 'South Korea'], [41, 'substitution', '수비수 투입 없이 중원을 내려 임시 백라인을 구성했습니다.', 0, 0, 'South Korea'], [48, 'shot', '상대의 먼 포스트 헤더가 골문을 벗어났습니다.', 0, 0, 'UEFA Path D Winner'], [60, 'full_time', '기준 흐름은 60분까지 무실점으로 버텼습니다.', 0, 0, 'South Korea']]),
  scenario('protect-lead', '4', 'United States', 'Paraguay', '리드를 지켜라', 'protect_lead', 3, 75, 'SECOND_HALF', { home:1, away:0 }, '후반 75분, 미국이 1-0으로 앞서갑니다.', objective('protect_lead', '실점 없이 경기 종료', '남은 정규 시간과 추가시간 동안 리드를 지키세요.', 90, { maximumGoalsAgainst:0 }), 'formation-4231', 5, undefined, ['직접적인 롱볼과 세컨드볼', '오른쪽 크로스 집중'], ['양 풀백 체력 저하', '수비형 미드필더가 경고를 안고 있음'], '기준 흐름에서는 너무 깊게 내려서 막판 동점 위기를 허용합니다.', [[63, 'goal', 'United States가 전환 공격으로 선제골을 넣었습니다.', 1, 0, 'United States'], [79, 'tactical_shift', '수비 라인을 박스 앞까지 내렸습니다.', 1, 0, 'United States'], [88, 'shot', 'Paraguay의 헤더가 골대를 스쳤습니다.', 1, 0, 'Paraguay'], [90, 'full_time', '기준 흐름은 한 골 차 리드로 종료됐습니다.', 1, 0, 'United States']]),
  scenario('late-winner', '7', 'Brazil', 'Morocco', '마지막 10분', 'late_winner', 4, 80, 'SECOND_HALF', { home:0, away:0 }, '후반 80분, 브라질과 모로코가 0-0입니다.', objective('late_winner', '10분 안에 결승골 만들기', '정규 시간 안에 한 골을 넣어 승리하세요.', 90, { minimumGoalsFor:1 }), 'formation-343', 5, undefined, ['중앙 밀집 수비', '볼 탈취 후 빠른 역습'], ['유효 슈팅 부족', '크로스가 단조롭게 반복됨'], '기준 흐름에서는 공격 숫자를 늘렸지만 좋은 슈팅 위치를 만들지 못했습니다.', [[80, 'tactical_shift', 'Brazil이 윙어를 더 높여 3-4-3에 가까운 형태로 전환했습니다.', 0, 0, 'Brazil'], [84, 'shot', '중거리 슈팅이 수비에 맞고 굴절됐습니다.', 0, 0, 'Brazil'], [89, 'save', 'Morocco 골키퍼가 낮은 슈팅을 막았습니다.', 0, 0, 'Morocco'], [90, 'full_time', '기준 흐름은 무득점으로 종료됐습니다.', 0, 0, 'Brazil']]),
  scenario('extra-time-winner', '69', 'Argentina', 'Austria', '연장전 승부수', 'extra_time_winner', 5, 90, 'EXTRA_TIME_FIRST_HALF', { home:1, away:1 }, '연장 전반 시작, 아르헨티나와 오스트리아가 1-1입니다.', objective('extra_time_winner', '승부차기 전에 득점', '연장전 종료 전 결승골을 만들어 승부를 끝내세요.', 120, { minimumGoalsFor:1 }), 'formation-343', 2, undefined, ['체력은 떨어졌지만 박스 안 수비 집중', '한 명을 남긴 역습'], ['주전 공격진 체력 고갈', '교체 카드 2장만 남음'], '기준 흐름에서는 양 팀이 위험을 줄여 승부차기까지 갑니다.', [[90, 'kick_off', '1-1 상황에서 연장 전반이 시작됐습니다.', 1, 1, 'Argentina'], [103, 'shot', 'Argentina의 중거리 슈팅이 골문을 벗어났습니다.', 1, 1, 'Argentina'], [112, 'save', 'Austria 역습 슈팅을 골키퍼가 막았습니다.', 1, 1, 'Argentina'], [120, 'full_time', '추가 득점 없이 기준 흐름이 종료됐습니다.', 1, 1, 'Austria']]),
  scenario('canada-late-winner', '3', 'Canada', 'UEFA Path A Winner', '홈 개막전의 한 방', 'late_winner', 3, 78, 'SECOND_HALF', { home:0, away:0 }, '후반 78분, 캐나다가 홈 개막전에서 0-0 균형을 깨야 합니다.', objective('late_winner', '정규 시간 안에 결승골', '남은 시간 동안 공격 변화를 만들어 한 골 차 승리를 가져오세요.', 90, { minimumGoalsFor:1 }), 'formation-343', 4, undefined, ['중앙을 비우지 않는 4-4-2 블록', '전환 시 전방 두 명을 빠르게 활용'], ['측면 속도는 좋지만 박스 안 숫자가 부족함', '중원 패스가 안전한 방향으로만 흐름'], '기준 흐름에서는 캐나다가 높은 점유율에도 마지막 패스를 만들지 못했습니다.', [[78, 'tactical_shift', 'Canada가 윙백을 높이며 공격 폭을 넓혔습니다.', 0, 0, 'Canada'], [83, 'shot', '문전 혼전 뒤 슈팅이 수비수에게 막혔습니다.', 0, 0, 'Canada'], [90, 'full_time', '기준 흐름은 0-0으로 끝났습니다.', 0, 0, 'Canada']]),
  scenario('germany-protect-lead', '33', 'Germany', 'Ivory Coast', '압박을 견뎌라', 'protect_lead', 4, 74, 'SECOND_HALF', { home:1, away:0 }, '후반 74분, 독일이 1-0으로 앞서지만 상대 압박이 거세집니다.', objective('protect_lead', '리드 지키기', '남은 시간 동안 실점하지 않고 승리를 마무리하세요.', 90, { maximumGoalsAgainst:0 }), 'formation-4231', 5, undefined, ['강한 피지컬과 세컨드볼 경합', '풀백 뒤 공간을 빠르게 공략'], ['센터백 간격이 벌어짐', '전방 압박 실패 시 역습 노출'], '기준 흐름에서는 독일이 점유율을 낮추고 버티는 선택을 했습니다.', [[61, 'goal', 'Germany가 박스 앞 연계로 선제골을 넣었습니다.', 1, 0, 'Germany'], [82, 'save', '골키퍼가 가까운 거리 슈팅을 막아냈습니다.', 1, 0, 'Germany'], [90, 'full_time', '기준 흐름은 1-0으로 종료됐습니다.', 1, 0, 'Germany']]),
  scenario('netherlands-japan-trailing', '11', 'Netherlands', 'Japan', '오렌지의 반격', 'trailing_draw', 4, 68, 'SECOND_HALF', { home:0, away:1 }, '후반 68분, 네덜란드가 일본에 0-1로 끌려갑니다.', objective('trailing_draw', '패배 피하기', '경기 종료 전 동점 이상을 만드세요.', 90, { minimumGoalsFor:1 }), 'formation-343', 5, undefined, ['촘촘한 중원 압박', '볼 탈취 후 빠른 2선 침투'], ['중앙 빌드업 속도가 느림', '공격수 주변 지원 부족'], '기준 흐름에서는 네덜란드가 공격 숫자를 늘렸지만 역습 위험도 커졌습니다.', [[56, 'goal', 'Japan이 빠른 전환으로 선제골을 만들었습니다.', 0, 1, 'Japan'], [76, 'shot', 'Netherlands의 헤더가 골문 옆으로 벗어났습니다.', 0, 1, 'Netherlands'], [90, 'full_time', '기준 흐름은 0-1 패배로 종료됐습니다.', 0, 1, 'Japan']]),
  scenario('spain-uruguay-extra', '66', 'Spain', 'Uruguay', '연장 점유율의 결론', 'extra_time_winner', 5, 90, 'EXTRA_TIME_FIRST_HALF', { home:1, away:1 }, '연장 전반 시작, 스페인과 우루과이가 1-1입니다.', objective('extra_time_winner', '승부차기 전 결승골', '연장 30분 안에 득점해 승부를 끝내세요.', 120, { minimumGoalsFor:1 }), 'formation-433', 2, undefined, ['낮은 수비와 강한 몸싸움', '세트피스에서 제공권 우위'], ['점유율 대비 박스 침투 부족', '교체 카드가 제한적임'], '기준 흐름에서는 스페인이 공을 오래 소유했지만 결정적인 침투를 만들지 못했습니다.', [[90, 'kick_off', '연장전이 시작됐습니다.', 1, 1, 'Spain'], [101, 'shot', 'Spain의 감아차기가 골문을 살짝 벗어났습니다.', 1, 1, 'Spain'], [116, 'tactical_shift', 'Uruguay가 위험한 프리킥 기회를 얻었습니다.', 1, 1, 'Uruguay'], [120, 'full_time', '기준 흐름은 승부차기로 이어졌습니다.', 1, 1, 'Spain']]),
  scenario('france-norway-red-card', '41', 'France', 'Norway', '한 명 없는 프랑스', 'red_card_survival', 4, 38, 'FIRST_HALF', { home:0, away:0 }, '전반 38분, 프랑스 미드필더가 퇴장당했습니다.', objective('red_card_survival', '60분까지 버티기', '수적 열세 이후 60분까지 실점하지 마세요.', 60, { maximumGoalsAgainst:0 }), 'formation-4231', 4, 'CM', ['직선적인 침투와 빠른 마무리', '하이볼 경합 우위'], ['중원 숫자 부족', '전방 압박을 유지하기 어려움'], '기준 흐름에서는 프랑스가 라인을 낮추며 위험 지역을 줄였습니다.', [[38, 'red_card', 'France 미드필더가 거친 태클로 퇴장당했습니다.', 0, 0, 'France'], [49, 'save', 'Norway의 박스 안 슈팅을 막았습니다.', 0, 0, 'France'], [60, 'full_time', '기준 흐름은 60분까지 0-0입니다.', 0, 0, 'France']]),
  scenario('portugal-colombia-late', '71', 'Portugal', 'Colombia', '막판 균열 만들기', 'late_winner', 4, 80, 'SECOND_HALF', { home:0, away:0 }, '후반 80분, 포르투갈이 콜롬비아의 밀집 수비를 열어야 합니다.', objective('late_winner', '결승골 만들기', '정규 시간 안에 한 골을 넣어 승리하세요.', 90, { minimumGoalsFor:1 }), 'formation-343', 5, undefined, ['박스 앞 밀집 수비', '파울로 템포를 끊는 운영'], ['중앙 침투 타이밍이 늦음', '슈팅 전 패스가 한 번씩 많음'], '기준 흐름에서는 포르투갈이 세트피스와 측면 크로스를 반복했습니다.', [[80, 'tactical_shift', 'Portugal이 공격형 미드필더를 더 전진 배치했습니다.', 0, 0, 'Portugal'], [86, 'shot', '좋은 위치의 프리킥이 수비벽에 막혔습니다.', 0, 0, 'Portugal'], [90, 'full_time', '기준 흐름은 무득점으로 종료됐습니다.', 0, 0, 'Portugal']]),
  scenario('england-croatia-protect', '68', 'England', 'Croatia', '리드를 잠가라', 'protect_lead', 3, 76, 'SECOND_HALF', { home:1, away:0 }, '후반 76분, 잉글랜드가 크로아티아에 1-0으로 앞섭니다.', objective('protect_lead', '실점 없이 종료', '남은 시간 동안 상대 중원 장악을 끊고 리드를 지키세요.', 90, { maximumGoalsAgainst:0 }), 'formation-4231', 5, undefined, ['중원 점유와 2선 침투', '후반 막판 측면 크로스 증가'], ['라인을 내리면 박스 앞 슈팅을 허용함', '전방 압박 체력이 떨어짐'], '기준 흐름에서는 잉글랜드가 내려앉으며 막판 압박을 받았습니다.', [[69, 'goal', 'England가 빠른 공격으로 선제골을 넣었습니다.', 1, 0, 'England'], [85, 'shot', 'Croatia의 중거리 슈팅이 골문 위로 벗어났습니다.', 1, 0, 'Croatia'], [90, 'full_time', '기준 흐름은 1-0으로 종료됐습니다.', 1, 0, 'England']]),
]

export const missionScenarios:ScenarioSeed[] = actualMatchRows.flatMap((row, index) => scenarioFromActualMatch(row, index))

export const opponentProfiles = Object.fromEntries(missionScenarios.map((seed) => [seed.id, seed.opponentTraits]))
export const manualLineupPlans = Object.fromEntries(missionScenarios.map((seed) => [seed.id, { formationId: seed.recommendedFormationId, benchSize: 9 }]))

export const worldCup2026FixtureDetails:NormalizedFixtureDetail[] = missionScenarios.map(toFixtureDetail)
export const worldCup2026Missions:Mission[] = missionScenarios.map(toMission)

export const worldCup2026AppTeams:Team[] = actualTeamNames.map((name, index) => {
  const roster = rosterFor(name)
  return {
    id: teamIdByName(name),
    source: { provider: 'github-worldcup2026', externalId: slug(name) },
    name: displayTeamName(name),
    shortName: codeForTeam(name) || name.slice(0, 3).toUpperCase(),
    countryCode: codeForTeam(name) || name.slice(0, 2).toUpperCase(),
    primaryColor: palette[index % palette.length],
    secondaryColor: '#0f172a',
    startingPlayerIds: roster.startXI.map((player) => player.id),
    benchPlayerIds: roster.substitutes.map((player) => player.id),
  }
})

export const worldCup2026Snapshot:WorldCup2026Snapshot = {
  tournamentYear: 2026,
  season: 2026,
  leagueId: 1,
  provider: 'github-worldcup2026',
  dataMode: 'static_csv_snapshot',
  fetchedAt: DATASET_FETCHED_AT,
  fixtureCount: worldCup2026Fixtures.length,
  teamCount: worldCup2026Teams.length,
  standingGroupCount: worldCup2026Standings.length,
  detailFixtureCount: worldCup2026FixtureDetails.length,
  detailFixtureIds: worldCup2026FixtureDetails.map((detail) => detail.fixtureId),
  disclaimer: 'Actual match results, goal order, cards, team match statistics, and knockout stage context from Kaggle mominullptr/fifa-world-cup-2026-dataset. Team/group/stadium schedule context from rezarahiminia/worldcup2026. Player attributes generated from Kaggle swaptr/fifa-wc-2026-players players.csv. Tactical lineups and IF tactical states are generated seed data for simulation.',
}

function parseCsv(input:string):CsvRow[] {
  const rows:string[][] = []
  let row:string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]
    const next = input[i + 1]
    if (char === '"' && quoted && next === '"') { cell += '"'; i += 1; continue }
    if (char === '"') { quoted = !quoted; continue }
    if (char === ',' && !quoted) { row.push(cell); cell = ''; continue }
    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1
      row.push(cell); cell = ''
      if (row.some(Boolean)) rows.push(row)
      row = []
      continue
    }
    cell += char
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  const headers = rows[0] ?? []
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])))
}

function toFixture(row:CsvRow):NormalizedWorldCupFixture {
  const home = teamBySourceId.get(row.home_team_id)
  const away = teamBySourceId.get(row.away_team_id)
  const stadium = stadiumBySourceId.get(row.stadium_id)
  return {
    id: row.id,
    date: row.date,
    timezone: 'UTC',
    round: row.type === 'group' ? `Group ${row.group} · Matchday ${row.matchday}` : row.type,
    status: { long: row.finished === 'TRUE' ? 'Finished' : 'Not started', short: row.time_elapsed || 'NS', elapsed: null },
    venue: { id: row.stadium_id, name: stadium?.fifa_name || stadium?.name_en || null, city: stadium?.city_en || null },
    teams: { home: fixtureTeam(home), away: fixtureTeam(away) },
    goals: { home: numberOrNull(row.home_score), away: numberOrNull(row.away_score) },
    score: { fulltime: { home: numberOrNull(row.home_score), away: numberOrNull(row.away_score) } },
  }
}

function toActualFixture(row:CsvRow, index:number):NormalizedWorldCupFixture {
  const home = matchHome(row)
  const away = matchAway(row)
  const goals = actualGoals(row)
  return {
    id: actualFixtureId(row, index),
    date: `${row.date}T${row.kickoff_time_utc || row.start_time || '00:00'}:00Z`,
    timezone: 'UTC',
    round: displayRound(row.stage_name || row.round),
    status: { long: 'Finished', short: 'FT', elapsed: 90 },
    venue: { id: slug(row.stadium_name || row.venue), name: row.stadium_name || row.venue || null, city: row.city || venueCity(row.venue || '') },
    teams: { home: fixtureTeamByName(home), away: fixtureTeamByName(away) },
    goals,
    score: { fulltime: goals },
  }
}

function fixtureTeam(row?:CsvRow) {
  const name = row?.name_en ?? 'TBD'
  return { id: teamId(row?.id ?? 'tbd'), name, code: row?.fifa_code || null, badgeText: row?.fifa_code || name.slice(0, 3).toUpperCase(), winner: null }
}

function fixtureTeamByName(name:string) {
  return { id: teamIdByName(name), name: displayTeamName(name), code: codeForTeam(name), badgeText: codeForTeam(name) || displayTeamName(name).slice(0, 3).toUpperCase(), winner: null }
}

function toStanding(row:CsvRow):NormalizedWorldCupStandingGroup {
  return {
    group: `Group ${row.name}`,
    rows: [0, 1, 2, 3].map((index) => {
      const sourceId = row[`teams[${index}].team_id`]
      const team = teamBySourceId.get(sourceId)
      return {
        rank: index + 1,
        team: fixtureTeam(team),
        points: num(row[`teams[${index}].pts`]),
        goalsDiff: num(row[`teams[${index}].gd`]),
        all: {
          played: num(row[`teams[${index}].mp`]),
          win: num(row[`teams[${index}].w`]),
          draw: num(row[`teams[${index}].d`]),
          lose: num(row[`teams[${index}].l`]),
          goalsFor: num(row[`teams[${index}].gf`]),
          goalsAgainst: num(row[`teams[${index}].ga`]),
        },
      }
    }),
  }
}

function toPlayer(row:NumberedPlayerRow):Player {
  const team = canonicalTeam(row.team)
  const position = primaryPosition(row.position)
  const externalId = `${slug(team)}:${slug(row.player)}`
  return {
    id: playerId(team, row.player),
    source: { provider: 'kaggle', externalId },
    name: row.player,
    shirtNumber: num(row.generatedShirtNumber),
    primaryPosition: position,
    positions: [{ position, rating: rating(row) }],
    roles: [{ role: roleFor(position, row), rating: rating(row) }],
    attributes: attributesFor(position, row),
  }
}

function toSupplementalPlayerRow(row:CsvRow):CsvRow {
  const team = eventTeamName(row.team_id)
  const caps = num(row.caps)
  const goals = num(row.goals)
  const marketValue = num(row.market_value_eur)
  return {
    player: row.player_name,
    team,
    position: row.position,
    minutes: String(Math.max(120, caps * 22)),
    games_starts: String(Math.min(7, Math.floor(caps / 15))),
    goals: String(goals),
    assists: '0',
    goals_assists: String(goals),
    shots: String(Math.max(1, goals * 3)),
    shots_on_target: String(Math.max(1, goals * 2)),
    shots_on_target_per90: String(Math.max(0.2, goals / 8)),
    shots_per90: String(Math.max(0.8, goals / 5)),
    goals_per_shot: String(goals > 0 ? 0.12 : 0.03),
    crosses: row.position === 'DEF' || row.position === 'MID' ? '6' : '3',
    fouled: '4',
    fouls: row.position === 'DEF' || row.position === 'MID' ? '8' : '4',
    tackles_won: row.position === 'DEF' ? '12' : row.position === 'MID' ? '9' : '3',
    interceptions: row.position === 'DEF' ? '10' : row.position === 'MID' ? '7' : '2',
    offsides: row.position === 'FWD' ? '3' : '0',
    gk_save_pct: row.position === 'GK' ? '70' : '0',
    gk_games: row.position === 'GK' ? '1' : '0',
    market_value_eur: String(marketValue),
  }
}

function attributesFor(position:PlayerPosition, row:CsvRow):PlayerAttributes {
  const minutes = num(row.minutes)
  const starts = num(row.games_starts)
  const base = clamp(62 + Math.min(16, minutes / 35) + starts)
  if (position === 'GK') {
    const save = num(row.gk_save_pct)
    return { pace:58, finishing:35, passing:clamp(base - 2), crossing:38, dribbling:45, pressing:48, defense:clamp(68 + save / 5), stamina:clamp(64 + minutes / 45), offBall:48, heightPower:78 }
  }
  return {
    pace: clamp(base + num(row.offsides) * 2 + num(row.fouled)),
    finishing: clamp(56 + num(row.goals) * 7 + num(row.shots_on_target_per90) * 5 + num(row.goals_per_shot) * 25),
    passing: clamp(base + num(row.assists) * 5 + num(row.crosses) * .3),
    crossing: clamp(58 + num(row.crosses) * .8 + (position === 'LB' || position === 'RB' || position === 'LW' || position === 'RW' ? 8 : 0)),
    dribbling: clamp(base + num(row.fouled) * 1.2 + num(row.shots_per90)),
    pressing: clamp(base + num(row.fouls) * .8 + num(row.tackles_won) * 1.4),
    defense: clamp(56 + num(row.interceptions) * 2 + num(row.tackles_won) * 2 + (['CB', 'LB', 'RB', 'DM'].includes(position) ? 10 : 0)),
    stamina: clamp(66 + minutes / 30),
    offBall: clamp(base + num(row.goals_assists) * 4 + num(row.shots_per90) * 2),
    heightPower: clamp(64 + (position === 'CB' || position === 'ST' ? 9 : 0) + num(row.shots_on_target) * .8),
  }
}

function toMission(seed:ScenarioSeed):Mission {
  const fixture = worldCup2026Fixtures.find((item) => item.id === seed.fixtureId)
  const userTeamId = teamIdByName(seed.userTeam)
  const dismissedPlayerId = seed.dismissedPosition ? rosterFor(seed.userTeam).startXI.find((player) => player.primaryPosition === seed.dismissedPosition)?.id : undefined
  return {
    id: seed.id,
    source: { provider: 'manual', matchExternalId: seed.fixtureId },
    title: seed.title,
    type: seed.type,
    difficulty: seed.difficulty,
    situation: seed.situation,
    objective: seed.objective,
    context: {
      matchId: `github-worldcup2026-match-${seed.fixtureId}`,
      competition: '2026 World Cup IF',
      season: '2026',
      stage: fixture?.round ?? 'Group stage',
      period: seed.period,
      minute: seed.minute,
      score: seed.score,
      userTeamId,
      opponentTeamId: teamIdByName(seed.opponentTeam),
      availableSubstitutions: seed.availableSubstitutions,
      dismissedPlayerId,
      dismissedPosition: seed.dismissedPosition,
    },
    recommendedFormationId: seed.recommendedFormationId,
    opponentTraits: seed.opponentTraits,
    teamProblems: seed.teamProblems,
    actualFlowSummary: seed.actualFlowSummary,
    actualTimeline: seed.timeline.map((event, index) => timelineEvent(seed, event, index)),
    relatedFixtureId: seed.fixtureId,
    confidence: 'medium',
    dataSource: { provider: 'github-worldcup2026', fetchedAt: DATASET_FETCHED_AT },
  }
}

function toFixtureDetail(seed:ScenarioSeed):NormalizedFixtureDetail {
  const teams = [seed.userTeam, seed.opponentTeam]
  const match = actualMatchByFixtureId.get(seed.fixtureId)
  return {
    fixtureId: seed.fixtureId,
    events: seed.timeline.map((event) => ({ fixtureId: seed.fixtureId, minute: event[0], teamId: teamIdByName(event[5] ?? seed.userTeam), teamName: displayTeamName(event[5] ?? seed.userTeam), type: event[1] === 'red_card' ? 'Card' : event[1] === 'substitution' ? 'subst' : event[1] === 'goal' ? 'Goal' : 'Event', detail: event[2] })),
    lineups: teams.map((teamName) => ({ fixtureId: seed.fixtureId, teamId: teamIdByName(teamName), teamName: displayTeamName(teamName), formation: teamName === seed.userTeam ? seed.recommendedFormationId.replace('formation-', '') : '4-2-3-1', startXI: rosterFor(teamName).startXI.map(lineupPlayer), substitutes: rosterFor(teamName).substitutes.map(lineupPlayer) })),
    statistics: teams.map((teamName) => ({ fixtureId: seed.fixtureId, teamId: teamIdByName(teamName), teamName: displayTeamName(teamName), statistics: match ? actualStatisticsFor(match, teamName) : { 'Data basis': 'Kaggle players.csv + generated IF lineup seed' } })),
    playerStats: [],
  }
}

function rosterFor(teamName:string) {
  const rows = uniqueRows([...(playersByTeam.get(canonicalTeam(teamName)) ?? [])]).sort((a, b) => num(b.minutes) - num(a.minutes))
  const byPosition = {
    GK: rows.filter((row) => row.position.includes('GK')),
    DF: rows.filter((row) => row.position.includes('DF') || row.position.includes('DEF')),
    MF: rows.filter((row) => row.position.includes('MF') || row.position.includes('MID')),
    FW: rows.filter((row) => row.position.includes('FW') || row.position.includes('FWD')),
  }
  const startRows = takeUnique([...byPosition.GK.slice(0, 1), ...byPosition.DF.slice(0, 4), ...byPosition.MF.slice(0, 3), ...byPosition.FW.slice(0, 3)], 11)
  const fallbackRows = rows.filter((row) => !startRows.includes(row)).slice(0, Math.max(0, 11 - startRows.length))
  const selectedStartRows = takeUnique([...startRows, ...fallbackRows], 11)
  const startXI = selectedStartRows.map(playerFromRow)
  const substitutes = takeUnique(rows.filter((row) => !selectedStartRows.includes(row)), 9).map(playerFromRow)
  return { startXI, substitutes }
}

function playerFromRow(row:CsvRow):Player {
  return playerByNameTeam.get(`${slug(canonicalTeam(row.team))}:${slug(row.player)}`) ?? toPlayer({ ...row, generatedShirtNumber: '99' })
}

function lineupPlayer(player:Player) {
  return { id: player.id, name: player.name, number: player.shirtNumber, pos: player.primaryPosition, grid: null }
}

function timelineEvent(seed:ScenarioSeed, event:[number, ActualMatchTimelineEvent['type'], string, number, number, string?], index:number):ActualMatchTimelineEvent {
  return { id: `${seed.id}-event-${index + 1}`, minute: event[0], period: event[0] > 105 ? 'EXTRA_TIME_SECOND_HALF' : event[0] > 90 ? 'EXTRA_TIME_FIRST_HALF' : event[0] > 45 ? 'SECOND_HALF' : 'FIRST_HALF', teamId: teamIdByName(event[5] ?? seed.userTeam), type: event[1], summary: event[2], homeScore: event[3], awayScore: event[4] }
}

function scenario(id:string, fixtureId:string, userTeam:string, opponentTeam:string, title:string, type:MissionType, difficulty:1|2|3|4|5, minute:number, period:MatchContext['period'], score:{home:number;away:number}, situation:string, objectiveValue:MissionObjective, recommendedFormationId:string, availableSubstitutions:number, dismissedPosition:PlayerPosition|undefined, opponentTraits:string[], teamProblems:string[], actualFlowSummary:string, timeline:ScenarioSeed['timeline']):ScenarioSeed {
  return { id, fixtureId, userTeam, opponentTeam, title, type, difficulty, minute, period, score, situation, objective: objectiveValue, recommendedFormationId, availableSubstitutions, dismissedPosition, opponentTraits, teamProblems, actualFlowSummary, timeline }
}

function objective(type:MissionType, title:string, description:string, targetMinute:number, extra:Partial<MissionObjective> = {}):MissionObjective {
  return { type, title, description, targetMinute, ...extra }
}

function teamIdByName(name:string) { return teamId(slug(canonicalTeam(name))) }

function teamId(id:string) { return `github-worldcup2026-team-${id}` }
function playerId(team:string, player:string) { return `kaggle-player-${slug(team)}-${slug(player)}` }
function slug(value:string) { return value.normalize('NFKD').replace(/[^\w\s-]/g, '').trim().toLowerCase().replace(/[\s_]+/g, '-') || 'unknown' }
function canonicalTeam(value:string) { return teamAliases[value] ?? value }
function groupBy<T>(items:T[], key:(item:T)=>string) { return items.reduce((map, item) => map.set(key(item), [...(map.get(key(item)) ?? []), item]), new Map<string,T[]>()) }
function num(value:string|number|undefined|null) { return Number.isFinite(Number(value)) ? Number(value) : 0 }
function numberOrNull(value:string) { return value === '' || value === 'null' ? null : num(value) }
function clamp(value:number) { return Math.max(35, Math.min(95, Math.round(value))) }
function rating(row:CsvRow) { return clamp(68 + num(row.minutes) / 45 + num(row.goals_assists) * 2 + num(row.tackles_won) * .7 + num(row.gk_save_pct) / 10) }

function primaryPosition(value:string):PlayerPosition {
  if (value.includes('GK')) return 'GK'
  if (value.includes('DF') || value.includes('DEF')) return 'CB'
  if (value.includes('MF') || value.includes('MID')) return 'CM'
  if (value.includes('FW') || value.includes('FWD')) return 'ST'
  return 'CM'
}

function roleFor(position:PlayerPosition, row:CsvRow):PlayerRole {
  if (position === 'GK') return num(row.gk_games) > 0 ? 'goalkeeper' : 'sweeper_keeper'
  if (position === 'CB') return num(row.crosses) > 2 ? 'full_back' : 'stopper'
  if (position === 'CM') return num(row.interceptions) > num(row.goals_assists) ? 'box_to_box' : 'advanced_playmaker'
  return num(row.crosses) > num(row.shots) ? 'winger' : 'pressing_forward'
}

function uniqueRows(rows:CsvRow[]) {
  const seen = new Set<string>()
  return rows.filter((row) => {
    const key = playerKey(row)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function playerKey(row:CsvRow) {
  return `${canonicalTeam(row.team)}:${slug(row.player)}`
}

function takeUnique(rows:CsvRow[], count:number) {
  return uniqueRows(rows).slice(0, count)
}

function assignSquadNumbers(rows:CsvRow[]):NumberedPlayerRow[] {
  const sorted = uniqueRows(rows).sort((a, b) => positionRank(a.position) - positionRank(b.position) || num(b.minutes) - num(a.minutes) || a.player.localeCompare(b.player))
  const used = new Set<number>()
  return sorted.map((row, index) => {
    const preferred = preferredNumber(row, index)
    const generatedShirtNumber = String(nextAvailable(preferred, used))
    return { ...row, generatedShirtNumber }
  })
}

function preferredNumber(row:CsvRow, index:number) {
  if (row.position.includes('GK')) return index === 0 ? 1 : 12 + index
  if (row.position.includes('DF') || row.position.includes('DEF')) return 2 + index
  if (row.position.includes('MF') || row.position.includes('MID')) return 6 + index
  if (row.position.includes('FW') || row.position.includes('FWD')) return 9 + index
  return 20 + index
}

function nextAvailable(start:number, used:Set<number>) {
  let value = ((start - 1) % 99) + 1
  while (used.has(value)) value = (value % 99) + 1
  used.add(value)
  return value
}

function positionRank(position:string) {
  if (position.includes('GK')) return 0
  if (position.includes('DF') || position.includes('DEF')) return 1
  if (position.includes('MF') || position.includes('MID')) return 2
  if (position.includes('FW') || position.includes('FWD')) return 3
  return 4
}

function scenarioFromActualMatch(row:CsvRow, index:number):ScenarioSeed[] {
  const fixtureId = actualFixtureId(row, index)
  const home = matchHome(row)
  const away = matchAway(row)
  const { home: homeGoals, away: awayGoals } = actualGoals(row)
  const events = enrichedEventsForMatch(row)
  const comeback = comebackScenario(fixtureId, row, events)
  if (comeback) return [comeback]
  const redCard = events.find((event) => event.event_type === 'Red Card')
  if (redCard) {
    const redTeam = eventTeamName(redCard.team_id)
    const opponent = redTeam === home ? away : home
    return [redCardScenario(fixtureId, row, redTeam, opponent, events, redCard)]
  }
  if (homeGoals > awayGoals) return [protectScenario(fixtureId, row, home, away, events)]
  if (awayGoals > homeGoals) return [protectScenario(fixtureId, row, away, home, events)]
  if (row.result_type === 'Penalties' || displayRound(row.stage_name || row.round) !== '조별리그') return [extraTimeScenario(fixtureId, row, home, away, events)]
  return [lateWinnerScenario(fixtureId, row, home, away, homeGoals, awayGoals)]
}

function comebackScenario(fixtureId:string, row:CsvRow, events:MatchEventRow[]):ScenarioSeed|undefined {
  const finalGoals = actualGoals(row)
  const winner = finalGoals.home > finalGoals.away ? matchHome(row) : finalGoals.away > finalGoals.home ? matchAway(row) : ''
  if (!winner) return undefined
  const opponent = winner === matchHome(row) ? matchAway(row) : matchHome(row)
  const goals = events.filter((event) => event.event_type === 'Goal')
  const firstTrailingGoal = goals.find((event) => scoreForTeam(row, winner, event.runningHome, event.runningAway).home < scoreForTeam(row, winner, event.runningHome, event.runningAway).away)
  if (!firstTrailingGoal) return undefined
  const equalizer = goals.find((event) => num(event.minute) > num(firstTrailingGoal.minute) && eventTeamName(event.team_id) === winner && scoreForTeam(row, winner, event.runningHome, event.runningAway).home >= scoreForTeam(row, winner, event.runningHome, event.runningAway).away)
  if (!equalizer) return undefined
  const minute = Math.max(num(firstTrailingGoal.minute) + 5, Math.min(num(equalizer.minute) - 10, num(firstTrailingGoal.minute) + 28))
  const startScore = scoreForTeam(row, winner, ...homeAwayScoreAt(events, minute))
  const userName = displayTeamName(winner)
  const opponentName = displayTeamName(opponent)
  const firstMinute = num(firstTrailingGoal.minute)
  const equalizerMinute = num(equalizer.minute)
  const winnerGoals = scoreForTeam(row, winner, finalGoals.home, finalGoals.away).home
  const opponentGoals = scoreForTeam(row, winner, finalGoals.home, finalGoals.away).away
  return scenario(
    `actual-${fixtureId}-comeback-${slug(winner)}`,
    fixtureId,
    winner,
    opponent,
    `${userName}의 역전 설계`,
    'trailing_draw',
    4,
    minute,
    periodForMinute(minute),
    startScore,
    `${matchTimeLabel(minute)}, ${userName}이 ${opponentName}에 ${startScore.home}-${startScore.away}로 끌려갑니다.`,
    objective('trailing_draw', '패배를 뒤집는 최소 조건', `실제 골 순서는 ${opponentName} 선제골 뒤 ${userName}이 따라잡은 흐름입니다. 경기 종료 전 동점 이상을 만드세요.`, 90, { minimumGoalsFor:1 }),
    formationId(''),
    5,
    undefined,
    opponentProfileFromStats(row, opponent),
    [`${firstMinute}분 선제 실점 이후 공격 전환 속도를 높여야 함`, ...teamProblemsFromStats(row, winner).slice(0, 1)],
    `${actualScoreText(row)}. 실제 골 흐름은 ${opponentName} ${firstMinute}분 선제골, ${userName} ${equalizerMinute}분 동점골 이후 ${winnerGoals > opponentGoals ? `${winnerGoals}-${opponentGoals}로 역전승` : `${winnerGoals}-${opponentGoals} 무승부`}입니다.`,
    timelineFromEvents(row, events, winner),
  )
}

function protectScenario(fixtureId:string, row:CsvRow, userTeam:string, opponentTeam:string, events:MatchEventRow[]):ScenarioSeed {
  const finalGoals = actualGoals(row)
  const finalUserScore = scoreForTeam(row, userTeam, finalGoals.home, finalGoals.away)
  const goAhead = [...events].reverse().find((event) => event.event_type === 'Goal' && eventTeamName(event.team_id) === userTeam && scoreForTeam(row, userTeam, event.runningHome, event.runningAway).home > scoreForTeam(row, userTeam, event.runningHome, event.runningAway).away)
  const minute = Math.min(80, Math.max(65, goAhead ? num(goAhead.minute) + 5 : 75))
  const startScore = scoreForTeam(row, userTeam, ...homeAwayScoreAt(events, minute))
  const userName = displayTeamName(userTeam)
  const opponentName = displayTeamName(opponentTeam)
  return scenario(
    `actual-${fixtureId}-protect-${slug(userTeam)}`,
    fixtureId,
    userTeam,
    opponentTeam,
    `${userName} 리드 지키기`,
    'protect_lead',
    finalUserScore.home - finalUserScore.away >= 3 ? 2 : 3,
    minute,
    periodForMinute(minute),
    startScore,
    `${matchTimeLabel(minute)}, ${userName}이 ${startScore.home}-${startScore.away}로 앞서갑니다.`,
    objective('protect_lead', '실점 없이 경기 종료', `실제 경기는 ${actualScoreText(row)}로 끝났습니다. 남은 시간을 관리해 리드를 지키세요.`, 90, { maximumGoalsAgainst:0 }),
    formationId(''),
    5,
    undefined,
    opponentProfileFromStats(row, opponentTeam),
    teamProblemsFromStats(row, userTeam),
    actualSummary(row),
    timelineFromEvents(row, events, userTeam, [[Math.min(88, minute + 7), 'shot', `${opponentName}이 추격을 위해 슈팅 빈도를 높였습니다.`, startScore.home, startScore.away, opponentTeam]]),
  )
}

function lateWinnerScenario(fixtureId:string, row:CsvRow, userTeam:string, opponentTeam:string, userGoals:number, opponentGoals:number):ScenarioSeed {
  const userName = displayTeamName(userTeam)
  const opponentName = displayTeamName(opponentTeam)
  return scenario(
    `actual-${fixtureId}-late-${slug(userTeam)}`,
    fixtureId,
    userTeam,
    opponentTeam,
    `${userName} 마지막 10분`,
    'late_winner',
    4,
    80,
    'SECOND_HALF',
    { home: userGoals, away: opponentGoals },
    `후반 80분, ${userName}과 ${opponentName}이 ${userGoals}-${opponentGoals}로 맞서고 있습니다.`,
    objective('late_winner', '정규 시간 안에 결승골', `실제 경기는 ${actualScoreText(row)}로 끝났습니다. IF 전술로 무승부를 승리로 바꿔보세요.`, 90, { minimumGoalsFor:1 }),
    formationId(row.home_formation),
    5,
    undefined,
    opponentProfileFromStats(row, opponentTeam),
    teamProblemsFromStats(row, userTeam),
    actualSummary(row),
    timelineFromEvents(row, enrichedEventsForMatch(row), userTeam, [
      [80, 'tactical_shift', `${userName}이 실제 경기 막판 공격 숫자를 조정합니다.`, userGoals, opponentGoals, userTeam],
      [87, 'shot', `양 팀이 마지막 득점 기회를 만들었지만 승부를 가르지 못했습니다.`, userGoals, opponentGoals, userTeam],
      [90, 'full_time', `실제 최종 스코어는 ${actualScoreText(row)}입니다.`, userGoals, opponentGoals, userTeam],
    ]),
  )
}

function extraTimeScenario(fixtureId:string, row:CsvRow, userTeam:string, opponentTeam:string, events:MatchEventRow[]):ScenarioSeed {
  const userName = displayTeamName(userTeam)
  const opponentName = displayTeamName(opponentTeam)
  const finalGoals = actualGoals(row)
  const finalScore = scoreForTeam(row, userTeam, finalGoals.home, finalGoals.away)
  return scenario(
    `actual-${fixtureId}-extra-${slug(userTeam)}`,
    fixtureId,
    userTeam,
    opponentTeam,
    `${userName} 연장전 승부수`,
    'extra_time_winner',
    5,
    90,
    'EXTRA_TIME_FIRST_HALF',
    { home: finalScore.home, away: finalScore.away },
    `연장 전반 시작, ${userName}과 ${opponentName}이 ${finalScore.home}-${finalScore.away}로 맞서고 있습니다.`,
    objective('extra_time_winner', '승부차기 전에 득점', '승부차기 전에 추가 득점을 만들어 경기를 끝내세요.', 120, { minimumGoalsFor:1 }),
    formationId(''),
    2,
    undefined,
    opponentProfileFromStats(row, opponentTeam),
    ['연장전 체력 저하로 전방 압박 지속 시간이 짧아짐', ...teamProblemsFromStats(row, userTeam).slice(0, 1)],
    actualSummary(row),
    timelineFromEvents(row, events, userTeam, [[120, 'full_time', `실제 경기는 ${actualScoreText(row)} 이후 ${row.result_type === 'Penalties' ? '승부차기' : '연장 흐름'}로 마무리됐습니다.`, finalScore.home, finalScore.away, userTeam]]),
  )
}

function redCardScenario(fixtureId:string, row:CsvRow, userTeam:string, opponentTeam:string, events:MatchEventRow[], redCard:MatchEventRow):ScenarioSeed {
  const userName = displayTeamName(userTeam)
  const opponentName = displayTeamName(opponentTeam)
  const minute = num(redCard.minute)
  const startScore = scoreForTeam(row, userTeam, ...homeAwayScoreAt(events, minute))
  return scenario(
    `actual-${fixtureId}-red-${slug(userTeam)}`,
    fixtureId,
    userTeam,
    opponentTeam,
    `${userName} 수적 열세`,
    'red_card_survival',
    4,
    minute,
    periodForMinute(minute),
    startScore,
    `${matchTimeLabel(minute)}, ${userName}이 퇴장으로 10명이 됐습니다.`,
    objective('red_card_survival', `${Math.min(90, minute + 25)}분까지 무실점`, '실제 경기 퇴장 이벤트를 반영한 위기입니다. 수적 열세 직후 실점하지 마세요.', Math.min(90, minute + 25), { maximumGoalsAgainst:0 }),
    formationId(''),
    5,
    'CB',
    opponentProfileFromStats(row, opponentTeam),
    ['수적 열세로 중원 간격 관리가 어려움', ...teamProblemsFromStats(row, userTeam).slice(0, 1)],
    actualSummary(row),
    timelineFromEvents(row, events, userTeam, [[Math.min(90, minute + 12), 'shot', `${opponentName}이 수적 우위를 이용해 슈팅을 시도했습니다.`, startScore.home, startScore.away, opponentTeam]]),
  )
}

function actualFixtureId(row:CsvRow, index:number) {
  return `kaggle-match-${row.match_id || String(index + 1).padStart(2, '0')}-${slug(matchHome(row))}-${slug(matchAway(row))}`
}

function actualScoreText(row:CsvRow) {
  const goals = actualGoals(row)
  return `${displayTeamName(matchHome(row))} ${goals.home}-${goals.away} ${displayTeamName(matchAway(row))}`
}

function actualSummary(row:CsvRow) {
  const homeStats = statsForTeam(row, matchHome(row))
  const awayStats = statsForTeam(row, matchAway(row))
  return `실제 경기 데이터 기준 ${actualScoreText(row)}. 점유율 ${homeStats.possession_pct}-${awayStats.possession_pct}, 유효슈팅 ${homeStats.shots_on_target}-${awayStats.shots_on_target}, 총슈팅 ${homeStats.total_shots}-${awayStats.total_shots}, 코너 ${homeStats.corners}-${awayStats.corners}.`
}

function actualStatisticsFor(row:CsvRow, teamName:string):Record<string, string | number | null> {
  const stats = statsForTeam(row, teamName)
  return {
    Possession: num(stats.possession_pct),
    'Shots on target': num(stats.shots_on_target),
    'Total shots': num(stats.total_shots),
    Corners: num(stats.corners),
    Fouls: num(stats.fouls),
    Offsides: num(stats.offsides),
    Saves: num(stats.saves),
    'Player of the match': stats.player_of_the_match || null,
    Source: stats.data_source || 'Kaggle match_team_stats.csv',
  }
}

function opponentProfileFromStats(row:CsvRow, opponentTeam:string) {
  const stats = statsForTeam(row, opponentTeam)
  const traits = [`점유율 ${num(stats.possession_pct)}% · 총슈팅 ${num(stats.total_shots)}회`, `유효슈팅 ${num(stats.shots_on_target)}회 · 코너 ${num(stats.corners)}회`]
  if (num(stats.corners) >= 5) traits.push('코너킥과 세트피스 위협')
  if (num(stats.fouls) >= 13) traits.push('파울로 템포를 끊는 강한 경합')
  if (num(stats.offsides) >= 2) traits.push('라인 뒤 공간을 반복적으로 노리는 침투')
  return traits
}

function teamProblemsFromStats(row:CsvRow, userTeam:string) {
  const stats = statsForTeam(row, userTeam)
  const problems = [`실제 유효슈팅 ${num(stats.shots_on_target)}회 · 파울 ${num(stats.fouls)}회`]
  if (num(stats.saves) >= 4) problems.push('골키퍼 선방 의존도가 높았던 흐름')
  if (num(stats.total_shots) <= 8) problems.push('슈팅 생산량 부족')
  if (num(stats.possession_pct) <= 45) problems.push('볼 점유 시간이 짧아 수비 시간이 길었음')
  return problems
}

function formationId(value:string) {
  if (value === '3-4-3') return 'formation-343'
  if (value === '4-2-3-1') return 'formation-4231'
  return 'formation-433'
}

function codeForTeam(name:string) {
  const canonical = canonicalTeam(name)
  return teamCodes[canonical] || eventTeamRows.find((row) => canonicalTeam(row.team_name) === canonical)?.fifa_code || teamRows.find((row) => canonicalTeam(row.name_en) === canonical)?.fifa_code || canonical.slice(0, 3).toUpperCase()
}

function venueCity(venue:string) {
  const parts = venue.split(',')
  return parts.length > 1 ? parts.slice(1).join(',').trim() : null
}

function uniqueStrings(values:string[]) {
  return [...new Set(values.filter(Boolean))]
}

function displayTeamName(name:string) {
  const canonical = canonicalTeam(name)
  return teamKoreanNames[canonical] ?? canonical
}

function displayRound(round:string) {
  if (round === 'Group stage' || round === 'Group Stage') return '조별리그'
  if (round === 'Round of 32') return '32강'
  if (round === 'Round of 16') return '16강'
  if (round === 'Quarter-finals') return '8강'
  if (round === 'Semi-finals') return '4강'
  if (round === 'Third-place match') return '3위 결정전'
  if (round === 'Final') return '결승'
  return round || '월드컵'
}

function actualGoals(row:CsvRow) {
  if (row.home_score !== '' && row.away_score !== '') return { home: num(row.home_score), away: num(row.away_score) }
  const scores = [...row.score.matchAll(/(\d+)\s*[\u2013-]\s*(\d+)/g)]
  const match = scores.at(-1)
  return { home: match ? Number(match[1]) : 0, away: match ? Number(match[2]) : 0 }
}

function matchHome(row:CsvRow) {
  return canonicalTeam(row.home_team_name || row.home_team || '')
}

function matchAway(row:CsvRow) {
  return canonicalTeam(row.away_team_name || row.away_team || '')
}

function eventTeamName(teamId:string|number|undefined) {
  return eventTeamById.get(String(teamId ?? '')) ?? 'Unknown'
}

function eventType(type:string):ActualMatchTimelineEvent['type'] {
  if (type === 'Goal' || type === 'Penalty Shootout Goal') return 'goal'
  if (type === 'Red Card') return 'red_card'
  if (type === 'Yellow Card' || type === 'VAR Review') return 'tactical_shift'
  return 'shot'
}

function enrichedEventsForMatch(row:CsvRow):MatchEventRow[] {
  const events = [...(eventsByMatchId.get(row.match_id) ?? [])].sort((a, b) => num(a.minute) - num(b.minute) || num(a.event_id) - num(b.event_id))
  let runningHome = 0
  let runningAway = 0
  return events.map((event) => {
    if (event.event_type === 'Goal') {
      const team = eventTeamName(event.team_id)
      if (team === matchHome(row)) runningHome += 1
      if (team === matchAway(row)) runningAway += 1
    }
    return { event_id: event.event_id, match_id: event.match_id, minute: event.minute, event_type: event.event_type, team_id: event.team_id, player_id: event.player_id, runningHome, runningAway }
  })
}

function homeAwayScoreAt(events:MatchEventRow[], minute:number):[number, number] {
  const last = [...events].reverse().find((event) => event.event_type === 'Goal' && num(event.minute) <= minute)
  return last ? [last.runningHome, last.runningAway] : [0, 0]
}

function scoreForTeam(row:CsvRow, userTeam:string, homeScore:number, awayScore:number) {
  return userTeam === matchHome(row) ? { home: homeScore, away: awayScore } : { home: awayScore, away: homeScore }
}

function timelineFromEvents(row:CsvRow, events:MatchEventRow[], userTeam:string, extra:ScenarioSeed['timeline'] = []):ScenarioSeed['timeline'] {
  const mappedEvents = events
    .filter((event) => ['Goal', 'Red Card', 'Yellow Card', 'Penalty Shootout Goal', 'Penalty Shootout Miss'].includes(event.event_type))
    .map((event):ScenarioSeed['timeline'][number] => {
      const team = eventTeamName(event.team_id)
      const score = scoreForTeam(row, userTeam, event.runningHome, event.runningAway)
      return [num(event.minute), eventType(event.event_type), eventSummary(event, team), score.home, score.away, team]
    })
  const finalGoals = actualGoals(row)
  const finalScore = scoreForTeam(row, userTeam, finalGoals.home, finalGoals.away)
  const finalEvent:ScenarioSeed['timeline'][number] = [90, 'full_time', `실제 최종 스코어는 ${actualScoreText(row)}입니다.`, finalScore.home, finalScore.away, userTeam]
  return [...mappedEvents, ...extra, finalEvent]
    .sort((a, b) => a[0] - b[0])
    .filter((event, index, all) => index === all.findIndex((candidate) => candidate[0] === event[0] && candidate[1] === event[1] && candidate[2] === event[2]))
    .slice(0, 10)
}

function eventSummary(event:{ event_type:string; minute:string }, team:string) {
  const teamName = displayTeamName(team)
  if (event.event_type === 'Goal') return `${teamName}이 ${event.minute}분 득점했습니다.`
  if (event.event_type === 'Red Card') return `${teamName}에 ${event.minute}분 퇴장이 나왔습니다.`
  if (event.event_type === 'Yellow Card') return `${teamName}에 ${event.minute}분 경고가 나왔습니다.`
  if (event.event_type === 'Penalty Shootout Goal') return `${teamName}이 승부차기에서 성공했습니다.`
  if (event.event_type === 'Penalty Shootout Miss') return `${teamName}이 승부차기에서 실축했습니다.`
  return `${teamName}의 주요 이벤트입니다.`
}

function statsForTeam(row:CsvRow, teamName:string) {
  const teamId = eventTeamRows.find((team) => canonicalTeam(team.team_name) === canonicalTeam(teamName))?.team_id ?? ''
  return matchStatsByKey.get(`${row.match_id}:${teamId}`) ?? ({} as CsvRow)
}

function periodForMinute(minute:number):MatchContext['period'] {
  if (minute > 105) return 'EXTRA_TIME_SECOND_HALF'
  if (minute > 90) return 'EXTRA_TIME_FIRST_HALF'
  return minute > 45 ? 'SECOND_HALF' : 'FIRST_HALF'
}

function matchTimeLabel(minute:number) {
  if (minute > 90) return `연장 ${minute - 90}분`
  return minute > 45 ? `후반 ${minute}분` : `전반 ${minute}분`
}
