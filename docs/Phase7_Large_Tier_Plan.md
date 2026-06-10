# Phase 7: Large Tier Implementation Plan

**Created:** June 10, 2026
**Status:** Pending — ready to implement
**Research:** Haiku agent (all line numbers verified against live.html + api/index.js)

---

## Task Overview

| # | Task | Effort | Lambda? | Status |
|---|------|--------|---------|--------|
| LT-1 | Game Funnel | 1–2 hrs | No (extend existing parsers) | ⏳ Next |
| LT-2 | Music A/B Test | 3–4 hrs | New handler | ⏳ Pending |
| LT-3 | Movement A/B Test | 2–3 hrs | New handler | ⏳ Pending |

**Recommended order:** LT-1 → LT-2 → LT-3

---

## LT-1: Game Funnel — No new Lambda needed

### Summary
All funnel data is already available from existing endpoints. Only parser extensions and integration wiring required.

### Funnel Stages & Data Sources

| Stage | Data Source | Status |
|-------|------------|--------|
| `game_start` | Standard query (`eventCounts['game_start']`) | ✅ Already live |
| `wave_reached L4` | progression-analysis (extend parser to count `wave_reached` at `levelReached === '4'`) | 🔧 Parser extension |
| `boss_attempt 1` | `DATA.bossAnalysis.boss1.overall.attempts` | ✅ Already live |
| `boss_defeated 1` | `DATA.bossAnalysis.boss1.overall.defeats` | ✅ Already live |
| `boss_defeated 2` | `DATA.bossAnalysis.boss2.overall.defeats` | ✅ Already live |
| `boss_defeated 3` | `DATA.bossAnalysis.boss3.overall.defeats` | ✅ Already live |
| `player_won` | Standard query (`eventCounts['player_won']`) | ✅ Already live |

### Files to Modify
- `live.html` only

---

### Change 1: Extend progression-analysis parser to count wave_reached L4

**Location:** `live.html` — inside the `if (reportType === 'progression-analysis')` block

**Current code (~line 2843):**
```javascript
// Only count player_death events — these are what the Wave Drop-off chart displays
if (eventName === 'player_death' && levelReached) {
```

**Add this block AFTER the existing `player_death` block (after line 2859):**
```javascript
// Count wave_reached at level 4 — used for funnel stage 2
if (eventName === 'wave_reached' && levelReached === '4') {
  waveReachedL4 = (waveReachedL4 || 0) + count;
}
```

**Add accumulator declaration before the loop (~line 2834, with the other accumulators):**
```javascript
let waveReachedL4 = 0; // count of wave_reached events at level 4 (funnel stage 2)
```

**Add to return object (~line 2872, inside `progressionData:`):**
```javascript
waveReachedL4,
```

---

### Change 2: Wire funnel data in integration block

**Location:** `live.html` — after the existing `DATA.deathsByLevel` assignments (~line 3742), inside the `if (!progressionData.error && progressionData.progressionData)` block

**Add:**
```javascript
// Wire game funnel — derive from existing live data sources
if (progressionData.progressionData.waveReachedL4 > 0) {
  const gs  = DATA.kpis.sessions ? parseInt(DATA.kpis.sessions.replace(/,/g, ''), 10) : 0;
  const wr  = progressionData.progressionData.waveReachedL4;
  const ba1 = DATA.bossAnalysis?.boss1?.overall?.attempts || 0;
  const bd1 = DATA.bossAnalysis?.boss1?.overall?.defeats  || 0;
  const bd2 = DATA.bossAnalysis?.boss2?.overall?.defeats  || 0;
  const bd3 = DATA.bossAnalysis?.boss3?.overall?.defeats  || 0;
  const pw  = DATA.bossAnalysis?.boss3?.overall?.defeats  || 0; // proxy until player_won available here

  const pct = (n) => gs > 0 ? parseFloat(((n / gs) * 100).toFixed(1)) : 0;
  const drop = (a, b) => a > 0 ? parseFloat((((a - b) / a) * 100).toFixed(1)) : null;

  DATA.funnel = [
    { name: 'game_start',       n: gs,  pct: 100,       dropPct: null },
    { name: 'wave_reached L4',  n: wr,  pct: pct(wr),   dropPct: drop(gs, wr) },
    { name: 'boss_attempt 1',   n: ba1, pct: pct(ba1),  dropPct: drop(wr, ba1) },
    { name: 'boss_defeated 1',  n: bd1, pct: pct(bd1),  dropPct: drop(ba1, bd1) },
    { name: 'boss_defeated 2',  n: bd2, pct: pct(bd2),  dropPct: drop(bd1, bd2) },
    { name: 'boss_defeated 3',  n: bd3, pct: pct(bd3),  dropPct: drop(bd2, bd3) },
    { name: 'player_won',       n: DATA.bossAnalysis?.boss3?.overall?.defeats || 0, pct: pct(DATA.bossAnalysis?.boss3?.overall?.defeats || 0), dropPct: null },
  ];
  console.log('Funnel data updated:', DATA.funnel);
}
```

