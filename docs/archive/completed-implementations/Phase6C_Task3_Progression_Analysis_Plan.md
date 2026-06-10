# Phase 6C Task 3: Phase/Level Progression Endpoint — Implementation Plan

**Created:** June 9, 2026
**Updated:** June 10, 2026 — fetch pattern upgraded to `AbortSignal.timeout()` (2026 best practice)
**Estimated Time:** 2.5–3 hours
**Dashboard Progress After:** ~55% live (up from ~51%)
**Status:** PENDING — awaiting implementation approval

---

## Overview

**Goal:** Make the Wave Drop-off chart (Deaths by Level) 100% live using GA4 `customEvent:level_reached` and `customEvent:phase` dimensions.

**What becomes live after this task:**
- Wave Drop-off chart — ALL / DESKTOP / MOBILE platform toggle
- Per-level death distribution (levels 1–12) from real GA4 data

**Custom Dimensions used:**
- `customEvent:phase` — `'green'`, `'red'`, `'purple'`
- `customEvent:level_reached` — `'1'` through `'12'`

**Query Structure:** `phase × level_reached × eventName × deviceCategory`

**Key insight:** The backend handler (`progression-analysis`) is already written in `api/index.js:147-168`. It needs to be deployed to AWS, and then 4 frontend changes are needed in `live.html`.

---

## Task List

| # | Task | File | Est. |
|---|------|------|------|
| 1 | Verify `progression-analysis` handler at `api/index.js:147-168` | `api/index.js` | 5 min |
| 2 | Deploy updated `api/index.js` to AWS Lambda | AWS Console | 15 min |
| 3 | Test raw endpoint response (expect 200 OK, 4 dims, 50-150 rows) | Browser/curl | 10 min |
| 4 | Add `progression-analysis` parser to `mapGA4ResponseToDATA()` | `live.html` after line 2812 | 45 min |
| 5 | Add comment to `DATA.deathsByLevel` initialization block | `live.html:2329` | 5 min |
| 6 | Create `fetchProgressionAnalysisData()` function | `live.html` after line 3187 | 20 min |
| 7 | Integrate into `loadAndRenderGA4Data()` | `live.html` after line 3373 | 15 min |
| 8 | Test Wave Drop-off chart (ALL / MOBILE / DESKTOP toggle) | Dashboard | 20 min |
| 9 | Verify platform toggle unlocks after live data loads | Dashboard | 5 min |
| 10 | Update `HANDOFF_SUMMARY.md` and `PRIORITIES.md` | Docs | 10 min |

**Total: 2.5–3 hours**

---

## Files to Modify

| File | Action | Lines |
|------|--------|-------|
| `api/index.js` | Deploy only (handler already written) | 147–168 |
| `live.html` | Add comment to DATA init | 2329–2335 |
| `live.html` | Add progression parser in `mapGA4ResponseToDATA()` | Insert after 2812 |
| `live.html` | Add `fetchProgressionAnalysisData()` function | Insert after 3187 |
| `live.html` | Add integration block in `loadAndRenderGA4Data()` | Insert after 3373 |

---

## Code Changes

---

### Change 1 — DATA.deathsByLevel Comment Update

**File:** `live.html`
**Lines:** 2329–2335
**Action:** Add 2 comment lines to the existing initialization block (no code changes)

**Before (lines 2329–2335):**
```javascript
        deathsByLevel: {
          // Labels interleave level deaths + boss fight deaths after L4/L8/L12
          labels: ['L1', 'L2', 'L3', 'L4', 'Boss 1', 'L5', 'L6', 'L7', 'L8', 'Boss 2', 'L9', 'L10', 'L11', 'L12', 'Boss 3'],
          counts: [88, 124, 210, 187, 347, 98, 143, 221, 195, 308, 62, 91, 128, 87, 118],
          phase: ['grn', 'grn', 'grn', 'grn', 'grn', 'red', 'red', 'red', 'red', 'red', 'pur', 'pur', 'pur', 'pur', 'pur'],
          isBoss: [false, false, false, false, true, false, false, false, false, true, false, false, false, false, true],
        },
```

