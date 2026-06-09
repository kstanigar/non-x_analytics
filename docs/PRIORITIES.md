# NON-X Analytics - Priorities

**Purpose:** Source of truth for all project tasks. Documents what needs to be done (Pending) and what has been completed (Completed). Updated when planning tasks and when marking tasks complete.

**Last Updated:** June 8, 2026

**Agent Instructions:** Cross-reference with HANDOFF_SUMMARY.md to ensure completed tasks are synced. Use hook to auto-move completed tasks from Pending to Completed section.

---

## 🎯 PENDING TASKS

Tasks organized by date added (newest first). Tasks include planning details, inline comments needed, and code changes required.

---

### Added: June 8, 2026 (Dashboard Audit - Immediate Actions)

- [x] ~~**Add Live/Mock Data Labels**~~ ❌ SKIPPED
  - **Reason:** Temporary work - labels removed after Phase 6 (all data live)
  - **Decision:** Skip, go straight to Phase 6 Lambda enhancements
  - **Skipped:** June 8, 2026, 7:15 PM

---

### Added: June 8, 2026 (Phase 5 Completion)

- [ ] **Complete Phase 5 Task #5: Case Study Page**
  - **Estimate:** 60 minutes
  - **Location:** `live.html` - Replace Looker tab content (lines ~1347-1575)
  - **Requirements:**
    - Two-column layout (casual left, technical right)
    - Left: Game overview, data insights, design decisions, A/B test impact
    - Right: Analytics methodology, statistical significance, chart interpretation
    - No sensitive info (API keys, Lambda details, AWS infrastructure)
  - **Inline Comments:** Add section headers for each content card
  - **Code Changes:** Replace Looker page HTML with case study structure
  - **Dependencies:** None
  - **Blocker:** None

- [ ] **Investigate ISSUE-002: Missing Outcome Events**
  - **Estimate:** 2-3 hours
  - **Issue:** 52.6% of games have no outcome (neither win nor death)
  - **Investigation Steps:**
    1. GA4 DebugView: Play game and observe event firing
    2. Review game code: Find where outcome events triggered
    3. Check network logs: Verify events sent before page unload
    4. Determine root cause: Abandonment vs bug
  - **Code Changes:** TBD based on findings
  - **Dependencies:** Requires playing game with DebugView open

- [ ] **Add Data Completeness Warning to Dashboard**
  - **Estimate:** 10 minutes
  - **Location:** `live.html` - After KPI calculations (~line 1810)
  - **Code Changes:**
    ```javascript
    // Add after line 1809
    const completedGames = playerWon + playerDeath;
    const completeness = gameStarts > 0 ? (completedGames / gameStarts * 100).toFixed(1) : 'N/A';

    if (completeness < 80) {
      console.warn(
        `⚠️ Data Completeness: Only ${completeness}% of games have recorded outcomes. ` +
        `${gameStarts - completedGames} games have no outcome event.`
      );
    }
    ```
  - **Inline Comment:** "Warn if <80% games have outcome events (win or death)"
  - **Dependencies:** None

- [ ] **Investigate Leaderboard Event Name**
  - **Estimate:** 30 minutes
  - **Issue:** Dashboard expects `leaderboard_submit` but event not found in GA4
  - **Investigation:** Check GA4 for alternative event names (scorecard_viewed, etc.)
  - **Code Changes:** Update event mapping if different name found
  - **Note:** DebugView showed `leaderboard_submit` IS firing - likely just needs documentation

- [ ] **API Security Issue - Phase 2 (Server-Side Proxy)**
  - **Estimate:** 1-2 hours
  - **Priority:** MEDIUM (Production deployment requirement)
  - **Action:** Create Lambda proxy to hide API key server-side
  - **Why:** Required for S3/CloudFront static site deployment
  - **Dependencies:** Phase 1 complete (API key removed)
  - **Tasks:**
    1. Create new Lambda proxy function (30 min)
    2. Deploy and test proxy Lambda (15 min)
    3. Update API Gateway with proxy endpoint (15 min)
    4. Update live.html to use proxy endpoint (10 min)
    5. Test end-to-end (15 min)

