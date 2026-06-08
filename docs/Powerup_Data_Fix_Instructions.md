# Quad Shot Powerup Data Fix Instructions

**Issue:** Quad Shot powerups appearing in Green and Red phases when they should only be in Purple phase
**Status:** Ready for fix
**Priority:** CRITICAL

---

## Quick Fix (5 minutes)

If Quad Shot is confirmed as Purple-phase only, apply this fix immediately:

### Fix A: Zero out Quad Shot in Green/Red phases

**File 1:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`

**Location:** Lines 1640-1644

**Current Code:**
```javascript
  powerups: {
    labels: ['Health','Double Laser','Shield','Quad Shot'],
    green: [420, 310, 280, 190],
    red:   [510, 390, 340, 220],
    purple:[280, 210, 430, 310],
  },
```

**Fixed Code:**
```javascript
  powerups: {
    labels: ['Health','Double Laser','Shield','Quad Shot'],
    green: [420, 310, 280, 0],      // ← Changed 190 to 0
    red:   [510, 390, 340, 0],      // ← Changed 220 to 0
    purple:[280, 210, 430, 310],
  },
```

---

**File 2:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/index.html`

**Location:** Lines 1634-1638

**Current Code:**
```javascript
  powerups: {
    labels: ['Health','Double Laser','Shield','Quad Shot'],
    green: [420, 310, 280, 190],
    red:   [510, 390, 340, 220],
    purple:[280, 210, 430, 310],
  },
```

**Fixed Code:**
```javascript
  powerups: {
    labels: ['Health','Double Laser','Shield','Quad Shot'],
    green: [420, 310, 280, 0],      // ← Changed 190 to 0
    red:   [510, 390, 340, 0],      // ← Changed 220 to 0
    purple:[280, 210, 430, 310],
  },
```

---

## Fix B: Alternative - Remove Quad Shot Column Entirely

If Quad Shot should not be displayed as a separate column:

**File 1:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`

**Location:** Lines 1640-1644

**Changed Code:**
```javascript
  powerups: {
    labels: ['Health','Double Laser','Shield'],  // Removed 'Quad Shot'
    green: [420, 310, 280],
    red:   [510, 390, 340],
    purple:[280, 210, 430],
  },
```

**File 2:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/index.html`

**Location:** Lines 1634-1638

**Changed Code:**
```javascript
  powerups: {
    labels: ['Health','Double Laser','Shield'],  // Removed 'Quad Shot'
    green: [420, 310, 280],
    red:   [510, 390, 340],
    purple:[280, 210, 430],
  },
```

---

## Proper Fix (2-4 hours) - Connect to Live GA4 Data

This is the long-term solution if you want the chart to display actual collected powerup data.

### Step 1: Verify Game Event Data

First, confirm what the game code actually sends by checking:
1. The game source code for powerup collection event
2. What value is sent for `powerup_type` in each phase
3. Whether Purple phase sends `quad_shot` or `double_laser`

Expected behavior:
```javascript
// When player collects a powerup, game sends:
gtag('event', 'powerup_collected', {
  'powerup_type': 'quad_shot',  // or 'double_laser' depending on phase
  'level_reached': 9,            // or any level 1-12
  'phase': 'purple',             // or 'green', 'red'
  'score': 12345,
  ...
});
```

### Step 2: Update GA4 API Query

Modify the backend API to return powerup data with dimension breakdown.

Currently the API likely queries:
```javascript
// Returns only event counts
dimensions: ['eventName']
metrics: ['eventCount']
```

Update to include powerup type and phase:
```javascript
// Returns powerup counts by type and phase
dimensions: ['eventName', 'customEvent:powerup_type', 'customDimension:phase']
metrics: ['eventCount']
```

Or if phase isn't a dimension, derive it from level_reached:
```javascript
dimensions: ['eventName', 'customEvent:powerup_type', 'customDimension:level_reached']
metrics: ['eventCount']
```

### Step 3: Update API Response Mapping