**After:**
```javascript
        deathsByLevel: {
          // Mock data for fallback — used by chartDropoff() when hasRealData is false
          // Live path populates: levelDeaths, levelDesktop, levelMobile, hasRealData
          // Updated by fetchProgressionAnalysisData() — sets hasRealData=true to activate live data path
          labels: ['L1', 'L2', 'L3', 'L4', 'Boss 1', 'L5', 'L6', 'L7', 'L8', 'Boss 2', 'L9', 'L10', 'L11', 'L12', 'Boss 3'],
          counts: [88, 124, 210, 187, 347, 98, 143, 221, 195, 308, 62, 91, 128, 87, 118],
          phase: ['grn', 'grn', 'grn', 'grn', 'grn', 'red', 'red', 'red', 'red', 'red', 'pur', 'pur', 'pur', 'pur', 'pur'],
          isBoss: [false, false, false, false, true, false, false, false, false, true, false, false, false, false, true],
        },
```

---

### Change 2 — Add `progression-analysis` Parser in `mapGA4ResponseToDATA()`

**File:** `live.html`
**Location:** Insert after line 2812 (closing `}` of `powerup-analysis` block), before line 2813
**Context lines before insertion:**
```
2810             }
2811           };
2812         }       ← insert NEW block immediately after this line
2813       }
2814
2815       // ─── EXTRACTION ───────────────────────────────────────────────
```
**Size:** ~35 lines

**Code to insert after line 2812:**
```javascript
        if (reportType === 'progression-analysis') {
          // Parse phase × level_reached × eventName × deviceCategory response
          // Builds per-level death counts for Wave Drop-off chart (all / desktop / mobile)
          const levelDeaths = {};   // all platforms combined (keyed by level string '1'–'12')
          const levelDesktop = {};  // desktop only
          const levelMobile = {};   // mobile only

          if (response.rows && response.rows.length > 0) {
            response.rows.forEach(row => {
              const phase = row.dimensionValues[0]?.value?.toLowerCase() || '';           // 'green', 'red', 'purple'
              const levelReached = row.dimensionValues[1]?.value || '';                   // '1' through '12'
              const eventName = row.dimensionValues[2]?.value || '';                      // 'player_death', 'player_won', 'wave_reached'
              const deviceCategory = row.dimensionValues[3]?.value?.toLowerCase() || ''; // 'desktop', 'mobile', 'tablet'
              const count = parseInt(row.metricValues[0]?.value || '0', 10);

              // Only count player_death events — these are what the Wave Drop-off chart displays
              if (eventName === 'player_death' && levelReached) {
                levelDeaths[levelReached] = (levelDeaths[levelReached] || 0) + count;

                if (deviceCategory === 'desktop') {
                  levelDesktop[levelReached] = (levelDesktop[levelReached] || 0) + count;
                } else if (deviceCategory === 'mobile') {
                  levelMobile[levelReached] = (levelMobile[levelReached] || 0) + count;
                }
              }
            });
          }

          return {
            progressionData: {
              levelDeaths,
              levelDesktop,
              levelMobile,
              hasRealData: Object.keys(levelDeaths).length > 0, // true only if death rows returned
            }
          };
        }
```

---

### Change 3 — Add `fetchProgressionAnalysisData()` Function

**File:** `live.html`
**Location:** Insert after line 3187 (closing `}` of `fetchPowerupAnalysisData()`), before line 3189
**Context lines before insertion:**
```
3184         console.error(`Failed to fetch powerup-analysis data:`, error);
3185         return { success: false, error: error.message, data: null };
3186       }
3187     }       ← insert NEW function immediately after this line
3188
3189     /**
3190      * Loads GA4 data, maps to DATA object, and updates charts
```
**Size:** ~38 lines
**Pattern:** Copy exactly from `fetchPowerupAnalysisData()` — zero variation

