# Phase 4 Live Dashboard - Manual Testing Guide

**Date:** April 26, 2026
**File to Test:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`
**Expected Duration:** 30-45 minutes
**Browser Requirements:** Chrome (latest), Firefox (optional), Safari (optional)

---

## Pre-Testing Checklist

Before opening the dashboard, verify:

- [ ] You have internet connectivity (required for API calls)
- [ ] The AWS Lambda API is running (endpoint: `https://tiq9k6g2ma.execute-api.us-east-2.amazonaws.com/prod/analytics`)
- [ ] You have Chrome DevTools ready (for console monitoring)

---

## Test 1: Initial Page Load & API Connection

**Objective:** Verify the dashboard loads and connects to the API successfully.

### Steps:

1. **Open live.html in Chrome:**
   ```bash
   open -a "Google Chrome" /Users/keithstanigar/Documents/Projects/non-x_analytics/live.html
   ```

2. **Open Chrome DevTools:**
   - Press `Cmd + Option + J` (Mac)
   - Go to the **Console** tab

3. **Verify Console Output:**

   **Expected Console Messages:**
   ```
   NON-X Analytics Live Dashboard - Initializing...
   Version: 5.0 (Live API Integration)
   API Endpoint: https://tiq9k6g2ma.execute-api.us-east-2.amazonaws.com/prod/analytics
   [HH:MM:SS] Fetching GA4 data...
   Mapping GA4 response to DATA format...
   Successfully mapped XX events
   Auto-refresh enabled (every 5 minutes)
   ✅ Dashboard initialized successfully
   ```

   **If API Fails (Expected Fallback):**
   ```
   Failed to fetch GA4 data: [error message]
   ⚠️ Dashboard initialized with errors - check console
   ```

4. **Verify API Status Bar:**
   - [ ] Status bar visible at top of page
   - [ ] Shows "📡 LIVE DATA" label
   - [ ] Status text shows "Connected" (cyan color) if API succeeded
   - [ ] Status text shows "Error: [message]" (red color) if API failed
   - [ ] "Last updated" timestamp shows (e.g., "Last updated: 5s ago")
   - [ ] Refresh button visible (🔄 Refresh)

5. **Check for JavaScript Errors:**
   - [ ] **NO red error messages in Console**
   - [ ] **NO "Uncaught" errors**
   - [ ] **NO "undefined is not a function" errors**

**Result:** ✅ PASS / ❌ FAIL

**Notes:**
```
[Your observations here]
```

---

## Test 2: KPI Display

**Objective:** Verify KPIs are populated correctly.

### Steps:

1. **Scroll to Overview Tab** (should be active by default)

2. **Verify KPI Cards:**

   **Expected (if API connected):**
   - [ ] **Sessions:** Shows number (e.g., "2,841" or live API value)
   - [ ] **New User %:** Shows "—" (not available in current API)
   - [ ] **Win Rate:** Shows percentage (e.g., "8.4%" or live API value)
   - [ ] **Death Rate:** Shows percentage (e.g., "84.2%" or live API value)
   - [ ] **Play-Again Rate:** Shows "—" (not available)
   - [ ] **Avg Survival:** Shows "—" (not available)
   - [ ] **Leaderboard Rate:** Shows percentage (e.g., "31%" or live API value)
   - [ ] **Avg Level Reached:** Shows "—" (not available)

   **If API Failed (Sample Data):**
   - [ ] All KPIs show sample data values from DATA object

3. **Verify Platform Comparison KPIs:**
   - [ ] Desktop Win Rate: Shows value or "—"
   - [ ] Mobile Win Rate: Shows value or "—"
   - [ ] Desktop Avg Level: Shows value or "—"
   - [ ] Mobile Avg Level: Shows value or "—"

**Result:** ✅ PASS / ❌ FAIL

**Notes:**
```
[Your observations here]
```

---

## Test 3: Manual Refresh Button

**Objective:** Verify manual refresh triggers API call and updates data.

### Steps:

1. **Click the "🔄 Refresh" button** in the API status bar

