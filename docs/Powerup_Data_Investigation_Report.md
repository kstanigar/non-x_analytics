# Powerup Collection Data Issue - Investigation Report

**Investigation Date:** June 8, 2026
**Severity:** CRITICAL - Data Integrity Issue
**Affected Component:** POWERUP COLLECTION BY PHASE chart (live.html & index.html)

---

## Executive Summary

The "POWERUP COLLECTION BY PHASE" dashboard chart displays **Quad Shot powerups being collected in Green Phase (190) and Red Phase (220)**, but according to game design specifications, **Quad Shot should ONLY appear in Purple Phase (310)**.

This investigation reveals a **multi-layered data integrity problem** combining game code design, GA4 event tracking, and dashboard data visualization issues.

---

## Problem Statement

**User Observation:** "Quad Shot powerups are showing in Green and Red phases, but they should only spawn in Purple Phase"

**Current Dashboard Data:**
```
Powerup Collection by Phase:
                Health    Double Laser    Shield    Quad Shot
Green Phase:    420         310           280        190  ❌ Should be 0
Red Phase:      510         390           340        220  ❌ Should be 0
Purple Phase:   280         210           430        310  ✅ Correct
```

---

## Investigation Findings

### 1. Game Code Design (Source: NON-X_PAIM_Memory.md)

**Documented Powerup Types:**
- Health
- Shield
- Double Laser / Triple Laser / Quad Laser (variants of "Laser" type)

**Powerup Spawn Cycle by Phase:**
According to game documentation (Mar 18, 2026 fix):
```
Green Phase (L1-4):   Shield → Laser → Health (3 types cycling)
Red Phase (L5-8):     Laser → Health → Shield (3 types cycling)
Purple Phase (L9-12): Health → Shield → Laser (3 types cycling)
```

**Key Finding:** The game code only has **3 powerup types in a rotating cycle**, not 4.

### 2. GA4 Event Definition (Source: live.html:1371)

The dashboard expects these `powerup_type` values:
```javascript
'health', 'double_laser', 'shield', 'quad_shot'  // 4 distinct types
```

**Critical Mismatch:** Game sends 3 types (with Laser as a generic type), but GA4 schema defines 4 types.

### 3. Dashboard Data Structure (Source: live.html:1640-1644)

```javascript
powerups: {
  labels: ['Health','Double Laser','Shield','Quad Shot'],
  green: [420, 310, 280, 190],    // ← Quad Shot showing 190 in Green
  red:   [510, 390, 340, 220],    // ← Quad Shot showing 220 in Red
  purple:[280, 210, 430, 310],    // ← Quad Shot showing 310 in Purple
}
```

**File Locations:**
- `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html:1640-1644`
- `/Users/keithstanigar/Documents/Projects/non-x_analytics/index.html:1634-1638`

### 4. Chart Rendering Code (Source: live.html:2141-2156)

```javascript
function chartPowerup() {
  const d = DATA.powerups;
  const _ex_chart_powerup = Chart.getChart('chart-powerup');
  if (_ex_chart_powerup) _ex_chart_powerup.destroy();
  new Chart(document.getElementById('chart-powerup'),{
    type:'bar',
    data:{
      labels:d.labels,                                    // ['Health','Double Laser','Shield','Quad Shot']
      datasets:[
        { label:'Green Phase', data:d.green, ... },       // [420, 310, 280, 190]
        { label:'Red Phase',   data:d.red, ... },         // [510, 390, 340, 220]
        { label:'Purple Phase',data:d.purple, ... },      // [280, 210, 430, 310]
      ]
    },
    ...
  });
}
```

**File Locations:**
- `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html:2141-2156`
- `/Users/keithstanigar/Documents/Projects/non-x_analytics/index.html:1814-1829`

---

## Root Cause Analysis

### Primary Issues Identified

**Issue A: Hardcoded Mock Data**
- The dashboard uses hardcoded sample data in the `DATA.powerups` object
- This mock data shows Quad Shot being collected in all 3 phases (190, 220, 310)
- **Problem:** The data was never validated against actual game powerup mechanics
- **Impact:** Dashboard displays incorrect distribution across phases

