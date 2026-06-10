# Phase 6A Task 7: Boss Analysis Endpoint - Implementation Plan

**Created:** June 9, 2026
**Estimate:** 4-6 hours
**Status:** Ready for implementation

---

## Overview

**Goal:** Make Boss Analysis page 100% live with GA4 data

**Business Value:**
- Identify platform-specific boss difficulty (desktop vs mobile)
- Track boss balance in real-time
- Support game design decisions with live boss defeat rates
- Monitor boss difficulty changes after game updates

**Prerequisites:** ✅ VERIFIED
- boss_id custom dimension exists (registered Feb 27, 2026)
- 3+ months of data available
- Events: `boss_attempt`, `boss_defeated` confirmed in codebase

---

## Implementation Steps

### Step 1: Lambda Backend (45 min)

**File:** `api/index.js`
**Location:** After daily-timeseries handler (~line 83)

**Code to add:**

```javascript
} else if (requestType === 'standard' && subType === 'boss-analysis') {
    // ─── BOSS ANALYSIS REQUEST (Boss defeat rates by platform) ───
    const bossAnalysisRequest = {
        property: `properties/${propertyId}`,
        dateRanges: [dateRange], // Dynamic date range from query parameter
        // Multi-dimensional query: deviceCategory × boss_id × eventName
        // Returns boss attempts/defeats split by desktop vs mobile
        dimensions: [
            { name: 'deviceCategory' },        // Dimension 0: 'desktop', 'mobile', 'tablet'
            { name: 'customEvent:boss_id' },   // Dimension 1: '1', '2', or '3'
            { name: 'eventName' }              // Dimension 2: 'boss_attempt', 'boss_defeated'
        ],
        metrics: [{ name: 'eventCount' }],
    };

    // Apply version filter if specified
    if (dimensionFilter) {
        bossAnalysisRequest.dimensionFilter = dimensionFilter;
    }

    [response] = await analyticsDataClient.runReport(bossAnalysisRequest);
}
```

**Inline Comments:**
- Line 1: "Boss analysis endpoint - returns boss attempts/defeats by platform"
- Line 5: "Use dynamic date range from selector (7/30/90 days, all time)"
- Line 6: "Multi-dimensional query: deviceCategory × boss_id × eventName"
- Line 8: "Platform: desktop, mobile, tablet (filter out tablet in frontend)"
- Line 9: "Boss identifier: 1 (Green phase), 2 (Red phase), 3 (Purple phase)"
- Line 10: "Event type: boss_attempt or boss_defeated"

**Expected Response Example:**
```json
{
  "rows": [
    {
      "dimensionValues": [
        { "value": "desktop" },
        { "value": "1" },
        { "value": "boss_attempt" }
      ],
      "metricValues": [{ "value": "342" }]
    },
    {
      "dimensionValues": [
        { "value": "desktop" },
        { "value": "1" },
        { "value": "boss_defeated" }
      ],
      "metricValues": [{ "value": "228" }]
    },
    {
      "dimensionValues": [
        { "value": "mobile" },
        { "value": "1" },
        { "value": "boss_attempt" }
      ],
      "metricValues": [{ "value": "156" }]
    }
    // ... rows for each deviceCategory × boss_id × eventName combination
  ]
}
```

---

### Step 2: Frontend Parser (90 min)

**File:** `live.html`
**Location:** Inside `mapGA4ResponseToDATA()` function, after daily-timeseries handler (~line 2546)

**Code to add:**

