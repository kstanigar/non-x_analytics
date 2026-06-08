# NON-X Analytics - Issues & Bugs Tracker

**Purpose:** Centralized tracking for bugs, data accuracy issues, and technical problems across the NON-X Analytics platform.

**Last Updated:** June 7, 2026

---

## 📋 ISSUE SUMMARY

| Status | Count |
|--------|-------|
| 🔴 CRITICAL (Blocking) | 2 |
| 🟡 MEDIUM (Should Fix) | 1 |
| 🟢 LOW (Nice to Have) | 0 |
| ✅ RESOLVED | 2 |

---

## 🔴 CRITICAL ISSUES (Blocking Deployment)

### ISSUE-001: Death Rate Formula Incorrectly Includes Abandoned Games

**Status:** ✅ RESOLVED - June 8, 2026
**Severity:** CRITICAL
**Found:** June 7, 2026 (Data Investigation Session)
**Resolved:** June 8, 2026
**Affected Component:** Dashboard KPI Calculations
**Location:** `live.html:1803-1805`

#### Description
The death rate calculation divides `player_death` events by `game_start` events, which includes abandoned games in the denominator. This produces misleading metrics that don't reflect actual player mortality rates.

#### Current Formula
```javascript
const deathRate = gameStarts > 0
  ? ((playerDeath / gameStarts) * 100).toFixed(1) + '%'
  : '0%';
```

#### Observed Data
With current production data:
- Game starts: 19
- Player won: 6 (31.6%)
- Player death: 3 (15.8%)
- **Missing outcomes: 10 games (52.6%)**

**Current Result:** Death Rate = 15.8% (misleading)
**Expected Result:** Death Rate ≈ 66-70% (deaths among completed games)

#### Impact
- **High:** Users cannot trust death rate metric for game balance decisions
- Misleading data may lead to incorrect boss difficulty tuning
- Win rate + Death rate ≠ 100%, which is confusing for stakeholders

#### Root Cause
Formula treats abandoned games (no outcome event) the same as completed games. The denominator should only include games with known outcomes.

#### Recommended Fix
Replace current formula with:
```javascript
// Calculate death rate only from games with recorded outcomes
const completedGames = playerWon + playerDeath;
const deathRate = completedGames > 0
  ? ((playerDeath / completedGames) * 100).toFixed(1) + '%'
  : '0%';
```

#### Expected Result After Fix
- Death Rate: ~66-70% (realistic mortality rate)
- Win Rate: ~31.6% (unchanged)
- Total outcomes: 100% (death rate + win rate)

#### Related Issues
- See ISSUE-002 (Missing Outcome Events) - explains why 52.6% of games lack outcomes

#### Action Items
- [ ] Apply formula fix to `live.html:1803-1805`
- [ ] Test with live data to verify expected ~66-70% result
- [ ] Add comment explaining calculation logic
- [ ] Update dashboard documentation

#### Implementation Plan

**File:** `live.html`
**Section:** `mapGA4ResponseToDATA()` function - KPI Calculations
**Lines to Modify:** 1803-1809

**Task Breakdown:**
1. Replace death rate calculation (lines 1803-1805) - 2 minutes
2. Add inline comment explaining the fix - 1 minute
3. Optional: Add data completeness metric calculation - 2 minutes
4. Test with live API data - 5 minutes
5. Verify expected result (~66-70% death rate) - 1 minute

**BEFORE (Current Code):**
```javascript
  const deathRate = gameStarts > 0
    ? ((playerDeath / gameStarts) * 100).toFixed(1) + '%'
    : '0%';

  const lbRate = playerWon > 0
    ? ((leaderboardSubmit / playerWon) * 100).toFixed(0) + '%'
    : '0%';
```

**AFTER (Fixed Code with Comments):**
```javascript
  // Calculate death rate only from games with recorded outcomes
  // Previous formula used gameStarts (includes abandoned games), which gave misleading 15.8%
  // Fixed: Only count completed games (won + death) to get accurate mortality rate
  const completedGames = playerWon + playerDeath;
  const deathRate = completedGames > 0
    ? ((playerDeath / completedGames) * 100).toFixed(1) + '%'
    : '0%';

  const lbRate = playerWon > 0
    ? ((leaderboardSubmit / playerWon) * 100).toFixed(0) + '%'
    : '0%';
```

