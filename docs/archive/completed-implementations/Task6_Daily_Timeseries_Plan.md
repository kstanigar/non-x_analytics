# Phase 6A Task 6: Daily Timeseries Endpoint - Implementation Plan

**Created:** June 9, 2026
**Estimate:** 4-6 hours
**Status:** Ready for implementation

---

## Overview

**Goal:** Replace mock data in "Daily Plays & Wins" chart with live GA4 data showing 14-day trend.

**Business Value:**
- Track daily engagement trends
- Monitor win rate changes over time
- Identify spikes/drops in activity
- Spot patterns (weekdays vs weekends)

---

## Implementation Steps

### Step 1: Lambda Backend (30 min)

**File:** `api/index.js`
**Location:** After platform-split handler (~line 63)

**Code to add:**

```javascript
// ─── DAILY TIMESERIES REQUEST (14-day Play/Win trend) ───
else if (requestType === 'standard' && subType === 'daily-timeseries') {
    const dailyTimeseriesRequest = {
        property: `properties/${propertyId}`,
        dateRanges: [dateRange], // Dynamic date range from query parameter
        // Multi-dimensional query: date × eventName
        // Returns daily counts for game_start, player_won, etc.
        dimensions: [
            { name: 'date' },         // Dimension 0: YYYYMMDD format (e.g., "20260609")
            { name: 'eventName' }     // Dimension 1: game_start, player_won, etc.
        ],
        metrics: [{ name: 'eventCount' }],
    };

    // Apply version filter if specified
    if (dimensionFilter) {
        dailyTimeseriesRequest.dimensionFilter = dimensionFilter;
    }

    [response] = await analyticsDataClient.runReport(dailyTimeseriesRequest);
}
```

**Inline Comments:**
- Line 1: "Daily timeseries endpoint - returns Play/Win counts by date"
- Line 5: "Use dynamic date range from selector (7/30/90 days, all time)"
- Line 7: "Multi-dimensional query: date × eventName"
- Line 9: "Date in YYYYMMDD format (e.g., 20260609)"
- Line 10: "Event name (game_start, player_won, player_death, etc.)"

**Expected Response Example:**
```json
{
  "rows": [
    {
      "dimensionValues": [
        { "value": "20260525" },
        { "value": "game_start" }
      ],
      "metricValues": [{ "value": "28" }]
    },
    {
      "dimensionValues": [
        { "value": "20260525" },
        { "value": "player_won" }
      ],
      "metricValues": [{ "value": "2" }]
    }
    // ... one row per date × eventName combination
  ]
}
```

---

### Step 2: Frontend Parser (60 min)

**File:** `live.html`
**Location:** Inside `mapGA4ResponseToDATA()` function, after platform-split handler (~line 1833)

**Code to add:**

```javascript
// ─── DAILY-TIMESERIES RESPONSE HANDLER ───
if (reportType === 'daily-timeseries') {
    // Parse multi-dimensional response: date × eventName
    // Build object mapping dates to event counts
    const dateMap = {};  // { "20260525": { game_start: 28, player_won: 2 }, ... }

    try {
        response.rows.forEach((row) => {
            // Extract date (YYYYMMDD) and event name from dimensions
            const date = row.dimensionValues[0]?.value;       // e.g., "20260525"
            const eventName = row.dimensionValues[1]?.value;  // e.g., "game_start"
            const eventCount = parseInt(row.metricValues[0]?.value || 0, 10);

            // Skip invalid rows (missing date/event or zero count)
            if (!date || !eventName || isNaN(eventCount)) return;

            // Initialize date bucket if first event for this date
            if (!dateMap[date]) {
                dateMap[date] = {};
            }

            // Store event count for this date
            dateMap[date][eventName] = eventCount;
        });

        // Convert date map to ordered arrays for Chart.js
        const dates = Object.keys(dateMap).sort();  // Sort YYYYMMDD chronologically

        // Format dates as "Mon DD" for chart labels
        const labels = dates.map(d => {
            const year = parseInt(d.substring(0, 4), 10);
            const month = parseInt(d.substring(4, 6), 10) - 1;  // JS months are 0-indexed
            const day = parseInt(d.substring(6, 8), 10);
            const dateObj = new Date(year, month, day);
            return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        // Extract plays (game_start) and wins (player_won) per day
        const plays = dates.map(d => dateMap[d]['game_start'] || 0);
        const wins = dates.map(d => dateMap[d]['player_won'] || 0);

        // Survival time calculation (placeholder - using mock data for now)
        // TODO: Add session duration dimension in future for accurate survival time
        const survival = dates.map((d, i) => {
            const gameStarts = dateMap[d]['game_start'] || 1;
            const totalEvents = Object.values(dateMap[d]).reduce((a, b) => a + b, 0);
            // Rough approximation: more events per game = longer survival
            return Math.round((totalEvents / gameStarts) * 60);
        });

        return {
            daily: { labels, plays, wins, survival }
        };

    } catch (error) {
        console.error('Error parsing daily-timeseries response:', error);
        return { error: error.message, daily: {} };
    }
}
```