```javascript
// ─── BOSS-ANALYSIS RESPONSE HANDLER ───
if (reportType === 'boss-analysis') {
    // Parse multi-dimensional response: deviceCategory × boss_id × eventName
    // Build nested object: { boss1: { desktop: {attempts, defeats}, mobile: {...} }, ... }
    const bossMap = {
        '1': { desktop: { attempts: 0, defeats: 0 }, mobile: { attempts: 0, defeats: 0 } },
        '2': { desktop: { attempts: 0, defeats: 0 }, mobile: { attempts: 0, defeats: 0 } },
        '3': { desktop: { attempts: 0, defeats: 0 }, mobile: { attempts: 0, defeats: 0 } }
    };

    try {
        response.rows.forEach((row) => {
            // Extract deviceCategory, boss_id, and eventName from dimensions
            const deviceCategory = row.dimensionValues[0]?.value;  // 'desktop', 'mobile', 'tablet'
            const bossId = row.dimensionValues[1]?.value;          // '1', '2', or '3'
            const eventName = row.dimensionValues[2]?.value;       // 'boss_attempt' or 'boss_defeated'
            const eventCount = parseInt(row.metricValues[0]?.value || 0, 10);

            // Skip invalid rows or tablet data (desktop/mobile only)
            if (!bossId || !eventName || isNaN(eventCount)) return;
            if (deviceCategory !== 'desktop' && deviceCategory !== 'mobile') return;

            // Skip if boss_id not in expected range (1-3)
            if (!bossMap[bossId]) return;

            // Categorize by event type (attempt vs defeat)
            if (eventName === 'boss_attempt') {
                bossMap[bossId][deviceCategory].attempts += eventCount;
            } else if (eventName === 'boss_defeated') {
                bossMap[bossId][deviceCategory].defeats += eventCount;
            }
        });

        // Calculate defeat rates and aggregate metrics
        const bossAnalysis = {};

        Object.keys(bossMap).forEach(bossId => {
            const boss = bossMap[bossId];

            // Desktop metrics
            const desktopAttempts = boss.desktop.attempts;
            const desktopDefeats = boss.desktop.defeats;
            const desktopRate = desktopAttempts > 0 ? (desktopDefeats / desktopAttempts * 100).toFixed(1) : '0.0';

            // Mobile metrics
            const mobileAttempts = boss.mobile.attempts;
            const mobileDefeats = boss.mobile.defeats;
            const mobileRate = mobileAttempts > 0 ? (mobileDefeats / mobileAttempts * 100).toFixed(1) : '0.0';

            // Overall metrics (desktop + mobile)
            const totalAttempts = desktopAttempts + mobileAttempts;
            const totalDefeats = desktopDefeats + mobileDefeats;
            const overallRate = totalAttempts > 0 ? (totalDefeats / totalAttempts * 100).toFixed(1) : '0.0';

            // Attempt-to-defeat ratio (for chart)
            const attemptsPerDefeat = totalDefeats > 0 ? (totalAttempts / totalDefeats).toFixed(1) : 'N/A';

            bossAnalysis[`boss${bossId}`] = {
                desktop: {
                    attempts: desktopAttempts,
                    defeats: desktopDefeats,
                    defeatRate: parseFloat(desktopRate)
                },
                mobile: {
                    attempts: mobileAttempts,
                    defeats: mobileDefeats,
                    defeatRate: parseFloat(mobileRate)
                },
                overall: {
                    attempts: totalAttempts,
                    defeats: totalDefeats,
                    defeatRate: parseFloat(overallRate),
                    attemptsPerDefeat: attemptsPerDefeat === 'N/A' ? null : parseFloat(attemptsPerDefeat)
                }
            };
        });

        return {
            bossAnalysis: bossAnalysis
        };

    } catch (error) {
        console.error('Error parsing boss-analysis response:', error);
        return { error: error.message, bossAnalysis: {} };
    }
}
```

**Inline Comments Added:**
- Line 2: "Parse multi-dimensional response: deviceCategory × boss_id × eventName"
- Line 3: "Build nested object for each boss × platform combination"
- Line 12: "Extract dimensions: deviceCategory, boss_id, eventName"
- Line 18: "Skip invalid rows or tablet data (desktop/mobile only)"
- Line 23: "Skip if boss_id not in expected range (1-3)"
- Line 26: "Categorize by event type (attempt vs defeat)"
- Line 34: "Calculate defeat rates and aggregate metrics"

**Output Structure:**
```javascript
{
  bossAnalysis: {
    boss1: {
      desktop: { attempts: 342, defeats: 228, defeatRate: 66.7 },
      mobile: { attempts: 156, defeats: 89, defeatRate: 57.1 },
      overall: { attempts: 498, defeats: 317, defeatRate: 63.7, attemptsPerDefeat: 1.6 }
    },
    boss2: { ... },
    boss3: { ... }
  }
}
```

---

### Step 3: API Fetch Function (45 min)

**File:** `live.html`
**Location:** After fetchDailyTimeseriesData() function (~line 2830)

**Code to add:**