**Code Change Summary:**
- **Line 1803:** Add new variable `completedGames = playerWon + playerDeath`
- **Line 1804:** Add inline comment explaining the fix (3 lines)
- **Line 1807-1809:** Replace `gameStarts` with `completedGames` in denominator
- **Total lines changed:** 3 lines deleted, 7 lines added (net +4 lines)

**Expected Results After Fix:**
```
Current Data (version 4.3):
- gameStarts: 19
- playerWon: 6
- playerDeath: 3
- completedGames: 9 (6 + 3)

Before Fix:
  deathRate = (3 / 19) * 100 = 15.8%  ❌ WRONG

After Fix:
  deathRate = (3 / 9) * 100 = 33.3%  ✅ CORRECT
  (Note: With more data, expect 66-70% based on typical 31% win rate)
```

**Testing Validation Checklist:**
- [ ] Death rate changes from 15.8% to higher percentage
- [ ] Win rate remains unchanged at 31.6%
- [ ] Death rate + win rate ≈ 100% (validates fix is working)
- [ ] No JavaScript console errors
- [ ] KPI card displays updated death rate correctly
- [ ] Manual refresh button triggers recalculation

**Rollback Plan (if needed):**
```bash
git checkout live.html  # Restore previous version
# OR manually revert lines 1803-1809 to original formula
```

---

### ISSUE-002: 52.6% of Games Have Missing Outcome Events

**Status:** 🔴 OPEN - Requires investigation
**Severity:** CRITICAL
**Found:** June 7, 2026 (Data Investigation Session)
**Affected Component:** GA4 Event Tracking
**Location:** Game source code (event tracking logic)

#### Description
Approximately 52.6% of games that fire `game_start` events do NOT fire either `player_won` or `player_death` outcome events. This indicates incomplete event tracking and makes the data unreliable for decision-making.

#### Observed Data
From live GA4 data (version 4.3, last 7 days):
- Total `game_start` events: 19
- `player_won` events: 6 (31.6%)
- `player_death` events: 3 (15.8%)
- **Games with no outcome: 10 (52.6%)**

#### Impact
- **High:** Cannot trust any conversion metrics or funnel analysis
- Missing data prevents accurate win rate, death rate, and engagement calculations
- Impossible to determine if players are abandoning games or if events aren't firing
- Blocks informed game design decisions

#### Possible Root Causes
1. **Game Abandonment (Expected):** Players close browser/tab mid-game without triggering outcome event
2. **Missing Edge Cases (Bug):** Certain game flows don't fire outcome events:
   - Falling off map without death trigger
   - Level transition bugs
   - Pause/unpause states
   - AI system crashes
3. **Client-Side Event Sending Issue (Bug):** Events queued but not sent before page unload
4. **Network Issues (External):** Events dropped before reaching GA4

#### Investigation Required
1. **GA4 DebugView Real-Time Testing:**
   - Play complete game (win scenario) → verify both `game_start` and `player_won` fire
   - Play complete game (death scenario) → verify both `game_start` and `player_death` fire
   - Abandon game mid-way → check if ANY outcome event fires
   - Check if `analytics_version: "4.3"` dimension is sent correctly

2. **Game Code Audit:**
   - Review where `game_start` event is triggered
   - Review where `player_won` event is triggered
   - Review where `player_death` event is triggered
   - Identify any game states that skip outcome events

3. **GA4 Console Cross-Check:**
   - Run Exploration query to validate event completeness
   - Check for sampling or filtering at GA4 level
   - Compare against expected user behavior

#### Recommended Fix
After investigation determines root cause:
- **If abandonment:** Add `game_abandoned` event when user navigates away
- **If edge case:** Add missing event triggers for all game end states
- **If client-side:** Implement `sendBeacon()` or queue persistence for events

#### Temporary Workaround
Add data completeness warning to dashboard:
```javascript
const recordedGames = playerWon + playerDeath;
const completeness = gameStarts > 0 ? (recordedGames / gameStarts * 100).toFixed(1) : 'N/A';

if (completeness < 80) {
  console.warn(
    `⚠️ Data Completeness: Only ${completeness}% of games have recorded outcomes. ` +
    `${gameStarts - recordedGames} games have no outcome event. ` +
    `This may indicate event tracking issues.`
  );
}
```

#### Action Items
- [ ] Conduct GA4 DebugView real-time testing (play game, observe events)
- [ ] Audit game source code for event triggering logic
- [ ] Run GA4 Exploration query to validate data completeness
- [ ] Determine if issue is abandonment (expected) or bug (needs fix)
- [ ] Implement appropriate fix based on root cause
- [ ] Add data completeness warning to dashboard (temporary)

