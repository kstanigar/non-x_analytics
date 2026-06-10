# Phase 6B Task 2: Powerup Analysis Endpoint - Implementation Plan

**Created:** June 9, 2026
**Estimate:** 4-6 hours
**Impact:** MEDIUM - Makes powerup metrics live
**Complexity:** MEDIUM

---

## 📋 TASK OVERVIEW

**Goal:** Add powerup_type dimension query to Lambda, parse response in frontend, make Powerup Collection chart 100% live

**Current State:**
- Powerup chart shows mock data only (lines 2296-2301)
- No API calls for powerup data
- Chart displays 3 phases × 4 powerup types (12 data points)

**End State:**
- Powerup chart shows live GA4 data
- Backend supports `?type=standard&subType=powerup-analysis`
- Dashboard progress: ~55% live (up from 47%)

---

## 🎯 OBJECTIVES

**Makes Live:**
1. Powerup Collection by Phase chart (lines 3452-3467)
2. Powerup effectiveness metrics (future enhancement)
3. Powerup usage by platform (future enhancement)

**Custom Dimension Required:**
- `customEvent:powerup_type` (values: 'health', 'double_laser', 'shield', 'quad_shot')

**Query Structure:**
```
powerup_type × phase × eventName × deviceCategory
```

**Expected Response:** ~100-200 rows for 90-day query
- 4 powerup types × 3 phases × 2 device categories × 1-2 event names

---

## 📝 IMPLEMENTATION STEPS

### **Step 1: Backend - Add Powerup-Analysis Handler to Lambda (30 min)**

**File:** `api/index.js`
**Location:** After survival-time handler (after line 124)

**Code to Add (+25 lines):**

```javascript
} else if (requestType === 'standard' && subType === 'powerup-analysis') {
    // ─── POWERUP ANALYSIS REQUEST (Powerup collection by phase and platform) ───
    const powerupAnalysisRequest = {
        property: `properties/${propertyId}`,
        dateRanges: [dateRange], // Dynamic date range from query parameter
        // Multi-dimensional query: powerup_type × phase × eventName × deviceCategory
        // Returns powerup collection counts split by phase (Green/Red/Purple) and platform (desktop/mobile)
        dimensions: [
            { name: 'customEvent:powerup_type' },  // Dimension 0: 'health', 'double_laser', 'shield', 'quad_shot'
            { name: 'customEvent:phase' },         // Dimension 1: 'green', 'red', 'purple'
            { name: 'eventName' },                 // Dimension 2: 'powerup_collected'
            { name: 'deviceCategory' }             // Dimension 3: 'desktop', 'mobile', 'tablet'
        ],
        metrics: [{ name: 'eventCount' }],
    };

    // Apply version filter if specified
    if (dimensionFilter) {
        powerupAnalysisRequest.dimensionFilter = dimensionFilter;
    }

    [response] = await analyticsDataClient.runReport(powerupAnalysisRequest);
}
```

**Inline Comments Added:**
- Line 125: Request type description
- Lines 130-133: Dimension explanations with expected values
- Line 137: Version filter application note

**Possible Errors:**
- **Error:** `customEvent:powerup_type` dimension not found in GA4
  - **Solution:** Verify dimension exists in GA4 Admin (should be registered ~Feb 24, 2026)
- **Error:** `customEvent:phase` dimension not found
  - **Solution:** Verify phase dimension registered in GA4

**Testing:**
- [ ] Lambda deployment succeeds (green banner in AWS)
- [ ] Endpoint returns data: `GET /analytics?type=standard&subType=powerup-analysis&version=4.3&dateRange=90day`
- [ ] Response has 4 dimension headers (powerup_type, phase, eventName, deviceCategory)
- [ ] Response contains `powerup_collected` events only

---

### **Step 2: Frontend - Add Powerup Parser to mapGA4ResponseToDATA() (45 min)**

**File:** `live.html`
**Location:** After survival-time parser (after line 2719)

**Code to Add (+95 lines):**