> **Note on player_won:** The standard query result is in scope earlier in `loadAndRenderGA4Data()` as part of the main GA4 fetch. We will use the value already in `DATA.kpis` — need to verify `playerWon` count is accessible here. If not, `boss_defeated 3` serves as a close proxy since almost all boss 3 defeats result in wins.

---

### Change 3: Update buildFunnelTable() with live conversion rates

**Location:** `live.html:4104–4111`

**Current (hardcoded):**
```javascript
const conversions = [
  { from: 'game_start', to: 'wave_reached L4', overall: '55.0%', on: '~57%', off: '~53%', delta: '+4pp' },
  ...
];
```

**Replace with dynamic calculation from `DATA.funnel`:**
```javascript
const conversions = DATA.funnel.slice(1).map((stage, i) => {
  const prev = DATA.funnel[i];
  const rate = prev.n > 0 ? ((stage.n / prev.n) * 100).toFixed(1) + '%' : '—';
  return { from: prev.name, to: stage.name, overall: rate, on: '—', off: '—', delta: '—' };
});
```

> Music ON/OFF columns will show `'—'` until LT-2 is complete and wires `DATA.funnelMusicOn/Off`.

---

### Testing (LT-1)
- [ ] Console shows `Funnel data updated:` with 7 non-zero stages
- [ ] Funnel tab main chart shows live proportional bars
- [ ] Drop % shown between each stage
- [ ] Conversion table rows update with live rates

---

---

## LT-2: Music A/B Test — New Lambda handler

### Summary
New `subType=music-ab` query using `customEvent:ab_music_group` dimension. Wires `DATA.abMusic`, `DATA.abSplit`, `DATA.funnelMusicOn`, `DATA.funnelMusicOff`.

### GA4 Details
- **Dimension:** `customEvent:ab_music_group`
- **Values:** `'music_on'` / `'music_off'`
- **Scope:** Event (sent on all game events)

### Metrics to make live

| Key | Formula | Mock value |
|-----|---------|-----------|
| `sessions` | `game_start` count per group | 1449 / 1392 |
| `winRate` | `player_won / game_start` per group | `'9.6%'` / `'7.2%'` |
| `lbRate` | `leaderboard_submit / player_won` per group | `'34%'` / `'27%'` |
| `musicToggle` | `music_toggled / game_start` per group | `'18%'` / `'22%'` |
| `abSplit` donut | `game_start` % per group | `{ musicOn: 51, musicOff: 49 }` |
| `survival` | Needs `session_duration_seconds` dim — **skip for now, leave mock** | `'2:32'` / `'2:11'` |
| `replay` | Needs `is_replay` dim — **skip for now, leave mock** | `'2.5×'` / `'2.1×'` |
| `avgLevel` | Needs `level_reached` dim — **skip for now, leave mock** | `'5.7'` / `'4.8'` |

> Skipped metrics require a second query (exceeds 3-dim limit when combined). Add in a follow-up pass.

### Files to Modify
- `api/index.js` — new handler
- `live.html` — parser, fetch function, integration

---

### Change 1: api/index.js — new handler (after replay-rate, before realtime, ~line 244)

```javascript
} else if (requestType === 'standard' && subType === 'music-ab') {
    // ─── MUSIC A/B REQUEST (Win/LB/toggle rates split by ab_music_group) ───
    const musicABRequest = {
        property: `properties/${propertyId}`,
        dateRanges: [dateRange],
        // Multi-dimensional query: ab_music_group × eventName
        // Returns event counts split by music_on vs music_off cohort
        dimensions: [
            { name: 'customEvent:ab_music_group' }, // Dimension 0: 'music_on' or 'music_off'
            { name: 'eventName' }                    // Dimension 1: game_start, player_won, etc.
        ],
        metrics: [{ name: 'eventCount' }],
    };
    if (dimensionFilter) { musicABRequest.dimensionFilter = dimensionFilter; }
    [response] = await analyticsDataClient.runReport(musicABRequest);
}
```

