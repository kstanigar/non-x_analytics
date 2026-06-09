# Version + Date Range Selector - Implementation Plan

**Session:** June 9, 2026
**Phase:** Phase 6A - Task 5B (New Subtask)
**Estimated Time:** 60-90 minutes total

---

## Overview

Replace separate version selector with combined dropdown that controls both:
1. **Version filtering** (all, 4.3, 4.2)
2. **Date range filtering** (7, 30, 90 days)

**Benefits:**
- Cleaner UI (one dropdown vs two)
- Better mobile UX (less space)
- Clear data scope communication ("Last 7 Days - Version 4.3")
- Easy to phase out old versions when 4.3 has sufficient data

---

## Problem Statement

**Current State:**

**Version Filtering:** ✅ Fully implemented
- Frontend selector at `live.html:1387-1395`
- 3 options: all, 4.3, 4.2
- API parameter: `?version=4.3`
- Lambda dimension filter applies to GA4 query

**Date Range Filtering:** 🔴 Hard-coded only
- Fixed to 7 days in Lambda (`api/index.js:33, 65`)
- No frontend selector
- No API parameter support
- Users cannot change date range

**User Request:**
- Combine both filters into single dropdown
- Support 7, 28, 90 day ranges
- Long-term: Eventually filter only version 4.3 data (phase out old versions)

---

## Proposed Solution: Combined Dropdown (Option A)

**New Selector Format:**

```
Last 7 Days - Version 4.3 (Current)      [DEFAULT]
Last 30 Days - Version 4.3 (Current)
Last 90 Days - Version 4.3 (Current)
Last 7 Days - Version 4.2 (Legacy)
Last 30 Days - Version 4.2 (Legacy)
Last 7 Days - All Versions
Last 30 Days - All Versions
Last 90 Days - All Versions
```

**Value Format:** `{dateRange}-{version}` (e.g., `"7day-43"`)

**API Changes:**
- Before: `GET /analytics?version=4.3`
- After: `GET /analytics?version=4.3&dateRange=7day`

---

## Implementation Steps

### **Step 1: Frontend HTML Changes (10 min)**

**File:** `live.html`
**Location:** Lines 1388-1395 (current version selector) ✅ VERIFIED

**Before:**
```html
<!-- VERSION FILTER -->
<div class="version-filter">
  <label for="version-select">🔍 Analytics Version:</label>
  <select id="version-select" onchange="applyVersionFilter()">
    <option value="all">All Versions</option>
    <option value="4.3" selected>Version 4.3 (Current)</option>
    <option value="4.2">Version 4.2 (Legacy)</option>
  </select>
</div>
```

**After:**
```html
<!-- VERSION + DATE RANGE FILTER (Combined Selector) -->
<div class="version-filter">
  <label for="data-range-select">🔍 Data Range:</label>
  <select id="data-range-select" onchange="applyDataRangeFilter()">
    <!-- Version 4.3 (Current) - Primary Options -->
    <option value="7day-43" selected>Last 7 Days - Version 4.3 (Current)</option>
    <option value="30day-43">Last 30 Days - Version 4.3 (Current)</option>
    <option value="90day-43">Last 90 Days - Version 4.3 (Current)</option>

    <!-- Version 4.2 (Legacy) -->
    <option value="7day-42">Last 7 Days - Version 4.2 (Legacy)</option>
    <option value="30day-42">Last 30 Days - Version 4.2 (Legacy)</option>

    <!-- All Versions -->
    <option value="7day-all">Last 7 Days - All Versions</option>
    <option value="30day-all">Last 30 Days - All Versions</option>
    <option value="90day-all">Last 90 Days - All Versions</option>
  </select>
</div>
```

**Changes:**
- Renamed `id="version-select"` → `id="data-range-select"`
- Updated label text: "Analytics Version" → "Data Range"
- Changed `onchange="applyVersionFilter()"` → `onchange="applyDataRangeFilter()"`
- 8 combined options (version + date range)
- Default: `7day-43` (matches current behavior: 7 days, version 4.3)
- Grouped by version (4.3 first, then 4.2, then all)

**Note:** CSS class `.version-filter` remains unchanged - existing styles apply

---

### **Step 2: Frontend JavaScript Changes (20 min)**