```javascript
// ─── POWERUP-ANALYSIS RESPONSE HANDLER ───
if (reportType === 'powerup-analysis') {
  // Initialize phase-based powerup data structure
  // Structure: { green: {health: 0, double_laser: 0, shield: 0, quad_shot: 0}, red: {...}, purple: {...} }
  const powerupData = {
    green: { health: 0, double_laser: 0, shield: 0, quad_shot: 0 },
    red: { health: 0, double_laser: 0, shield: 0, quad_shot: 0 },
    purple: { health: 0, double_laser: 0, shield: 0, quad_shot: 0 }
  };

  // Platform-specific powerup data (for future enhancements)
  const powerupByPlatform = {
    desktop: { health: 0, double_laser: 0, shield: 0, quad_shot: 0 },
    mobile: { health: 0, double_laser: 0, shield: 0, quad_shot: 0 }
  };

  // Parse response rows: powerup_type × phase × eventName × deviceCategory
  if (gaResponse.rows && gaResponse.rows.length > 0) {
    gaResponse.rows.forEach(row => {
      const powerupType = row.dimensionValues[0]?.value?.toLowerCase() || '';  // 'health', 'double_laser', 'shield', 'quad_shot'
      const phase = row.dimensionValues[1]?.value?.toLowerCase() || '';        // 'green', 'red', 'purple'
      const eventName = row.dimensionValues[2]?.value || '';                    // 'powerup_collected'
      const deviceCategory = row.dimensionValues[3]?.value?.toLowerCase() || ''; // 'desktop', 'mobile', 'tablet'
      const count = parseInt(row.metricValues[0]?.value || '0', 10);

      // Only process powerup_collected events
      if (eventName === 'powerup_collected') {
        // Validate phase exists in data structure
        if (powerupData[phase] && powerupData[phase].hasOwnProperty(powerupType)) {
          powerupData[phase][powerupType] += count;
        }

        // Aggregate by platform (desktop vs mobile)
        if (deviceCategory === 'desktop' || deviceCategory === 'mobile') {
          if (powerupByPlatform[deviceCategory].hasOwnProperty(powerupType)) {
            powerupByPlatform[deviceCategory][powerupType] += count;
          }
        }
      }
    });

    // Convert to array format for chart
    // Chart expects: { labels: [...], green: [...], red: [...], purple: [...] }
    const powerupLabels = ['Health', 'Double Laser', 'Shield', 'Quad Shot'];
    const powerupKeys = ['health', 'double_laser', 'shield', 'quad_shot'];

    const chartData = {
      labels: powerupLabels,
      green: powerupKeys.map(key => powerupData.green[key] || 0),
      red: powerupKeys.map(key => powerupData.red[key] || 0),
      purple: powerupKeys.map(key => powerupData.purple[key] || 0),
      // Platform breakdown (for future use)
      byPlatform: {
        desktop: powerupKeys.map(key => powerupByPlatform.desktop[key] || 0),
        mobile: powerupKeys.map(key => powerupByPlatform.mobile[key] || 0)
      }
    };

    console.log('✅ Powerup analysis data parsed:', chartData);
    return { powerupCollection: chartData };

  } else {
    console.warn('⚠️ No powerup data in GA4 response, using fallback');
    return {
      powerupCollection: {
        labels: ['Health', 'Double Laser', 'Shield', 'Quad Shot'],
        green: [0, 0, 0, 0],
        red: [0, 0, 0, 0],
        purple: [0, 0, 0, 0],
        byPlatform: {
          desktop: [0, 0, 0, 0],
          mobile: [0, 0, 0, 0]
        }
      }
    };
  }
}
```

**Inline Comments Added:**
- Lines 2720-2721: Request type description
- Line 2724: Data structure explanation
- Lines 2736-2739: Dimension parsing with expected values
- Line 2743: Event filtering note
- Line 2758: Chart format conversion note

**Possible Errors:**
- **Error:** Powerup types don't match expected values (health, double_laser, etc.)
  - **Solution:** Add normalization (replace spaces with underscores, lowercase)
- **Error:** Phase values don't match (Green vs green, RED vs red)
  - **Solution:** Apply `.toLowerCase()` to phase dimension (already included)
- **Error:** Empty response (no powerup_collected events)
  - **Solution:** Return fallback data structure with zeros (already included)

**Testing:**
- [ ] Parser correctly extracts powerup_type, phase, eventName, deviceCategory
- [ ] Chart data arrays match expected length (4 elements per phase)
- [ ] Console log shows parsed data structure
- [ ] Fallback triggers correctly when no data present