---

### Change 2: live.html — parser (before `// ─── EXTRACTION ───` at line 3025)

```javascript
if (reportType === 'music-ab') {
  // Parse ab_music_group × eventName response
  // Counts key events per music cohort (music_on vs music_off)
  const groups = { music_on: {}, music_off: {} };

  if (response.rows && response.rows.length > 0) {
    response.rows.forEach(row => {
      const group     = row.dimensionValues[0]?.value?.toLowerCase() || '';
      const eventName = row.dimensionValues[1]?.value || '';
      const count     = parseInt(row.metricValues[0]?.value || '0', 10);
      if (!groups[group]) return; // skip unknown groups
      groups[group][eventName] = (groups[group][eventName] || 0) + count;
    });
  }

  const calc = (grp) => {
    const g = groups[grp];
    const gs    = g['game_start']         || 0;
    const pw    = g['player_won']         || 0;
    const lb    = g['leaderboard_submit'] || 0;
    const mt    = g['music_toggled']      || 0;
    const fmt   = (n, d) => d > 0 ? Math.round((n / d) * 100) + '%' : '—';
    return { sessions: gs, winRate: fmt(pw, gs), lbRate: fmt(lb, pw), musicToggle: fmt(mt, gs) };
  };

  const on  = calc('music_on');
  const off = calc('music_off');
  const totalGs = on.sessions + off.sessions;

  return {
    musicAB: { on, off },
    abSplit: {
      musicOn:  totalGs > 0 ? Math.round((on.sessions  / totalGs) * 100) : 51,
      musicOff: totalGs > 0 ? Math.round((off.sessions / totalGs) * 100) : 49,
    },
    hasRealData: totalGs > 0,
  };
}
```

---

### Change 3: live.html — fetch function (after fetchReplayRateData, ~line 3515)

```javascript
async function fetchMusicABData() {
  const dataRangeSelect = document.getElementById('data-range-select');
  const selectedValue = dataRangeSelect ? dataRangeSelect.value : '90day-43';
  const [dateRange, versionShort] = selectedValue.split('-');
  const version = versionShort === '43' ? '4.3' : versionShort === 'all' ? 'all' : '4.3';
  const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.analytics}?type=standard&subType=music-ab&version=${version}&dateRange=${dateRange}`;
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(API_CONFIG.timeout),
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    if (error.name === 'TimeoutError') {
      console.error(`Music-AB request timeout after ${API_CONFIG.timeout}ms`);
      return { success: false, error: 'Request timeout', data: null };
    }
    console.error('Failed to fetch music A/B data:', error);
    return { success: false, error: error.message, data: null };
  }
}
```

---

### Change 4: live.html — integration (before `reinitAllCharts()` at line 3834)

```javascript
// Fetch music A/B data (win rate / lb rate / toggle rate split by ab_music_group)
const musicABResult = await fetchMusicABData();
if (musicABResult.success && musicABResult.data) {
  const mabData = mapGA4ResponseToDATA(musicABResult.data, 'music-ab');
  if (!mabData.error && mabData.hasRealData) {
    DATA.abMusic.A.sessions     = mabData.musicAB.on.sessions;
    DATA.abMusic.A.winRate      = mabData.musicAB.on.winRate;
    DATA.abMusic.A.lbRate       = mabData.musicAB.on.lbRate;
    DATA.abMusic.A.musicToggle  = mabData.musicAB.on.musicToggle;
    DATA.abMusic.B.sessions     = mabData.musicAB.off.sessions;
    DATA.abMusic.B.winRate      = mabData.musicAB.off.winRate;
    DATA.abMusic.B.lbRate       = mabData.musicAB.off.lbRate;
    DATA.abMusic.B.musicToggle  = mabData.musicAB.off.musicToggle;
    DATA.abSplit.musicOn        = mabData.abSplit.musicOn;
    DATA.abSplit.musicOff       = mabData.abSplit.musicOff;
    console.log('Music A/B data updated:', DATA.abMusic, DATA.abSplit);
  } else {
    console.warn('Music-AB parsing failed or no data, using mock values');
  }
} else {
  console.warn('Music-AB fetch failed:', musicABResult.error);
}
```

---

### Testing (LT-2)
- [ ] Console shows `Music A/B data updated:` with non-zero sessions
- [ ] A/B Split donut chart updates from 51/49 mock to live proportions
- [ ] Music A/B cards show live winRate / lbRate / musicToggle
- [ ] survival / replay / avgLevel remain mock (expected)
- [ ] significance table session counts update

---

---

## LT-3: Movement A/B Test — New Lambda handler

### Summary
Same pattern as LT-2. New `subType=movement-ab` using `customEvent:movement_group`.

### GA4 Details
- **Dimension:** `customEvent:movement_group`
- **Values:** Unknown — need to verify via endpoint test before implementing
- **Recommended:** Hit endpoint raw first, inspect actual values in response

### Endpoint to test first (before implementation):
```
GET /analytics?type=standard&subType=movement-ab&version=4.3&dateRange=90day
```
Check `dimensionValues[0]` values in the response to confirm group names.

### Metrics to make live

| Key | Formula | Mock value |
|-----|---------|-----------|
| `sessions` | `game_start` count per group | 1389 / 1452 |
| `winRate` | `player_won / game_start` per group | `'8.1%'` / `'8.7%'` |
| `survival` | Needs `session_duration_seconds` — **skip, leave mock** | `'2:19'` / `'2:25'` |
| `avgLevel` | Needs `level_reached` dim — **skip, leave mock** | `'5.0'` / `'5.4'` |

### Files to Modify
- `api/index.js` — new handler (same pattern as music-ab)
- `live.html` — parser, fetch function, integration

---

### Change 1: api/index.js — new handler (after music-ab, before realtime)

```javascript
} else if (requestType === 'standard' && subType === 'movement-ab') {
    // ─── MOVEMENT A/B REQUEST (Win rate split by movement_group) ───
    const movementABRequest = {
        property: `properties/${propertyId}`,
        dateRanges: [dateRange],
        dimensions: [
            { name: 'customEvent:movement_group' }, // Dimension 0: values TBC from endpoint test
            { name: 'eventName' }                    // Dimension 1: game_start, player_won, etc.
        ],
        metrics: [{ name: 'eventCount' }],
    };
    if (dimensionFilter) { movementABRequest.dimensionFilter = dimensionFilter; }
    [response] = await analyticsDataClient.runReport(movementABRequest);
}
```

---

### Change 2: live.html — parser (after music-ab parser, before `// ─── EXTRACTION ───`)