#### **2A: Rename and Update `applyVersionFilter()` Function**

**File:** `live.html`
**Location:** Lines 2799-2806 ✅ VERIFIED

**Before:**
```javascript
async function applyVersionFilter() {
  const versionSelect = document.getElementById('version-select');
  const selectedVersion = versionSelect.value;
  console.log(`Version filter changed to: ${selectedVersion}`);

  // Trigger refresh with new version filter
  await loadAndRenderGA4Data('standard');
}
```

**After:**
```javascript
async function applyDataRangeFilter() {
  const dataRangeSelect = document.getElementById('data-range-select');
  const selectedValue = dataRangeSelect.value;

  // Parse combined value (e.g., "7day-43" → dateRange="7day", version="43")
  const [dateRange, versionShort] = selectedValue.split('-');
  const version = versionShort === '43' ? '4.3' :
                  versionShort === '42' ? '4.2' :
                  versionShort === 'all' ? 'all' : '4.3';

  console.log(`Data range changed to: ${dateRange} days, version ${version}`);

  // Trigger refresh with new version and date range filters
  await loadAndRenderGA4Data('standard');
}
```

**Changes:**
- Renamed function: `applyVersionFilter()` → `applyDataRangeFilter()`
- Parse combined value with `.split('-')`
- Convert short version codes: `'43'` → `'4.3'`, `'42'` → `'4.2'`, `'all'` → `'all'`
- Updated console log to show both filters

---

#### **2B: Update `fetchGA4Data()` Function**

**File:** `live.html`
**Location:** Lines 2579-2584 ✅ VERIFIED

**Before:**
```javascript
async function fetchGA4Data(type = 'standard') {
  // Get selected version from dropdown (default to 4.3 if not found)
  const versionSelect = document.getElementById('version-select');
  const version = versionSelect ? versionSelect.value : '4.3';

  // Build URL with version parameter
  const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.analytics}?version=${version}`;
  // ... rest of fetch logic
}
```

**After:**
```javascript
async function fetchGA4Data(type = 'standard') {
  // Get selected data range from combined dropdown (default to 7day-43 if not found)
  const dataRangeSelect = document.getElementById('data-range-select');
  const selectedValue = dataRangeSelect ? dataRangeSelect.value : '7day-43';

  // Parse combined value (e.g., "7day-43" → dateRange="7day", version="4.3")
  const [dateRange, versionShort] = selectedValue.split('-');
  const version = versionShort === '43' ? '4.3' :
                  versionShort === '42' ? '4.2' :
                  versionShort === 'all' ? 'all' : '4.3';

  // Build URL with version and dateRange parameters
  const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.analytics}?version=${version}&dateRange=${dateRange}`;
  // ... rest of fetch logic
}
```

**Changes:**
- Changed selector ID: `version-select` → `data-range-select`
- Changed default: `'4.3'` → `'7day-43'`
- Added parsing logic: `.split('-')` to extract dateRange and version
- Updated URL to include `&dateRange=${dateRange}` parameter

---

#### **2C: Update `fetchPlatformSplitData()` Function**

**File:** `live.html`
**Location:** Lines 2623-2629 ✅ VERIFIED

**Before:**
```javascript
async function fetchPlatformSplitData() {
  // Get selected version from dropdown (default to 4.3 if not found)
  const versionSelect = document.getElementById('version-select');
  const version = versionSelect ? versionSelect.value : '4.3';

  // Build URL with type=standard, subType=platform-split, and version parameters
  const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.analytics}?type=standard&subType=platform-split&version=${version}`;
  // ... rest of fetch logic
}
```

**After:**
```javascript
async function fetchPlatformSplitData() {
  // Get selected data range from combined dropdown (default to 7day-43 if not found)
  const dataRangeSelect = document.getElementById('data-range-select');
  const selectedValue = dataRangeSelect ? dataRangeSelect.value : '7day-43';

  // Parse combined value (e.g., "7day-43" → dateRange="7day", version="4.3")
  const [dateRange, versionShort] = selectedValue.split('-');
  const version = versionShort === '43' ? '4.3' :
                  versionShort === '42' ? '4.2' :
                  versionShort === 'all' ? 'all' : '4.3';

  // Build URL with type=standard, subType=platform-split, version, and dateRange parameters
  const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.analytics}?type=standard&subType=platform-split&version=${version}&dateRange=${dateRange}`;
  // ... rest of fetch logic
}
```