**Code to insert after line 3187:**
```javascript
      async function fetchProgressionAnalysisData() {
        // Get selected data range from combined dropdown (default: 90day-43)
        const dataRangeSelect = document.getElementById('data-range-select');
        const selectedValue = dataRangeSelect ? dataRangeSelect.value : '90day-43';

        // Parse combined value (e.g., "7day-43" → dateRange="7day", version="4.3")
        const [dateRange, versionShort] = selectedValue.split('-');
        const version = versionShort === '43' ? '4.3' :
                        versionShort === 'all' ? 'all' : '4.3';

        // Build URL with progression-analysis subType
        const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.analytics}?type=standard&subType=progression-analysis&version=${version}&dateRange=${dateRange}`;

        try {
          // AbortSignal.timeout() — 2026 best practice (Baseline 2024, replaces AbortController + setTimeout)
          const response = await fetch(url, {
            signal: AbortSignal.timeout(API_CONFIG.timeout),
            headers: { 'Content-Type': 'application/json' }
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          return { success: true, data };

        } catch (error) {
          // TimeoutError: thrown by AbortSignal.timeout() when the request exceeds the limit
          if (error.name === 'TimeoutError') {
            console.error(`Progression-analysis request timeout after ${API_CONFIG.timeout}ms`);
            return { success: false, error: 'Request timeout', data: null };
          }
          console.error(`Failed to fetch progression-analysis data:`, error);
          return { success: false, error: error.message, data: null };
        }
      }
```

---

### Change 4 — Integrate in `loadAndRenderGA4Data()`

**File:** `live.html`
**Location:** Insert after line 3373 (closing `}` of powerup fetch block), before line 3375
**Context lines before insertion:**
```
3371       } else {
3372         console.warn('Powerup-analysis fetch failed, using mock data:', powerupResult.error);
3373       }       ← insert NEW block immediately after this line
3374
3375       // Re-render all charts
3376       reinitAllCharts();
```
**Size:** ~18 lines

**Code to insert after line 3373:**
```javascript
        // Fetch progression analysis data (wave drop-off by level and platform)
        console.log('Fetching progression-analysis data...');
        const progressionResult = await fetchProgressionAnalysisData();

        if (progressionResult.success && progressionResult.data) {
          const progressionData = mapGA4ResponseToDATA(progressionResult.data, 'progression-analysis');

          if (!progressionData.error && progressionData.progressionData) {
            // Populate live data keys — chartDropoff() uses hasRealData flag to switch from mock to live path
            DATA.deathsByLevel.levelDeaths = progressionData.progressionData.levelDeaths;
            DATA.deathsByLevel.levelDesktop = progressionData.progressionData.levelDesktop;
            DATA.deathsByLevel.levelMobile = progressionData.progressionData.levelMobile;
            DATA.deathsByLevel.hasRealData = progressionData.progressionData.hasRealData;
            console.log('Progression data updated:', DATA.deathsByLevel.levelDeaths);
          } else {
            console.warn('Progression-analysis parsing failed, using mock data');
          }
        } else {
          console.warn('Progression-analysis fetch failed, using mock data:', progressionResult.error);
        }
```

---

## API Endpoint

**URL:** `GET /analytics?type=standard&subType=progression-analysis&version=4.3&dateRange=90day`

**Expected Response Structure:**
```json
{
  "dimensionHeaders": [
    {"name": "customEvent:phase"},
    {"name": "customEvent:level_reached"},
    {"name": "eventName"},
    {"name": "deviceCategory"}
  ],
  "rows": [
    {
      "dimensionValues": [
        {"value": "green"},
        {"value": "3"},
        {"value": "player_death"},
        {"value": "desktop"}
      ],
      "metricValues": [{"value": "12"}]
    }
    // ... 50-150 rows (3 phases × 12 levels × 2-3 events × 2-3 platforms)
  ]
}
```

---

## How `chartDropoff()` Uses Live Data (No Chart Code Changes Needed)

`chartDropoff()` at `live.html:3662` already has two data paths:

```javascript
const useReal = d.hasRealData; // ← our fetch sets this to true

