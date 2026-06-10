# NON-X Analytics Dashboard — Comprehensive Data Audit Report
**Date:** June 8, 2026
**Dashboard Version:** 5.0 (Live API Integration)
**Status:** Live with Lambda API (Phase 5 in progress)

---

## EXECUTIVE SUMMARY

The NON-X Analytics dashboard is **partially operational** with live GA4 data. Currently:
- **✅ 4/12 KPIs** receiving live GA4 data via AWS Lambda API
- **⚠️ 8/12 KPIs** displayed with hardcoded sample/mock data
- **❓ 30+ charts** using mock data (funnel, boss analysis, platform, A/B tests, AI agent)
- **🔴 Critical gap:** Lambda API returns only event counts; enriched dimensions/metrics missing

**Overall Live Data Coverage: 9% (4/44 visible metrics)**

---

## PART 1: COMPLETE DATA POINT INVENTORY

### OVERVIEW PAGE (KPI Cards)

| KPI | Element ID | Current Value | Source | Status | Issue |
|-----|-----------|---------------|--------|--------|-------|
| **Total Sessions** | `kpi-sessions` | '2,841' | Sample DATA | 🔴 MOCK | Displays sample; GA4 has session_start events but mapping not enabled |
| **New vs Returning %** | `kpi-new-pct` | '73%' | Sample DATA | 🔴 MOCK | Requires GA4 `first_visit_date` dimension filter |
| **Win Rate** | `kpi-winrate` | '8.4%' | GA4 API via mapGA4ResponseToDATA() | ✅ LIVE | Calculated: `player_won / game_start` (line 1800) |
| **Death Rate** | `kpi-deathrate` | '84.2%' | GA4 API via mapGA4ResponseToDATA() | ✅ LIVE | Calculated: `player_death / (playerWon + playerDeath)` (line 1807) |
| **Play-Again Rate** | `kpi-replay` | '2.3×' | Sample DATA | 🔴 MOCK | Requires `is_replay` custom dimension + user aggregation |
| **Avg Survival** | `kpi-survival` | '2:22' | Sample DATA | 🔴 MOCK | Requires `session_duration_seconds` metric aggregation |
| **Leaderboard Rate** | `kpi-lb-rate` | '31%' | GA4 API via mapGA4ResponseToDATA() | ✅ LIVE | Calculated: `leaderboard_submit / player_won` (line 1811) |
| **Avg Level Reached** | `kpi-avg-level` | '5.2' | Sample DATA | 🔴 MOCK | Requires `level_reached` custom dimension + averaging |
| **Desktop Win Rate** | `kpi-desk-win` | '11.2%' | Sample DATA | 🔴 MOCK | Requires `platform='desktop'` dimension filter |
| **Mobile Win Rate** | `kpi-mob-win` | '5.7%' | Sample DATA | 🔴 MOCK | Requires `platform='mobile'` dimension filter |
| **Desktop Avg Level** | `kpi-desk-level` | '6.1' | Sample DATA | 🔴 MOCK | Requires platform + level dimensions |
| **Mobile Avg Level** | `kpi-mob-level` | '4.3' | Sample DATA | 🔴 MOCK | Requires platform + level dimensions |

**KPI Summary:**
- **Live Data:** 4 metrics (Win Rate, Death Rate, Leaderboard Rate, Sessions as event_count)
- **Mock Data:** 8 metrics (New %, Replay, Survival, Avg Level, Platform variants)
- **Missing GA4 Dimensions:** `first_visit_date`, `is_replay`, `session_duration_seconds`, `level_reached`, `platform`

---

### OVERVIEW PAGE (Charts & Cards)

| Chart | Canvas ID | Data Source | Status | Details |
|-------|-----------|-------------|--------|---------|
| **Daily Plays & Wins** | `chart-daily` | `DATA.daily` | 🔴 MOCK | 14-day hardcoded (lines 1632-1636) |
| **Device Mix** | `chart-device` | `DATA.deviceMix` | 🔴 MOCK | 54% desktop / 46% mobile hardcoded (line 1638) |
| **Music A/B Split** | `chart-ab-split` | `DATA.abSplit` | 🔴 MOCK | 51%/49% hardcoded (line 1639) |
| **Powerup Collection by Phase** | `chart-powerup` | `DATA.powerups` | 🔴 MOCK | Phase-based counts hardcoded (lines 1641-1644) |