**Changes:**
- Changed selector ID: `version-select` → `data-range-select`
- Changed default: `'4.3'` → `'7day-43'`
- Added parsing logic: `.split('-')` to extract dateRange and version
- Updated URL to include `&dateRange=${dateRange}` parameter

---

### **Step 3: Backend Lambda Changes (15 min)**

**File:** `api/index.js`
**Location:** Lines 14-52 (request handler)

#### **3A: Extract dateRange Parameter**

**Location:** Lines 13-15 ✅ VERIFIED
**Insert After Line 14** (after version extraction):

```javascript
// Extract dateRange parameter (default to 7day if not specified)
const dateRangeParam = event.queryStringParameters?.dateRange || '7day';
```

---

#### **3B: Create Date Range Mapping**

**Insert After Line 15** (after dateRangeParam extraction):

```javascript
// Map date range string to GA4 date range object
const dateRangeMap = {
  '7day': { startDate: '7daysAgo', endDate: 'today' },
  '30day': { startDate: '30daysAgo', endDate: 'today' },
  '90day': { startDate: '90daysAgo', endDate: 'today' }
};

// Get date range object (fallback to 7 days if invalid value)
const dateRange = dateRangeMap[dateRangeParam] || dateRangeMap['7day'];
```

---

#### **3C: Update Platform-Split Request (Line 33 ✅ VERIFIED)**

**Before:**
```javascript
dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
```

**After:**
```javascript
dateRanges: [dateRange], // Dynamic date range from query parameter
```

---

#### **3D: Update Standard Request (Line 65 ✅ VERIFIED)**

**Before:**
```javascript
dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
```

**After:**
```javascript
dateRanges: [dateRange], // Dynamic date range from query parameter
```

---

#### **3E: Add Console Logging (Optional, for debugging)**

**Insert After Line 27** (after dimensionFilter logic):

```javascript
console.log(`Request parameters: version=${version}, dateRange=${dateRangeParam}`);
```

---

**Complete Lambda Changes Summary:**

```javascript
// Line 14-15: Extract parameters
const version = event.queryStringParameters?.version || '4.3';
const dateRangeParam = event.queryStringParameters?.dateRange || '7day';

// Line 16-23: Map date range
const dateRangeMap = {
  '7day': { startDate: '7daysAgo', endDate: 'today' },
  '30day': { startDate: '30daysAgo', endDate: 'today' },
  '90day': { startDate: '90daysAgo', endDate: 'today' }
};
const dateRange = dateRangeMap[dateRangeParam] || dateRangeMap['7day'];

// Line 24-27: Build dimension filter (existing code, unchanged)
const dimensionFilter = version === 'all' ? undefined : { ... };

// Line 28: Add logging
console.log(`Request parameters: version=${version}, dateRange=${dateRangeParam}`);

// Line 33: Update platform-split dateRanges
dateRanges: [dateRange], // Dynamic date range from query parameter

// Line 65: Update standard dateRanges
dateRanges: [dateRange], // Dynamic date range from query parameter
```

**Total Lines Changed:** ~12 lines (7 new, 2 modified, 3 comments)

---

### **Step 4: Deploy Lambda Changes (5 min)**

**AWS Lambda Console Steps:**

1. Open AWS Lambda console
2. Navigate to `non-x-analytics-api` function
3. Update `index.js` with changes from Step 3
4. Click blue "Deploy (⌘+U)" button in left sidebar
5. Verify green banner: "Successfully updated the function 'non-x-analytics-api'"

**No dependencies or layers to update** - only code changes

---

### **Step 5: Testing (20-30 min)**

See Testing Checklist section below.

---

## Code Changes Summary

