# Phase 6B Task 1: Survival Time Endpoint - Implementation Plan

**Created:** June 9, 2026
**Estimate:** 2-3 hours
**Status:** Planning Complete, Ready for Implementation

---

## 📋 OVERVIEW

**Goal:** Add `session_duration_seconds` dimension query to make Survival Time Distribution chart 100% live

**Current State:**
- Survival Time Distribution chart uses hardcoded mock data (lines 3769-3786)
- Platform table shows mock survival times (lines 2345-2346)
- No GA4 dimension query for session duration exists

**End State:**
- Chart shows live survival time distribution by platform (desktop vs mobile)
- Platform table shows live average survival times
- New API endpoint: `?type=standard&subType=survival-time&version=4.3&dateRange=7day`

---

## ✅ PREREQUISITES

### Custom Dimension Verification

**Dimension Name:** Session Duration (Seconds)
**Parameter Name:** `session_duration_seconds`
**Scope:** Event
**Registered:** Feb 24, 2026 (GA4 Admin)
**Status:** ✅ Available for use

**Verification Steps:**
1. GA4 Admin → Custom definitions → Custom dimensions
2. Search for "session_duration_seconds"
3. Confirm parameter exists and has data

---

## 🔧 IMPLEMENTATION

### Part 1: Backend (Lambda) - api/index.js

**File:** `api/index.js`
**Lines to Add:** After line 103 (after boss-analysis handler)
**Code to Add:** ~22 lines

#### Step 1.1: Add Survival-Time Request Handler

**Location:** After line 103 (after boss-analysis `else if` block)

**Code:**
```javascript
} else if (requestType === 'standard' && subType === 'survival-time') {
    // ─── SURVIVAL TIME REQUEST (Session duration distribution by platform) ───
    const survivalTimeRequest = {
        property: `properties/${propertyId}`,
        dateRanges: [dateRange], // Dynamic date range from query parameter
        // Multi-dimensional query: deviceCategory × session_duration_seconds × eventName
        // Returns session duration distribution split by desktop vs mobile
        dimensions: [
            { name: 'deviceCategory' },                    // Dimension 0: 'desktop', 'mobile', 'tablet'
            { name: 'customEvent:session_duration_seconds' }, // Dimension 1: duration in seconds (e.g., "45", "120", "180")
            { name: 'eventName' }                          // Dimension 2: 'player_won', 'player_death', etc.
        ],
        metrics: [{ name: 'eventCount' }],
    };

    // Apply version filter if specified
    if (dimensionFilter) {
        survivalTimeRequest.dimensionFilter = dimensionFilter;
    }

    [response] = await analyticsDataClient.runReport(survivalTimeRequest);
}
```

**Inline Comments Added:**
- Line 1: Request type identifier
- Line 2: Query purpose explanation
- Line 6: Multi-dimensional query structure
- Line 7: Platform split explanation
- Lines 9-11: Dimension purpose comments
- Line 16: Version filter application

**Total Lines Added:** 22 lines (including blank lines)

---

### Part 2: Frontend (Dashboard) - live.html

#### Step 2.1: Add Survival-Time Parser to mapGA4ResponseToDATA()

**Location:** After line 2636 (after boss-analysis parser)
**Lines to Add:** ~95 lines

