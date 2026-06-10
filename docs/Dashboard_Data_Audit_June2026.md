# Dashboard Data Audit — Live vs Hardcoded

**Created:** June 10, 2026
**Purpose:** Complete inventory of every chart, table, and KPI showing hardcoded/mock data vs live GA4 data. Documents what's needed to make each component live.

---

## Overall Status

| Category | Live | Hardcoded/Empty | Total |
|---|---|---|---|
| KPI Cards | 7 | 9 | 16 |
| Charts | 8 | 8 | 16 |
| Tables | 4 | 3 | 7 |
| **Total** | **~19** | **~20** | **~39** |

**Estimated effort to fully live:** 3–5 days (5–7 new custom dims + 3–4 new endpoints)

---

## ✅ CONFIRMED LIVE (Updated by GA4 API)

| Component | Function | Endpoint |
|---|---|---|
| Sessions KPI | `populateKPIs()` | `fetchGA4Data()` |
| Win Rate KPI | `populateKPIs()` | `fetchGA4Data()` |
| Death Rate KPI | `populateKPIs()` | `fetchGA4Data()` |
| Leaderboard Rate KPI | `populateKPIs()` | `fetchGA4Data()` |
| Desktop Win Rate KPI | `populateKPIs()` | `fetchPlatformSplitData()` |
| Mobile Win Rate KPI | `populateKPIs()` | `fetchPlatformSplitData()` |
| Avg Adjustments KPI (AI) | `populateAIKPIs()` | `fetchAIAnalysisData()` |
| Daily Play/Wins chart | `chartDaily()` | `fetchDailyTimeseriesData()` |
| Powerup Collection chart | `chartPowerup()` | `fetchPowerupAnalysisData()` |
| Wave Drop-off chart | `chartDropoff()` | `fetchProgressionAnalysisData()` |
| Boss Cards | `buildBossCards()` | `fetchBossAnalysisData()` |
| Boss Defeat Rates chart | `chartBossRatio()` | `fetchBossAnalysisData()` |
| Boss by Platform chart | `chartBossPlatform()` | `fetchBossAnalysisData()` |
| Boss Table | `buildBossTable()` | `fetchBossAnalysisData()` |
| Survival Distribution chart | `chartSurvivalDist()` | `fetchSurvivalTimeData()` |
| Platform Table (partial) | `buildPlatformTable()` | `fetchPlatformSplitData()` |
| AI Tier Distribution chart | `chartAITierDist()` | `fetchAIAnalysisData()` |
| AI Tier Flow chart | `chartAITierFlow()` | `fetchAIAnalysisData()` |

---

## ❌ HARDCODED / EMPTY — Full Inventory

### GROUP A: Quick Win — Can be calculated from existing data

#### 1. Device Mix Chart
- **Function:** `chartDevice()` — line 3748
- **Current data:** `DATA.deviceMix = { desktop: 54, mobile: 46 }` (hardcoded)
- **Fix:** Calculate from `DATA.platform.desktop.sessions` / `DATA.platform.mobile.sessions` — data already available from `fetchPlatformSplitData()`
- **Effort:** < 1 hour — no new endpoint or dimension needed
- **Priority:** LOW (quick win)

---

### GROUP B: New API Endpoints Needed (data exists in GA4)

#### 2. Game Funnel (Main)
- **Function:** `renderFunnel()` line 3792, `buildFunnelTable()` line 3817
- **Current data:** 7 hardcoded stages with static n/pct/dropPct values
  ```javascript
  { name: 'game_start', n: 2841, pct: 100, dropPct: null },
  { name: 'wave_reached L4', n: 1562, pct: 55.0, dropPct: 45.0 },
  // ...5 more hardcoded stages
  ```
- **Conversion table:** 6 hardcoded HTML rows (lines 3818–3825)
- **Fix needed:** New `subType=funnel` endpoint querying `game_start`, `wave_reached`, `boss_attempt`, `boss_defeated`, `player_won` event counts in sequence
- **New dimensions:** None — all events already tracked
- **Effort:** 3–4 hours
- **Priority:** HIGH (visible on Overview tab)

#### 3. Music A/B Test (funnel split)
- **Function:** `buildABCards()` line 4124
- **Current data:** All 7 metrics hardcoded for both groups
  ```javascript
  A: { sessions: 1449, winRate: '9.6%', survival: '2:32', replay: '2.5×', lbRate: '34%', avgLevel: '5.7', musicToggle: '18%' }
  B: { sessions: 1392, winRate: '7.2%', survival: '2:11', replay: '2.1×', lbRate: '27%', avgLevel: '4.8', musicToggle: '22%' }
  ```
