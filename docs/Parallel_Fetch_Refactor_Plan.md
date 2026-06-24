# Parallel Fetch Refactor Plan

**Task:** Refactor `loadAndRenderGA4Data()` from sequential awaits to two-wave `Promise.allSettled()`
**Goal:** Reduce dashboard load time from 10–20s to ~2–5s
**File:** `live.html:4485–4901`
**Research:** 3 Haiku agents (dependency analysis, best practices, security audit)
**Status:** PENDING APPROVAL

---

## Problem

`loadAndRenderGA4Data()` fires 12 API fetches sequentially — each waits for the previous to complete before starting. Total load time = sum of all fetch durations.

As more metrics are added, load time grows linearly.

**Current execution order (live.html):**

| # | Function | Line | Wait |
|---|---|---|---|
| 1 | `fetchGA4Data()` | 4493 | sequential |
| 2 | `fetchPlatformSplitData()` | 4526 | sequential |
| 3 | `fetchDailyTimeseriesData()` | 4589 | sequential |
| 4 | `fetchBossAnalysisData()` | 4605 | sequential |
| 5 | `fetchSurvivalTimeData()` | 4629 | sequential |
| 6 | `fetchPowerupAnalysisData()` | 4652 | sequential |
| 7 | `fetchProgressionAnalysisData()` | 4668 | sequential |
| 8 | `fetchReplayRateData()` | 4771 | sequential |
| 9 | `Promise.all([fetchMusicABData(), fetchMusicFunnelData()])` | 4788 | parallel pair |
| 10 | `fetchMovementABData()` | 4828 | sequential |
| 11 | `fetchEngagementData()` | 4845 | sequential |
| 12 | `Promise.all([fetchAvgTierData(), fetchTierScoreData()])` | 4876 | parallel pair |
| — | `reinitAllCharts()` | 4891 | after all fetches |
| — | `loadAndRenderGA4Data()` invoked | 6092 | DOMContentLoaded |

---

## Data Dependency Analysis

Three hard dependencies prevent full parallelization:

| Dependent Function | Requires | Source |
|---|---|---|
| `fetchEngagementData()` | `DATA.kpis.sessions` | populated by `fetchGA4Data()` mapper |
| `fetchMusicFunnelData()` mapper | `DATA.abMusic.A/B.sessions` | populated by `fetchMusicABData()` mapper |
| `fetchProgressionAnalysisData()` | `DATA.bossAnalysis` | populated by `fetchBossAnalysisData()` mapper |

All other functions are fully independent — they read nothing from the shared `DATA` object before their own fetch completes.

---

## Solution: Single-Wave Promise.allSettled()

**Confirmed best approach for 2026** (Haiku research — no superior alternative exists for this use case).

**Refinement discovered during implementation:** Originally planned as two waves, but all 17 fetches can fire simultaneously in a single `Promise.allSettled()`. The data dependencies are on the **mapping order**, not the **fetch order** — since JavaScript is single-threaded, mappers run sequentially after `allSettled` resolves. Controlling the mapping order is sufficient; no second wave is needed.

```
Single wave — all 17 fetches fire simultaneously:
  fetchGA4Data()
  fetchPlatformSplitData()
  fetchDailyTimeseriesData()
  fetchBossAnalysisData()
  fetchSurvivalTimeData()
  fetchPowerupAnalysisData()
  fetchAIAnalysisData()
  fetchDeathTriggersData()
  fetchNewUserPctData()
  fetchReplayRateData()
  fetchMusicABData()
  fetchMovementABData()
  fetchAvgTierData()
  fetchTierScoreData()
  fetchEngagementData()       ← fetch is independent; mapper reads DATA.kpis + DATA.bossAnalysis
  fetchMusicFunnelData()      ← fetch is independent; mapper reads DATA.abMusic
  fetchProgressionAnalysisData() ← fetch is independent; mapper reads DATA.bossAnalysis + DATA.kpis

→ Map results in dependency order (see Step 2 below)
→ reinitAllCharts()
```

**Mapping order within the single wave:**
1. `ga4Result` → DATA.kpis (required by engagement + progression mappers)
2. `bossResult` → DATA.bossAnalysis (required by engagement + progression mappers)
3. `musicABResult` → DATA.abMusic (required by musicFunnel mapper)
4. All remaining results (any order)
5. `progressionResult` mapper (reads DATA.bossAnalysis + DATA.kpis — already populated)
6. `engagementResult` mapper (reads DATA.kpis + DATA.bossAnalysis — already populated)
7. `musicFunnelResult` mapper (reads DATA.abMusic — already populated)

**Expected load time:**
- Before: ~17 fetches × ~1.5s avg = **15–20s+**
- After: max(all 17 fetches simultaneously) ≈ **2–4s**
- Future metrics added add **zero** additional load time (they join the single allSettled)

---

## Implementation

### File: `live.html`
### Function: `loadAndRenderGA4Data()` — lines 4485–4901
### Lines replaced: 4493–4890 (all fetch calls and their mappers)

---

### Step 1 — Replace sequential fetches with Wave 1 Promise.allSettled()

**Before (lines 4493–4787, sequential):**
```javascript
const result = await fetchGA4Data(type);
// ... mapping block ...
const platformResult = await fetchPlatformSplitData(dateRange);
// ... mapping block ...
const dailyResult = await fetchDailyTimeseriesData(dateRange);
// ... (continues for all 9 sequential fetches)
```