---

### FUNNEL PAGE

| Component | Data Source | Status | Details |
|-----------|-------------|--------|---------|
| **Full Progression Funnel** | `DATA.funnel` | 🔴 MOCK | 7-stage funnel hardcoded (lines 1646-1654) |
| **Music ON Funnel** | `DATA.funnelMusicOn` | 🔴 MOCK | 4-stage variant hardcoded (lines 1655-1660) |
| **Music OFF Funnel** | `DATA.funnelMusicOff` | 🔴 MOCK | 4-stage variant hardcoded (lines 1661-1666) |
| **Deaths by Level Chart** | `chart-dropdoff` | 🔴 MOCK | 15 level/boss death counts hardcoded (lines 1667-1673) |
| **Death Rate Table** | `drt-*` elements | 🔴 MOCK | Dynamically calculated from mock `DATA.deathsByLevel` |
| **Conversion Rates Table** | `funnel-table` | 🔴 MOCK | 6 conversion rates hardcoded in buildFunnelTable() (lines 2184-2204) |

**Issue:** Function `renderFunnel()` (lines 2159-2182) expects array of `{name, n, pct, dropPct}` — works with mock data but requires GA4 Funnel API for live version.

---

### BOSS ANALYSIS PAGE

| Component | Data Source | Status | Details |
|-----------|-------------|--------|---------|
| **Boss 1/2/3 Cards** | `DATA.bosses[3]` | 🔴 MOCK | 3 boss objects hardcoded (lines 1675-1679) |
| **Boss Ring Meters** | `defeat_rate` field | 🔴 MOCK | Percentage calculated from static property |
| **Attempt-to-Defeat Ratio** | `chart-boss-ratio` | 🔴 MOCK | Bar chart with hardcoded values (lines 2343-2345) |
| **Boss Conversion by Platform** | `chart-boss-platform` | 🔴 MOCK | Static data [28.4%, 19.6%] (lines 2359-2360) |
| **Boss Difficulty Table** | `boss-table` | 🔴 MOCK | Dynamic HTML from mock DATA.bosses (lines 2371-2403) |

**Boss Data Structure (lines 1675-1679):**
```javascript
{
  id:1, name:'BOSS 1', phase:'GREEN', threshold:'L4',
  attempts: 1034, defeats: 687, defeat_rate: 66.4,
  avg_attempts: 1.5, color: '#39FF14'
}
```

---

### A/B TESTS PAGE

| Component | Data Source | Status | Details |
|-----------|-------------|--------|---------|
| **Music A/B Cards** | `DATA.abMusic` | 🔴 MOCK | 2 groups with 6 metrics each (lines 1680-1683) |
| **Movement A/B Cards** | `DATA.abMovement` | 🔴 MOCK | 2 schemes with 3 metrics each (lines 1684-1686) |
| **Significance Table** | `ab-sig-table` | 🔴 MOCK | 2 tests with hardcoded p-values (lines 2470-2489) |

**Metrics per group:** winRate, survival, replay, lbRate, avgLevel, musicToggle (music only)

---

### PLATFORM COMPARISON PAGE

| Component | Data Source | Status | Details |
|-----------|-------------|--------|---------|
| **Desktop/Mobile KPIs** | `DATA.platform.desktop/mobile` | 🔴 MOCK | 8 metrics hardcoded (lines 1689-1691) |
| **Completion Funnel** | `chart-platform-funnel` | 🔴 MOCK | Bar chart [100%, 28.4%, 17.1%, 11.2%] (lines 2501-2502) |
| **Survival Time Distribution** | `chart-survival-dist` | 🔴 MOCK | 6 time buckets by platform (lines 2520-2521) |
| **Full Platform Breakdown Table** | `platform-table` | 🔴 MOCK | 9 metrics (lines 2549-2555) |

---

### AI AGENT PAGE