| File | Lines | Change Type | Description |
|------|-------|-------------|-------------|
| `live.html` | 1387-1395 | HTML | Replace version selector with combined data range selector (8 options) |
| `live.html` | 2799-2806 | JavaScript | Rename `applyVersionFilter()` → `applyDataRangeFilter()`, add parsing logic |
| `live.html` | 2578-2584 | JavaScript | Update `fetchGA4Data()` to parse combined value and add `dateRange` parameter |
| `live.html` | 2623-2629 | JavaScript | Update `fetchPlatformSplitData()` to parse combined value and add `dateRange` parameter |
| `api/index.js` | 14-15 | JavaScript | Extract `dateRange` parameter from query string |
| `api/index.js` | 16-23 | JavaScript | Add date range mapping object (7day/30day/90day → GA4 format) |
| `api/index.js` | 33 | JavaScript | Replace hard-coded date range with dynamic `dateRange` variable |
| `api/index.js` | 65 | JavaScript | Replace hard-coded date range with dynamic `dateRange` variable |

**Total Changes:**
- **Frontend:** ~25 lines (8 HTML, 17 JavaScript)
- **Backend:** ~12 lines (7 new, 2 modified, 3 comments)
- **Grand Total:** ~37 lines

---

## Version + Date Range Options

| Value | Display Text | Date Range | Version | Notes |
|-------|--------------|------------|---------|-------|
| `7day-43` | Last 7 Days - Version 4.3 (Current) | 7 days | 4.3 | **DEFAULT** - matches current behavior |
| `30day-43` | Last 30 Days - Version 4.3 (Current) | 30 days | 4.3 | Primary option for trend analysis |
| `90day-43` | Last 90 Days - Version 4.3 (Current) | 90 days | 4.3 | Long-term trend analysis |
| `7day-42` | Last 7 Days - Version 4.2 (Legacy) | 7 days | 4.2 | Legacy version comparison |
| `30day-42` | Last 30 Days - Version 4.2 (Legacy) | 30 days | 4.2 | Historical comparison |
| `7day-all` | Last 7 Days - All Versions | 7 days | all | Cross-version analysis |
| `30day-all` | Last 30 Days - All Versions | 30 days | all | Cross-version trend |
| `90day-all` | Last 90 Days - All Versions | 90 days | all | Long-term cross-version |

**Ordering Rationale:**
- Version 4.3 first (current, most used)
- Version 4.2 second (legacy, less common)
- All versions last (debugging/comparison)
- Date ranges ordered 7 → 30 → 90 (most to least common)

---

## Parsing Logic

**Input:** `value="7day-43"`

**Parse Steps:**
1. Split on `-`: `["7day", "43"]`
2. Extract `dateRange = "7day"`
3. Extract `versionShort = "43"`
4. Convert to full version:
   - `"43"` → `"4.3"`
   - `"42"` → `"4.2"`
   - `"all"` → `"all"`

**API Call:**
```javascript
const url = `${API_CONFIG.baseURL}/analytics?version=4.3&dateRange=7day`;
```

**Lambda Processing:**
```javascript
const version = '4.3';
const dateRangeParam = '7day';
const dateRange = { startDate: '7daysAgo', endDate: 'today' };

// Applied to GA4 query:
dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }]
dimensionFilter: { fieldName: 'customEvent:analytics_version', value: '4.3' }
```

---

## Testing Checklist

### **Frontend Testing (10 min)**

**HTML Structure:**
- [ ] Data range selector displays with 8 options
- [ ] Default selection is "Last 7 Days - Version 4.3 (Current)"
- [ ] Label reads "🔍 Data Range:"
- [ ] Dropdown styling matches current design (cyan border, dark background)

**Dropdown Functionality:**
- [ ] Click dropdown opens option list
- [ ] Can select each of the 8 options
- [ ] Selected option displays in dropdown after selection
- [ ] No JavaScript console errors on page load

---

### **API Call Testing (10 min)**

**Test Each Option:**

1. **Select "Last 7 Days - Version 4.3"**
   - [ ] Console log shows: `Data range changed to: 7day days, version 4.3`
   - [ ] Network tab shows: `GET /analytics?version=4.3&dateRange=7day`
   - [ ] Dashboard refreshes with data

2. **Select "Last 30 Days - Version 4.3"**
   - [ ] Console log shows: `Data range changed to: 30day days, version 4.3`
   - [ ] Network tab shows: `GET /analytics?version=4.3&dateRange=30day`
   - [ ] Dashboard refreshes with data (likely more data than 7 days)