**Code:**
```javascript
// ─── SURVIVAL-TIME RESPONSE HANDLER ───
if (reportType === 'survival-time') {
  // Bucket structure: 0-30s, 30-60s, 60-120s, 120-180s, 180-240s, 240+s
  const buckets = [
    { label: '0-30s', min: 0, max: 30, desktop: 0, mobile: 0 },
    { label: '30-60s', min: 30, max: 60, desktop: 0, mobile: 0 },
    { label: '60-120s', min: 60, max: 120, desktop: 0, mobile: 0 },
    { label: '120-180s', min: 120, max: 180, desktop: 0, mobile: 0 },
    { label: '180-240s', min: 180, max: 240, desktop: 0, mobile: 0 },
    { label: '240+s', min: 240, max: Infinity, desktop: 0, mobile: 0 }
  ];

  // Track total duration and count for average calculation
  const platformTotals = {
    desktop: { totalDuration: 0, count: 0 },
    mobile: { totalDuration: 0, count: 0 }
  };

  try {
    response.rows.forEach((row) => {
      const deviceCategory = row.dimensionValues[0]?.value;        // Dimension 0: 'desktop' or 'mobile'
      const sessionDuration = parseInt(row.dimensionValues[1]?.value || 0, 10); // Dimension 1: duration in seconds
      const eventName = row.dimensionValues[2]?.value;             // Dimension 2: event type
      const eventCount = parseInt(row.metricValues[0]?.value || 0, 10); // Metric: count

      // Filter: only process desktop/mobile, only game outcome events (won/death)
      if (deviceCategory !== 'desktop' && deviceCategory !== 'mobile') return;
      if (eventName !== 'player_won' && eventName !== 'player_death') return;
      if (isNaN(sessionDuration) || isNaN(eventCount)) return;

      // Add to bucket distribution
      for (let bucket of buckets) {
        if (sessionDuration >= bucket.min && sessionDuration < bucket.max) {
          bucket[deviceCategory] += eventCount;
          break;
        }
      }

      // Add to totals for average calculation
      platformTotals[deviceCategory].totalDuration += sessionDuration * eventCount;
      platformTotals[deviceCategory].count += eventCount;
    });

    // Convert bucket counts to percentages
    const desktopTotal = platformTotals.desktop.count;
    const mobileTotal = platformTotals.mobile.count;

    const survivalDist = {
      labels: buckets.map(b => b.label),
      desktop: buckets.map(b => desktopTotal > 0 ? (b.desktop / desktopTotal * 100).toFixed(1) : '0.0'),
      mobile: buckets.map(b => mobileTotal > 0 ? (b.mobile / mobileTotal * 100).toFixed(1) : '0.0')
    };

    // Calculate average survival time (formatted as MM:SS)
    const desktopAvg = desktopTotal > 0
      ? platformTotals.desktop.totalDuration / desktopTotal
      : 0;
    const mobileAvg = mobileTotal > 0
      ? platformTotals.mobile.totalDuration / mobileTotal
      : 0;

    const formatMMSS = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const avgSurvival = {
      desktop: formatMMSS(desktopAvg),
      mobile: formatMMSS(mobileAvg)
    };

    return {
      survivalDist: survivalDist,
      avgSurvival: avgSurvival
    };

  } catch (error) {
    console.error('Error parsing survival-time response:', error);
    return {
      error: error.message,
      survivalDist: { labels: [], desktop: [], mobile: [] },
      avgSurvival: { desktop: '0:00', mobile: '0:00' }
    };
  }
}
```

**Inline Comments Added:**
- Line 2: Bucket structure explanation
- Lines 20-23: Dimension mapping
- Line 26: Filter criteria
- Line 31: Bucket distribution logic
- Line 40: Average calculation logic
- Line 48: Percentage conversion
- Line 55: MM:SS formatting

**Total Lines Added:** 95 lines

---

#### Step 2.2: Add fetchSurvivalTimeData() Function

**Location:** After line 2923 (after fetchBossAnalysisData())
**Lines to Add:** ~50 lines

**Code:**
```javascript
/**
 * Fetch survival time distribution data from GA4 API
 * Multi-dimensional query: deviceCategory × session_duration_seconds × eventName
 * Returns survival time buckets and average survival time by platform
 */
async function fetchSurvivalTimeData() {
  const dataRangeSelect = document.getElementById('data-range-select');
  // DEFAULT: 90day-43 (changed from 7day-43 on June 9, 2026)
  const selectedValue = dataRangeSelect ? dataRangeSelect.value : '90day-43';

  // Parse combined value (e.g., "7day-43" → dateRange="7day", version="4.3")
  const [dateRange, versionShort] = selectedValue.split('-');
  const version = versionShort === '43' ? '4.3' : versionShort === 'all' ? 'all' : '4.3';

  const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.analytics}?type=standard&subType=survival-time&version=${version}&dateRange=${dateRange}`;

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
      console.error(`Survival-time request timeout after ${API_CONFIG.timeout}ms`);
      return { success: false, error: 'Request timeout', data: null };
    }
    console.error(`Failed to fetch survival-time data:`, error);
    return { success: false, error: error.message, data: null };
  }
}
```

**Inline Comments Added:**
- Lines 1-4: Function documentation
- Line 8: Default value (90 days)
- Line 11: Value parsing
- Line 15: URL construction
- Line 19: Timeout protection
- Line 35: Error handling

**Total Lines Added:** 50 lines

---

#### Step 2.3: Integrate into loadAndRenderGA4Data()

**Location:** After line 3064 (after boss analysis integration)
**Lines to Add:** ~21 lines

**Code:**
```javascript
// Fetch survival time distribution (session duration by platform)
console.log('Fetching survival-time data...');
const survivalResult = await fetchSurvivalTimeData();