| Component | Data Source | Status | Details |
|-----------|-------------|--------|---------|
| **AI KPI Cards** | `DATA.aiAgent.kpis` | 🔴 EMPTY | All 4 KPIs = '—' (lines 1693-1698) |
| **Tier Distribution Chart** | `tierDist.counts` | 🔴 EMPTY | 7 tiers all = 0 (line 1701) |
| **Tier Progression Flow** | `tierFlow` | 🔴 EMPTY | increases/decreases = 0 (lines 1704-1706) |
| **Score Multiplier Distribution** | `scoreMultDist.counts` | 🔴 EMPTY | 8 multipliers all = 0 (line 1709) |
| **Tier vs Final Score** | `tierScores.avgScores` | 🔴 EMPTY | 7 tiers all = 0 (line 1713) |
| **Death Triggers by Phase** | `deathTriggers.counts` | 🔴 EMPTY | 3 phases all = 0 (line 1717) |
| **Tier Performance Table** | `ai-tier-table` | 🔴 EMPTY | Placeholder text (lines 2689-2691) |

**Status:** Completely non-functional — all arrays zeroed or empty. Designed for CSV upload (deprecated in Phase 5). No GA4 events tracked.

---

## PART 2: GA4 API DATA FLOW ANALYSIS

### Lambda API Implementation

**File:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/api/index.js` (70 lines)

**Data Flow:**
```
Browser fetch()
    ↓
API Gateway /analytics endpoint
    ↓
Lambda handler (lines 10-70)
    ↓
GA4 BetaAnalyticsDataClient.runReport() or runRealtimeReport()
    ↓
GA4 returns rows: [{dimensionValues:[eventName], metricValues:[eventCount]}, ...]
    ↓
Lambda extracts eventCounts: {game_start: 2841, player_won: 239, ...}
    ↓
Return JSON to browser (line 60)
    ↓
mapGA4ResponseToDATA() converts to KPI format (lines 1736-1839)
    ↓
Update DATA.kpis object
    ↓
reinitAllCharts() re-renders all visualizations
```

### Lambda Capabilities

**Working:**
- ✅ Connects to GA4 via BetaAnalyticsDataClient (line 4)
- ✅ Supports 2 report types: `realtime` (last 30 min) and `standard` (7daysAgo-today) (lines 28-51)
- ✅ Supports version filtering via `analytics_version` custom dimension (lines 18-26)
- ✅ Returns flattened event counts {eventName: count} (line 1784)

**Limitations:**
- ❌ No multi-dimensional queries (can't get `platform='mobile'` subset)
- ❌ No metric aggregation (can't calculate averages)
- ❌ No funnel/sequence analysis
- ❌ No date bucketing (can't get daily breakdown)
- ❌ No custom metric support (can't retrieve `session_duration_seconds`)
- ❌ Fixed date range (7 days hardcoded, line 43)

### Data Mapping Function (lines 1730-1839)

**mapGA4ResponseToDATA(response, reportType)**

**Validation (lines 1737-1758):**
- Checks for null response
- Validates rows array exists
- Handles empty row case

**Extraction (lines 1760-1789):**
- Iterates through rows
- Builds eventCounts object: `{game_start: N, player_won: M, ...}`

**KPI Calculations (lines 1791-1813):**

```javascript
// ✅ LIVE FROM GA4
sessions = eventCounts['session_start'] || 0
gameStarts = eventCounts['game_start'] || 0
playerWon = eventCounts['game_complete'] || 0  // ⚠️ NOTE: event name mismatch?
playerDeath = eventCounts['player_death'] || 0
leaderboardSubmit = eventCounts['leaderboard_submit'] || 0

winRate = (playerWon / gameStarts * 100).toFixed(1) + '%'
deathRate = (playerDeath / (playerWon + playerDeath) * 100).toFixed(1) + '%'
lbRate = (leaderboardSubmit / playerWon * 100).toFixed(0) + '%'