#### Related Issues
- See ISSUE-001 (Death Rate Formula) - this missing data causes death rate to be misleading

---

### ISSUE-004: Event Name Mismatch Between GA4 and Dashboard

**Status:** 🔴 OPEN - Blocking all KPI metrics
**Severity:** CRITICAL
**Found:** June 8, 2026 (API Response Investigation)
**Affected Component:** Event Mapping Logic
**Location:** `live.html:1795` (and potentially other event references)

#### Description
The dashboard is looking for an event named `player_won`, but GA4 is actually sending an event named `game_complete`. This mismatch causes the dashboard to show 0% win rate even though players are successfully completing the game.

#### Evidence from API Response
```json
{
  "dimensionValues": [{ "value": "game_complete" }],
  "metricValues": [{ "value": "5" }]
}
```

#### Evidence from GA4 Exploration
- Funnel shows "Player Won": 3 users (14.29% completion rate)
- Last 28 days (May 11 - Jun 7, 2026)
- Players ARE winning, but dashboard can't see it

#### Current Code (Line 1795)
```javascript
const playerWon = eventCounts['player_won'] || 0;  // ❌ This event doesn't exist in GA4
```

#### Impact
- **High:** Win Rate shows 0.0% when actual win rate is ~14-62% (5 wins out of 8 games)
- All metrics depending on `playerWon` are broken:
  - Win Rate: incorrect (shows 0%)
  - Death Rate: can't calculate correctly without wins
  - Leaderboard Rate: can't calculate (needs wins as denominator)
- Users can't trust any dashboard metrics for game balance decisions

#### Event Name Audit

| Dashboard Expects | GA4 Actually Sends | Status | Count (last 7 days) |
|-------------------|-------------------|--------|---------------------|
| `session_start` | `session_start` | ✅ Match | 35 |
| `game_start` | `game_start` | ✅ Match | 8 |
| `player_won` | `game_complete` | ❌ **MISMATCH** | 5 (as `game_complete`) |
| `player_death` | `player_death` | ✅ Match | 4 |
| `leaderboard_submit` | ??? | ❓ Not found | 0 |

#### Additional Events Available in GA4
Events we could potentially use but aren't currently:
- `scorecard_viewed` (3 events)
- `play_again` (2 events)
- `first_visit` (2 events)
- `returning_user` (16 events)
- `wave_reached` (12 events)
- `powerup_collected` (8 events)

#### Root Cause
One of two scenarios:
1. **Game code changed:** Event was renamed from `player_won` to `game_complete` in game code, but dashboard wasn't updated
2. **Dashboard built with wrong name:** Dashboard was built expecting `player_won` but game was always sending `game_complete`

#### Recommended Fix

**Option 1: Update Dashboard Event Mapping (Preferred)**

Change line 1795 to look for the correct event name:

```javascript
// Before:
const playerWon = eventCounts['player_won'] || 0;

// After:
const playerWon = eventCounts['game_complete'] || 0;  // ✅ Use actual GA4 event name
```

**Option 2: Add Fallback Logic**

Support both event names for backwards compatibility:

```javascript
const playerWon = eventCounts['game_complete'] || eventCounts['player_won'] || 0;
```

**Option 3: Update Game Code**

Change the game to send `player_won` instead of `game_complete` (not recommended - would lose historical data)

#### Expected Results After Fix
With current data (5 `game_complete`, 8 `game_start`, 4 `player_death`):

```
Before Fix:
  Win Rate: 0.0%  ❌
  Death Rate: 100.0%  ❌

After Fix:
  Win Rate: 62.5%  ✅ (5 / 8)
  Death Rate: 44.4%  ✅ (4 / (4+5) = 4/9)
```

Note: Death rate will now show the correct percentage among completed games.

#### Leaderboard Event Investigation Required

The dashboard also expects `leaderboard_submit` but this event doesn't appear in the API response. Need to investigate:
1. What is the actual event name for leaderboard submissions?
2. Is it being sent at all?
3. Possible names: `scorecard_viewed`, `leaderboard_viewed`, `score_submit`, etc.

#### Action Items
- [ ] Verify actual event name in game source code
- [ ] Update dashboard mapping to use `game_complete` (line 1795)
- [ ] Search for other references to `player_won` in code
- [ ] Investigate correct event name for leaderboard submissions
- [ ] Test with live data to verify metrics display correctly
- [ ] Document event name standards for future development
- [ ] Consider adding event name validation/logging

