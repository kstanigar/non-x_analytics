# Phase 6A Task 5 - Subtask 5: Extend mapGA4ResponseToDATA()

**Objective:** Add platform-split response parser to dashboard

**Estimate:** 60 minutes

**File:** `live.html:1759-1800`

---

## Task Breakdown

### Task 5.1: Read Current mapGA4ResponseToDATA() Function (5 min)

- [ ] Open `live.html` in editor
- [ ] Navigate to line 1736 (function definition)
- [ ] Read lines 1736-1839 (complete function)
- [ ] Understand current structure:
  - Takes `response` and `reportType` parameters
  - Handles 'realtime' and 'standard' report types
  - Returns DATA object with KPIs
- [ ] Identify insertion point (after line 1758 - empty rows check)

---

### Task 5.2: Add Platform-Split Response Handler (40 min)

**Location:** Insert after line 1758 (after empty rows check)

**Code to Add:**

```javascript
// ─── PLATFORM-SPLIT RESPONSE HANDLER ───
if (reportType === 'platform-split') {
    const platformData = {
        desktop: {
            eventCounts: {},
            sessions: 0,
            gameStarts: 0,
            playerWon: 0,
            playerDeath: 0,
            leaderboardSubmit: 0
        },
        mobile: {
            eventCounts: {},
            sessions: 0,
            gameStarts: 0,
            playerWon: 0,
            playerDeath: 0,
            leaderboardSubmit: 0
        }
    };

    try {
        response.rows.forEach((row) => {
            // Extract dimensions (3 values per row)
            const platform = row.dimensionValues[0]?.value;         // 'web' or 'app'
            const deviceCategory = row.dimensionValues[1]?.value;   // 'desktop', 'mobile', 'tablet'
            const eventName = row.dimensionValues[2]?.value;
            const eventCount = parseInt(row.metricValues[0]?.value || 0, 10);

            if (!eventName || isNaN(eventCount)) return;

            // Route to desktop or mobile bucket (ignore tablet for now)
            const key = deviceCategory === 'mobile' ? 'mobile' : 'desktop';
            const bucket = platformData[key];

            // Accumulate event counts by platform
            bucket.eventCounts[eventName] = (bucket.eventCounts[eventName] || 0) + eventCount;
        });

        // Calculate KPIs for each platform
        ['desktop', 'mobile'].forEach(platform => {
            const ec = platformData[platform].eventCounts;

            // Extract event counts (verified event names from endpoint test)
            const sessions = ec['session_start'] || 0;
            const gameStarts = ec['game_start'] || 0;
            const playerWon = ec['player_won'] || 0;
            const playerDeath = ec['player_death'] || 0;
            const leaderboardSubmit = ec['leaderboard_submit'] || 0;

            // Store raw counts
            platformData[platform].sessions = sessions;
            platformData[platform].gameStarts = gameStarts;
            platformData[platform].playerWon = playerWon;
            platformData[platform].playerDeath = playerDeath;
            platformData[platform].leaderboardSubmit = leaderboardSubmit;
        });

        return platformData;

    } catch (error) {
        console.error('Error parsing platform-split response:', error);
        return {
            error: error.message,
            desktop: { eventCounts: {}, sessions: 0, gameStarts: 0, playerWon: 0, playerDeath: 0 },
            mobile: { eventCounts: {}, sessions: 0, gameStarts: 0, playerWon: 0, playerDeath: 0 }
        };
    }
}
```

**Inline Comments to Add:**
- "Parse multi-dimensional response: platform × deviceCategory × eventName"
- "Route events to desktop/mobile buckets based on deviceCategory"
- "Calculate raw counts for each platform (KPI calculations happen in caller)"

---

### Task 5.3: Verify Code Syntax (5 min)

- [ ] Check all braces match (opening and closing)
- [ ] Verify indentation consistent
- [ ] Check all quotes are paired correctly
- [ ] Verify variable names match (platformData, eventCounts, etc.)
- [ ] Ensure return statement inside try block

---

### Task 5.4: Test Code Logic Manually (10 min)

**Using Sample Response from Endpoint:**

Desktop data:
- game_start: 11
- player_won: 1
- player_death: 5
- session_start: 1

Mobile data:
- returning_user: 6

**Expected Result:**
```javascript
{
  desktop: {
    eventCounts: { game_start: 11, player_won: 1, player_death: 5, session_start: 1, ... },
    sessions: 1,
    gameStarts: 11,
    playerWon: 1,
    playerDeath: 5,
    leaderboardSubmit: 0
  },
  mobile: {
    eventCounts: { returning_user: 6 },
    sessions: 0,
    gameStarts: 0,
    playerWon: 0,
    playerDeath: 0,
    leaderboardSubmit: 0
  }
}
```

**Manual Verification:**
- [ ] Desktop game_start should be 11
- [ ] Desktop player_won should be 1
- [ ] Desktop player_death should be 5
- [ ] Mobile should have 0 game data (only returning_user event)

---

## Implementation Checklist

### Before Implementation:
- [ ] Read current function structure
- [ ] Identify exact insertion point (line 1758)
- [ ] Copy code template from this document

### During Implementation:
- [ ] Open live.html in editor
- [ ] Navigate to line 1758
- [ ] Insert platform-split handler code
- [ ] Add inline comments
- [ ] Verify syntax (braces, quotes, indentation)

### After Implementation:
- [ ] Save file
- [ ] Review code for errors
- [ ] Confirm line numbers haven't shifted other code
- [ ] Document completion

---

## Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Cannot read property 'value' of undefined" | Response missing dimensionValues | Add null-coalescing: `?.value` (already included) |
| Desktop/Mobile totals don't match | Tablet data included | Filter: `deviceCategory === 'mobile' ? 'mobile' : 'desktop'` (already included) |
| KPIs show NaN | Empty eventCounts object | Use `|| 0` fallback (already included) |
| Return value undefined | Return statement outside try block | Move return inside try block (already correct) |

---

## Success Criteria

- [ ] Code compiles without syntax errors
- [ ] Function returns object with `desktop` and `mobile` keys
- [ ] Each platform has `eventCounts`, `sessions`, `gameStarts`, `playerWon`, `playerDeath`, `leaderboardSubmit`
- [ ] Desktop data populated from endpoint test (11 game_start, 1 player_won, etc.)
- [ ] Mobile data shows 0 for game events (only returning_user in test data)
- [ ] Error handling returns safe fallback object

---

## Next Subtask

After Subtask 5 complete:
- **Subtask 6:** Add API fetch call to retrieve platform-split data (30 min)

**Total Time Invested (After Subtask 5):** ~2.5 hours
**Remaining Time:** ~4-5.5 hours