---

### Added: June 8, 2026 (Phase 6A: Lambda Multi-Dimensional Queries)

**Goal:** Get dashboard to 50% live data (25-30 of 44 metrics)

**Documentation:** See `docs/Phase6A_Implementation_Plan.md` for complete details

- [ ] **Phase 6A Task 5: Platform Splits Endpoint** 🔵 IN PROGRESS
  - **Estimate:** 6-8 hours (revised to 7-9 hours with responsive fixes)
  - **Time Invested:** ~6 hours (Lambda ✅, Parser ✅, API fetch ✅, Funnel chart ✅, Table ✅, API Testing ✅, Responsive Part 1 ✅, Part 2 Planning ✅)
  - **Files:** `api/index.js` (lines 13-15, 27-45), `live.html` (multiple sections)
  - **Changes:** Add platform dimension query (desktop vs mobile)
  - **Result:** 3 platform KPIs live + Platform funnel chart live + Platform table live + Responsive design optimized
  - **Progress:**
    - ✅ Subtask 1: Add subType parameter (api/index.js:14)
    - ✅ Subtask 2: Build platform-split query (api/index.js:29-52)
    - ✅ Subtask 3: Test Lambda setup (test files created)
    - ✅ Subtask 4: Deploy to AWS (endpoint live and tested)
    - ✅ Subtask 5: Extend mapGA4ResponseToDATA() (live.html:1760-1832)
    - ✅ Subtask 6: Add API fetch call (live.html:1970-2017, 2069-2120)
    - ✅ Subtask 7: Update chartPlatformFunnel() (live.html:2671-2717)
    - ✅ Subtask 8: Update buildPlatformTable() + KPI cards (live.html:2751-2794, 2116-2120)
    - ✅ Subtask 9: API Endpoint Testing (Task 9.1-9.3 all pass) - 30 min
    - [ ] Subtask 10: UI Display Testing - PAUSED (responsive issues found)
      - ✅ Task 10.1: KPI Cards Validation ✅
      - ✅ Task 10.2.1-10.2.2: Chart display and data accuracy ✅
      - [ ] Task 10.2.3: Chart responsiveness - NEXT (after responsive fixes)
      - [ ] Task 10.3: Platform table validation
      - [ ] Task 10.4: Survival Time Distribution chart validation
    - [ ] **RESPONSIVE FIX - Part 1** ✅ COMPLETE (65 min)
      - ✅ Charts: Add `maintainAspectRatio:false` to 14 instances
      - ✅ CSS: Add `@media (max-width: 479px)` block (50 lines)
      - ✅ Tables: Wrap 7 tables in `.table-wrapper` divs
      - ✅ Documentation: Created `Responsive_Design_Fix_Plan.md`
    - [x] **RESPONSIVE FIX - Part 2** ✅ COMPLETE (30 min)
      - ✅ Issue 3: Fix chart overflow (5 min)
      - ✅ Issue 4: Stack Analytics Version (3 min)
      - ✅ Issue 5: Hamburger menu with "DASHBOARDS" label (17 min + 4 min label)
      - ✅ Planning: Created `Responsive_Design_Fix_Part2_Plan.md`
    - [x] **Chart Legend Scaling Fix** ✅ COMPLETE (16 min)
      - ✅ Added `getLegendFontSize()` helper (8px mobile, 11px desktop)
      - ✅ Updated 10 chart legend configs with responsive font sizing
      - ✅ Result: Legends proportional to charts at all viewport sizes
    - [x] **Mobile UI Cleanup** ✅ COMPLETE (30 min)
      - ✅ Issue 6: Hide "WINNING" labels from A/B Test cards (line ~959)
      - ✅ Issue 7: Hide x-axis labels on mobile bar charts (line 2914-2928)
        - Bar colors identify bosses (Green=Boss 1, Red=Boss 2, Purple=Boss 3)
        - Charts affected: Boss Analysis, Powerup Usage, Boss by Platform, Survival Time, AI Tier
      - ✅ Documentation: Created `Mobile_UI_Cleanup_Plan.md`
    - [x] **Issue 8: Chart Overflow Fix** ✅ COMPLETE (5 min)
      - ✅ Added canvas width constraints (max-width: 100%, width: 100%) - line 380-384
      - ✅ Resolved Survival Time Distribution chart overflow on Platform tab
    - [x] **Issue 9: Active Tab Indicator** ✅ COMPLETE (15 min)
      - ✅ Added active tab name to mobile hamburger label (line 1424)
      - ✅ CSS styling for purple/magenta tab name (lines 1182-1187)
      - ✅ JavaScript updates label on tab switch (lines 3633-3645)
      - ✅ Documentation: Created `Issue9_Active_Tab_Indicator_Plan.md`
    - [x] Subtask 10: Resume UI Display Testing ✅ COMPLETE (30 min)
      - [x] Task 10.2.3: Retest chart responsiveness ✅
      - [x] Task 10.3: Platform table validation ✅ (data accuracy verified, Issue 8 resolved)
      - [x] Task 10.4: Survival Time Distribution chart validation ✅
    - [ ] Subtask 11: Integration Testing (15 min)
    - [ ] Subtask 12: Documentation (15 min)
  - **Code Changes:**
    - ✅ api/index.js: New request handler for `/analytics?subType=platform-split`
    - ✅ live.html:1760-1832: Platform-split response parser (73 lines)
    - ✅ live.html:1970-2017: fetchPlatformSplitData() function (48 lines)
    - ✅ live.html:2069-2120: Platform data integration + KPI cards update (52 lines)
    - ✅ live.html:2671-2717: chartPlatformFunnel() with live data (47 lines)
    - ✅ live.html:2751-2794: buildPlatformTable() dynamic winner logic (44 lines)
  - **AWS Changes:** None (backward compatible) ✅
  - **Endpoint:** `https://6waopo3jh1.execute-api.us-east-2.amazonaws.com/prod/analytics?type=standard&subType=platform-split&version=4.3`
  - **Testing:** Endpoint returns 18 rows, desktop/mobile split confirmed ✅
  - **Dependencies:** Phase 6A research complete ✅
  - **Status:** Part A complete (Lambda), Part B pending (Dashboard)

