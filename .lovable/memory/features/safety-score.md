---
name: Safety Score System
description: Auto-calculated safety score (1-10) from road_condition, difficulty, fatigue_level, distance with weighted formula
type: feature
---
- `road_condition` column (1-5) on events table, default 3
- `calculateSafetyScore()` in `src/data/events.ts` — weighted penalty formula
- Weights: Road 30%, Difficulty 25%, Fatigue 25%, Distance 20%
- Levels: aman (7-10 green), waspada (4-6 yellow), hardcore (1-3 red)
- Shown: EventCard badge (top-right), EventDetail breakdown panel, Admin form preview
- Events page has "Safety Level" filter in advanced filters
- Constants: ROAD_CONDITION_LABELS, SAFETY_LEVEL_LABELS, SafetyLevel type