```javascript
/**
 * Fetches boss analysis data from GA4 API (boss defeat rates by platform)
 * Uses multi-dimensional query: deviceCategory × boss_id × eventName
 * @returns {Promise<Object>} { success, data, error }
 */
async function fetchBossAnalysisData() {
    // Get selected data range from combined dropdown
    const dataRangeSelect = document.getElementById('data-range-select');
    const selectedValue = dataRangeSelect ? dataRangeSelect.value : '7day-43';

    // Parse combined value (e.g., "7day-43" → dateRange="7day", version="4.3")
    const [dateRange, versionShort] = selectedValue.split('-');
    const version = versionShort === '43' ? '4.3' :
                    versionShort === 'all' ? 'all' : '4.3';

    // Build URL with boss-analysis subType
    const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.analytics}?type=standard&subType=boss-analysis&version=${version}&dateRange=${dateRange}`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' }
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return { success: true, data };

    } catch (error) {
        if (error.name === 'AbortError') {
            console.error(`Boss-analysis request timeout after ${API_CONFIG.timeout}ms`);
            return { success: false, error: 'Request timeout', data: null };
        }

        console.error(`Failed to fetch boss-analysis data:`, error);
        return { success: false, error: error.message, data: null };
    }
}
```

---

### Step 4: Integration (30 min)

**File:** `live.html`
**Location:** Inside `loadAndRenderGA4Data()` function, after daily timeseries fetch (~line 2910)

**Code to add:**

```javascript
// Fetch boss analysis data (boss defeat rates by platform)
console.log('Fetching boss-analysis data...');
const bossResult = await fetchBossAnalysisData();

if (bossResult.success && bossResult.data) {
    // Update DATA.bossAnalysis with live data from API
    const bossData = mapGA4ResponseToDATA(bossResult.data, 'boss-analysis');

    if (!bossData.error && bossData.bossAnalysis) {
        DATA.bossAnalysis = bossData.bossAnalysis;
        console.log('Boss analysis data updated:', DATA.bossAnalysis);

        // Re-render boss analysis components
        if (typeof renderBossCards === 'function') renderBossCards();
        if (typeof chartBossRatio === 'function') chartBossRatio();
        if (typeof chartBossPlatform === 'function') chartBossPlatform();
        if (typeof buildBossTable === 'function') buildBossTable();
    } else {
        console.warn('Boss-analysis parsing failed, using mock data');
    }
} else {
    console.warn('Boss-analysis fetch failed, using mock data:', bossResult.error);
}
```

---

### Step 5: Update Boss Cards (30 min)

**File:** `live.html`
**Location:** Find `renderBossCards()` or boss card rendering logic (~line 2628 based on Phase6A research)

**Current (Mock Data):**
```javascript
// Mock boss defeat rates
const boss1Rate = 66.4;
const boss2Rate = 55.6;
const boss3Rate = 71.0;
```

**Updated (Live Data):**
```javascript
// Use live data from DATA.bossAnalysis or fallback to mock
const boss1Rate = DATA.bossAnalysis?.boss1?.overall?.defeatRate ?? 66.4;
const boss2Rate = DATA.bossAnalysis?.boss2?.overall?.defeatRate ?? 55.6;
const boss3Rate = DATA.bossAnalysis?.boss3?.overall?.defeatRate ?? 71.0;
```

---

### Step 6: Update Boss Ratio Chart (30 min)

**File:** `live.html`
**Location:** Find `chartBossRatio()` function

**Chart:** Attempt-to-Defeat Ratio by Boss (chart-boss-ratio, line 1635)

**Current (Mock Data):**
```javascript
data: [1.5, 1.8, 1.4] // Boss 1, 2, 3 attempt ratios
```

**Updated (Live Data):**
```javascript
// Use live data or fallback to mock
const boss1Ratio = DATA.bossAnalysis?.boss1?.overall?.attemptsPerDefeat ?? 1.5;
const boss2Ratio = DATA.bossAnalysis?.boss2?.overall?.attemptsPerDefeat ?? 1.8;
const boss3Ratio = DATA.bossAnalysis?.boss3?.overall?.attemptsPerDefeat ?? 1.4;

data: [boss1Ratio, boss2Ratio, boss3Ratio]
```

---

### Step 7: Update Boss Platform Chart (45 min)

**File:** `live.html`
**Location:** Find `chartBossPlatform()` function

**Chart:** Boss Conversion by Platform (chart-boss-platform, line 1640)

**Current (Mock Data):**
```javascript
datasets: [
    { label: 'Desktop', data: [66.7, 56.7, 72.5] },
    { label: 'Mobile', data: [64.8, 54.3, 69.3] }
]
```

**Updated (Live Data):**
```javascript
// Desktop defeat rates per boss
const desktopRates = [
    DATA.bossAnalysis?.boss1?.desktop?.defeatRate ?? 66.7,
    DATA.bossAnalysis?.boss2?.desktop?.defeatRate ?? 56.7,
    DATA.bossAnalysis?.boss3?.desktop?.defeatRate ?? 72.5
];