- **Significance table:** 2 hardcoded rows with p-values and recommendations (lines 4189–4207)
- **Fix needed:** Query GA4 filtered by `customEvent:ab_music_group` dimension
- **New dimensions:** `customEvent:ab_music_group` — need to verify if tracked in game
- **Effort:** 4–6 hours
- **Priority:** HIGH (A/B Tests tab entirely hardcoded)

#### 4. Movement A/B Test
- **Function:** `buildABCards()` line 4159
- **Current data:** 3 hardcoded metrics for both groups
  ```javascript
  A: { sessions: 1389, winRate: '8.1%', survival: '2:19', avgLevel: '5.0' }
  B: { sessions: 1452, winRate: '8.7%', survival: '2:25', avgLevel: '5.4' }
  ```
- **Fix needed:** Query GA4 filtered by movement scheme dimension
- **New dimensions:** Need to verify if `customEvent:movement_scheme` or similar is tracked
- **Effort:** 3–4 hours
- **Priority:** MEDIUM

#### 5. Music A/B Split chart
- **Function:** `chartABSplit()` line 3761
- **Current data:** `DATA.abSplit = { musicOn: 51, musicOff: 49 }` (hardcoded)
- **Fix needed:** Calculate from A/B group session counts (tied to A/B endpoint above)
- **Effort:** 30 min once A/B endpoint exists
- **Priority:** LOW (depends on A/B endpoint)

---

### GROUP C: New Custom Dimensions Needed in Game + GA4

#### 6. New User % KPI
- **Function:** `populateKPIs()` line 3672
- **Current data:** `newPct: '—'` placeholder
- **Fix needed:** `user_type` dimension or `is_new_user` flag on GA4 events
- **Note:** GA4 has a built-in `newVsReturning` dimension — may already be available
- **Effort:** 2–3 hours
- **Priority:** LOW

#### 7. Avg Session Duration (Survival) KPI + Platform table
- **Functions:** `populateKPIs()`, `buildPlatformTable()`, `buildABCards()`
- **Current data:** `survival: '—'` (KPI), `'2:38'`/`'2:04'` (platform, hardcoded)
- **Fix needed:** Aggregate `customEvent:session_duration_seconds` to session-level average
- **Note:** `session_duration_seconds` IS tracked — need average per platform/group, not just distribution
- **Effort:** 2–3 hours
- **Priority:** MEDIUM

#### 8. Avg Level Reached KPI + Platform table
- **Functions:** `populateKPIs()`, `buildPlatformTable()`, `buildABCards()`
- **Current data:** `avgLevel: '—'` (KPI), `'6.1'`/`'4.3'` (platform, hardcoded)
- **Current comment:** "Mock data — awaits Phase 6A Tasks 6-7"
- **Fix needed:** Average `customEvent:level_reached` per platform/session
- **Note:** `level_reached` IS tracked — currently used for Wave Drop-off chart
- **Effort:** 2–3 hours
- **Priority:** HIGH (appears in multiple places)