**After:**
```javascript
updateAPIStatus('loading', 'Fetching data...');

const [
  ga4Result, platformResult, dailyResult, bossResult,
  survivalResult, powerupResult, replayResult,
  musicABResult, movementResult, avgTierResult, tierScoreResult
] = await Promise.allSettled([
  fetchGA4Data(type),
  fetchPlatformSplitData(dateRange),
  fetchDailyTimeseriesData(dateRange),
  fetchBossAnalysisData(dateRange),
  fetchSurvivalTimeData(dateRange),
  fetchPowerupAnalysisData(dateRange),
  fetchReplayRateData(dateRange),
  fetchMusicABData(dateRange),
  fetchMovementABData(dateRange),
  fetchAvgTierData(),
  fetchTierScoreData()
]);
```

---

### Step 2 — Map all Wave 1 results to DATA.*

Each result wrapped in a `fulfilled` check (resilience pattern):

```javascript
// Map Wave 1 results
if (ga4Result.status === 'fulfilled' && ga4Result.value.success) {
  mapGA4ResponseToDATA(ga4Result.value.data, 'overview');
} else {
  console.warn('fetchGA4Data failed:', ga4Result.reason ?? ga4Result.value?.error);
}

if (platformResult.status === 'fulfilled' && platformResult.value.success) {
  mapGA4ResponseToDATA(platformResult.value.data, 'platform');
} else {
  console.warn('fetchPlatformSplitData failed:', platformResult.reason ?? platformResult.value?.error);
}

// ... same pattern for dailyResult, bossResult, survivalResult,
//     powerupResult, replayResult, musicABResult, movementResult,
//     avgTierResult, tierScoreResult
```

---

### Step 3 — Fire Wave 2 (dependent fetches) in parallel

```javascript
// Wave 2: depends on DATA.kpis, DATA.abMusic, DATA.bossAnalysis from Wave 1
const [engagementResult, musicFunnelResult, progressionResult] =
  await Promise.allSettled([
    fetchEngagementData(dateRange),
    fetchMusicFunnelData(dateRange),
    fetchProgressionAnalysisData(dateRange)
  ]);

// Map Wave 2 results
if (engagementResult.status === 'fulfilled' && engagementResult.value.success) {
  mapGA4ResponseToDATA(engagementResult.value.data, 'engagement');
} else {
  console.warn('fetchEngagementData failed:', engagementResult.reason ?? engagementResult.value?.error);
}
// ... same pattern for musicFunnelResult, progressionResult
```

---

### Step 4 — reinitAllCharts() remains at line 4891 (no change)

```javascript
reinitAllCharts(); // called after Wave 2 maps — same as today
```

---

## Security & Reliability Findings

### Real Concerns — Must Address

**1. API Gateway Rate Limiting (HIGH PRIORITY)**
- Wave 1 fires 11 simultaneous requests to API Gateway
- Current throttle: 10 req/s (set during Phase 6A security config)
- 11 simultaneous requests may trigger throttling on the first wave
- **Action required:** Check API Gateway usage plan throttle setting in AWS console before deploying
- **Fix if needed:** Raise per-second quota to 20 req/s, or split Wave 1 into two sub-waves of 5–6

**2. AbortSignal.timeout() per fetch (BEST PRACTICE)**
- Prevents any single hung request from blocking render indefinitely
- Already used in this codebase (AbortSignal.timeout() cleanup was completed June 10, 2026)
- Verify all 11 Wave 1 fetch functions still have timeout signals — no change needed if already present

### False Concerns — No Action Needed

| Concern | Why safe |
|---|---|
| Race conditions on `DATA` object | JS is single-threaded — parallel writes are atomic, no corruption possible |
| Error surface expansion | `allSettled()` vs sequential `await` does not change attack surface |
| CORS / API key leakage | Parallelization does not affect credential exposure |

---

## Alternatives Considered (Rejected)

| Alternative | Why rejected |
|---|---|
| ReadableStream / streaming | Adds complexity for marginal gain in fixed 2-wave flow |
| Web Workers | Overkill — mapping is lightweight, not CPU-bound |
| Service Workers | Cross-session caching, not a parallelization tool |
| Promise.race() | Wrong tool — need all results, not first-to-win |

---

## Pre-Implementation Checklist

- [x] **Raise API Gateway throttle to 20 req/s** — USER DECISION: June 24, 2026
  - AWS Console → API Gateway → Usage Plans → select NON-X plan → Edit → Throttling → Rate: `20` req/s
  - Burst can remain at existing setting (typically 2× rate)
  - Reason: Wave 1 fires 11 simultaneous requests; current 10 req/s limit would throttle on load
- [ ] Confirm all 12 fetch functions have `AbortSignal.timeout()` — if not, add during this refactor
- [x] User approves plan — June 24, 2026

## Testing Checklist

- [ ] Network tab: Wave 1 fetches fire simultaneously (not cascading)
- [ ] Wave 2 fires only after Wave 1 maps complete
- [ ] All 12 dashboard sections populate correctly
- [ ] One fetch blocked (DevTools → Network → block request URL) → other sections still render
- [ ] Load time measured before/after in Network tab (Performance tab or manual timer)
- [ ] Refresh button still works correctly after refactor
- [ ] No console errors on successful load

---

## Possible Errors During Implementation

| Error | Cause | Solution |
|---|---|---|
| Section renders blank | `fulfilled` check too strict — mapping condition wrong | Log `result.status` and `result.value` to verify shape |
| Wave 2 reads stale DATA | Wave 1 mapper missed a field | Add `console.log(DATA)` after Wave 1 maps to verify |
| API Gateway 429 on load | 11 req/s exceeds throttle | Raise AWS quota or split Wave 1 into two sub-waves |
| `reinitAllCharts()` fires before data | Wave 2 not awaited properly | Ensure `await Promise.allSettled(Wave2)` before charts call |

---

**User Approval Required Before Implementation**
