# Quad Shot Powerup Issue - Code Reference Guide

Complete code locations and exact code snippets for the Quad Shot powerup data issue.

---

## File 1: live.html

### Location 1: Hardcoded Mock Data (Lines 1640-1644)

**Full Data Object Context (Lines 1637-1645):**
```javascript
  deviceMix: { desktop: 54, mobile: 46 },
  abSplit: { musicOn: 51, musicOff: 49 },
  powerups: {
    labels: ['Health','Double Laser','Shield','Quad Shot'],
    green: [420, 310, 280, 190],    // ❌ Quad Shot = 190
    red:   [510, 390, 340, 220],    // ❌ Quad Shot = 220
    purple:[280, 210, 430, 310],    // ✅ Quad Shot = 310
  },
  funnel: [
```

**Issue:** Quad Shot (column index 3) appears in all three phases
**Fix:** Change green[3] from 190 to 0, red[3] from 220 to 0

---

### Location 2: Chart Rendering Function (Lines 2141-2156)

**Full Function:**
```javascript
// ── CHART: Powerup ─────────────────────────────────────────────────
function chartPowerup() {
  const d = DATA.powerups;
  const _ex_chart_powerup = Chart.getChart('chart-powerup');
  if (_ex_chart_powerup) _ex_chart_powerup.destroy();
  new Chart(document.getElementById('chart-powerup'),{
    type:'bar',
    data:{
      labels:d.labels,
      datasets:[
        { label:'Green Phase', data:d.green, backgroundColor:GRN+'55', borderColor:GRN, borderWidth:1 },
        { label:'Red Phase',   data:d.red,   backgroundColor:RED+'55', borderColor:RED, borderWidth:1 },
        { label:'Purple Phase',data:d.purple,backgroundColor:PUR+'55', borderColor:PUR, borderWidth:1 },
      ]
    },
    options:{ responsive:true, scales:gridOpts(), plugins:{ legend:{ labels:{ color:'rgba(200,232,255,0.5)', boxWidth:12 } } } }
  });
}
```

**Issue:** Renders hardcoded DATA.powerups without validating against actual GA4 events
**Impact:** Chart always shows static sample data regardless of actual powerup collections

---

### Location 3: GA4 Event Schema Definition (Lines 1371)

**Context (Lines 1365-1373):**
```javascript
            <tr><td><code>boss_id</code></td><td>Event</td><td>Boss number: 1, 2, or 3</td><td>boss_attempt, boss_defeated</td></tr>
            <tr><td><code>visit_count</code></td><td>Event</td><td>Lifetime visit number</td><td>returning_user</td></tr>
            <tr><td><code>is_replay</code></td><td>Event</td><td>true = Play Again, false = fresh</td><td>game_start</td></tr>
            <tr><td><code>games_played</code></td><td>Event</td><td>Lifetime game count at event time</td><td>game_start, survey_submitted</td></tr>
            <tr><td><code>instagram_provided</code></td><td>Event</td><td>true/false — handle submitted</td><td>leaderboard_submit</td></tr>
            <tr><td><code>powerup_type</code></td><td>Event</td><td>'health', 'double_laser', 'shield', 'quad_shot'</td><td>powerup_collected</td></tr>
          </tbody>
        </table>
```

**Issue:** Schema defines 4 types, but game only implements 3-type cycle
**Values:** 'health', 'double_laser', 'shield', 'quad_shot'

---

### Location 4: API Response Mapping (Lines 1736-1839)

**Function Header and Key Sections:**
```javascript
/**
 * Maps GA4 API response to DATA object format for Chart.js
 * @param {Object} response - GA4 API response (runReport or runRealtimeReport)
 * @param {string} reportType - 'realtime' or 'standard'
 * @returns {Object} Mapped DATA object or error
 */
function mapGA4ResponseToDATA(response, reportType = 'standard') {
  // ─── VALIDATION ───────────────────────────────────────────────
  // ... validation code ...

  // ─── EXTRACTION ───────────────────────────────────────────────
  const eventCounts = {};

  try {
    response.rows.forEach((row, index) => {
      // ... parsing code ...
      const eventName = row.dimensionValues[0].value;
      const eventCountStr = row.metricValues[0].value;
      const eventCount = parseInt(eventCountStr, 10);
      eventCounts[eventName] = eventCount;
    });
  } catch (error) {
    // ... error handling ...
  }

  // ─── KPI CALCULATIONS ─────────────────────────────────────────

  const sessions = eventCounts['session_start'] || 0;
  const gameStarts = eventCounts['game_start'] || 0;
  const playerWon = eventCounts['game_complete'] || 0;
  const playerDeath = eventCounts['player_death'] || 0;
  const leaderboardSubmit = eventCounts['leaderboard_submit'] || 0;

  // ... KPI calculations ...

  // ─── RETURN MAPPED DATA ───────────────────────────────────────
  return {
    eventCounts,
    kpis: { ... },
    reportType,
    rowCount: response.rowCount || response.rows.length,
    timestamp: new Date().toISOString(),
    isEmpty: false
  };
}
```