- [ ] **Phase 6A Task 5B: Date Range Filtering**
  - **Estimate:** 2 hours
  - **Priority:** HIGH - Enables visibility into historical data and version comparisons
  - **Files:** `api/index.js`, `live.html` (CSS, HTML, JS for date dropdown)
  - **Changes:** Add date range parameter to API queries and UI dropdown
  - **Result:** Users can view data for 7/28/90 days or all time, with version-specific date context
  - **Requirements:**
    - **Date Range Dropdown:** Next to version dropdown
      - Options: "Last 7 Days" (default), "Last 28 Days", "Last 90 Days", "All Time"
      - Maps to GA4 `dateRanges`: `7daysAgo`, `28daysAgo`, `90daysAgo`, or since first event
    - **Version-Aware Date Display:**
      - Show deployment dates in version dropdown labels
      - "Version 4.3 (Current) - March 1, 2026 → Today" ⭐ Latest, cleanest data
      - "Version 4.2 (Legacy) - Jan 1, 2026 → Feb 28, 2026"
      - "All Versions - Discover test data impact" (allows seeing how test/sample data may have skewed numbers)
    - **Date Labels in Visualizations:**
      - Display selected date range in dashboard header
      - Example: "Last 28 Days (May 12 - June 9, 2026)"
      - Show version deployment dates in tooltips/labels
    - **Integration with Case Study Report:**
      - Analytics version timeline will be shared in report (replacing Looker page)
      - Users can explore test data vs production data
      - Transparency: Show how metrics evolved across versions
  - **Task Breakdown:**
    1. Lambda: Add `dateRange` parameter to API (20 min)
    2. Dashboard: Add date range dropdown UI (30 min)
    3. Update all API calls to include dateRange (15 min)
    4. Add version deployment dates to config (15 min)
    5. Display date range in dashboard header (15 min)
    6. Testing: Verify date ranges apply correctly (15 min)
    7. Documentation: Update HANDOFF_SUMMARY.md (10 min)
  - **Code Changes:**
    - `api/index.js`: Accept `dateRange` query parameter, map to GA4 `dateRanges`
    - `live.html`: Add date range dropdown, update API calls, display date labels
  - **AWS Changes:** None (backward compatible)
  - **Testing:** Verify 7/28/90 day ranges, verify version + date combinations
  - **Dependencies:** Task 5 complete (Subtasks 1-12)
  - **Status:** Ready for implementation after Task 5 testing complete
  - **Context:** Version 4.3 has cleanest production data. Earlier versions/dates may show test/sample data that skewed metrics. Date filtering allows discovery and transparency.