**File:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`

**Function:** `mapGA4ResponseToDATA()` (Lines 1736-1839)

**Current Implementation:**
```javascript
function mapGA4ResponseToDATA(response, reportType = 'standard') {
  // ... existing code ...

  // Only populates KPIs, doesn't handle powerup data
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

**Add Powerup Data Extraction:**
```javascript
function mapGA4ResponseToDATA(response, reportType = 'standard') {
  // ... existing code ...

  // NEW: Extract powerup collection data
  const powerupsByPhase = {
    green: { health: 0, double_laser: 0, shield: 0 },
    red: { health: 0, double_laser: 0, shield: 0 },
    purple: { health: 0, shield: 0, quad_shot: 0 }
  };

  // Parse powerup_collected events
  response.rows.forEach(row => {
    const eventName = row.dimensionValues[0]?.value;
    if (eventName === 'powerup_collected') {
      const powerupType = row.dimensionValues[1]?.value;  // e.g., 'quad_shot'
      const levelStr = row.dimensionValues[2]?.value;     // e.g., '12'
      const count = parseInt(row.metricValues[0].value, 10);

      // Derive phase from level
      let phase;
      if (levelStr) {
        const level = parseInt(levelStr, 10);
        if (level >= 1 && level <= 4) phase = 'green';
        else if (level >= 5 && level <= 8) phase = 'red';
        else if (level >= 9 && level <= 12) phase = 'purple';
      }

      // Accumulate counts
      if (phase && powerupType && powerupsByPhase[phase]) {
        if (!powerupsByPhase[phase][powerupType]) {
          powerupsByPhase[phase][powerupType] = 0;
        }
        powerupsByPhase[phase][powerupType] += count;
      }
    }
  });

  // Update DATA.powerups with live data
  DATA.powerups = {
    labels: ['Health', 'Double Laser', 'Shield', 'Quad Shot'],
    green: [
      powerupsByPhase.green.health || 0,
      powerupsByPhase.green.double_laser || 0,
      powerupsByPhase.green.shield || 0,
      0  // Quad Shot never appears in Green
    ],
    red: [
      powerupsByPhase.red.health || 0,
      powerupsByPhase.red.double_laser || 0,
      powerupsByPhase.red.shield || 0,
      0  // Quad Shot never appears in Red
    ],
    purple: [
      powerupsByPhase.purple.health || 0,
      0,  // Double Laser replaced by Quad Shot in Purple
      powerupsByPhase.purple.shield || 0,
      powerupsByPhase.purple.quad_shot || 0
    ]
  };

  // ... return existing structure ...
}
```

### Step 4: Update Chart to Use Live Data

No changes needed to `chartPowerup()` function - it already reads from `DATA.powerups`. Once the API response mapping is updated, the chart will automatically display live data.

### Step 5: Testing

1. Load the dashboard with live GA4 data enabled
2. Verify Quad Shot shows 0 in Green and Red phases
3. Verify Quad Shot shows correct count in Purple phase
4. Check that counts match GA4 console

---

## Implementation Checklist

### Quick Fix (Recommended First Step)
- [ ] Apply Fix A or Fix B to live.html (lines 1640-1644)
- [ ] Apply Fix A or Fix B to index.html (lines 1634-1638)
- [ ] Test dashboard displays corrected data
- [ ] Commit changes with message: "fix: Quad Shot powerup data - Purple phase only"

### Proper Fix (Longer Term)
- [ ] Audit game source code for powerup_collected event
- [ ] Verify powerup_type values being sent
- [ ] Update GA4 API query to include powerup dimensions
- [ ] Update mapGA4ResponseToDATA() to extract powerup data
- [ ] Test with live GA4 data
- [ ] Verify Quad Shot shows as Purple-only in chart
- [ ] Commit changes with message: "feat: connect powerup chart to live GA4 data"

---

## Validation

After applying fix, verify:

1. **Green Phase:** Quad Shot shows 0 (or doesn't appear)
2. **Red Phase:** Quad Shot shows 0 (or doesn't appear)
3. **Purple Phase:** Quad Shot shows collected count
4. **Total Distribution:** Matches expected game mechanics
5. **No JavaScript Errors:** Check browser console for errors
6. **Chart Renders:** Properly displays with corrected data

---

## Rollback Plan

If something breaks after the fix:

```bash
git diff live.html index.html  # See what changed
git checkout live.html index.html  # Revert to original
```

---

## Questions Before Implementation

Confirm answers before proceeding:

1. Is Quad Shot confirmed as Purple-phase only? (Yes/No)
2. Should we show Quad Shot as a separate column, or fold it into "Laser"? (Separate/Fold)
3. Do we want to implement live GA4 data now, or keep mock data? (Live/Mock)
4. What's the source of the current mock data numbers? (Can we validate?)
5. Should other powerup-phase combinations also be validated? (Yes/No)

---

**Document Created:** June 8, 2026
**Status:** Ready for implementation
**Estimated Time:** 5 minutes (quick fix) or 2-4 hours (proper fix)