3. **Select "Last 90 Days - Version 4.3"**
   - [ ] Console log shows: `Data range changed to: 90day days, version 4.3`
   - [ ] Network tab shows: `GET /analytics?version=4.3&dateRange=90day`
   - [ ] Dashboard refreshes with data

4. **Select "Last 7 Days - Version 4.2"**
   - [ ] Network tab shows: `GET /analytics?version=4.2&dateRange=7day`
   - [ ] Dashboard shows empty or minimal data (4.2 has zero events per April 27 notes)

5. **Select "Last 7 Days - All Versions"**
   - [ ] Network tab shows: `GET /analytics?version=all&dateRange=7day`
   - [ ] Dashboard shows combined data from all versions

---

### **Lambda Testing (5 min)**

**CloudWatch Logs:**
- [ ] Open AWS Lambda console
- [ ] Navigate to Monitor tab → View logs in CloudWatch
- [ ] Find latest log stream
- [ ] Verify log line: `Request parameters: version=4.3, dateRange=7day`
- [ ] No error messages in logs

**API Response Validation:**
- [ ] Response returns 200 status code
- [ ] Response includes expected number of rows (varies by date range)
- [ ] 30-day range returns more rows than 7-day range
- [ ] 90-day range returns more rows than 30-day range

---

### **Cross-Tab Consistency (5 min)**

**Test all tabs update with new date range:**

1. Select "Last 30 Days - Version 4.3"
2. Verify all tabs show 30-day data:
   - [ ] Overview tab: KPIs reflect 30-day range
   - [ ] Platform tab: Platform table shows 30-day data
   - [ ] Funnel tab: Completion funnel shows 30-day data
   - [ ] Boss Analysis tab: Boss metrics show 30-day data
   - [ ] AI Agent tab: AI metrics show 30-day data

**Note:** Only tabs with live API data will update. Tabs with mock data remain static.

---

### **Mobile Responsiveness (5 min)**

**Test at <479px width:**
- [ ] Data range selector displays correctly
- [ ] Dropdown text doesn't overflow
- [ ] Option labels readable (may truncate on very small screens)
- [ ] Dropdown closes after selection
- [ ] Active tab indicator updates correctly (Issue 9 verification)

---

## Possible Errors

### **Error 1: Dropdown Not Found (Console Error)**

**Symptom:** `Cannot read property 'value' of null`

**Cause:** JavaScript looking for old `version-select` ID

**Solution:** Verify ALL instances updated to `data-range-select`:
- `fetchGA4Data()` function
- `fetchPlatformSplitData()` function
- `applyDataRangeFilter()` function

**Fix:** Search codebase for `getElementById('version-select')` and replace with `getElementById('data-range-select')`

---

### **Error 2: API Still Returns 7-Day Data**

**Symptom:** Selecting "Last 30 Days" but API returns same data as 7 days

**Cause:** Lambda not updated or not deployed

**Solution:**
1. Verify Lambda code includes `dateRange` parameter extraction
2. Check "Deploy" button clicked (green banner confirmation)
3. Check CloudWatch logs for `Request parameters` log line
4. Hard refresh browser (Cmd+Shift+R) to clear cache

---

### **Error 3: Wrong Version Data Returned**

**Symptom:** Select "Version 4.3" but get "All Versions" data

**Cause:** Parsing logic incorrect (version mapping issue)

**Solution:** Verify conversion logic in `fetchGA4Data()`:
```javascript
const version = versionShort === '43' ? '4.3' :
                versionShort === '42' ? '4.2' :
                versionShort === 'all' ? 'all' : '4.3';
```

**Check:** Console log should show correct version number (e.g., `version 4.3`, not `version 43`)

---

### **Error 4: Lambda Returns 400 Bad Request**

**Symptom:** API call fails with 400 error

**Cause:** Invalid `dateRange` parameter value

**Solution:** Verify `dateRangeMap` includes all possible values:
```javascript
const dateRangeMap = {
  '7day': { startDate: '7daysAgo', endDate: 'today' },
  '30day': { startDate: '30daysAgo', endDate: 'today' },
  '90day': { startDate: '90daysAgo', endDate: 'today' }
};
```

**Fix:** Add fallback logic:
```javascript
const dateRange = dateRangeMap[dateRangeParam] || dateRangeMap['7day'];
```

---