```javascript
if (reportType === 'movement-ab') {
  // Parse movement_group × eventName response
  // Group key names depend on actual GA4 values — discovered via endpoint test
  const groupCounts = {};

  if (response.rows && response.rows.length > 0) {
    response.rows.forEach(row => {
      const group     = row.dimensionValues[0]?.value?.toLowerCase() || '';
      const eventName = row.dimensionValues[1]?.value || '';
      const count     = parseInt(row.metricValues[0]?.value || '0', 10);
      if (!group || group === '(not set)') return;
      if (!groupCounts[group]) groupCounts[group] = {};
      groupCounts[group][eventName] = (groupCounts[group][eventName] || 0) + count;
    });
  }

  const groups = Object.keys(groupCounts); // discover actual group names from data
  if (groups.length < 2) return { hasRealData: false };

  const calc = (grp) => {
    const g  = groupCounts[grp] || {};
    const gs = g['game_start'] || 0;
    const pw = g['player_won'] || 0;
    return { sessions: gs, winRate: gs > 0 ? Math.round((pw / gs) * 100) + '%' : '—' };
  };

  return {
    movementAB: {
      A: { ...calc(groups[0]), label: groups[0] }, // group A = first alphabetically
      B: { ...calc(groups[1]), label: groups[1] }, // group B = second
    },
    hasRealData: true,
  };
}
```

> **Note:** Parser uses dynamic group discovery from response since `movement_group` values are unconfirmed. Labels will be set to raw GA4 values initially — update `DATA.abMovement.A.label` / `.B.label` with friendly names once values are known.

---

### Change 3: live.html — fetch function (after fetchMusicABData)