**Issue B: Game/GA4 Event Schema Mismatch**
The game code implements a 3-type rotating cycle (Health, Shield, Laser), but GA4 expects to distinguish between:
- `double_laser`
- `quad_shot`

This creates an ambiguity:
1. Is "Quad Shot" a separate powerup type in the game, or a variant of "Laser"?
2. If it's separate, where in the 3-type cycle does it fit?
3. If it's a variant, how does GA4 differentiate it from Double Laser?

**Issue C: Dashboard Not Connected to Live Data**
The current dashboard shows static mock data from `DATA.powerups` hardcoded object. Even if GA4 is sending correct event data with correct `powerup_type` values, the chart displays the hardcoded mock data instead.

---

## Data Pattern Analysis

### Current Incorrect Distribution

```
Health:         1,210 total (34.6% Green, 42.1% Red, 23.1% Purple)
Double Laser:   910 total (34.1% Green, 42.9% Red, 23.1% Purple)
Shield:         1,050 total (26.7% Green, 32.4% Red, 41.0% Purple)
Quad Shot:      720 total (26.4% Green, 30.6% Red, 43.1% Purple)
```

### Expected Distribution (if Quad Shot Purple-only)

```
Health:         1,210 total
Double Laser:   910 total
Shield:         1,050 total
Quad Shot:      0 Green, 0 Red, 310+ Purple
```

The fact that Quad Shot shows a similar distribution pattern to Shield and Double Laser (highest in Red phase, lowest in Green) suggests this is fabricated sample data rather than real GA4 data.

---

## Powerup Availability Rules

Based on game documentation review:

### Confirmed Rules:
1. **Each phase cycles through exactly 3 powerup types** (Health, Shield, Laser)
2. **Each powerup type appears once per 3-level cycle**
3. **Laser variants (Double/Triple/Quad) may change by phase or level**, but are part of the same "Laser" powerup slot

### Question for Clarification:
- **Is "Quad Shot" a hardcoded variant only available in Purple phase?**
  - If yes: Should appear in Phase 3 "Laser" slot only
  - If no: Should appear wherever "Laser" type spawns

### Hypothesis:
The most likely scenario is that Quad Shot is a **Purple-phase-exclusive Laser variant**:
- Green Phase Laser slot → Double Laser
- Red Phase Laser slot → Triple Laser
- Purple Phase Laser slot → Quad Shot

This would explain why the user expects it Purple-only.

---

## Issues Found

### ISSUE-005: Quad Shot Appearing in Wrong Phases

**Severity:** CRITICAL - Data Integrity
**Status:** 🔴 OPEN

#### Sub-Issue 1: Hardcoded Mock Data
**Location:** `live.html:1640-1644` and `index.html:1634-1638`

**Current Code:**
```javascript
powerups: {
  labels: ['Health','Double Laser','Shield','Quad Shot'],
  green: [420, 310, 280, 190],    // Contains Quad Shot (should be 0)
  red:   [510, 390, 340, 220],    // Contains Quad Shot (should be 0)
  purple:[280, 210, 430, 310],    // Contains Quad Shot (correct)
}
```

**Issue:** Sample/mock data showing Quad Shot in all phases, not just Purple

**Required Fix:**
- Update mock data to show `[0, 0, 310]` for Quad Shot
- Or replace with live GA4 data once event mapping is corrected
- Or remove if using live API data (current implementation uses hardcoded mock data)

#### Sub-Issue 2: GA4 Event Schema vs. Game Implementation Mismatch
**Location:** `live.html:1371` (GA4 event definition)

**Current Schema:**
```javascript
'health', 'double_laser', 'shield', 'quad_shot'  // 4 types
```

**Issue:** Game implements 3-type cycling (Health, Shield, Laser), not 4 types

**Investigation Needed:**
- Verify what `powerup_type` value the game actually sends for Quad Shot
- Is it sent as `'quad_shot'` or as `'double_laser'` (variant of Laser)?
- If Purple-phase Laser is always Quad Shot, does game send `quad_shot` specifically?

#### Sub-Issue 3: Dashboard Not Using Live GA4 Data
**Location:** `live.html:2141-2156` and `index.html:1814-1829`

**Current Implementation:** Chart renders from hardcoded `DATA.powerups` object
```javascript
function chartPowerup() {
  const d = DATA.powerups;  // ← Hardcoded mock data
  // ... renders chart with d.green, d.red, d.purple
}
```