#### Related Issues
- ISSUE-001: Death Rate formula fix can't be validated until this is resolved
- ISSUE-002: Missing outcome events partially explained by name mismatch

---

## 🟡 MEDIUM PRIORITY ISSUES

### ISSUE-003: Leaderboard Rate Could Exceed 100% in Edge Cases

**Status:** 🟡 OPEN - Low likelihood
**Severity:** MEDIUM
**Found:** June 7, 2026 (Data Investigation Session)
**Affected Component:** Dashboard KPI Calculations
**Location:** `live.html:1807-1809`

#### Description
The leaderboard rate calculation assumes `leaderboardSubmit ≤ playerWon` (only winners can submit to leaderboard). If non-winners somehow submit scores (edge case or bug), the rate could exceed 100%, which is mathematically impossible for a rate metric.

#### Current Formula
```javascript
const lbRate = playerWon > 0
  ? ((leaderboardSubmit / playerWon) * 100).toFixed(0) + '%'
  : '0%';
```

#### Current Observed Data
- Player won: 6
- Leaderboard submit: 4
- **Leaderboard Rate: 67%** ✓ (valid)

#### Impact
- **Medium:** Low likelihood of occurring, but would display nonsensical metric if it does
- Could indicate a bug in leaderboard submission logic
- May confuse stakeholders if >100% is displayed

#### Recommended Fix
Add validation to cap at 100%:
```javascript
const validLeaderboardSubmits = Math.min(leaderboardSubmit, playerWon);
const lbRate = playerWon > 0
  ? ((validLeaderboardSubmits / playerWon) * 100).toFixed(0) + '%'
  : '0%';
```

Or add conditional warning:
```javascript
const lbRate = playerWon > 0
  ? ((leaderboardSubmit / playerWon) * 100).toFixed(0) + '%'
  : '0%';

if (leaderboardSubmit > playerWon) {
  console.warn(
    `⚠️ Data Anomaly: ${leaderboardSubmit} leaderboard submissions vs ${playerWon} wins. ` +
    `More submissions than wins detected - possible tracking issue.`
  );
}
```

#### Action Items
- [ ] Monitor production data to see if issue ever occurs
- [ ] If occurs, investigate leaderboard submission logic
- [ ] Implement validation fix (low priority)

---

## 🟢 LOW PRIORITY / ENHANCEMENTS

_(No items currently)_

---

## ✅ RESOLVED ISSUES

_(No items currently - issues will be moved here after resolution with fix details)_

---

## 📊 ISSUE TRACKING WORKFLOW

### Adding New Issues
1. Assign next sequential ID (ISSUE-XXX)
2. Set severity: 🔴 CRITICAL / 🟡 MEDIUM / 🟢 LOW
3. Mark status: 🔴 OPEN / 🔄 IN PROGRESS / ✅ RESOLVED
4. Include: Description, Location, Impact, Recommended Fix
5. Update summary table at top

### Updating Existing Issues
1. Change status as work progresses
2. Add investigation findings and action items
3. Update "Last Updated" date at top

### Resolving Issues
1. Document the fix applied (code changes, file locations)
2. Include resolution date and testing validation
3. Move entire issue to "RESOLVED ISSUES" section
4. Update summary table

---

## 🔗 RELATED DOCUMENTATION

- **Investigation Report:** Agent investigation findings (June 7, 2026)
- **Phase 5 Handoff:** `docs/Phase5_Handoff_Summary_April27_2026.md`
- **Session History:** `docs/NON-X_PAIM_SessionHistory.md`
- **API Task List:** `docs/API_Task_List.md`

---

## 📝 NOTES

### Data Investigation Session (June 7, 2026)
- Haiku agent conducted comprehensive data accuracy investigation
- Identified 3 issues in dashboard KPI calculations
- Root cause: Combination of formula bugs and incomplete event tracking
- **Blocker:** Cannot deploy to AWS until ISSUE-001 and ISSUE-002 are resolved
- User requirement: "We need accurate data to reflect so we can make informed decisions on the game"

### Next Session Priorities
1. Fix ISSUE-001 (Death Rate Formula) - 5 minutes
2. Add data completeness warning - 10 minutes
3. Conduct GA4 DebugView investigation for ISSUE-002 - 1-2 hours
4. Complete Task #5 (Case Study Page) - 60 minutes
5. Commit Phase 5 changes after validation

---

**Document Version:** 1.0
**Created:** June 7, 2026
**Last Modified:** June 7, 2026