- [ ] **Phase 6A Task 6: Daily Timeseries Endpoint**
  - **Estimate:** 4-6 hours
  - **Files:** `api/index.js` (lines 46-62), `live.html` (lines 1801-1840, ~2700)
  - **Changes:** Add date dimension query (14-day history)
  - **Result:** Daily Plays & Wins chart live
  - **Code Changes:**
    - api/index.js: New request handler for `/analytics?subType=daily`
    - live.html: Timeseries data parser + chartDaily() update
  - **AWS Changes:** None (backward compatible)
  - **Testing:** Date range validation + chart rendering tests
  - **Dependencies:** Task 5 complete (recommended, not required)
  - **Status:** Ready for implementation

- [ ] **Phase 6A Task 7: Boss Analysis Endpoint**
  - **Estimate:** 4-6 hours
  - **Files:** `api/index.js` (lines 63-79), `live.html` (lines 1841-1880, Boss Analysis page)
  - **Changes:** Add customEvent:boss_id dimension query
  - **Result:** Boss Analysis page 100% live
  - **Code Changes:**
    - api/index.js: New request handler for `/analytics?subType=bosses`
    - live.html: Boss data parser + Boss Analysis page updates
  - **AWS Changes:** None (backward compatible)
  - **Testing:** Boss ID validation + difficulty metrics verification
  - **Dependencies:** GA4 custom dimension `boss_id` must exist (needs verification)
  - **Status:** Ready for implementation (verify boss_id dimension first)

**Phase 6A Total Time:** 14-20 hours implementation + 4-6 hours testing
**Phase 6A Result:** Dashboard 50% live (25-30 metrics), 5 major sections working

---

### Added: June 7, 2026

- [ ] **Git Commit Phase 5 Changes**
  - **Estimate:** 10 minutes
  - **Files to Commit:**
    - `live.html` (death rate fix, event name fix, powerup fix)
    - `index.html` (powerup fix)
    - `api/index.js` (version filtering)
    - `docs/Issues_And_Bugs.md`
    - `docs/ISSUE-005_Fix_Documentation.md`
    - `docs/Session_Summary_June8_2026.md`
    - `docs/HANDOFF_SUMMARY.md`
    - `docs/PRIORITIES.md`
    - `docs/BLOG_NOTES.md`
  - **Commit Message:**
    ```
    feat: Phase 5 data accuracy fixes and analytics enhancements

    - Fix death rate calculation (ISSUE-001)
    - Fix event name mismatch (ISSUE-004)
    - Fix powerup phase data (ISSUE-005)
    - Add version filtering to Lambda
    - Add version dropdown to UI
    - Create centralized issue tracker
    - Update documentation structure
    ```
  - **Dependencies:** Complete testing after refresh

---

### Added: April 27, 2026

- [ ] **Create Pull Request for Phase 5**
  - **Estimate:** 15 minutes
  - **Branch:** `feature/phase4-live-dashboard`
  - **Base:** `main`
  - **PR Title:** "Phase 5: Analytics Version Filtering + Data Accuracy Fixes"
  - **PR Body:** Reference Phase5 handoff summary and session summary
  - **Dependencies:** Git commit complete

---

## ✅ COMPLETED TASKS

Tasks organized by completion date (newest first). Includes completion details and dates.

---

### Completed: June 8, 2026

