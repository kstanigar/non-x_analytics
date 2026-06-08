# NON-X Analytics - Priorities

**Purpose:** Source of truth for all project tasks. Documents what needs to be done (Pending) and what has been completed (Completed). Updated when planning tasks and when marking tasks complete.

**Last Updated:** June 8, 2026

**Agent Instructions:** Cross-reference with HANDOFF_SUMMARY.md to ensure completed tasks are synced. Use hook to auto-move completed tasks from Pending to Completed section.

---

## 🎯 PENDING TASKS

Tasks organized by date added (newest first). Tasks include planning details, inline comments needed, and code changes required.

---

### Added: June 8, 2026

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

    Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
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

- [x] **Fix ISSUE-005: Powerup Phase Data Correction**
  - **Completed:** June 8, 2026, 5:05 AM
  - **Files:** `live.html:1640-1644`, `index.html:1634-1638`
  - **Change:** Set Quad Shot values to 0 for Green/Red phases
  - **Result:** Powerup chart now shows Quad Shot only in Purple phase
  - **Documentation:** `ISSUE-005_Fix_Documentation.md`

- [x] **Fix ISSUE-004: Event Name Mismatch**
  - **Completed:** June 8, 2026, 4:55 AM
  - **File:** `live.html:1795`
  - **Change:** `eventCounts['player_won']` → `eventCounts['game_complete']`
  - **Result:** Win Rate displays correctly (55.6%)
  - **Impact:** All KPI metrics now working with live data

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

**Pending Tasks:** 6
**Completed Tasks:** 13
**Completion Rate (June 2026):** 9 tasks completed

**Average Task Completion Time:**
- Quick fixes (< 15 min): 4 tasks
- Medium tasks (15-60 min): 3 tasks
- Large tasks (1-4 hours): 2 tasks

---

## 🔄 SYNC NOTES

**Last Sync with HANDOFF_SUMMARY.md:** June 8, 2026
**Sync Status:** ✅ In sync
**Pending Hook Execution:** None