**Issue:** Function only populates KPIs, doesn't extract powerup data
**Missing:** Powerup type extraction and phase breakdown

---

## File 2: index.html

### Location 1: Hardcoded Mock Data (Lines 1634-1638)

**Identical to live.html Lines 1640-1644:**
```javascript
  powerups: {
    labels: ['Health','Double Laser','Shield','Quad Shot'],
    green: [420, 310, 280, 190],    // ❌ Same incorrect data
    red:   [510, 390, 340, 220],    // ❌ Same incorrect data
    purple:[280, 210, 430, 310],    // ✅ Same data
  },
```

---

### Location 2: Chart Rendering Function (Lines 1814-1829)

**Identical to live.html Lines 2141-2156:**
```javascript
function chartPowerup() {
  const d = DATA.powerups;
  const _ex_chart_powerup = Chart.getChart('chart-powerup');
  if (_ex_chart_powerup) _ex_chart_powerup.destroy();
  new Chart(document.getElementById('chart-powerup'),{
    type:'bar',
    data:{
      labels:d.labels,
      datasets:[
        { label:'Green Phase', data:d.green, backgroundColor:GRN+'55', borderColor:GRN, borderWidth:1 },
        { label:'Red Phase',   data:d.red,   backgroundColor:RED+'55', borderColor:RED, borderWidth:1 },
        { label:'Purple Phase',data:d.purple,backgroundColor:PUR+'55', borderColor:PUR, borderWidth:1 },
      ]
    },
    options:{ responsive:true, scales:gridOpts(), plugins:{ legend:{ labels:{ color:'rgba(200,232,255,0.5)', boxWidth:12 } } } }
  });
}
```

---

### Location 3: GA4 Event Schema Definition (Lines 1399)

**Identical to live.html Line 1371**

---

## Supporting Documentation Excerpts

### From NON-X_PAIM_Memory.md (Lines 1720-1733)

Shows the actual game powerup cycle design:

```
**Result:** All phases now spawn all 3 power-ups correctly:
- Green (L1-4): Shield → Laser → Health ✅
- Red (L5-8): Laser → Health → Shield ✅
- Purple (L9-12): Health → Shield → Laser ✅

**Code locations:**
- game_mobile.html: Lines 1711 (variable), 2242-2253 (trySpawnPowerup logic), 3959/4707/5578/5628/7037/8182 (resets)
- game.html: Lines 1509 (variable), 1957-1971 (trySpawnPowerup logic), 3671/4006/4941/4991/6483/7308 (resets)
```

This confirms **only 3 powerup types per phase**, not 4.

---

## Data Quality Analysis

### Current Mock Data Distribution

```javascript
const currentData = {
  health: { green: 420, red: 510, purple: 280 },
  doubleLaser: { green: 310, red: 390, purple: 210 },
  shield: { green: 280, red: 340, purple: 430 },
  quadShot: { green: 190, red: 220, purple: 310 }
};

// Total by powerup
health: 1,210 (420+510+280)
doubleLaser: 910 (310+390+210)
shield: 1,050 (280+340+430)
quadShot: 720 (190+220+310)  // Should be 0+0+310=310 if Purple-only

// Percentages by phase
Green:  [36%, 34%, 27%, 26%]  (all ~30%)
Red:    [42%, 43%, 32%, 31%]  (all ~33%)
Purple: [23%, 23%, 41%, 43%]  (high variation)
```

**Assessment:** Distribution is too uniform across Green/Red phases to be real data from a 3-phase cycle. Suggests fabricated sample data for development/demo purposes.

---

## Impact Summary

### What's Wrong
- Quad Shot shows values in Green (190) and Red (220) phases
- Game design only allows Quad Shot in Purple phase
- Chart renders static mock data, not live GA4 events

### What Users See
- Dashboard displays incorrect powerup collection rates
- Cannot make accurate game balance decisions
- Data appears accurate but is actually sample/demo data

### What Needs to Change
- Mock data: Change [190, 220] to [0, 0] for Quad Shot in Green/Red
- API mapping: Implement powerup data extraction from GA4
- Chart source: Connect to live data instead of hardcoded mock

---

## Files Requiring Changes

| File | Lines | Change | Priority |
|------|-------|--------|----------|
| live.html | 1640-1644 | Update mock data | CRITICAL |
| index.html | 1634-1638 | Update mock data | CRITICAL |
| live.html | 1736-1839 | Add powerup data extraction | HIGH |
| live.html | 2141-2156 | No change needed (uses DATA.powerups) | - |

---

**Reference Guide Created:** June 8, 2026
**Status:** Investigation Complete
**Next Step:** Apply fixes from Powerup_Data_Fix_Instructions.md