if (useReal) {
  // Real data path: reads d.levelDeaths / d.levelMobile / d.levelDesktop
  for (let lvl = 1; lvl <= 12; lvl++) {
    const k = String(lvl);
    labels.push('L' + k); counts.push(ld[k] || 0); // ← reads our live data
    ...
  }
} else {
  // Mock data path: reads d.labels / d.counts arrays
}
```

Boss bars pull from `DATA.bosses[bIdx]` (already live from Phase 6A Task 7) — no change needed.

Platform toggle at `live.html:3521-3534` already guards against empty `levelMobile`:
```javascript
const hasSplit = Object.values(DATA.deathsByLevel.levelMobile || {}).some(v => v > 0);
if (!hasSplit && p !== 'all') { showToast('...', 'warn'); return; }
```
Once live data loads, mobile/desktop toggle will unlock automatically.

---

## Possible Errors and Solutions

| Error | Cause | Solution |
|-------|-------|---------|
| AWS 403 / endpoint not found | `progression-analysis` not deployed | Re-deploy `api/index.js` via AWS Lambda Console |
| `CONFIG is not defined` | Using `CONFIG` instead of `API_CONFIG` | Copy exactly from `fetchPowerupAnalysisData()` — always `API_CONFIG` |
| Chart shows all zeros | `player_death` event name mismatch | Check raw API response rows for actual `eventName` values |
| Platform toggle still locked | `levelMobile` has no data | Check raw response for mobile rows — may be low sample size |
| `level_reached` values are empty string | Dimension not firing in game | Verify custom dimension registered and game is sending `level_reached` param |
| `progressionData.progressionData` undefined | Wrong return key in parser | Verify `return { progressionData: { ... } }` — not `return { progression: { ... } }` |
| `hasRealData` stays false | No `player_death` rows returned | Check if date range has any deaths — try `dateRange=alltime` |

---

## Testing Protocol

### Test 1: API Endpoint (10 min)
- [ ] 1.1: Endpoint returns 200 OK with rows
- [ ] 1.2: Response has 4 dimension headers (phase, level_reached, eventName, deviceCategory)
- [ ] 1.3: `player_death` events present in rows with `level_reached` values '1'–'12'
- [ ] 1.4: Version filter works (`version=4.3` returns fewer rows than `version=all`)
- [ ] 1.5: Date range works (`dateRange=7day` vs `dateRange=90day`)

### Test 2: Frontend Parsing (10 min)
- [ ] 2.1: Console shows: `Fetching progression-analysis data...`
- [ ] 2.2: Console shows: `Progression data updated: {1: N, 2: N, ...}`
- [ ] 2.3: `DATA.deathsByLevel.hasRealData` = `true` (verify in browser console)
- [ ] 2.4: `DATA.deathsByLevel.levelDeaths` has level keys '1'–'12'

### Test 3: Chart Rendering (15 min)
- [ ] 3.1: Wave Drop-off chart displays live bars (different heights from mock data)
- [ ] 3.2: Boss bars still appear at L4/L8/L12 positions with correct heights
- [ ] 3.3: Phase colors correct (green bars L1–L4, red L5–L8, purple L9–L12)
- [ ] 3.4: No console errors during chart render

### Test 4: Platform Toggle (5 min)
- [ ] 4.1: MOBILE button no longer shows toast warning — click works
- [ ] 4.2: MOBILE view shows different bar distribution than ALL
- [ ] 4.3: DESKTOP view shows different bar distribution than MOBILE
- [ ] 4.4: Toggle back to ALL restores combined data

### Test 5: Selector Integration (10 min)
- [ ] 5.1: Changing date range (90day → 7day) triggers refetch and chart updates
- [ ] 5.2: Version change (4.3 → all) triggers refetch and chart updates

---

## Dashboard Progress After Completion

| Metric | Before | After |
|--------|--------|-------|
| Live data % | ~51% | ~55% |
| Wave Drop-off (ALL) | Mock | ✅ Live |
| Wave Drop-off (DESKTOP) | Locked | ✅ Live |
| Wave Drop-off (MOBILE) | Locked | ✅ Live |

---

## Lessons Learned from Phase 6B (Apply Here)

1. **Copy fetch pattern exactly** — use `API_CONFIG`, not `CONFIG`
2. **Test endpoint FIRST** before writing parser — verify actual `eventName` values in response
3. **Match dimension index to handler order** — `phase`=0, `level_reached`=1, `eventName`=2, `deviceCategory`=3
4. **Verify return key name** — `progressionData.progressionData` must match exactly what parser returns

---

## Codebase-Wide AbortSignal.timeout() Scope

**Haiku agent research finding (June 10, 2026):**

`api/index.js` does NOT use fetch — Lambda runs server-side using the GA4 Node.js client library. No changes needed there.

`live.html` has **6 existing fetch functions** all using the old `AbortController + setTimeout` pattern:

| Function | AbortController lines | Error check |
|----------|----------------------|-------------|
| `fetchGA4Data()` | 2925–2936 | `'AbortError'` |
| `fetchPlatformSplitData()` | 2976–2987 | `'AbortError'` |
| `fetchDailyTimeseriesData()` | 3030–3037 | `'AbortError'` |
| `fetchBossAnalysisData()` | 3076–3083 | `'AbortError'` |
| `fetchSurvivalTimeData()` | 3120–3128 | `'AbortError'` |
| `fetchPowerupAnalysisData()` | 3162–3170 | `'AbortError'` |

All 6 use `API_CONFIG.timeout` and catch `error.name === 'AbortError'`.

**Phase 6C scope:** Only `fetchProgressionAnalysisData()` (new function) uses `AbortSignal.timeout()`. The 6 existing functions are out of scope for Phase 6C — they still work correctly with the old pattern.

**Recommended follow-up task:** After Phase 6C is complete, do a single cleanup pass to upgrade all 6 existing fetch functions to `AbortSignal.timeout()` and change `'AbortError'` → `'TimeoutError'`. Estimated time: 20 minutes. Add to PRIORITIES.md as a low-priority cleanup task.

---

**User Approval Required Before Implementation**