- [x] **Phase 6A Research & Planning** ✅
  - **Completed:** June 8, 2026, 7:30 PM
  - **Total Time:** 29 minutes (Haiku agent research)
  - **Deliverables:** 5 comprehensive documents (2,225 lines)
    - Phase6A_Implementation_Plan.md (1,256 lines / 44 KB)
    - Phase6A_Quick_Reference.md (240 lines / 6.6 KB)
    - Phase6A_Research_Summary.md (407 lines / 13 KB)
    - Phase6A_DELIVERABLES.md (322 lines / 10 KB)
    - Phase6A_RESEARCH_COMPLETE.txt (completion report)
  - **Research Findings:**
    - GA4 multi-dimensional queries verified (up to 9 dimensions)
    - No AWS configuration changes needed (Lambda code only)
    - Exact code changes documented with line numbers
    - Inline comments prepared for all changes
    - ~198 lines of new code (52 in api/index.js, 146 in live.html)
  - **Implementation Ready:** Tasks 5-7 (14-20 hours) with zero ambiguity
  - **Blog-Worthy:** Comprehensive documentation suitable for technical blog post

- [x] **CRITICAL: Fix API Security Issue - Phase 1 (Remove API Key)** ✅
  - **Completed:** June 8, 2026, 7:12 PM
  - **Total Time:** 18 minutes (estimate: 15 min)
  - **Files Modified:** `live.html:1595-1596, 1871`
  - **AWS Changes:** API Gateway - Unchecked "API key required", deployed to prod
  - **Code Changes:**
    - Removed hardcoded API key from config
    - Removed x-api-key header from fetch call
    - Added comment explaining removal (rate limiting protection)
  - **Testing:** Dashboard successfully connects without API key
  - **Result:** Security vulnerability eliminated, endpoint now uses rate limiting only (10 req/sec, 1000 req/day)

- [x] **Verify Event Names in GA4 DebugView** ✅
  - **Completed:** June 8, 2026, 4:30 PM
  - **Action:** Enabled debug mode, played game twice (win + death)
  - **Critical Discovery:** ISSUE-004 fix was INCORRECT
  - **Finding:** `game_complete` fires for BOTH wins AND deaths
  - **Result:** Reverted ISSUE-004 fix, added clarifying comments
  - **Events Verified:** All events firing correctly (player_won, player_death, leaderboard_submit, powerup_collected, ai_difficulty_adjusted)

- [x] **Revert ISSUE-004: Incorrect Event Mapping Fix** ✅
  - **Completed:** June 8, 2026, 4:30 PM
  - **File:** `live.html:1795-1801`
  - **Reverted:** `game_complete` back to `player_won`
  - **Added:** Inline comments explaining event mapping (verified via DebugView)
  - **Reason:** `game_complete` = generic outcome (fires for wins AND deaths)
  - **Correct Mapping:** Use `player_won` for wins, `player_death` for deaths
  - **Documentation:** Updated Issues_And_Bugs.md with mistake analysis

- [x] **Check AI Agent Events** ✅ PARTIAL
  - **Completed:** June 8, 2026, 4:30 PM
  - **Finding:** `ai_difficulty_adjusted` IS firing (verified in DebugView 4:11:01 PM)
  - **Status:** AI Agent events ARE being sent to GA4
  - **Note:** Dashboard shows 0 for AI metrics (Lambda issue, not event tracking)

- [x] **Fix ISSUE-005: Powerup Phase Data Correction**
  - **Completed:** June 8, 2026, 5:05 AM
  - **Files:** `live.html:1640-1644`, `index.html:1634-1638`
  - **Change:** Set Quad Shot values to 0 for Green/Red phases
  - **Result:** Powerup chart now shows Quad Shot only in Purple phase
  - **Documentation:** `ISSUE-005_Fix_Documentation.md`

- [x] **Fix ISSUE-004: Event Name Mapping** ⚠️ CORRECTED
  - **Initial Fix:** June 8, 2026, 4:55 AM (INCORRECT)
  - **Correction:** June 8, 2026, 4:30 PM (REVERTED)
  - **File:** `live.html:1795`
  - **Initial Change:** `player_won` → `game_complete` ❌
  - **Corrected:** Reverted to `player_won` ✅
  - **Lesson:** Always verify with DebugView before changing event mappings