2. **Watch Console Output:**
   ```
   Manual refresh triggered by user
   [HH:MM:SS] Fetching GA4 data...
   Mapping GA4 response to DATA format...
   Successfully mapped XX events
   ```

3. **Verify UI Updates:**
   - [ ] Status changes to "Fetching data..." (yellow) briefly
   - [ ] Loading spinner appears (optional - currently not triggered by manualRefresh)
   - [ ] Status changes to "Connected" (cyan) after success
   - [ ] "Last updated" timestamp resets to "0s ago"
   - [ ] Green toast notification appears: "Live data updated successfully"

4. **Verify KPIs Refresh:**
   - [ ] KPI values update (may be same if no new data)
   - [ ] Charts re-render (brief flash as they redraw)

5. **Test Multiple Rapid Clicks:**
   - Click refresh button 3 times quickly
   - [ ] Console shows "Refresh already in progress, skipping..." for duplicate requests
   - [ ] No concurrent API calls (debouncing works)

**Result:** ✅ PASS / ❌ FAIL

**Notes:**
```
[Your observations here]
```

---

## Test 4: Auto-Refresh Timer

**Objective:** Verify auto-refresh triggers every 5 minutes.

### Steps:

**Note:** Testing the full 5-minute interval is time-consuming. For quick validation:

1. **Check Console for Auto-Refresh Setup:**
   ```
   Auto-refresh enabled (every 5 minutes)
   ```

2. **Verify Timer is Active:**
   - Open DevTools → **Sources** tab
   - Press `Cmd + P` and type "live.html"
   - Search for `refreshTimer` variable
   - Set a breakpoint in `startAutoRefresh()` function
   - Refresh page and verify breakpoint hits

3. **Test "Last Updated" Timer:**
   - [ ] Wait 10 seconds
   - [ ] "Last updated" text changes from "5s ago" → "15s ago"
   - [ ] Updates occur every 10 seconds

**Optional: Test Full Auto-Refresh (5-minute wait):**
- [ ] Leave page open for 5 minutes
- [ ] Console logs "Auto-refresh triggered" at 5:00 mark
- [ ] API fetch occurs automatically
- [ ] Data refreshes without user interaction

**Result:** ✅ PASS / ❌ FAIL (or SKIP if not waiting 5 minutes)

**Notes:**
```
[Your observations here]
```

---

## Test 5: Chart Rendering

**Objective:** Verify all charts render correctly across all tabs.

### Steps:

**Tab 1: Overview**
- [ ] **Chart: Daily Plays & Wins** - Line chart visible, no errors
- [ ] **Chart: Device Mix** - Pie/doughnut chart visible
- [ ] **Chart: Music A/B Split** - Pie/doughnut chart visible
- [ ] **Chart: Powerup Collection by Phase** - Bar chart visible

**Tab 2: Funnel**
- [ ] **Funnel: Full Progression** - Funnel diagram visible
- [ ] **Funnel: Music ON** - Funnel diagram visible
- [ ] **Funnel: Music OFF** - Funnel diagram visible
- [ ] **Table: Funnel Data** - Table populated with data

**Tab 3: Boss Analysis**
- [ ] **Boss Cards** - 3 boss cards visible (Boss 1, 2, 3)
- [ ] **Chart: Boss Kill Rates** - Bar chart visible
- [ ] **Chart: Boss Performance by Platform** - Grouped bar chart visible
- [ ] **Table: Boss Stats** - Table populated

**Tab 4: AI Agent**
- [ ] **AI KPI Cards** - 4 KPI cards visible
- [ ] **Chart: Tier Distribution** - Bar chart visible
- [ ] **Chart: Tier Flow** - Visual representation visible
- [ ] **Chart: Score Multiplier Distribution** - Bar chart visible
- [ ] **Chart: Tier Score Comparison** - Line/bar chart visible
- [ ] **Chart: Death Triggers by Phase** - Bar chart visible
- [ ] **Table: AI Tier Metrics** - Table visible (may be empty)

