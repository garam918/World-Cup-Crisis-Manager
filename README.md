# 감독의 한 수

2026 월드컵 스타일의 위기 상황을 다시 지휘하는 단계형 IF 전술 시뮬레이터입니다. 전술 편집, deterministic Monte Carlo 시뮬레이션, 실제/IF 흐름 비교를 제공합니다.

## 실행 방법

Node.js 18 이상이 필요합니다.

```bash
npm install
npm run dev
```

기본 개발 주소는 `http://localhost:5173`입니다.

## npm scripts

```bash
npm run dev      # Vite 개발 서버
npm run build    # TypeScript 검사 및 프로덕션 빌드
npm run preview  # 프로덕션 빌드 미리보기
npm test         # Vitest 단위 테스트
npm run sync:worldcup # API-Football 데이터를 정적 snapshot으로 동기화
```

## 구조

```text
src/
  app/       # 앱 조립, 단계 store, 화면 순서
  features/  # 6개 사용자 화면과 화면별 UI
  entities/  # mission, player, team, tactic, simulation 타입
  engine/    # 향후 시뮬레이션 순수 함수
  data/      # 정적 seed와 generated snapshot
  services/  # World Cup provider, mapper, repository
  shared/    # 공통 컴포넌트와 유틸리티
```

`src/app/appStore.ts`의 `currentStep`이 라우터 없이 다음 흐름을 제어합니다.

`LandingPage → MissionSelectPage → MissionBriefingPage → TacticEditorPage → SimulationPage → ResultReportPage`

## Data Sources

The MVP runs entirely from static files bundled with the app. Runtime gameplay does not call external APIs and does not require API keys.

- Actual match results, goal order, cards, team match statistics, squads, and knockout context: [`mominullptr/fifa-world-cup-2026-dataset`](https://www.kaggle.com/datasets/mominullptr/fifa-world-cup-2026-dataset), `matches_detailed.csv`, `match_events.csv`, `match_team_stats.csv`, `squads_and_players.csv`, CC0: Public Domain
- Match schedule, teams, groups, and stadium context: [`rezarahiminia/worldcup2026`](https://github.com/rezarahiminia/worldcup2026)
- Player stat source for generated attributes: [`swaptr/fifa-wc-2026-players`](https://www.kaggle.com/datasets/swaptr/fifa-wc-2026-players), `players.csv`, CC0: Public Domain
- Manual seed supplements: mission scenarios, tactical lineups, bench plans, red-card/substitution situations, and opponent profiles

Bundled source CSV files live in:

```txt
src/data/source/
```

The app normalizes those files through `src/data/worldCup2026Static.ts`. It uses Kaggle `match_events.csv` to reconstruct goal order and card events, `matches_detailed.csv` for actual scores and tournament rounds, and `match_team_stats.csv` for possession, shots, corners, fouls, and saves. Missing tactical-state data such as detailed substitutions, in-match tactical instructions, and mission-specific crisis framing is still filled with generated seed data suitable for an IF tactical simulator.

### Latest verified snapshot

- Kaggle dataset version: 69
- Kaggle last-updated timestamp checked through the dataset API: 2026-07-16 08:15:07 UTC
- Latest completed-match range in the downloadable CSV: quarter-finals, through match 100
- Semi-finals (matches 101 and 102): still marked `Scheduled`, so they are excluded from missions until verified scores and events are published

## Legacy Sync Script

`npm run sync:worldcup` remains in the repository as an older API-Football snapshot workflow, but it is not the default data source for the MVP.

### Data Strategy

The app uses Kaggle World Cup match/event data as the base match result/stat source, GitHub World Cup data for schedule and venue context, and Kaggle `players.csv` as the primary player ability source. Mission scenarios are IF situations derived from actual goal/card events, with manual seed supplements for lineups, benches, substitutions, opponent profiles, and tactical context that are not fully represented in the source data.

The simulator is not an official prediction model. It is a tactical IF simulator that estimates possible match-flow changes based on user decisions.

No FIFA logos, official World Cup logos, federation crests, player photos, or match videos are used.