- [x] **Fix ISSUE-001: Death Rate Formula Bug**
  - **Completed:** June 8, 2026, 4:50 AM
  - **File:** `live.html:1803-1809`
  - **Change:** Calculate death rate using `completedGames` (wins + deaths) instead of `gameStarts`
  - **Result:** Death Rate corrected from 15.8% → 44.4%
  - **Code Added:**
    ```javascript
    const completedGames = playerWon + playerDeath;
    const deathRate = completedGames > 0
      ? ((playerDeath / completedGames) * 100).toFixed(1) + '%'
      : '0%';
    ```

- [x] **Create Issues_And_Bugs.md Tracker**
  - **Completed:** June 8, 2026, 4:30 AM
  - **File:** `docs/Issues_And_Bugs.md` (16K)
  - **Purpose:** Centralized issue tracking with severity levels
  - **Structure:** Critical/Medium/Low sections + Resolved section

- [x] **Investigate Data Accuracy with Haiku Agent**
  - **Completed:** June 8, 2026, 4:00 AM
  - **Duration:** 45 minutes
  - **Findings:** Identified ISSUE-001 (death rate formula) and ISSUE-004 (event name mismatch)
  - **Documentation:** Comprehensive investigation report in session summary

---

### Completed: April 27, 2026

- [x] **Remove Duplicate A/B Test Charts**
  - **Completed:** April 27, 2026
  - **File:** `live.html`
  - **Removed:** `chartABWinRate()` and `chartABSurvival()` functions
  - **Lines Deleted:** 47 lines
  - **Reason:** Redundant with comparison cards

- [x] **Add Version Selector Dropdown to Dashboard**
  - **Completed:** April 27, 2026
  - **File:** `live.html`
  - **Added:** CSS styling, HTML dropdown, JavaScript functions
  - **Options:** All Versions, Version 4.3, Version 4.2

- [x] **Add Analytics Version Filtering to Lambda**
  - **Completed:** April 27, 2026
  - **File:** `api/index.js`
  - **Added:** `analytics_version` dimension filter
  - **Deployed:** AWS Lambda (us-east-2)
  - **API:** Supports `?version=4.3` or `?version=all`

- [x] **Change Dashboard Auto-Refresh Rate**
  - **Completed:** April 27, 2026
  - **File:** `live.html:1566`
  - **Change:** 5 minutes → 1 hour
  - **Impact:** 92% reduction in API calls

---

### Completed: April 26, 2026

- [x] **Complete Phase 4: Live Dashboard with API Integration**
  - **Completed:** April 26, 2026
  - **Files:** `live.html`, `api/index.js`
  - **Features:** Auto-refresh, manual refresh, error handling, live GA4 data
  - **API Endpoint:** `https://6waopo3jh1.execute-api.us-east-2.amazonaws.com/prod/analytics`
  - **Status:** Production-ready

- [x] **Deploy Lambda Function to AWS**
  - **Completed:** April 26, 2026
  - **Function:** `non-x-analytics-api`
  - **Region:** us-east-2
  - **Memory:** 256 MB
  - **Response Time:** ~200ms average

---

### Completed: March 10, 2026

- [x] **Configure AWS API Gateway**
  - **Completed:** March 10, 2026
  - **Endpoint:** `/prod/analytics`
  - **Features:** CORS enabled, rate limiting (10 req/sec, 1000 req/day)
  - **Security:** TLS 1.3

---

## 📊 STATISTICS

**Pending Tasks:** 10 (3 new Phase 6A tasks + 7 existing)
**Completed Tasks:** 18
**Completion Rate (June 2026):** 14 tasks completed

**Average Task Completion Time:**
- Quick fixes (< 30 min): 6 tasks
- Medium tasks (30-90 min): 3 tasks
- Large tasks (1-4 hours): 2 tasks
- Research tasks: 1 task (29 min)

---

## 🔄 SYNC NOTES

**Last Sync with HANDOFF_SUMMARY.md:** June 8, 2026, 7:30 PM
**Sync Status:** ✅ In sync
**Pending Hook Execution:** None