**Tab 5: A/B Tests**
- [ ] **A/B Comparison Cards** - Music ON vs OFF cards visible
- [ ] **Chart: Win Rate Comparison** - Bar chart visible
- [ ] **Chart: Survival Time Comparison** - Bar chart visible

**Tab 6: Platform Comparison**
- [ ] **Chart: Platform Funnel** - Grouped bar chart visible
- [ ] **Chart: Survival Distribution** - Distribution chart visible
- [ ] **Table: Platform Metrics** - Table populated

**Tab 7: Looker Studio**
- [ ] Instructions visible
- [ ] GA4 connection guide displayed

**Test Platform Toggle (Drop-off Chart):**
1. Navigate to **Funnel** tab
2. Scroll to "Level Drop-off Pattern" chart
3. Click **"All Platforms"** button
   - [ ] Chart updates
4. Click **"Desktop Only"** button
   - [ ] Chart filters to desktop data
5. Click **"Mobile Only"** button
   - [ ] Chart filters to mobile data

**Result:** ✅ PASS / ❌ FAIL

**Charts with Issues:**
```
[List any charts that don't render or show errors]
```

---

## Test 6: Error Handling

**Objective:** Verify error states display correctly.

### Steps:

**Test 1: Simulate API Timeout**

1. **Disconnect from Internet:**
   - Turn off WiFi or unplug ethernet

2. **Click Refresh Button**

3. **Verify Error Handling:**
   - [ ] Console shows error message
   - [ ] Status bar shows "Error: Failed to fetch" (red text)
   - [ ] Error toast notification appears
   - [ ] Dashboard doesn't break (charts still visible with old data)

4. **Reconnect to Internet**

5. **Click Refresh Again:**
   - [ ] API call succeeds
   - [ ] Status returns to "Connected"
   - [ ] Data updates

**Test 2: Invalid API Response**

1. **Open DevTools → Network tab**

2. **Click Refresh Button**

3. **Right-click the API request** (`/analytics`)

4. **Select "Block request URL"** (to simulate 403/404 error)

5. **Click Refresh Again:**
   - [ ] Console shows HTTP error
   - [ ] Status bar shows error
   - [ ] Dashboard remains functional

6. **Unblock the URL** (right-click → Unblock)

**Result:** ✅ PASS / ❌ FAIL

**Notes:**
```
[Your observations here]
```

---

## Test 7: Loading States

**Objective:** Verify loading spinner appears during API operations.

### Steps:

**Note:** The current implementation may not show the loading overlay since it's not explicitly called in the fetch functions. This is expected behavior.

1. **Click Refresh Button**

2. **Look for Loading Indicators:**
   - [ ] Status bar text changes to "Fetching data..." (yellow)
   - [ ] Loading spinner overlay appears (if implemented)
   - [ ] Spinner disappears when fetch completes

**If Loading Overlay Doesn't Appear:**
- This is expected - the implementation uses status bar updates instead
- Loading overlay is available but not currently triggered

**Result:** ✅ PASS / ⚠️ SKIP (loading overlay not actively used)

**Notes:**
```
[Your observations here]
```

---

## Test 8: Browser Compatibility (Optional)

**Objective:** Verify dashboard works across browsers.

### Browsers to Test:

**Chrome (Latest):**
- [ ] Dashboard loads correctly
- [ ] API calls work
- [ ] Charts render correctly
- [ ] No console errors

**Firefox (Latest):**
- [ ] Dashboard loads correctly
- [ ] API calls work
- [ ] Charts render correctly
- [ ] No console errors

**Safari (Latest):**
- [ ] Dashboard loads correctly
- [ ] API calls work
- [ ] Charts render correctly
- [ ] No console errors

**Mobile Safari (iOS):**
- [ ] Dashboard loads on iPhone
- [ ] Layout is responsive
- [ ] Charts render (may be slower)
- [ ] Refresh button works

**Result:** ✅ PASS / ❌ FAIL / ⚠️ SKIP

**Browser-Specific Issues:**
```
[Note any browser-specific problems]
```

