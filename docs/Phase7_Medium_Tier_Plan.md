# Phase 7: Medium Tier Implementation Plan

**Created:** June 10, 2026
**Status:** Pending — ready to implement next session
**Research:** Haiku agent (line numbers verified against live.html + api/index.js)

---

## Task Overview

| # | Task | Effort | Lambda? | Status |
|---|------|--------|---------|--------|
| MT-1 | Avg Survival KPI | 30 min | No | ⏳ Next |
| MT-2 | New User % KPI | 1–2 hrs | New handler | ⏳ Pending |
| MT-3 | Avg Level KPI + Platform cols | 2–3 hrs | No (extend parser) | ⏳ Pending |
| MT-4 | Replay Rate KPI | 2–3 hrs | New handler | ⏳ Pending |
| MT-5 | Tier vs Final Score chart | Deferred | — | ❌ Needs game-side `final_score` |

---

## MT-1: Avg Survival KPI — 30 min, no Lambda

**Finding:** Parser already calculates `avgSurvival.desktop` and `avgSurvival.mobile` in MM:SS format. Never wired to `DATA.kpis.survival`.

**File:** `live.html` only

**Change:** In `loadAndRenderGA4Data()`, after survival data is set, add:
```javascript
DATA.kpis.survival             = survivalData.avgSurvival.desktop;
DATA.platform.desktop.survival = survivalData.avgSurvival.desktop;
DATA.platform.mobile.survival  = survivalData.avgSurvival.mobile;
```

**Key lines:**
- `DATA.kpis.survival` init: line 2280 (`'2:22'` hardcoded)
- Display element: `#kpi-survival` (line 1490)
- `populateKPIs()` sets it: line 3782
- `DATA.platform.desktop.survival` init: line 2353 (`'2:38'` hardcoded)
- `DATA.platform.mobile.survival` init: line 2354 (`'2:04'` hardcoded)
- Survival parser already returns `avgSurvival`: lines 2705–2721
- Integration insertion point: ~line 3402 (after survival data is set)

---

## MT-2: New User % KPI — 1–2 hrs, new Lambda handler

**GA4 dimension:** `newVsReturning` (built-in, no custom registration needed)
**Values:** `'new'` or `'returning'`
**Formula:** `new_game_starts / total_game_starts × 100`

**File:** `api/index.js` + `live.html`

**Lambda handler** (new `subType=new-user-pct`):
```javascript
dimensions: [
  { name: 'newVsReturning' }, // Dimension 0: 'new' or 'returning'
  { name: 'eventName' }       // Dimension 1: filter to 'game_start'
]
```

**Parser:** Filter to `game_start`, count `'new'` vs total, return `newPct` string
**Fetch function:** `fetchNewUserPctData()` — same AbortSignal.timeout pattern
**Integration:** Set `DATA.kpis.newPct`

**Key lines:**
- `DATA.kpis.newPct` init: line 2276 (`'73%'` hardcoded)
- Display element: `#kpi-new-pct` (line 1469)
- `populateKPIs()` sets it: line 3778
- New handler inserts after death-triggers block (~line 211 in api/index.js)

---

## MT-3: Avg Level KPI + Platform Columns — 2–3 hrs, extend parser

**Finding:** `level_reached` already queried in `progression-analysis` (dim 1). GA4 Data API has no native AVG — use manual aggregation: `sum(level × count) / total_count`.

**File:** `live.html` only (no new Lambda handler)

**Parser extension** in progression-analysis parser (`mapGA4ResponseToDATA()`):
- Accumulate `sum(level_reached × count)` and `totalCount` per platform
- Calculate `avgLevel = sum / totalCount` rounded to 1 decimal
- Add to return value: `avgLevel: { overall, desktop, mobile }`

**Integration:** After progression data is set:
```javascript
DATA.kpis.avgLevel             = progressionData.avgLevel.overall;
DATA.kpis.deskLevel            = progressionData.avgLevel.desktop;
DATA.kpis.mobLevel             = progressionData.avgLevel.mobile;
DATA.platform.desktop.avgLevel = progressionData.avgLevel.desktop;
DATA.platform.mobile.avgLevel  = progressionData.avgLevel.mobile;
```

**Key lines:**
- `DATA.kpis.avgLevel` init: line 2282 (`'5.2'` hardcoded)
- `DATA.kpis.deskLevel` init: line 2285 (`'6.1'` hardcoded)
- `DATA.kpis.mobLevel` init: line 2286 (`'4.3'` hardcoded)
- Display elements: `#kpi-avg-level` (line 1500), `#kpi-desk-level` (line 1846), `#kpi-mob-level` (line 1851)
- `populateKPIs()` sets avgLevel: line 3784
- Platform table column: line 4391
- Progression-analysis parser location: ~line 2816
- `level_reached` is dim 1 in the query (line 156 in api/index.js)
- Note: filter to `wave_reached` or `player_death` events only (not all events)

---

## MT-4: Replay Rate KPI — 2–3 hrs, new Lambda handler

**GA4 dimension:** `customEvent:is_replay` (registered Feb 27, 2026)
**Values:** `'true'` or `'false'`
**Formula:** `is_replay='true' count / total game_start count × 100`

**Important note:** This gives replay session %, not games-per-user (which needs BigQuery). The dashboard currently shows `'2.3×'` (games per user). Decision needed: keep `×` format and show event ratio, or change label to `%`.

**File:** `api/index.js` + `live.html`

**Lambda handler** (new `subType=replay-rate`):
```javascript
dimensions: [
  { name: 'customEvent:is_replay' }, // Dimension 0: 'true' or 'false'
  { name: 'eventName' },             // Dimension 1: 'game_start'
  { name: 'deviceCategory' }         // Dimension 2: platform split
]
```

**Parser:** Filter to `game_start`, count `is_replay='true'` vs total, return rate
**Fetch function:** `fetchReplayRateData()` — same pattern
**Integration:** Set `DATA.kpis.replay`, `DATA.platform.desktop.replay`, `DATA.platform.mobile.replay`

**Key lines:**
- `DATA.kpis.replay` init: line 2279 (`'2.3×'` hardcoded)
- Display element: `#kpi-replay` (line 1484)
- `populateKPIs()` sets it: line 3781
- `DATA.platform.desktop.replay` init: line 2353
- `DATA.platform.mobile.replay` init: line 2354

---

## MT-5: Tier vs Final Score Chart — DEFERRED

**Reason:** `final_score` or `score` is not being sent as a GA4 custom dimension on `player_won`/`player_death` events. The chart needs average score per tier which requires game-side changes to add the dimension.

**What to do before implementing:**
1. Check Xenon_3 game source — does it send any score param on `player_won`?
2. Check GA4 DebugView on `player_won` for score-related parameters
3. If not found, add `final_score` as custom event param + register in GA4

**Move to:** Large tier tasks, pending game source verification.

---

## Session Start Checklist (Next Session)

1. Start with **MT-1** — 30 min wire-up, no Lambda deploy
2. Then **MT-2** — New User % (needs Lambda)
3. Then **MT-3** — Avg Level (parser extension only)
4. Then **MT-4** — Replay Rate (needs Lambda + label decision)
5. Skip MT-5 until game source verified

**Total estimated time:** ~6–8 hours for MT-1 through MT-4