---

### **Step 3: Frontend - Update DATA.powerups Initialization (10 min)**

**File:** `live.html`
**Location:** Lines 2296-2301

**Before:**
```javascript
powerups: {
  labels: ['Health', 'Double Laser', 'Shield', 'Quad Shot'],
  green: [420, 310, 280, 0],    // Quad Shot not available in Green Phase
  red: [510, 390, 340, 0],    // Quad Shot not available in Red Phase
  purple: [280, 210, 430, 310],  // Quad Shot only available in Purple Phase
},
```

**After:**
```javascript
// Powerup collection by phase (Green/Red/Purple)
// Updated by fetchPowerupAnalysisData() with live GA4 data
powerups: {
  labels: ['Health', 'Double Laser', 'Shield', 'Quad Shot'],
  green: [420, 310, 280, 0],    // Mock data (replaced by live when API called)
  red: [510, 390, 340, 0],      // Mock data (replaced by live when API called)
  purple: [280, 210, 430, 310], // Mock data (replaced by live when API called)
  byPlatform: {                 // Platform breakdown (future enhancement)
    desktop: [0, 0, 0, 0],
    mobile: [0, 0, 0, 0]
  }
},
```

**Inline Comments Added:**
- Line 2296: Description of data purpose
- Line 2297: Live data update source
- Lines 2299-2301: Mock data annotations
- Line 2302: Platform breakdown note

**Changes Summary:**
- Add inline comment explaining data source
- Add `byPlatform` object for future platform-specific analysis
- Maintain backward compatibility (mock data as fallback)

---

### **Step 4: Frontend - Add fetchPowerupAnalysisData() Function (30 min)**

**File:** `live.html`
**Location:** After fetchSurvivalTimeData() (after line 3061)

**Code to Add (+50 lines):**

```javascript
// ─── FETCH POWERUP ANALYSIS DATA (Powerup collection by phase and platform) ───
async function fetchPowerupAnalysisData() {
  try {
    // Parse combined selector value (format: "7day-4.3" or "30day-all")
    const selectorValue = document.getElementById('data-range-select')?.value || '7day-4.3';
    const [dateRange, version] = selectorValue.split('-');

    // Construct API URL with parameters
    // Example: GET /analytics?type=standard&subType=powerup-analysis&version=4.3&dateRange=7day
    const url = `${CONFIG.apiEndpoint}?type=standard&subType=powerup-analysis&version=${version}&dateRange=${dateRange}`;

    console.log('🔄 Fetching powerup analysis data:', url);

    // Fetch with 15-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const rawData = await response.json();
    console.log('✅ Powerup analysis data received:', rawData.rows?.length || 0, 'rows');

    // Parse GA4 response into powerup data structure
    const parsedData = mapGA4ResponseToDATA(rawData, 'powerup-analysis');

    // Update global DATA object with live powerup data
    if (parsedData?.powerupCollection) {
      DATA.powerups = parsedData.powerupCollection;
      console.log('✅ Powerup collection updated:', DATA.powerups);
    } else {
      console.warn('⚠️ No powerup data parsed, keeping existing data');
    }

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('⚠️ Powerup analysis fetch timeout (15s exceeded)');
    } else {
      console.error('❌ Error fetching powerup analysis data:', error.message);
    }
    // Keep existing mock data on error (graceful degradation)
  }
}
```

**Inline Comments Added:**
- Line 3062: Function purpose description
- Lines 3064-3065: Selector parsing explanation
- Line 3069: API URL construction example
- Line 3073: Timeout duration note
- Line 3088: Parsing step explanation
- Line 3091: Global DATA update note
- Line 3103: Error handling strategy

**Possible Errors:**
- **Error:** Network timeout (15 seconds exceeded)
  - **Solution:** Log error, keep existing mock data (graceful degradation)
- **Error:** API returns 500 Internal Server Error
  - **Solution:** Catch error, log message, keep existing data
- **Error:** Parser returns undefined/null
  - **Solution:** Check `parsedData?.powerupCollection` before updating (already included)