if (survivalResult.success && survivalResult.data) {
  const survivalData = mapGA4ResponseToDATA(survivalResult.data, 'survival-time');

  if (!survivalData.error && survivalData.survivalDist) {
    // Update survival distribution chart data
    DATA.survivalDist = survivalData.survivalDist;
    console.log('Survival distribution updated:', DATA.survivalDist);

    // Update average survival time for platform comparison
    if (survivalData.avgSurvival) {
      DATA.platform.desktop.survival = survivalData.avgSurvival.desktop;
      DATA.platform.mobile.survival = survivalData.avgSurvival.mobile;
      console.log('Avg survival times updated:', survivalData.avgSurvival);
    }
  } else {
    console.warn('Survival-time parsing failed, using mock data');
  }
} else {
  console.warn('Survival-time fetch failed, using mock data:', survivalResult.error);
}
```

**Inline Comments Added:**
- Line 1: Fetch purpose
- Line 9: Chart data update
- Line 13: Platform table update
- Lines 19, 22: Error handling

**Total Lines Added:** 21 lines

---

#### Step 2.4: Update chartSurvivalDist() to Use Live Data

**Location:** Lines 3769-3786 (existing function)
**Change Type:** Edit existing code

**Current Code (Lines 3778-3781):**
```javascript
datasets: [
  { label: 'Desktop', data: [8, 15, 28, 24, 16, 9], ... },
  { label: 'Mobile', data: [14, 22, 31, 19, 10, 4], ... },
]
```

**Updated Code:**
```javascript
datasets: [
  {
    label: 'Desktop',
    data: DATA.survivalDist?.desktop || [8, 15, 28, 24, 16, 9], // Live data with fallback
    backgroundColor: 'rgba(0, 255, 255, 0.5)',
    borderColor: 'rgba(0, 255, 255, 1)',
    borderWidth: 1
  },
  {
    label: 'Mobile',
    data: DATA.survivalDist?.mobile || [14, 22, 31, 19, 10, 4], // Live data with fallback
    backgroundColor: 'rgba(255, 0, 255, 0.5)',
    borderColor: 'rgba(255, 0, 255, 1)',
    borderWidth: 1
  },
]
```

**Inline Comments Added:**
- Line 4: Live data source
- Line 11: Live data source

**Total Lines Changed:** 2 lines (data array references)

---

#### Step 2.5: Add DATA.survivalDist Initialization

**Location:** After line 2346 (after DATA.platform definition)
**Lines to Add:** ~8 lines

**Code:**
```javascript
// Survival time distribution (buckets: 0-30s, 30-60s, 60-120s, 120-180s, 180-240s, 240+s)
// Updated by fetchSurvivalTimeData() with live GA4 data
survivalDist: {
  labels: ['0-30s', '30-60s', '60-120s', '120-180s', '180-240s', '240+s'],
  desktop: [8, 15, 28, 24, 16, 9],  // Percentages (mock data, replaced by live)
  mobile: [14, 22, 31, 19, 10, 4]   // Percentages (mock data, replaced by live)
},
```

**Inline Comments Added:**
- Line 1: Data structure description
- Line 2: Update source
- Lines 5-6: Mock data notes

**Total Lines Added:** 8 lines

---

## 🚀 AWS DEPLOYMENT

### Step 1: Update Lambda Code

1. **Navigate to AWS Lambda Console:**
   - URL: https://us-east-2.console.aws.amazon.com/lambda/home?region=us-east-2#/functions
   - Function: `non-x-analytics-api`

2. **Open Code Editor:**
   - Click on `index.js` in the file tree (left sidebar)
   - VS Code-based editor will open

3. **Add Survival-Time Handler:**
   - Scroll to line 103 (after boss-analysis handler)
   - Paste the 22-line survival-time handler code (see Part 1 above)
   - Verify indentation matches existing code

4. **Deploy:**
   - Click blue "Deploy" button in left sidebar (keyboard shortcut: ⌘+U)
   - Wait for green banner: "Successfully updated the function 'non-x-analytics-api'"

5. **Verify Deployment:**
   - Banner should appear within 2-3 seconds
   - If no banner, check for syntax errors in console

### Step 2: Test Endpoint

**Test URL:**
```
https://6waopo3jh1.execute-api.us-east-2.amazonaws.com/prod/analytics?type=standard&subType=survival-time&version=4.3&dateRange=7day
```

**Expected Response:**
```json
{
  "dimensionHeaders": [
    {"name": "deviceCategory"},
    {"name": "customEvent:session_duration_seconds"},
    {"name": "eventName"}
  ],
  "rows": [
    {
      "dimensionValues": [
        {"value": "desktop"},
        {"value": "45"},
        {"value": "player_won"}
      ],
      "metricValues": [{"value": "2"}]
    }
    // ... more rows with different durations and platforms
  ]
}
```

**Validation:**
- Response should have 3 dimensions (deviceCategory, session_duration_seconds, eventName)
- Rows should contain desktop/mobile values
- session_duration_seconds should be numeric strings ("30", "60", "120", etc.)

---

## 🧪 TESTING PROTOCOL

### Test 1: API Endpoint Validation

**Steps:**
1. Open browser DevTools → Network tab
2. Refresh dashboard
3. Filter requests for "survival-time"
4. Verify request URL: `?type=standard&subType=survival-time&version=4.3&dateRange=90day`
5. Check response status: 200 OK
6. Verify response has 3 dimensionHeaders
7. Verify rows contain survival data

**Expected:**
- ✅ Request completes in <2 seconds
- ✅ Response contains desktop and mobile data
- ✅ session_duration_seconds values are present

---

### Test 2: Chart Display Validation

**Steps:**
1. Navigate to Platform tab
2. Scroll to "Survival Time Distribution" chart
3. Verify chart displays with 6 bars (0-30s, 30-60s, etc.)
4. Verify Desktop (cyan) and Mobile (magenta) datasets visible
5. Hover over bars to see percentages

**Expected:**
- ✅ Chart renders without errors
- ✅ Live data replaces mock data (percentages change from mock values)
- ✅ Both Desktop and Mobile datasets show different distributions

---

### Test 3: Platform Table Validation

**Steps:**
1. Navigate to Platform tab
2. Scroll to platform comparison table
3. Find "Avg Survival" row
4. Verify Desktop and Mobile values show MM:SS format (e.g., "2:38")
5. Verify "Winner" column shows correct platform

**Expected:**
- ✅ Survival times formatted correctly (MM:SS)
- ✅ Values different from mock data ("2:38" and "2:04")
- ✅ Winner determined dynamically (higher survival time wins)

---

### Test 4: Version/Date Range Selector

**Steps:**
1. Change selector from "Last 90 Days - Version 4.3" to "Last 7 Days - Version 4.3"
2. Wait for dashboard to reload
3. Verify chart updates with different data
4. Change to "Last 30 Days - All Versions"
5. Verify data changes again

**Expected:**
- ✅ Chart updates on selector change
- ✅ Console shows "Fetching survival-time data..." on each change
- ✅ Network tab shows new request with updated dateRange parameter

---

### Test 5: Error Handling

**Steps:**
1. Open DevTools → Network tab
2. Throttle network to "Slow 3G"
3. Refresh dashboard
4. Wait for survival-time request to complete or timeout

**Expected:**
- ✅ Dashboard continues functioning (doesn't crash)
- ✅ If timeout, console shows "Survival-time request timeout after 15000ms"
- ✅ Chart falls back to mock data if request fails

---

## 📊 EXPECTED RESULTS

### Before Implementation:
- Survival Time Distribution chart: Hardcoded mock data (Desktop: [8, 15, 28, 24, 16, 9], Mobile: [14, 22, 31, 19, 10, 4])
- Platform table: Mock survival times (Desktop: "2:38", Mobile: "2:04")
- No survival-time API endpoint

### After Implementation:
- Survival Time Distribution chart: Live GA4 data showing actual session duration distribution
- Platform table: Live average survival times calculated from GA4
- New API endpoint working: `?subType=survival-time`
- Console logs: "Survival distribution updated: {labels: [...], desktop: [...], mobile: [...]}"

### Dashboard Progress:
- Phase 6A: ~40% live (18-20 of 44 metrics) ✅
- **Phase 6B Task 1: +3 metrics live** (survival distribution + 2 avg survival times)
- **New Total: ~47% live (21-23 of 44 metrics)**

---

## ⚠️ POTENTIAL ISSUES & SOLUTIONS

### Issue 1: Session Duration Values Too Large

**Problem:** GA4 might return session_duration_seconds > 1000 (outliers)

**Solution:** Add max cap in parser:
```javascript
const sessionDuration = Math.min(parseInt(row.dimensionValues[1]?.value || 0, 10), 600); // Cap at 10 minutes
```

**Location:** Line ~2655 in parser

---

### Issue 2: No Data for Mobile Platform

**Problem:** Mobile platform might have 0 events in selected date range

**Solution:** Parser already handles this with fallback:
```javascript
const mobileTotal = platformTotals.mobile.count;
mobile: buckets.map(b => mobileTotal > 0 ? (b.mobile / mobileTotal * 100).toFixed(1) : '0.0')
```

**Result:** Chart shows 0% for all mobile buckets (expected behavior)

---

### Issue 3: Chart Labels Cutoff on Mobile

**Problem:** X-axis labels might overflow on <479px viewport

**Solution:** Already fixed in Phase 6A responsive design work:
- `gridOpts()` function hides x-axis labels on mobile (line 2914-2928)
- Bar colors identify buckets instead

**No Action Needed:** Responsive fix already in place

---

## 📝 DOCUMENTATION UPDATES

After implementation, update the following files:

### 1. HANDOFF_SUMMARY.md
```markdown
## June 9, 2026 (Continued) - Phase 6B Task 1: Survival Time Endpoint