### **Error 5: Parsing Fails on Unexpected Value**

**Symptom:** `version` is `undefined` or `NaN`

**Cause:** Dropdown value format doesn't match `{dateRange}-{version}` pattern

**Solution:** Verify ALL dropdown options use consistent format:
- ✅ Correct: `value="7day-43"`
- ❌ Incorrect: `value="7-days-4.3"` or `value="7day_43"`

**Debug:** Add console log in parsing logic:
```javascript
console.log(`Parsing: ${selectedValue}`); // Should show "7day-43"
const [dateRange, versionShort] = selectedValue.split('-');
console.log(`Parsed: dateRange=${dateRange}, versionShort=${versionShort}`);
```

---

### **Error 6: Mobile Dropdown Text Overflow**

**Symptom:** Option labels cut off or overlap on mobile (<479px)

**Cause:** Text too long for narrow screens

**Solution:** Add CSS media query to reduce font size:

```css
@media (max-width: 479px) {
  #data-range-select {
    font-size: 0.6rem;  /* Reduce from 0.68rem */
  }
}
```

**Alternative:** Shorten option labels for mobile:
```html
<option value="7day-43">7d - v4.3</option>
<option value="30day-43">30d - v4.3</option>
```

---

## Time Breakdown

| Task | Time |
|------|------|
| **Step 1:** Frontend HTML changes | 10 min |
| **Step 2:** Frontend JavaScript changes | 20 min |
| **Step 3:** Backend Lambda changes | 15 min |
| **Step 4:** Deploy Lambda | 5 min |
| **Step 5:** Testing (all checklists) | 30 min |
| **TOTAL** | **80 min** |

**Contingency:** +10 min for unexpected issues (90 min total)

---

## Documentation Updates After Implementation

**Files to Update:**

1. **`docs/HANDOFF_SUMMARY.md`** - Add session entry:
   - Mark Phase 6A Task 5B complete
   - Document combined selector implementation
   - Note all 8 options and parsing logic
   - Include API changes and Lambda updates

2. **`docs/PRIORITIES.md`** - Mark task complete:
   - Check off "Phase 6A Task 5B: Combined Version + Date Range Selector"
   - Update time invested (actual vs estimate)
   - Move to Completed section

3. **`api/DEPLOYMENT_STEPS.md`** - Add note about dateRange parameter:
   - Document new `dateRange` query parameter
   - Explain date range mapping logic
   - Include example API calls

---

## Git Commit Message

```bash
feat: add combined version and date range selector

- Replace separate version selector with combined dropdown
- Support 8 options: 3 date ranges (7/30/90 days) × 3 versions (4.3, 4.2, all)
- Default: Last 7 Days - Version 4.3 (matches current behavior)
- Frontend: Parse "7day-43" format into version + dateRange parameters
- Backend: Add dateRange parameter to Lambda, map to GA4 date format
- Cleaner UI (single dropdown), better mobile UX

Phase 6A Task 5B
```

---

## Next Steps After Completion

**Resume Phase 6A Task 5 (Subtasks 11-12):**
- **Subtask 11:** Integration & Performance Testing (15 min)
  - Test version selector with new combined dropdown
  - Test date range filtering (7/30/90 days)
  - Verify cross-tab data consistency
- **Subtask 12:** Documentation updates (15 min)
  - Update HANDOFF_SUMMARY.md
  - Update PRIORITIES.md
  - Create Task 5 completion summary

**Estimated Time:** 30 minutes

---

## Future Enhancement Ideas

**Phase Out Old Versions:**

When version 4.3 has 90+ days of data, simplify dropdown to:
```html
<option value="7day-43">Last 7 Days</option>
<option value="30day-43">Last 30 Days</option>
<option value="90day-43">Last 90 Days</option>
```

Remove version suffix since all data will be 4.3 only.

**Add Custom Date Range:**

Allow users to select arbitrary date ranges:
```html
<option value="custom">Custom Date Range</option>
<!-- Show date picker inputs if "custom" selected -->
```

**Add Comparison Mode:**

Compare two date ranges or versions side-by-side:
```
[Last 7 Days - v4.3] vs [Last 7 Days - v4.2]
```

---

**Plan Verified:** June 9, 2026
**Ready for Implementation:** ✅