---

## Test 9: Performance

**Objective:** Measure load times and performance.

### Steps:

1. **Hard Refresh the Page:**
   - Press `Cmd + Shift + R` (Chrome)

2. **Open DevTools → Performance tab**

3. **Click "Record" button** (●)

4. **Refresh the page**

5. **Stop recording after page loads**

6. **Check Metrics:**
   - [ ] **Page Load Time:** Should be < 3 seconds
   - [ ] **API Fetch Time:** Should be < 2 seconds
   - [ ] **Chart Render Time:** Should be < 1 second total

7. **Check Memory Usage:**
   - Open DevTools → **Memory tab**
   - [ ] Take heap snapshot
   - [ ] Let page run for 10 minutes (auto-refresh twice)
   - [ ] Take another heap snapshot
   - [ ] Memory increase should be minimal (<10 MB)

**Result:** ✅ PASS / ❌ FAIL

**Performance Metrics:**
```
Page Load: [X] seconds
API Fetch: [X] seconds
Memory Growth: [X] MB over 10 minutes
```

---

## Test 10: Console Validation

**Objective:** Ensure no unexpected errors or warnings.

### Steps:

1. **Clear Console** (Cmd + K)

2. **Refresh the Page**

3. **Navigate Through All Tabs** (Overview → Funnel → Bosses → AI → A/B → Platform → Looker)

4. **Click All Interactive Elements:**
   - [ ] Refresh button
   - [ ] Platform toggle buttons
   - [ ] Tab switches

5. **Check Console:**
   - [ ] **NO red errors**
   - [ ] **NO "Uncaught" exceptions**
   - [ ] Yellow warnings are acceptable (e.g., CORS preflight, GA4 API notes)

**Acceptable Warnings:**
- `Access-Control-Allow-Origin` (CORS - expected for cross-origin API)
- GA4 API deprecation notices

**Unacceptable Errors:**
- `Uncaught TypeError`
- `undefined is not a function`
- `Cannot read property of undefined`
- `Failed to execute 'insertBefore'` (DOM errors)

**Result:** ✅ PASS / ❌ FAIL

**Console Errors Found:**
```
[Paste any errors here]
```

---

## Final Checklist

**Overall Dashboard Functionality:**
- [ ] Page loads without errors
- [ ] API connection works (or gracefully falls back to sample data)
- [ ] All KPIs display correctly
- [ ] All 14+ charts render correctly
- [ ] Manual refresh button works
- [ ] Auto-refresh timer is active
- [ ] Tab switching works smoothly
- [ ] Platform toggle works (Funnel tab)
- [ ] Error handling works (tested with no internet)
- [ ] Loading states display appropriately
- [ ] No console errors
- [ ] Performance is acceptable (<3s load time)

**Known Limitations (Expected):**
- ⚠️ Some KPIs show "—" (not available in current Lambda API)
- ⚠️ Charts use sample data (current API only provides basic KPIs)
- ⚠️ Loading spinner overlay not used (status bar used instead)

---

## Test Summary

**Date Tested:** _______________
**Tester:** _______________
**Browser:** _______________
**OS:** _______________

**Total Tests:** 10
**Passed:** ___ / 10
**Failed:** ___ / 10
**Skipped:** ___ / 10

**Critical Issues Found:**
```
[List any blocking issues]
```

**Minor Issues Found:**
```
[List any non-blocking issues]
```

**Recommendations:**
```
[Any improvements or fixes needed]
```

**Overall Status:** ✅ READY FOR DEPLOYMENT / ⚠️ NEEDS FIXES / ❌ NOT READY

---

## Next Steps After Testing

**If All Tests Pass:**
1. Proceed to Task #35 (Documentation & Deployment)
2. Create final documentation
3. Commit and push changes
4. Create pull request
5. Deploy to production

**If Tests Fail:**
1. Document all failures in this guide
2. Create fix tasks for critical issues
3. Re-test after fixes
4. Proceed to deployment only when all critical issues resolved

---

**Happy Testing! 🚀**