**Testing:**
- [ ] Function successfully parses selector value (7day-4.3, 30day-all, etc.)
- [ ] API URL constructed correctly with all parameters
- [ ] Timeout triggers after 15 seconds if API slow
- [ ] Error handling keeps existing data on failure
- [ ] Console logs show fetch → parse → update flow

---

### **Step 5: Frontend - Integrate Powerup Fetch into loadAndRenderGA4Data() (20 min)**

**File:** `live.html`
**Location:** After fetchSurvivalTimeData() call (after line 3229)

**Code to Add (+30 lines):**

```javascript
// ─── FETCH POWERUP ANALYSIS DATA ───
// Fetches powerup collection data (powerup_type × phase × deviceCategory)
// Updates: DATA.powerups (chart data by phase)
await fetchPowerupAnalysisData();

// Re-render powerup chart with live data
if (typeof chartPowerup === 'function') {
  chartPowerup();
  console.log('✅ Powerup chart re-rendered with live data');
}
```

**Inline Comments Added:**
- Line 3230: Section header
- Line 3231: Query structure reminder
- Line 3232: Data update target
- Line 3236: Re-render confirmation

**Integration Flow:**
```
loadAndRenderGA4Data() execution order:
1. fetchGA4Data() - Core metrics ✅
2. fetchPlatformSplitData() - Platform KPIs ✅
3. fetchDailyTimeseriesData() - Daily trend ✅
4. fetchBossAnalysisData() - Boss metrics ✅
5. fetchSurvivalTimeData() - Survival distribution ✅
6. fetchPowerupAnalysisData() - Powerup collection ⚡ NEW
7. Re-render all charts
```

**Possible Errors:**
- **Error:** chartPowerup() function not defined
  - **Solution:** Check `typeof chartPowerup === 'function'` before calling (already included)
- **Error:** Chart doesn't update with new data
  - **Solution:** Verify Chart.js destroy() → recreate in chartPowerup() (line 3454)

**Testing:**
- [ ] Powerup fetch executes after survival time fetch
- [ ] Chart re-renders after data update
- [ ] Console shows "Powerup chart re-rendered with live data"
- [ ] Multiple selector changes trigger correct updates

---

### **Step 6: Frontend - Update chartPowerup() to Use Live Data (15 min)**

**File:** `live.html`
**Location:** Lines 3452-3467

**Before:**
```javascript
function chartPowerup() {
  const d = DATA.powerups;
  const _ex_chart_powerup = Chart.getChart('chart-powerup'); if (_ex_chart_powerup) _ex_chart_powerup.destroy();
  new Chart(document.getElementById('chart-powerup'), {
    type: 'bar',
    data: {
      labels: d.labels,
      datasets: [
        { label: 'Green Phase', data: d.green, backgroundColor: GRN + '55', borderColor: GRN, borderWidth: 1 },
        { label: 'Red Phase', data: d.red, backgroundColor: RED + '55', borderColor: RED, borderWidth: 1 },
        { label: 'Purple Phase', data: d.purple, backgroundColor: PUR + '55', borderColor: PUR, borderWidth: 1 },
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, scales: gridOpts(), plugins: { legend: { labels: { font: { size: getLegendFontSize() }, color: 'rgba(200,232,255,0.5)', boxWidth: 12 } } } }
  });
}
```

**After:**
```javascript
function chartPowerup() {
  const d = DATA.powerups;
  const _ex_chart_powerup = Chart.getChart('chart-powerup'); if (_ex_chart_powerup) _ex_chart_powerup.destroy();
  new Chart(document.getElementById('chart-powerup'), {
    type: 'bar',
    data: {
      labels: d?.labels || ['Health', 'Double Laser', 'Shield', 'Quad Shot'],  // Fallback to default labels
      datasets: [
        { label: 'Green Phase', data: d?.green || [0, 0, 0, 0], backgroundColor: GRN + '55', borderColor: GRN, borderWidth: 1 },
        { label: 'Red Phase', data: d?.red || [0, 0, 0, 0], backgroundColor: RED + '55', borderColor: RED, borderWidth: 1 },
        { label: 'Purple Phase', data: d?.purple || [0, 0, 0, 0], backgroundColor: PUR + '55', borderColor: PUR, borderWidth: 1 },
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, scales: gridOpts(), plugins: { legend: { labels: { font: { size: getLegendFontSize() }, color: 'rgba(200,232,255,0.5)', boxWidth: 12 } } } }
  });
}
```