// Mobile defeat rates per boss
const mobileRates = [
    DATA.bossAnalysis?.boss1?.mobile?.defeatRate ?? 64.8,
    DATA.bossAnalysis?.boss2?.mobile?.defeatRate ?? 54.3,
    DATA.bossAnalysis?.boss3?.mobile?.defeatRate ?? 69.3
];

datasets: [
    { label: 'Desktop', data: desktopRates },
    { label: 'Mobile', data: mobileRates }
]
```

---

### Step 8: Update Boss Difficulty Table (45 min)

**File:** `live.html`
**Location:** Find `buildBossTable()` function (~line 3219 based on Phase6A research)

**Table:** Boss Difficulty Assessment (boss-table, line 1661)

**Columns:**
- Boss (e.g., "Boss 1 (Green)")
- Phase (GREEN/RED/PURPLE)
- Level Gate (4/8/12)
- Attempts / Player
- Defeat Rate
- Avg Attempts to Kill
- Assessment (Easy/Medium/Hard/Very Hard)

**Current (Mock Data):**
```javascript
const bossData = [
    { name: 'Boss 1', phase: 'GREEN', level: 4, attemptsPerPlayer: 2.1, defeatRate: 66.4, avgAttempts: 1.5 },
    { name: 'Boss 2', phase: 'RED', level: 8, attemptsPerPlayer: 1.8, defeatRate: 55.6, avgAttempts: 1.8 },
    { name: 'Boss 3', phase: 'PURPLE', level: 12, attemptsPerPlayer: 1.4, defeatRate: 71.0, avgAttempts: 1.4 }
];
```

**Updated (Live Data):**
```javascript
const bossData = [
    {
        name: 'Boss 1',
        phase: 'GREEN',
        level: 4,
        attemptsPerPlayer: (DATA.bossAnalysis?.boss1?.overall?.attempts / (DATA.overview?.uniquePlayers || 1)).toFixed(1) ?? 2.1,
        defeatRate: DATA.bossAnalysis?.boss1?.overall?.defeatRate ?? 66.4,
        avgAttempts: DATA.bossAnalysis?.boss1?.overall?.attemptsPerDefeat ?? 1.5
    },
    {
        name: 'Boss 2',
        phase: 'RED',
        level: 8,
        attemptsPerPlayer: (DATA.bossAnalysis?.boss2?.overall?.attempts / (DATA.overview?.uniquePlayers || 1)).toFixed(1) ?? 1.8,
        defeatRate: DATA.bossAnalysis?.boss2?.overall?.defeatRate ?? 55.6,
        avgAttempts: DATA.bossAnalysis?.boss2?.overall?.attemptsPerDefeat ?? 1.8
    },
    {
        name: 'Boss 3',
        phase: 'PURPLE',
        level: 12,
        attemptsPerPlayer: (DATA.bossAnalysis?.boss3?.overall?.attempts / (DATA.overview?.uniquePlayers || 1)).toFixed(1) ?? 1.4,
        defeatRate: DATA.bossAnalysis?.boss3?.overall?.defeatRate ?? 71.0,
        avgAttempts: DATA.bossAnalysis?.boss3?.overall?.attemptsPerDefeat ?? 1.4
    }
];

