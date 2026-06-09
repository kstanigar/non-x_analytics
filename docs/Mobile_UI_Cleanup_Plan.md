# Mobile UI Cleanup Plan - Issues 6 & 7

**Session:** June 9, 2026
**Phase:** Phase 6A - Task 5 (Subtask 10 continuation)
**Estimated Time:** 30 minutes total

---

## Overview

Clean up mobile UI by:
1. **Issue 6:** Hide "WINNING" labels from A/B Test cards at mobile widths
2. **Issue 7:** Hide x-axis labels on bar charts at mobile widths

---

## Issue 6: Remove "WINNING" Labels (15 min)

### Problem

A/B Test cards show green "▲ WINNING" badges that take up space on mobile screens.

**Screenshot Evidence:** `/Users/keithstanigar/Desktop/Screen Shot 2026-06-09 at 10.14.53 AM.png`

### Solution

Add CSS media query to hide `.ab-winner-tag` at <479px breakpoint.

### Code Changes

**File:** `live.html`

**Location:** Mobile CSS section (~line 950)

**Insert After Line 951** (after hamburger label CSS):

```css
/* ─── Hide "WINNING" badges on mobile ─── */
.ab-winner-tag {
  display: none;
}
```

**Lines Referenced (no changes needed):**
- Line 3263: `${isWinner ? '<span class="ab-winner-tag">▲ WINNING</span>' : ''}`
- Line 3292: `${isWinner ? '<span class="ab-winner-tag">▲ WINNING</span>' : ''}`

**Reasoning:**
- Labels controlled by `ab-winner-tag` class
- CSS media query already active at <479px
- Desktop (≥480px) will still show badges

### Testing

**Desktop (≥480px):**
- [ ] Navigate to A/B TESTS tab
- [ ] Verify "▲ WINNING" badge visible on GROUP A card
- [ ] Badge should be green with upward arrow

**Mobile (<479px):**
- [ ] Navigate to A/B TESTS tab
- [ ] Verify "▲ WINNING" badge hidden
- [ ] Card layout remains clean without extra spacing

---

## Issue 7: Hide X-Axis Labels on Mobile (15 min)

### Problem

Bar charts show x-axis labels (e.g., "Boss 1 (Green)", "Boss 2 (Red)") that take vertical space on mobile. Bar colors already identify the data, making labels redundant.

**Screenshot Evidence:** `/Users/keithstanigar/Desktop/Screen Shot 2026-06-09 at 10.15.46 AM.png`

### Solution

Update `gridOpts()` function to hide x-axis ticks at <479px using responsive logic.

### Code Changes

**File:** `live.html`

**Location:** Line 2916 - `gridOpts()` function

**Before (line 2916):**
```javascript
x: { grid: { color: 'rgba(0,255,255,0.07)', drawBorder: false }, ticks: { color: 'rgba(200,232,255,0.4)' }, display: axis !== 'y-only' },
```

**After:**
```javascript
// Responsive: hide x-axis labels on mobile (<479px) to save vertical space
x: {
  grid: { color: 'rgba(0,255,255,0.07)', drawBorder: false },
  ticks: {
    color: 'rgba(200,232,255,0.4)',
    display: window.innerWidth > 479  // Hide labels on mobile
  },
  display: axis !== 'y-only'
},
```

**Charts Affected (all use `gridOpts()`):**
- Line 2978: `chartPowerup()` - Powerup Usage by Phase
- Line 3177: `chartBossRatio()` - ATTEMPT-TO-DEFEAT RATIO BY BOSS ⭐ (primary target)
- Line 3194: `chartBossPlatform()` - Boss Defeat Rate by Platform
- Line 3383: `chartSurvivalDist()` - Survival Time Distribution
- Line 3473: `chartAITierDist()` - AI Tier Distribution

**Reasoning:**
- Bar colors identify data (Green=Boss 1, Red=Boss 2, Purple=Boss 3)
- Labels redundant on mobile
- Hiding labels gives ~20-30px more vertical space for chart
- `gridOpts()` centralized function = single change affects all charts

### Testing

**Desktop (≥480px):**
- [ ] Navigate to Boss Analysis tab
- [ ] Verify "ATTEMPT-TO-DEFEAT RATIO BY BOSS" shows x-axis labels
- [ ] Labels should read "Boss 1 (Green)", "Boss 2 (Red)", "Boss 3 (Purple)"

**Mobile (<479px):**
- [ ] Navigate to Boss Analysis tab
- [ ] Verify x-axis labels hidden on "ATTEMPT-TO-DEFEAT RATIO BY BOSS"
- [ ] Bar colors still identify bosses (Green/Red/Purple)
- [ ] Chart has more vertical space
- [ ] Test other tabs: Overview (Powerup chart), Platform (Boss by Platform), Funnel (Survival Time)

---

## Possible Errors

### Error 1: CSS Not Applying
**Symptom:** "WINNING" badges still visible on mobile

**Cause:** Media query not wrapping the rule

**Solution:** Verify CSS is inside `@media (max-width: 479px) { }` block

---

### Error 2: X-Axis Completely Disappears
**Symptom:** Entire x-axis missing (grid lines, axis line)

**Cause:** Modified `scales.x.display` instead of `scales.x.ticks.display`

**Solution:** Ensure change is to `ticks: { display: ... }` not axis-level `display`

---

### Error 3: Charts Don't Update After Code Change
**Symptom:** Labels still show after edit

**Cause:** Chart.js cached config or browser cache

**Solution:** Hard refresh (Cmd+Shift+R) or clear cache

---

## Implementation Steps

### Step 1: Issue 6 - Hide "WINNING" Labels (5 min)

1. Open `live.html`
2. Navigate to line ~951 (mobile CSS section)
3. Insert CSS rule to hide `.ab-winner-tag`
4. Save file

### Step 2: Issue 7 - Hide X-Axis Labels (5 min)

1. Navigate to line 2916 (`gridOpts()` function)
2. Update `scales.x.ticks` object
3. Add inline comment explaining responsive logic
4. Save file

### Step 3: Testing (20 min)

1. Open `live.html` in browser
2. Test desktop view (≥480px) - 5 min
3. Test mobile view (<479px) - 10 min
4. Test all affected charts across tabs - 5 min

---

## Time Breakdown

| Task | Time |
|------|------|
| Issue 6: CSS change | 5 min |
| Issue 7: gridOpts() update | 5 min |
| Desktop testing | 5 min |
| Mobile testing | 10 min |
| Cross-tab validation | 5 min |
| **TOTAL** | **30 min** |

---

## Documentation Updates After Implementation

**Files to Update:**
1. `docs/HANDOFF_SUMMARY.md` - Mark Issues 6-7 complete
2. `docs/PRIORITIES.md` - Update Phase 6A Task 5 progress

**Git Commit Message:**
```
fix: improve mobile UI readability

- Hide "WINNING" labels on A/B Test cards at <479px
- Hide x-axis labels on bar charts at <479px
- Bar colors identify data, labels redundant on mobile
- Provides more vertical space for charts

Resolves Issue 6 & Issue 7
```

---

## Next Steps After Completion

**Resume Phase 6A Task 5, Subtask 10:**
- Task 10.2.3: Retest chart responsiveness (verify fixes)
- Task 10.3: Platform table validation
- Task 10.4: Survival Time Distribution chart validation

**Estimated Time:** 30 minutes

---

**Plan Verified:** June 9, 2026
**Ready for Implementation:** ✅