**Changes Summary:**
- Line 3458: Add nullish coalescing (`d?.labels || [...]`) for fallback labels
- Lines 3460-3462: Add nullish coalescing (`d?.green || [0,0,0,0]`) for each phase
- **Purpose:** Graceful degradation if DATA.powerups is undefined/null

**Inline Comments:** None needed (changes are self-explanatory)

**Possible Errors:**
- **Error:** Chart shows [0,0,0,0] for all phases
  - **Solution:** Check console logs to verify DATA.powerups is being updated
- **Error:** Chart doesn't re-render after data update
  - **Solution:** Verify Chart.js destroy() is working (line 3454)

**Testing:**
- [ ] Chart displays live data after API call
- [ ] Fallback to zeros if data undefined
- [ ] Chart legend shows correct phase colors (Green/Red/Purple)
- [ ] Chart responsive on mobile viewports

---

## 🧪 TESTING PROTOCOL

### **Test 1: Lambda Endpoint Testing (15 min)**

**Test 1.1: Basic Endpoint Response**
```bash
# Test endpoint with version 4.3 and 90-day range
curl "https://6waopo3jh1.execute-api.us-east-2.amazonaws.com/prod/analytics?type=standard&subType=powerup-analysis&version=4.3&dateRange=90day"
```

**Expected Result:**
- Status: 200 OK
- Response contains `dimensionHeaders` array (4 dimensions)
- Response contains `rows` array (100-200 rows expected)
- Dimensions: powerup_type, phase, eventName, deviceCategory

**Test 1.2: Version Filtering**
```bash
# Test with "all" versions
curl "https://6waopo3jh1.execute-api.us-east-2.amazonaws.com/prod/analytics?type=standard&subType=powerup-analysis&version=all&dateRange=7day"
```

**Expected Result:**
- More rows than version=4.3 (includes all versions)
- Same structure as Test 1.1

**Test 1.3: Date Range Variations**
```bash
# Test different date ranges
curl "...&dateRange=7day"   # Last 7 days
curl "...&dateRange=30day"  # Last 30 days
curl "...&dateRange=alltime" # Since March 1, 2026
```

**Expected Result:**
- Row count increases: 7day < 30day < 90day < alltime
- Data structure remains consistent

---

### **Test 2: Frontend Parsing (10 min)**

**Test 2.1: Console Log Verification**
1. Open live.html in browser
2. Open DevTools Console
3. Change date range selector
4. Look for console logs:
   - "🔄 Fetching powerup analysis data: [url]"
   - "✅ Powerup analysis data received: X rows"
   - "✅ Powerup analysis data parsed: [object]"
   - "✅ Powerup collection updated: [object]"

**Expected Result:**
- All 4 console logs appear in order
- Parsed object shows `labels`, `green`, `red`, `purple` arrays
- No errors or warnings

**Test 2.2: DATA.powerups Inspection**
1. In DevTools Console, type: `DATA.powerups`
2. Inspect object structure

**Expected Result:**
```javascript
{
  labels: ['Health', 'Double Laser', 'Shield', 'Quad Shot'],
  green: [50, 30, 20, 0],    // Actual counts from GA4
  red: [60, 40, 35, 0],      // Actual counts from GA4
  purple: [40, 30, 55, 45],  // Actual counts from GA4 (Quad Shot available)
  byPlatform: {
    desktop: [85, 60, 55, 25],
    mobile: [65, 40, 55, 20]
  }
}
```

---

### **Test 3: Chart Rendering (15 min)**

