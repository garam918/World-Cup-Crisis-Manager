# AGENTS.md

## Project Name

감독의 한 수  
World Cup Crisis Manager

## Project Summary

This project is a web-based mini football management simulator for a hackathon.  
The user becomes the manager in a specific crisis moment from a World Cup-style match and tries to complete a tactical mission by changing substitutions, formation, player positions, player roles, and detailed tactical instructions.

The product should feel like a lightweight FM-style simulator, but it must remain feasible for a web hackathon MVP.

## Core Product Concept

The user does not simulate a full tournament or a full realistic football engine.

Instead, the user plays short tactical missions:

- Down 0-1 in the 70th minute: avoid defeat.
- One player sent off in the 35th minute: survive without conceding.
- Leading 1-0 in the 75th minute: protect the lead.
- Extra time begins at 1-1: score before penalties.
- 0-0 in the 80th minute: find a late winner.

The experience flow:

1. Landing page
2. Mission selection
3. Mission briefing
4. Tactical editor
5. FM-style simulation
6. Result report

## Product Goals

- Make the user feel like a football manager.
- Use real World Cup-style context and match situations.
- Provide dynamic interaction through substitutions, tactical changes, and player positioning.
- Show FM-style text commentary.
- Provide mission success/failure feedback.
- Compare the user's IF scenario with the actual match flow.
- Be fully playable without login, payment, or external API keys.
- Be suitable for a short hackathon demo video.

## Non-Goals

Do not attempt to build:

- A full Football Manager clone.
- A real physics-based football engine.
- A 3D match simulation.
- A full World Cup tournament simulator.
- Live API integration during the MVP.
- User authentication.
- Multiplayer.
- Betting, gambling, or real-money prediction features.

## Tech Stack

Use this stack unless the existing project already uses a different stack:

- Vite
- React
- TypeScript
- Tailwind CSS
- Zustand
- dnd-kit
- Framer Motion
- Recharts
- Vitest

## Runtime Data Rule

The MVP must work without external API calls.

Use static seed data under `src/data`.

Later, the data may be replaced or enriched with StatsBomb Open Data or other open football data, but runtime functionality must not depend on external API keys.

## Copyright and Asset Rules

Do not use:

- FIFA official logos.
- World Cup official logos.
- Team federation crests.
- Player photos.
- Match broadcast screenshots.
- Match video clips.
- Unlicensed fonts or icon packs.

Safe alternatives:

- Plain text team names.
- Country codes.
- Simple generated badges.
- CSS-based pitch graphics.
- Open-source icons with proper license.
- Self-created visual elements.

Always include source attribution in README when using open football data.

## Main UX Principle

The user must always understand:

1. What situation they are in.
2. What the mission goal is.
3. What tactical choices they can make.
4. How their choices changed the match flow.
5. Why the mission succeeded or failed.

Avoid complex UI that hides the mission goal.

## Suggested Folder Structure

```txt
src/
  app/
    App.tsx
    appStore.ts
    routes.ts

  data/
    missions.ts
    teams.ts
    players.ts
    formations.ts
    tactics.ts

  entities/
    mission/
      types.ts
    player/
      types.ts
    team/
      types.ts
    tactic/
      types.ts
    simulation/
      types.ts

  features/
    landing/
      LandingPage.tsx
    mission-select/
      MissionSelectPage.tsx
      MissionCard.tsx
    mission-briefing/
      MissionBriefingPage.tsx
    tactic-editor/
      TacticEditorPage.tsx
      PitchBoard.tsx
      PlayerToken.tsx
      BenchPanel.tsx
      TacticalInstructionPanel.tsx
      TacticalImpactPanel.tsx
    simulation/
      SimulationPage.tsx
      CommentaryFeed.tsx
      MatchClock.tsx
    result-report/
      ResultReportPage.tsx
      ResultSummaryCard.tsx
      ProbabilityChart.tsx
      ActualVsIfComparison.tsx

  engine/
    random.ts
    calculatePlayerInfluence.ts
    calculateTeamMetrics.ts
    generateSimulationEvent.ts
    runSingleSimulation.ts
    runMonteCarloSimulation.ts
    evaluateMissionResult.ts

  shared/
    components/
    utils/
    constants/