// ❌ CANNOT CALCULATE (marked as '—')
newPct: '—'        // Missing: first_visit_date dimension
replay: '—'        // Missing: is_replay custom dimension
survival: '—'      // Missing: session_duration_seconds metric
avgLevel: '—'      // Missing: level_reached custom dimension
deskWin: '—'       // Missing: platform='desktop' filter
mobWin: '—'        // Missing: platform='mobile' filter
deskLevel: '—'     // Missing: platform + level dimensions
mobLevel: '—'      // Missing: platform + level dimensions
```

**CRITICAL ISSUE (Line 1795):**
```javascript
const playerWon = eventCounts['game_complete'] || 0;
// Comment: "Fixed: GA4 sends 'game_complete', not 'player_won'"
```

This comment suggests a bug fix but doesn't match game code. **Requires verification in GA4 DebugView.**

---

## PART 3: CURRENT DATA STATUS BY SECTION

### ✅ WORKING WITH LIVE DATA (4 Metrics)

1. **Win Rate** (KPI card, line 2052)
   - Formula: `player_won / game_start`
   - Status: ✅ LIVE (pending event name verification)
   - Source: GA4 events `player_won` and `game_start`

2. **Death Rate** (KPI card, line 2053)
   - Formula: `player_death / (player_won + player_death)`
   - Status: ✅ LIVE (improved calculation excludes abandoned games)
   - Source: GA4 events `player_death`, `player_won`

3. **Leaderboard Rate** (KPI card, line 2056)
   - Formula: `leaderboard_submit / player_won`
   - Status: ✅ LIVE
   - Source: GA4 events `leaderboard_submit`, `player_won`

4. **Total Sessions** (KPI card, line 2050)
   - Source: GA4 event count `session_start`
   - Status: ✅ Passable (proxy for total users/sessions)
   - Note: Marked as sample data in DATA object but gets overwritten by API

---

### 🔴 NOT WORKING — USING MOCK DATA (40 Metrics)

**By Page:**

| Page | Metrics | Status | Root Cause |
|------|---------|--------|-----------|
| Overview | 8 KPIs + 4 charts | 🔴 MOCK | 8 missing dimensions/metrics; 4 charts use hardcoded sample data |
| Funnel | 6 components | 🔴 MOCK | Needs GA4 Funnel Report API (multi-step event sequences) |
| Boss | 4 components | 🔴 MOCK | Needs `boss_id` dimension filtering |
| A/B Tests | 3 components | 🔴 MOCK | Needs A/B group dimensions + statistical tests |
| Platform | 7 components | 🔴 MOCK | Needs `platform` dimension filtering |
| AI Agent | 10 components | 🔴 EMPTY | Events not firing or not configured in GA4 |

---

## PART 4: BLOCKERS & ROOT CAUSES

### Blocker 1: Lambda API Architecture
**Severity:** 🔴 CRITICAL
**Impact:** 40 metrics blocked

Current Lambda returns only `{eventName: eventCount}` with single-dimension filtering. To go live:

**Required Changes:**
```javascript
// Currently supports:
dimensions: [{ name: 'eventName' }]
dimensionFilter: { ... analytics_version ... }