#### 9. Desktop/Mobile Avg Level KPIs
- **Functions:** `populateKPIs()` lines 3424–3425
- **Current data:** `deskLevel: '—'`, `mobLevel: '—'`
- **Fix needed:** Same as above — level_reached + deviceCategory
- **Priority:** HIGH (tied to #8)

#### 10. Boss Rates by Platform (Platform Funnel chart)
- **Function:** `chartPlatformFunnel()` lines 4229–4242
- **Current data:** `'28.4%'`, `'17.1%'`, `'12.8%'` etc. hardcoded
- **Current comment:** "Mock data (requires boss dimension)"
- **Fix needed:** Extend boss-analysis query to cross-reference platform — data already available in `DATA.bossAnalysis`
- **Effort:** 1–2 hours (data already fetched, just not wired to this chart)
- **Priority:** MEDIUM

#### 11. Replay Rate KPI + tables
- **Functions:** `populateKPIs()`, `buildABCards()`, `buildPlatformTable()`
- **Current data:** `replay: '—'` (KPI), `'2.3×'` hardcoded fallback
- **Fix needed:** User-level aggregation of `game_start` events per session
- **Note:** Requires GA4 user-scoped query — complex with Data API, may need BigQuery export
- **Effort:** 4–6 hours (or not feasible without BigQuery)
- **Priority:** LOW

---

### GROUP D: AI Agent — Requires New Game Events or Custom Dims

#### 12. Avg Starting Tier KPI
- **Function:** `populateAIKPIs()` line 4337
- **Current data:** `avgStartTier: '—'` (never updated)
- **Fix needed:** First `ai_difficulty_adjusted` event per session = starting tier
- **Challenge:** Session-level stitching not natively supported in GA4 Data API
- **Priority:** MEDIUM

#### 13. Avg Final Tier KPI
- **Function:** `populateAIKPIs()` line 4338
- **Current data:** `avgFinalTier: '—'` (never updated)
- **Fix needed:** Last `ai_difficulty_adjusted` event per session = final tier
- **Same challenge as above**
- **Priority:** MEDIUM

#### 14. Speed Lock Rate KPI
- **Function:** `populateAIKPIs()` line 4339
- **Current data:** `speedLockRate: '—'` (never updated)
- **Fix needed:** Unknown — need to investigate if `speed_lock` event exists in game
- **Priority:** LOW (investigate first)

#### 15. Score Multiplier Distribution chart
- **Function:** `chartAIScoreMult()` line 4389
- **Current data:** `scoreMultDist.counts = [0,0,0,0,0,0,0,0]` (all zeros)
- **Fix needed:** New custom dimension `customEvent:score_multiplier` added to game events
- **Priority:** LOW (requires game-side change)

#### 16. Tier vs Final Score chart
- **Function:** `chartAITierScore()` line 4412
- **Current data:** `tierScores.avgScores = [0,0,0,0,0,0,0]` (all zeros)
- **Fix needed:** Score data per tier — requires `customEvent:final_score` or similar
- **Priority:** LOW (requires game-side change)

#### 17. Death Triggers by Phase chart
- **Function:** `chartAIDeathTriggers()` line 4437
- **Current data:** `deathTriggers.counts = [0,0,0]` (all zeros)
- **Fix needed:** `player_death` events cross-referenced with `customEvent:phase` — this data IS available from progression-analysis. Can be derived from existing data.
- **Effort:** 1–2 hours (data already fetched in `fetchProgressionAnalysisData()`)
- **Priority:** MEDIUM (quick win — data already available)

#### 18. Tier Performance Metrics table
- **Function:** `buildAITierTable()` line 4461
- **Current data:** `tierMetrics = []` (empty — CSV only)
- **Fix needed:** Complex — requires per-tier aggregation of win rates, avg level, avg time, player counts
- **Priority:** LOW (complex query)

---

## Priority Order for Making Dashboard Fully Live

### 🟢 Quick Wins (< 2 hours each, no new dims)
1. **Device Mix chart** — calculate from existing platform session data (< 1 hr)
2. **Boss rates by platform** — wire existing `DATA.bossAnalysis` to `chartPlatformFunnel()` (1–2 hrs)
3. **Death Triggers by Phase** — derive from existing `fetchProgressionAnalysisData()` death data (1–2 hrs)

### 🟡 Medium (2–4 hours, existing dimensions)
4. **Avg Level KPIs** — add level_reached aggregation to existing progression endpoint (2–3 hrs)
5. **Avg Survival KPI** — add session-level average to existing survival endpoint (2–3 hrs)
6. **Funnel endpoint** — new `subType=funnel` using existing events (3–4 hrs)

### 🔴 Larger (4–8 hours, new dims or game changes needed)
7. **A/B Test endpoints** — requires `customEvent:ab_music_group` verification (4–6 hrs)
8. **AI avg start/final tier** — session-level stitching (4–6 hrs, possibly needs BigQuery)

### ⚫ Not feasible without game changes
- Score Multiplier Distribution — needs `customEvent:score_multiplier` added to game
- Tier vs Final Score — needs `customEvent:final_score` added to game
- Replay Rate — needs user-level aggregation (BigQuery likely required)
- Speed Lock Rate — event may not exist; needs investigation

---

## Next Investigation Steps

1. **Check GA4 Admin → Custom Definitions** for any unregistered dims (`ab_music_group`, `score_multiplier`, `final_score`, `speed_lock`)
2. **Check Xenon_3 game source** for what parameters are sent on each event
3. **Check DebugView** for full parameter list on `ai_difficulty_adjusted` and `player_death` events
4. **Decide:** Which hardcoded charts should be removed vs. made live vs. kept as-is?