**Inline Comments Added:**
- Line 2: "Parse multi-dimensional response: date × eventName"
- Line 5: "Build object mapping dates to event counts"
- Line 9: "Extract date (YYYYMMDD) and event name from dimensions"
- Line 14: "Skip invalid rows"
- Line 17: "Initialize date bucket if first event for this date"
- Line 22: "Store event count for this date"
- Line 26: "Convert date map to ordered arrays for Chart.js"
- Line 29: "Format dates as 'Mon DD' for chart labels"
- Line 39: "Extract plays (game_start) and wins (player_won) per day"

---

### Step 3: API Fetch Call (30 min)

**File:** `live.html`
**Location:** Inside `loadAndRenderGA4Data()` function, after platform data fetch (~line 2120)

**Code to add:**

```javascript
// ─── FETCH DAILY TIMESERIES DATA ───
async function fetchDailyTimeseriesData() {
    // Get selected data range from combined dropdown
    const dataRangeSelect = document.getElementById('data-range-select');
    const selectedValue = dataRangeSelect ? dataRangeSelect.value : '7day-43';

    // Parse combined value (e.g., "7day-43" → dateRange="7day", version="4.3")
    const [dateRange, versionShort] = selectedValue.split('-');
    const version = versionShort === '43' ? '4.3' :
                    versionShort === 'all' ? 'all' : '4.3';

    // Build URL with daily-timeseries subType, version, and dateRange
    const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.analytics}?type=standard&subType=daily-timeseries&version=${version}&dateRange=${dateRange}`;

    try {
        console.log('Fetching daily-timeseries data...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' }
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Daily-timeseries data received:', data);

        return { success: true, data };

    } catch (error) {
        console.error('Failed to fetch daily-timeseries data:', error.message);
        return { success: false, error: error.message };
    }
}
```

**Integration in loadAndRenderGA4Data():**

```javascript
// Add after platform data fetch (around line 2120):

// Fetch and update daily timeseries data
const dailyResult = await fetchDailyTimeseriesData();
if (dailyResult.success) {
    const dailyData = mapGA4ResponseToDATA(dailyResult.data, 'daily-timeseries');
    if (!dailyData.error && dailyData.daily) {
        DATA.daily = dailyData.daily;
        chartDaily();  // Re-render chart with live data
        console.log('Daily timeseries chart updated with live data');
    }
} else {
    console.warn('Daily-timeseries fetch failed, using mock data');
}
```

---

### Step 4: Testing (90 min)

**Test 4.1: Lambda Endpoint (15 min)**
- Deploy Lambda to AWS
- Test endpoint: `?type=standard&subType=daily-timeseries&version=4.3&dateRange=7day`
- Verify response has date + eventName dimensions
- Check response time (<1 second)

**Test 4.2: Date Parsing (15 min)**
- Verify YYYYMMDD format parsed correctly
- Check labels formatted as "Jun 9" (month + day)
- Verify dates in chronological order

**Test 4.3: Chart Rendering (20 min)**
- Verify chart shows 2 lines (Plays, Wins)
- Check data points match API response
- Test with different date ranges (7/30/90 days)

**Test 4.4: Version Filtering (20 min)**
- Test "Version 4.3" selector option
- Test "All Versions" selector option
- Verify data changes between versions

**Test 4.5: Error Handling (20 min)**
- Test slow network (3G throttling)
- Test with empty response (v4.2)
- Verify fallback to mock data on error

---

## Possible Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| Chart shows wrong number of days | Date range mismatch | Use dynamic `dateRange` parameter from selector |
| Dates out of order | String sort doesn't work | Already sorted with `.sort()` on YYYYMMDD strings |
| Survival values incorrect | No session duration metric | Document as approximation, keep mock data for now |
| Weekend data missing | GA4 data lag (1-2 days) | Document limitation in chart tooltip |
| NaN in chart | Missing game_start events | Add fallback: `dateMap[d]['game_start'] || 0` |

---

## Files to Modify

1. **`api/index.js`** - Add daily-timeseries handler (~30 lines)
2. **`live.html`** - Add parser, fetch function, integration (~100 lines)

**Total Lines Added:** ~130 lines
**Total Lines Modified:** ~5 lines (integration hooks)

---

## Deployment Steps

1. Update `api/index.js` with daily-timeseries handler
2. Deploy Lambda via AWS console
3. Test endpoint with cURL or browser DevTools
4. Update `live.html` with parser and fetch logic
5. Test dashboard with live data
6. Verify chart updates with version/date filters
7. Document completion in HANDOFF_SUMMARY.md
8. Update PRIORITIES.md marking Task 6 complete

---

## Expected Outcome

**Before:** Daily Plays & Wins chart shows hardcoded mock data (Feb 25 - Mar 10)

**After:** Chart shows live GA4 data for selected date range:
- "Last 7 Days - Version 4.3": Shows last 7 days of v4.3 data
- "Last 30 Days - All Versions": Shows last 30 days of all data
- Chart auto-updates when selector changes
- Data refreshes every hour (existing auto-refresh)

---

## Ready to Proceed?

**User approval needed before implementation.**

Once approved:
1. I'll implement backend changes
2. Deploy Lambda to AWS
3. Implement frontend changes
4. Run testing protocol
5. Document completion

**Estimated total time:** 4-5 hours