**Issue:** API mapping function (`mapGA4ResponseToDATA`) doesn't populate `DATA.powerups`

**From Code Review (live.html:1736-1839):**
```javascript
function mapGA4ResponseToDATA(response, reportType = 'standard') {
  // Maps GA4 events to DATA object
  // Currently only updates: DATA.kpis and DATA.eventCounts
  // DOES NOT update: DATA.powerups or phase-specific breakdowns
  // ...
  return {
    eventCounts,
    kpis: {
      sessions, winRate, deathRate, lbRate, newPct, replay, survival, avgLevel, deskWin, mobWin, deskLevel, mobLevel
    },
    // ... missing powerup data mapping
  };
}
```

**Impact:** Even if GA4 sends correct `powerup_collected` events with correct `powerup_type` and `phase` dimensions, the dashboard can't display them because:
1. The API response doesn't include powerup dimension breakdown
2. The mapping function doesn't extract/process powerup events
3. The chart uses hardcoded mock data instead

---

## Technical Deep Dive

### Powerup Type Definition

**Game Code Tracking (from memory doc line 260):**
```
Power-ups: Health, Shield, Double Laser, Triple Laser, Quad Laser
```

**Notes:**
- Listed as variations (Double, Triple, Quad prefixes on Laser)
- Suggests "Laser" is the base type with variants
- But GA4 schema treats them as separate events:
  - `double_laser`
  - `quad_shot` (not "quad_laser" - note the "shot" terminology)

### Event Tracking Flow

The game likely has code like:
```javascript
if (currentPhase === PURPLE && powerupType === LASER) {
  sendEvent('powerup_collected', { powerup_type: 'quad_shot', ... });
}
```

But without access to the actual game source code, this is speculation.

### Why This Matters

1. **Data Integrity:** Users can't trust powerup distribution metrics
2. **Game Balance Decisions:** Incorrect data leads to wrong balance tuning
3. **Analytics Accuracy:** Event tracking system appears broken for powerup collection
4. **User Trust:** Dashboard claims to show live data but shows outdated mock data

---

## Recommended Fixes

### Fix Priority

1. **Immediate (Critical - Data Integrity):**
   - Update mock data OR
   - Remove Quad Shot from mock data in Green/Red phases

2. **High (Enable Live Data):**
   - Verify game code sends correct `powerup_type` values
   - Update `mapGA4ResponseToDATA()` to populate powerup phase data
   - Connect chart to live GA4 data

3. **Medium (Schema Alignment):**
   - Clarify game code: Is Quad Shot a separate powerup or Laser variant?
   - Document powerup type definitions
   - Align GA4 schema with game implementation

### Option 1: Fix Mock Data (Quick Fix - 5 minutes)