**Session Duration:** ~2.5 hours
**Status:** Complete ✅

### Actions Taken:
- Backend: Added survival-time handler to api/index.js (lines 104-125)
- Frontend: Added parser (lines 2637-2731), fetch function (lines 2924-2973), integration (lines 3065-3085)
- Chart: Updated chartSurvivalDist() to use live data (lines 3778-3781)
- Testing: All 5 tests pass ✅

### Result:
- Survival Time Distribution chart: 100% live ✅
- Platform table survival times: 100% live ✅
- Dashboard progress: 47% live (21-23 of 44 metrics)
```

### 2. PRIORITIES.md
- Mark Phase 6B Task 1 complete with ✅
- Move to completed section
- Update dashboard live data percentage

### 3. BLOG_NOTES.md
- Add session entry with survival time implementation highlights
- Note multi-dimensional query pattern (3 dimensions)
- Document bucket distribution calculation algorithm

---

## ✅ COMPLETION CHECKLIST

Before marking task complete:

- [ ] Backend: Survival-time handler added to api/index.js (22 lines)
- [ ] Backend: Lambda deployed successfully (green banner)
- [ ] Backend: Endpoint tested and returning data
- [ ] Frontend: Parser added to mapGA4ResponseToDATA() (95 lines)
- [ ] Frontend: fetchSurvivalTimeData() function added (50 lines)
- [ ] Frontend: Integration added to loadAndRenderGA4Data() (21 lines)
- [ ] Frontend: chartSurvivalDist() updated with live data (2 lines)
- [ ] Frontend: DATA.survivalDist initialization added (8 lines)
- [ ] Testing: All 5 tests pass
- [ ] Testing: No console errors
- [ ] Documentation: HANDOFF_SUMMARY.md updated
- [ ] Documentation: PRIORITIES.md updated
- [ ] Git: Changes committed with message

---

## 🎯 SUCCESS CRITERIA

Task is complete when:
1. ✅ Endpoint returns survival time data (deviceCategory × session_duration_seconds × eventName)
2. ✅ Chart displays live data (different from mock percentages)
3. ✅ Platform table shows live average survival times (MM:SS format)
4. ✅ Version/date range selector updates survival data correctly
5. ✅ No console errors on page load
6. ✅ Dashboard shows "LIVE DATA Connected" status

---

**Total Code Changes:**
- `api/index.js`: +22 lines (1 handler)
- `live.html`: +196 lines (parser, fetch, integration, init, chart update)
- **Total**: +218 lines

**Time Estimate:** 2-3 hours (backend: 30 min, frontend: 90 min, testing: 30 min)

**Ready to implement?**