// Needs to support:
dimensions: [{ name: 'eventName' }, { name: 'customEvent:platform' }]
// And multi-dimensional filtering:
dimensionFilter: {
  andGroup: {
    expressions: [
      { fieldName: 'customEvent:analytics_version', stringFilter: { ... } },
      { fieldName: 'customEvent:platform', stringFilter: { value: 'desktop' } }
    ]
  }
}
```

**Estimate:** 6-8 hours development + testing

---

### Blocker 2: Game Event Instrumentation
**Severity:** ⚠️ REQUIRES VERIFICATION
**Impact:** Affects platform, A/B, and AI tracking

**Verification Checklist:**
- [ ] GA4 DebugView shows `platform` dimension in all game events
- [ ] GA4 DebugView shows `level_reached` dimension in player_death events
- [ ] GA4 DebugView shows `boss_id` dimension in boss_attempt/defeated
- [ ] GA4 DebugView shows `ab_music_group` in all events
- [ ] GA4 DebugView shows `is_replay` in game_start events
- [ ] AI events (`ai_tier_assigned`, `ai_difficulty_adjusted`) firing in DebugView

**Estimate:** 30 mins verification, up to 2 hours fixes if missing

---

### Blocker 3: AI Agent Implementation
**Severity:** 🔴 UNKNOWN
**Impact:** 10 metrics (entire AI Agent page)

**Required Investigation:**
- [ ] Search `Xenon_3/game.html` for AI Agent tier tracking code
- [ ] Search for `ai_tier_assigned` event calls
- [ ] Confirm events firing in GA4 DebugView during gameplay
- [ ] If missing, implement AI agent instrumentation

**Current Status:** Page shows all zeros; unclear if:
- A) AI Agent not implemented in game
- B) Implemented but events not firing
- C) Events firing but wrong event names

**Estimate:** 1-3 hours diagnosis, 4-8 hours implementation if missing

---

### Blocker 4: Event Name Inconsistencies
**Severity:** 🟡 NEEDS VERIFICATION
**Impact:** Win Rate and Leaderboard Rate calculations

**Issue:** Code comment (line 1795) mentions `game_complete` vs `player_won` mismatch.

**Action:**
```javascript
// Need to verify which event name is actually sent:
// Option A: eventCounts['game_complete']  (per comment)
// Option B: eventCounts['player_won']     (per naming convention)
```

**How to verify:**
1. Open GA4 DebugView
2. Play game to victory
3. Check Event name field (look for exact event name)
4. Update Lambda line 1795 to match actual event name

**Estimate:** 15 minutes diagnosis, maybe 1 line fix

---

## PART 5: FILE-BY-FILE ISSUES

### live.html

| Line(s) | Issue | Severity | Fix Type |
|---------|-------|----------|----------|
| 975-977 | Insight box generic — doesn't explain which data is live vs sample | Low | Docs |
| 1586-1606 | API_CONFIG hardcoded; API Key exposed in client-side code | High | Security |
| 1617-1724 | 108 lines of hardcoded sample data (DATA object) | Medium | Refactor |
| 1632-1636 | 14-day daily data hardcoded | Medium | Replace with API |
| 1638-1644 | Device mix, A/B split, powerup data hardcoded | Medium | Replace with API |
| 1646-1687 | Funnel, boss, A/B data structures (42 lines) hardcoded | High | Replace with API |
| 1795 | Event name mismatch comment — needs verification | Critical | Bug fix |
| 2048-2062 | populateKPIs() only updates KPI cards, not charts | Medium | Architecture |
| 2159-2182 | renderFunnel() works with mock, but needs GA4 Funnel API for live | Medium | Feature |
| 2728-2768 | reinitAllCharts() recreates all charts every refresh | Low | Performance |

### api/index.js

| Line(s) | Issue | Severity | Fix Type |
|---------|-------|----------|----------|
| 1-6 | Google credentials from env vars — good ✅ | — | — |
| 18-26 | dimensionFilter only supports `analytics_version` | High | Feature |
| 41-50 | Returns only [eventName, eventCount] | High | Feature |
| 60 | Raw GA4 response format — no field mapping | Medium | Refactor |

---

## PART 6: PRIORITIZED IMPLEMENTATION ROADMAP

### Immediate (This Week) — VERIFICATION PHASE

**Task 1: Verify Event Names in GA4** (15 mins)
```
1. Open GA4 Property → DebugView
2. Play game to victory
3. Search event name (look for 'player_won' vs 'game_complete')
4. Update live.html line 1795 if mismatch found
5. Document in GitHub issue
```

**Task 2: Verify Custom Dimensions** (30 mins)
```
Check GA4 DebugView for presence of:
- platform ('desktop' or 'mobile')
- level_reached (1-12)
- boss_id (1, 2, 3)
- ab_music_group
- ab_movement_group
- is_replay (true/false)
```

**Task 3: Check AI Agent Events** (15 mins)
```
Play game and check DebugView for:
- ai_tier_assigned
- ai_difficulty_adjusted
- ai_tier_progression
If not found → open GitHub issue to implement
```

**Task 4: Update Dashboard Transparency** (30 mins)
```
- Edit insight box to list live vs mock metrics
- Add hover tooltips to KPIs explaining gaps
- Commit as docs improvement
```

### Short-Term (Weeks 2-3) — Phase 6 Enhancements

**Task 5: Enhance Lambda for Platform Splits** (6-8 hours)
```
New endpoint: GET /analytics/platform?version=4.3
- Add dimensions: [eventName, customEvent:platform]
- Return: {desktop: {game_start:N, player_won:M}, mobile:{...}}
- Update dashboard to populate 4 platform KPIs + charts
Deliverable: Platform page 75% live
```

**Task 6: Add Daily Timeseries** (4-6 hours)
```
New endpoint: GET /analytics/timeseries?range=14d
- Add dimension: date
- Return: [{date: '20260601', eventName: 'game_start', count: 120}, ...]
- Update chartDaily() to render live data
Deliverable: Daily chart live
```

**Task 7: Enhance for Boss Analysis** (4-6 hours)
```
New endpoint: GET /analytics/bosses?version=4.3
- Add dimension: customEvent:boss_id
- Return: {1: {attempts:N, defeats:M}, 2: {...}, 3: {...}}
Deliverable: Boss Analysis page live
```

### Medium-Term (Weeks 4-5) — Phase 6 Advanced

**Task 8: Implement Full Funnel Analysis** (10-15 hours)
```
Complexity: Very High
Use GA4 Funnel Report API method or custom event sequence logic
New endpoint: GET /analytics/funnel?version=4.3
Deliverable: Funnel page live
```

**Task 9: A/B Test Analytics** (12-16 hours)
```
Complexity: Very High
Multi-dimensional analysis by ab_music_group, ab_movement_group
Add statistical significance tests (chi-square)
Deliverable: A/B Tests page live + significant
```

**Task 10: AI Agent Tracking** (8-12 hours)
```
Depends on: Game code AI implementation status
If missing: Implement AI tier tracking in game + GA4 instrumentation
New endpoint: GET /analytics/ai-agent?version=4.3
Deliverable: AI Agent page fully functional
```

---

## PART 7: QUICK REFERENCE — WHAT NEEDS TO HAPPEN

### To Get 50% of Metrics Live (By Week 3)
1. Fix event name mismatch (Task 1)
2. Enhance Lambda for platform + timeseries (Tasks 5-6)
3. Add boss analysis (Task 7)
4. Update 4 platform KPIs + daily chart + boss page

**Result:** 25-30 metrics live, 5 major sections working

### To Get 80% of Metrics Live (By Week 5)
1. + Implement full funnel analysis (Task 8)
2. + Implement A/B test analytics (Task 9)
3. + Fix AI agent (Task 10)

**Result:** 35-40 metrics live, only sample data for edge cases

### To Get 100% (Phase 7+)
1. Add real-time data streaming (WebSocket)
2. Add historical cohort analysis
3. Add predictive analytics (Claude API integration)
4. Sunset all hardcoded DATA arrays

---

## PART 8: CONFIGURATION CHECKLIST

### GA4 Setup
- [x] GA4 property created (G-9ECFZ9JBE5)
- [x] 16 events tracked
- [x] Service account configured with viewer access
- [ ] Verify all custom dimensions registered:
  - [ ] `platform` (desktop/mobile)
  - [ ] `level_reached` (1-12)
  - [ ] `boss_id` (1/2/3)
  - [ ] `ab_music_group`
  - [ ] `ab_movement_group`
  - [ ] `is_replay`
  - [ ] `analytics_version`
- [ ] Verify custom metrics registered:
  - [ ] `session_duration_seconds`
  - [ ] `score`

### AWS Lambda
- [x] Function deployed
- [x] Environment variables set (GOOGLE_CREDENTIALS, GA4_PROPERTY_ID)
- [x] API Gateway integration working
- [ ] Add enhanced multi-dimensional query support (Phase 6)
- [ ] Add request validation + error handling improvements

### Dashboard
- [x] live.html deployed
- [x] Auto-refresh set to 1 hour
- [x] Manual refresh button working
- [x] Error handling + fallback to sample data
- [ ] Update insight box to clarify live vs sample metrics
- [ ] Migrate API key to environment variables (security)

---

## SUMMARY TABLE: Go-Live Readiness

| Component | Live Metrics | Total | % | Ready for Prod? |
|-----------|--------------|-------|---|---|
| **KPI Cards** | 4 | 12 | 33% | ⚠️ Partial |
| **Overview Charts** | 0 | 4 | 0% | 🔴 No |
| **Funnel Page** | 0 | 4 | 0% | 🔴 No |
| **Boss Analysis** | 0 | 4 | 0% | 🔴 No |
| **A/B Tests** | 0 | 3 | 0% | 🔴 No |
| **Platform Comparison** | 0 | 7 | 0% | 🔴 No |
| **AI Agent** | 0 | 10 | 0% | 🔴 No |
| **OVERALL** | **4** | **44** | **9%** | **🟡 Early Access** |

**Recommendation:** Current dashboard is suitable for monitoring **basic engagement metrics only** (sessions, win rate, death rate, leaderboard rate). Add prominent disclaimer and limit access until Phase 6 enhancements complete remaining 35+ metrics.

---

**Report Generated:** June 8, 2026
**Audit Scope:** Full dashboard data source analysis
**Next Review:** After Phase 6 Lambda enhancements
**Estimated Time to 80% Live:** 3-4 weeks (Tasks 1-9)