**File:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html` (line 1640-1644)
and `/Users/keithstanigar/Documents/Projects/non-x_analytics/index.html` (line 1634-1638)

**Current:**
```javascript
powerups: {
  labels: ['Health','Double Laser','Shield','Quad Shot'],
  green: [420, 310, 280, 190],
  red:   [510, 390, 340, 220],
  purple:[280, 210, 430, 310],
}
```

**Fix 1A - Remove Quad Shot from chart entirely:**
```javascript
powerups: {
  labels: ['Health','Double Laser','Shield'],  // Remove Quad Shot
  green: [420, 310, 280],
  red:   [510, 390, 340],
  purple:[280, 210, 430],
}
```

**Fix 1B - Show Quad Shot as Purple-only:**
```javascript
powerups: {
  labels: ['Health','Double Laser','Shield','Quad Shot'],
  green: [420, 310, 280, 0],      // ← Zero in Green
  red:   [510, 390, 340, 0],      // ← Zero in Red
  purple:[280, 210, 430, 310],    // ← Only in Purple
}
```

**Fix 1C - Replace with corrected data (if data is real):**
```javascript
// Assumes "Quad Shot" is the Purple-phase Laser variant
// Then we need to recalculate based on actual counts
powerups: {
  labels: ['Health','Shield','Laser (variant)'],  // Or: 'Double Laser'
  green: [420, 280, 310],   // Green phase laser is Double Laser
  red:   [510, 340, 390],   // Red phase laser is likely Triple Laser
  purple:[280, 430, 310],   // Purple phase laser is Quad Shot
}
```

### Option 2: Connect to Live GA4 Data (Proper Fix - 2-4 hours)

**Steps:**
1. Audit game source code to verify what `powerup_type` values are sent
2. Verify that `powerup_collected` events include a phase dimension OR level dimension
3. Update GA4 query to return powerup data with phase breakdown:
   ```javascript
   // In API configuration, add query parameter:
   dimensions: ['eventName', 'powerup_type', 'phase']  // or 'level_reached'
   ```
4. Update `mapGA4ResponseToDATA()` function to populate `DATA.powerups`:
   ```javascript
   // Extract powerup data from GA4 response
   const powerupsByPhase = {
     green: { health: 0, shield: 0, double_laser: 0, quad_shot: 0 },
     red:   { health: 0, shield: 0, double_laser: 0, quad_shot: 0 },
     purple:{ health: 0, shield: 0, double_laser: 0, quad_shot: 0 }
   };

   // Parse response and populate powerupsByPhase
   // Map phase level ranges: Green (1-4), Red (5-8), Purple (9-12)

   DATA.powerups = { ... };  // Update with live data
   ```
5. Test with live GA4 data to verify correct phase distribution

---

## Code Locations Summary

### Dashboard Data Definition
| File | Lines | Issue |
|------|-------|-------|
| `live.html` | 1640-1644 | Hardcoded mock powerup data with Quad Shot in all phases |
| `index.html` | 1634-1638 | Identical hardcoded mock data |

### Chart Rendering
| File | Lines | Function | Issue |
|------|-------|----------|-------|
| `live.html` | 2141-2156 | `chartPowerup()` | Renders hardcoded data, not live GA4 data |
| `index.html` | 1814-1829 | `chartPowerup()` | Renders hardcoded data, not live GA4 data |

### GA4 Event Definition
| File | Lines | Issue |
|------|-------|-------|
| `live.html` | 1371 | Schema defines 4 powerup types, but game may only track 3 |
| `index.html` | 1399 | Same schema definition |

### API Response Mapping
| File | Lines | Function | Issue |
|------|-------|----------|-------|
| `live.html` | 1736-1839 | `mapGA4ResponseToDATA()` | Only maps KPIs, doesn't populate powerup phase data |

---

## Questions for Clarification

Before implementing fixes, confirm:

1. **Is Quad Shot actually Purple-phase only?**
   - If yes: Should the mock data be corrected to show 0 in Green/Red?
   - If no: What is the correct phase distribution?

2. **What does the game code actually send?**
   - For Green/Red phase Laser powerups, is it `double_laser` or `quad_shot`?
   - For Purple phase Laser powerup, is it `quad_shot` or `double_laser`?

3. **Is the mock data based on real GA4 data?**
   - If yes: Where was this data extracted from?
   - If no: Where should we get real data to replace it?

4. **Should we migrate to live GA4 data?**
   - Current API is returning limited event counts
   - Need to expand query to include powerup_type dimension and phase breakdown
   - Timeline for API enhancement?

---

## Related Issues

This issue is related to but separate from:
- **ISSUE-002:** 52.6% of games have missing outcome events (different tracking problem)
- **ISSUE-004:** Event name mismatch (`player_won` vs `game_complete`)

The powerup collection issue is specifically about:
- Hardcoded incorrect mock data
- Phase-specific data not being tracked correctly
- GA4 schema vs. game implementation mismatch

---

## Conclusion

The Quad Shot appearing in Green and Red phases is caused by **hardcoded mock sample data** that was never validated against actual game mechanics. The issue has three components:

1. **Data Quality:** Mock data shows incorrect distribution
2. **Implementation:** Dashboard renders hardcoded data, not live GA4 data
3. **Schema Mismatch:** GA4 tracks 4 powerup types, game implements 3-type cycle

Immediate fix: Update mock data to show Quad Shot as Purple-only (or remove entirely)
Proper fix: Implement live GA4 data with powerup phase breakdown

---

**Document Version:** 1.0
**Created:** June 8, 2026
**Status:** Investigation Complete
**Next Step:** Obtain clarification on game design, then implement appropriate fix