**Test 3.1: Visual Inspection**
1. Navigate to Powerup tab
2. Verify chart displays 3 phase bars per powerup type
3. Check phase colors: Green (#00ff00), Red (#ff0000), Purple (#800080)

**Expected Result:**
- Chart shows 4 powerup types (Health, Double Laser, Shield, Quad Shot)
- 3 bars per type (Green, Red, Purple phases)
- Quad Shot shows 0 for Green/Red phases (only available in Purple)
- Bars scale proportionally to data values

**Test 3.2: Data Accuracy Validation**
1. Hover over bars to see tooltip values
2. Compare tooltip counts to console log values
3. Verify Quad Shot only appears in Purple phase

**Expected Result:**
- Tooltip values match `DATA.powerups` arrays
- Green phase Quad Shot = 0
- Red phase Quad Shot = 0
- Purple phase Quad Shot > 0

**Test 3.3: Responsive Design**
1. Resize browser window to mobile width (<480px)
2. Verify chart scales correctly
3. Check legend readability

**Expected Result:**
- Chart maintains aspect ratio
- Legend font size adjusts (getLegendFontSize() = 8px on mobile)
- No horizontal overflow

---

### **Test 4: Selector Integration (10 min)**

**Test 4.1: Date Range Changes**
1. Change selector: "Last 7 Days - Version 4.3" → "Last 30 Days - Version 4.3"
2. Wait for loading
3. Verify chart updates with new data

**Expected Result:**
- Console shows new fetch request
- DATA.powerups updates with new values
- Chart re-renders automatically
- Counts increase (30 days > 7 days)

**Test 4.2: Version Filter Changes**
1. Change selector: "Last 90 Days - Version 4.3" → "Last 90 Days - All Versions"
2. Wait for loading
3. Verify data updates

**Expected Result:**
- Console shows new fetch with `version=all`
- Counts increase (all versions > 4.3 only)
- Chart updates automatically

---

### **Test 5: Error Handling (10 min)**

**Test 5.1: Network Error Simulation**
1. Open DevTools → Network tab
2. Enable "Offline" mode
3. Change date range selector
4. Wait 15 seconds

**Expected Result:**
- Console shows: "⚠️ Powerup analysis fetch timeout (15s exceeded)"
- Chart keeps existing data (no blank chart)
- No JavaScript errors

**Test 5.2: Invalid Response Handling**
1. (Requires backend modification to test - skip if difficult)
2. Modify Lambda to return empty response
3. Verify fallback data structure used

**Expected Result:**
- Console shows: "⚠️ No powerup data in GA4 response, using fallback"
- Chart shows zeros: `[0, 0, 0, 0]` for all phases

---

## 🚀 AWS DEPLOYMENT INSTRUCTIONS

### **Step 1: Update Lambda Function Code**

1. **Navigate to AWS Lambda Console:**
   - Region: us-east-2 (Ohio)
   - Function: `non-x-analytics-api`

2. **Update Code:**
   - Click "Code" tab
   - Paste updated `api/index.js` code
   - Click "Deploy" button

3. **Wait for Deployment:**
   - Green banner appears: "Successfully updated the function non-x-analytics-api"

### **Step 2: Test Lambda Function**

1. **Create Test Event:**
   - Click "Test" tab
   - Event name: `powerup-analysis-test`
   - Event JSON:
   ```json
   {
     "queryStringParameters": {
       "type": "standard",
       "subType": "powerup-analysis",
       "version": "4.3",
       "dateRange": "90day"
     }
   }
   ```

2. **Run Test:**
   - Click "Test" button
   - Verify response:
     - Status: 200
     - Body contains GA4 data with 4 dimensions
     - No errors in execution logs

### **Step 3: Verify API Gateway**

1. **Navigate to API Gateway Console:**
   - Find API: (your API name)
   - Resource: `/analytics`

2. **Test Endpoint:**
   - Click "Resources" → "/analytics" → "GET"
   - Click "Test" (lightning bolt icon)
   - Query strings: `type=standard&subType=powerup-analysis&version=4.3&dateRange=90day`
   - Click "Test" button

3. **Verify Response:**
   - Status: 200
   - Response body contains powerup data
   - Headers include CORS headers

### **Step 4: Production Deployment**

1. **Deploy API:**
   - Click "Actions" → "Deploy API"
   - Stage: `prod`
   - Click "Deploy"

2. **Test Production Endpoint:**
   ```bash
   curl "https://6waopo3jh1.execute-api.us-east-2.amazonaws.com/prod/analytics?type=standard&subType=powerup-analysis&version=4.3&dateRange=90day"
   ```

3. **Verify Response:**
   - Status: 200 OK
   - Response contains GA4 powerup data

---

## 📊 EXPECTED RESULTS

### **API Response Example:**

```json
{
  "dimensionHeaders": [
    { "name": "customEvent:powerup_type" },
    { "name": "customEvent:phase" },
    { "name": "eventName" },
    { "name": "deviceCategory" }
  ],
  "rows": [
    {
      "dimensionValues": [
        { "value": "health" },
        { "value": "green" },
        { "value": "powerup_collected" },
        { "value": "desktop" }
      ],
      "metricValues": [{ "value": "25" }]
    },
    {
      "dimensionValues": [
        { "value": "double_laser" },
        { "value": "red" },
        { "value": "powerup_collected" },
        { "value": "mobile" }
      ],
      "metricValues": [{ "value": "18" }]
    },
    {
      "dimensionValues": [
        { "value": "quad_shot" },
        { "value": "purple" },
        { "value": "powerup_collected" },
        { "value": "desktop" }
      ],
      "metricValues": [{ "value": "12" }]
    }
    // ... 100-200 total rows
  ]
}
```

### **Parsed DATA.powerups Example:**

```javascript
DATA.powerups = {
  labels: ['Health', 'Double Laser', 'Shield', 'Quad Shot'],
  green: [50, 30, 20, 0],      // Quad Shot = 0 (not available)
  red: [60, 40, 35, 0],        // Quad Shot = 0 (not available)
  purple: [40, 30, 55, 45],    // Quad Shot = 45 (available in Purple only)
  byPlatform: {
    desktop: [85, 60, 55, 25],  // Desktop players collect more powerups
    mobile: [65, 40, 55, 20]    // Mobile players collect fewer powerups
  }
}
```

### **Dashboard Progress After Implementation:**

**Before (Phase 6B Task 1 Complete):**
- 21-23 of 44 metrics live (~47%)

**After (Phase 6B Task 2 Complete):**
- +4 powerup metrics (3 phase arrays + 1 chart)
- **25-27 of 44 metrics live (~55%)**

**Remaining Mock Data:**
- Progression metrics (wave drop-off, phase funnel, level completion)
- AI Agent metrics (tier distribution, tier flow, adjustment triggers)
- Some secondary metrics (device breakdown, A/B test comparisons)

---

## ⚠️ POSSIBLE ERRORS & SOLUTIONS

### **Error 1: Custom Dimension Not Found**
**Symptom:** Lambda returns 400 Bad Request - "Unknown dimension: customEvent:powerup_type"

**Cause:** Dimension not registered in GA4 property

**Solution:**
1. Check GA4 Admin → Events → Manage custom definitions
2. Verify `powerup_type` exists as custom dimension
3. If missing, register dimension (scope: Event, parameter: powerup_type)
4. Wait 24 hours for dimension to propagate

### **Error 2: No powerup_collected Events**
**Symptom:** API returns empty rows array `[]`

**Cause:** No powerup collection events in selected date range

**Solution:**
1. Verify events firing in GA4 DebugView
2. Try longer date range (90day or alltime)
3. Check game is sending `powerup_collected` event correctly
4. Fallback: Keep mock data (graceful degradation already implemented)

### **Error 3: Phase Values Mismatch**
**Symptom:** Chart shows zeros for all phases despite API returning data

**Cause:** Phase dimension values don't match expected ('Green' vs 'green')

**Solution:**
1. Check console log for parsed data structure
2. Verify `.toLowerCase()` applied to phase dimension (line 2738)
3. Add normalization if needed: `phase.toLowerCase().trim()`

### **Error 4: Quad Shot Appears in Green/Red Phases**
**Symptom:** Chart shows Quad Shot counts in Green/Red phases (should be 0)

**Cause:** Game code bug - Quad Shot spawning in wrong phases

**Solution:**
1. Verify game design: Quad Shot only in Purple phase
2. Check GA4 DebugView for incorrect phase tagging
3. Update game code to prevent Quad Shot in Green/Red phases
4. NOT a dashboard bug - this is game data issue

### **Error 5: Chart Doesn't Update**
**Symptom:** Chart still shows mock data after API call

**Cause:** `chartPowerup()` not called after data update

**Solution:**
1. Check console logs for "Powerup chart re-rendered with live data"
2. Verify `chartPowerup()` exists in loadAndRenderGA4Data() (line 3236)
3. Add manual call in DevTools: `chartPowerup()` to test rendering

### **Error 6: Platform Breakdown All Zeros**
**Symptom:** `DATA.powerups.byPlatform` shows `[0,0,0,0]` for both platforms

**Cause:** deviceCategory dimension values unexpected (e.g., 'tablet' instead of 'desktop'/'mobile')

**Solution:**
1. Check console log for deviceCategory values
2. Verify parser filters for 'desktop' and 'mobile' only (line 2751)
3. Add 'tablet' to parsing logic if needed
4. Note: byPlatform is for future enhancement, doesn't affect main chart

---

## ✅ COMPLETION CHECKLIST

**Backend (api/index.js):**
- [ ] Powerup-analysis handler added (lines 125-149, +25 lines)
- [ ] Multi-dimensional query configured (powerup_type × phase × eventName × deviceCategory)
- [ ] Version filtering applied to request
- [ ] Inline comments added for all dimensions
- [ ] Lambda deployed to AWS successfully
- [ ] Green deployment banner confirmed

**Frontend (live.html):**
- [ ] Powerup parser added to mapGA4ResponseToDATA() (after line 2719, +95 lines)
- [ ] DATA.powerups initialization updated with comments (lines 2296-2305)
- [ ] fetchPowerupAnalysisData() function created (after line 3061, +50 lines)
- [ ] Powerup fetch integrated into loadAndRenderGA4Data() (after line 3229, +30 lines)
- [ ] chartPowerup() updated with nullish coalescing (lines 3452-3467)
- [ ] All inline comments added

**Testing:**
- [ ] Test 1: Lambda endpoint returns powerup data
- [ ] Test 2: Frontend parses response correctly
- [ ] Test 3: Chart renders with live data
- [ ] Test 4: Selector changes trigger updates
- [ ] Test 5: Error handling works (timeout, empty response)

**Documentation:**
- [ ] HANDOFF_SUMMARY.md updated with Phase 6B Task 2 completion
- [ ] PRIORITIES.md updated (Task 2 marked complete ✅)
- [ ] Dashboard progress updated (~55% live)
- [ ] Key findings documented (powerup usage patterns, phase distribution)

**Git Commit:**
- [ ] Files staged: `api/index.js`, `live.html`
- [ ] Documentation staged: `HANDOFF_SUMMARY.md`, `PRIORITIES.md`
- [ ] Commit message prepared (conventional format)
- [ ] User approval obtained before commit

---

## 🎯 SUCCESS CRITERIA

1. **Powerup chart shows 100% live GA4 data** ✅
2. **API endpoint returns powerup_type × phase × deviceCategory data** ✅
3. **Quad Shot only appears in Purple phase** ✅ (as per game design)
4. **Chart updates when selector changes** ✅
5. **Error handling prevents blank charts** ✅
6. **Dashboard progress increases to ~55% live** ✅
7. **All tests pass (endpoint, parsing, rendering, integration)** ✅

---

## 📝 NOTES FOR IMPLEMENTATION

**Best Practices:**
- Copy-paste code blocks exactly as written (tested line numbers)
- Test Lambda deployment before updating frontend
- Verify console logs at each step (fetch → parse → update → render)
- Use DevTools to inspect DATA.powerups after updates
- Take screenshot of live chart for documentation

**Time Breakdown:**
- Backend Lambda: 30 min
- Frontend Parser: 45 min
- DATA Update: 10 min
- Fetch Function: 30 min
- Integration: 20 min
- Chart Update: 15 min
- Testing: 60 min
- AWS Deployment: 20 min
- Documentation: 30 min
- **Total: 4 hours** (mid-range of 4-6 hour estimate)

**Dependencies:**
- `customEvent:powerup_type` dimension exists in GA4 (registered ~Feb 24, 2026)
- `customEvent:phase` dimension exists in GA4 (registered ~Feb 24, 2026)
- Game sends `powerup_collected` events with both dimensions

**Future Enhancements (Post-Task 2):**
- Add platform comparison chart (desktop vs mobile powerup usage)
- Add powerup effectiveness metrics (win rate by powerup type)
- Add powerup collection rate over time (daily timeseries)

---

**Plan Version:** 1.0
**Created:** June 9, 2026
**User Approval Required Before Implementation**