// Assessment logic (based on defeat rate)
function getDifficultyAssessment(defeatRate) {
    if (defeatRate >= 70) return 'Easy';
    if (defeatRate >= 60) return 'Medium';
    if (defeatRate >= 50) return 'Hard';
    return 'Very Hard';
}
```

---

### Step 9: Testing (90 min)

**Test 9.1: Lambda Endpoint (15 min)**
- Deploy Lambda to AWS
- Test endpoint: `?type=standard&subType=boss-analysis&version=4.3&dateRange=7day`
- Verify response has deviceCategory + boss_id + eventName dimensions
- Check response time (<1 second)
- Verify all 3 bosses have data

**Test 9.2: Parser Validation (20 min)**
- Test with live API response
- Verify bossMap correctly separates desktop vs mobile
- Check defeat rate calculations (defeats / attempts * 100)
- Verify attemptsPerDefeat ratio (attempts / defeats)
- Test with edge case: zero attempts (should return 0.0, not NaN)

**Test 9.3: Boss Cards (15 min)**
- Verify 3 boss cards render with live defeat rates
- Check defeat rates match API response
- Test desktop vs mobile breakdown displayed correctly

**Test 9.4: Charts Rendering (20 min)**
- **Chart 1 (Boss Ratio):** Verify 3 bars showing attempts-per-defeat ratio
- **Chart 2 (Boss Platform):** Verify 2 datasets (desktop, mobile) with 3 data points each
- Check data points match API response
- Verify chart tooltips show correct values

**Test 9.5: Table Validation (15 min)**
- Verify table shows 3 rows (Boss 1, 2, 3)
- Check columns: Attempts/Player, Defeat Rate, Avg Attempts, Assessment
- Test assessment logic (Easy ≥70%, Medium ≥60%, Hard ≥50%, Very Hard <50%)
- Verify phase colors (Green, Red, Purple)

**Test 9.6: Version/Date Filtering (5 min)**
- Change selector to "Last 30 Days - Version 4.3"
- Verify boss data updates
- Check console logs show new API call

---

## Possible Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| boss_id dimension returns no data | Custom dimension not sending data | Check GA4 DebugView: verify `boss_attempt` events have `boss_id` parameter |
| Defeat rates are 0% | Wrong event names | Verify events are `boss_attempt` / `boss_defeated` (not `boss_attempted`) |
| Desktop/Mobile don't sum correctly | Tablet data included | Already filtered in parser: `if (deviceCategory !== 'desktop' && deviceCategory !== 'mobile') return;` |
| NaN in defeat rate | Zero attempts | Add fallback: `attemptsPerDefeat = totalDefeats > 0 ? ... : 'N/A'` |
| Chart shows old data | Cache not cleared | Already handled with hourly auto-refresh |
| Boss 2 has higher mobile difficulty | Platform-specific game balance issue | Feature, not bug - document in dashboard notes |

---

## Files to Modify

1. **api/index.js** - Add boss-analysis handler (~25 lines at line 83)
2. **live.html** - Parser, fetch, integration, charts, table (~200 lines total)
   - Line ~2546: Parser in mapGA4ResponseToDATA() (~90 lines)
   - Line ~2830: fetchBossAnalysisData() function (~45 lines)
   - Line ~2910: Integration in loadAndRenderGA4Data() (~25 lines)
   - Boss cards, charts, table updates (~40 lines changes)

**Total Lines Added:** ~225 lines
**Total Lines Modified:** ~40 lines

---

## Deployment Steps

1. Update `api/index.js` with boss-analysis handler
2. Deploy Lambda via AWS console
3. Test endpoint with cURL or browser DevTools
4. Update `live.html` with parser, fetch, and integration
5. Update boss cards rendering logic
6. Update boss charts (ratio + platform)
7. Update boss difficulty table
8. Test dashboard with live data
9. Verify charts/table update with version/date filters
10. Document completion in HANDOFF_SUMMARY.md
11. Update PRIORITIES.md marking Task 7 complete
12. Commit and push to main

---

## Expected Outcome

**Before:** Boss Analysis page shows hardcoded mock data

**After:** Boss Analysis page shows live GA4 data:
- Boss cards: Live defeat rates per boss
- Boss Ratio chart: Live attempts-per-defeat ratios
- Boss Platform chart: Live desktop vs mobile defeat rates
- Boss Difficulty table: Live metrics with dynamic assessment

**Dashboard Status:** ~35% live data (15-18 of 44 metrics)

**Boss Analysis Page:** 100% live ✅
- 3 boss cards ✅
- 2 charts ✅
- 1 table ✅

---

## Ready to Proceed?

**Prerequisites verified:**
- ✅ boss_id dimension exists
- ✅ 3+ months of data available
- ✅ Events confirmed (boss_attempt, boss_defeated)
- ✅ Phase 6A research complete

**User approval needed before implementation.**

Once approved:
1. Implement backend changes (45 min)
2. Deploy Lambda to AWS (15 min)
3. Implement frontend changes (3 hours)
4. Run testing protocol (90 min)
5. Document completion (30 min)

**Estimated total time:** 4-5 hours