```javascript
async function fetchMovementABData() {
  const dataRangeSelect = document.getElementById('data-range-select');
  const selectedValue = dataRangeSelect ? dataRangeSelect.value : '90day-43';
  const [dateRange, versionShort] = selectedValue.split('-');
  const version = versionShort === '43' ? '4.3' : versionShort === 'all' ? 'all' : '4.3';
  const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.analytics}?type=standard&subType=movement-ab&version=${version}&dateRange=${dateRange}`;
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(API_CONFIG.timeout),
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    if (error.name === 'TimeoutError') {
      console.error(`Movement-AB request timeout after ${API_CONFIG.timeout}ms`);
      return { success: false, error: 'Request timeout', data: null };
    }
    console.error('Failed to fetch movement A/B data:', error);
    return { success: false, error: error.message, data: null };
  }
}
```

---

### Change 4: live.html — integration (after music-AB integration, before reinitAllCharts())

```javascript
// Fetch movement A/B data (win rate split by movement_group)
const movementABResult = await fetchMovementABData();
if (movementABResult.success && movementABResult.data) {
  const mabData = mapGA4ResponseToDATA(movementABResult.data, 'movement-ab');
  if (!mabData.error && mabData.hasRealData) {
    DATA.abMovement.A.sessions = mabData.movementAB.A.sessions;
    DATA.abMovement.A.winRate  = mabData.movementAB.A.winRate;
    DATA.abMovement.A.label    = mabData.movementAB.A.label;
    DATA.abMovement.B.sessions = mabData.movementAB.B.sessions;
    DATA.abMovement.B.winRate  = mabData.movementAB.B.winRate;
    DATA.abMovement.B.label    = mabData.movementAB.B.label;
    console.log('Movement A/B data updated:', DATA.abMovement);
  } else {
    console.warn('Movement-AB parsing failed or no data, using mock values');
  }
} else {
  console.warn('Movement-AB fetch failed:', movementABResult.error);
}
```

---

### Testing (LT-3)
- [ ] First: test endpoint raw to confirm `movement_group` values
- [ ] Console shows `Movement A/B data updated:` with non-zero sessions
- [ ] Movement A/B cards show live winRate and session counts
- [ ] Labels update to real group names from GA4
- [ ] survival / avgLevel remain mock (expected)

---

## Implementation Order Summary

```
LT-1 (no Lambda, ~1–2 hrs):
  1. Extend progression-analysis parser — add waveReachedL4 accumulator
  2. Wire DATA.funnel in integration block
  3. Update buildFunnelTable() to use dynamic calculations

LT-2 (needs Lambda, ~3–4 hrs):
  1. Add music-ab handler to api/index.js → deploy Lambda
  2. Add music-ab parser to mapGA4ResponseToDATA()
  3. Add fetchMusicABData() function
  4. Add integration block before reinitAllCharts()

LT-3 (needs Lambda, ~2–3 hrs):
  1. Test movement-ab endpoint raw to confirm dimension values
  2. Add movement-ab handler to api/index.js → deploy Lambda
  3. Add movement-ab parser
  4. Add fetchMovementABData() function
  5. Add integration block
```

## Key Insertion Points (verified line numbers)

| What | File | Line |
|------|------|------|
| New Lambda handlers | `api/index.js` | After line 244 (after replay-rate, before realtime) |
| New parsers | `live.html` | Before line 3025 (`// ─── EXTRACTION ───`) |
| New fetch functions | `live.html` | After `fetchReplayRateData()` ends (~line 3515) |
| New integration blocks | `live.html` | After line 3831 (after replay-rate block, before `reinitAllCharts()`) |
| Progression parser loop | `live.html` | Line 2843 (`if (eventName === 'player_death'`) — add sibling block after |
| Progression parser return | `live.html` | ~Line 2872 — add `waveReachedL4` to return object |
| Progression integration | `live.html` | ~Line 3742 — after `DATA.deathsByLevel` assignments |
| DATA.funnel mock | `live.html` | Lines 2313–2321 (replaced by live) |
| DATA.funnelMusicOn/Off mock | `live.html` | Lines 2324–2335 (replaced by live in LT-2) |
| DATA.abMusic mock | `live.html` | Lines 2351–2354 (partially replaced by LT-2) |
| DATA.abSplit mock | `live.html` | Line 2302 (replaced by LT-2) |
| DATA.abMovement mock | `live.html` | Lines 2355–2358 (partially replaced by LT-3) |
| buildFunnelTable() | `live.html` | Lines 4103–4111 (replace hardcoded conversions) |
| renderFunnel() calls | `live.html` | Lines 4883–4885 (no change needed) |
| buildABCards() music section | `live.html` | Lines 4411–4443 (no change needed) |
| buildABCards() movement section | `live.html` | Lines 4445–4472 (no change needed) |
