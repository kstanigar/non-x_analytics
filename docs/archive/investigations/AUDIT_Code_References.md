# NON-X Analytics Dashboard Audit — Detailed Code References

**Quick lookup guide with exact file:line references for every data point and issue**

---

## LIVE DATA SOURCES

### Win Rate (✅ WORKING)

**Calculation:**
- File: `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`
- Lines: 1800-1801
```javascript
const winRate = gameStarts > 0
  ? ((playerWon / gameStarts) * 100).toFixed(1) + '%'
  : '0%';
```

**Event Sources:**
- `gameStarts = eventCounts['game_start']` (line 1794)
- `playerWon = eventCounts['game_complete']` (line 1795) — **⚠️ Verify event name**

**Display:**
- Line 2052: `document.getElementById('kpi-winrate').textContent = k.winRate;`

---

### Death Rate (✅ WORKING)

**Calculation:**
- File: `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`
- Lines: 1806-1809
```javascript
const completedGames = playerWon + playerDeath;
const deathRate = completedGames > 0
  ? ((playerDeath / completedGames) * 100).toFixed(1) + '%'
  : '0%';
```

**Note:** Fixed calculation (lines 1803-1805) to exclude abandoned games from denominator

**Event Sources:**
- `playerDeath = eventCounts['player_death']` (line 1796)
- `playerWon = eventCounts['game_complete']` (line 1795) — **⚠️ Verify event name**

**Display:**
- Line 2053: `document.getElementById('kpi-deathrate').textContent = k.deathRate;`

---

### Leaderboard Rate (✅ WORKING)

**Calculation:**
- File: `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`
- Lines: 1811-1813
```javascript
const lbRate = playerWon > 0
  ? ((leaderboardSubmit / playerWon) * 100).toFixed(0) + '%'
  : '0%';
```

**Event Sources:**
- `leaderboardSubmit = eventCounts['leaderboard_submit']` (line 1797)
- `playerWon = eventCounts['game_complete']` (line 1795) — **⚠️ Verify event name**

**Display:**
- Line 2056: `document.getElementById('kpi-lb-rate').textContent = k.lbRate;`

---

### Sessions (✅ PARTIAL LIVE)

**Data:**
- File: `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`
- Lines: 1820
```javascript
sessions: sessions.toLocaleString(),  // From eventCounts['session_start']
```

**Display:**
- Line 2050: `document.getElementById('kpi-sessions').textContent = k.sessions;`

**Note:** Gets overwritten by API response (line 1938) but also marked as sample data

---

## MOCK DATA STRUCTURES

### Sample KPI Values (All 12)

**File:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`
**Lines:** 1617-1631 (DATA object initialization)

```javascript
const DATA = {
  kpis: {
    sessions: '2,841',
    newPct: '73%',          // 🔴 MOCK
    winRate: '8.4%',        // ✅ Overwritten by API
    deathRate: '84.2%',     // ✅ Overwritten by API
    replay: '2.3×',         // 🔴 MOCK
    survival: '2:22',       // 🔴 MOCK
    lbRate: '31%',          // ✅ Overwritten by API
    avgLevel: '5.2',        // 🔴 MOCK
    deskWin: '11.2%',       // 🔴 MOCK
    mobWin: '5.7%',         // 🔴 MOCK
    deskLevel: '6.1',       // 🔴 MOCK
    mobLevel: '4.3',        // 🔴 MOCK
  },
```

---

### Daily Chart Data

**File:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`
**Lines:** 1632-1637

```javascript
daily: {
  labels: ['Feb 25','Feb 26','Feb 27',...,'Mar 10'],  // 14-day hardcoded
  plays:  [28,  41,  55,  38,  62,  79,  91, 104,  88,  73,  95, 118, 107, 132],
  wins:   [ 2,   3,   4,   3,   5,   7,   8,   9,   7,   5,   8,  10,   9,  11],
  survival:[110,118,125,122,134,140,145,148,143,138,147,152,149,155],
},
```

**Rendering:**
- Function: `chartDaily()` (lines 2098-2112)
- Chart instance: `document.getElementById('chart-daily')` (line 2101)

---

### Device Mix

**File:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`
**Lines:** 1638

```javascript
deviceMix: { desktop: 54, mobile: 46 },
```

**Rendering:**
- Function: `chartDevice()` (lines 2115-2125)
- Chart instance: `document.getElementById('chart-device')` (line 2117)

---

### A/B Split (Music)

**File:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`
**Lines:** 1639

```javascript
abSplit: { musicOn: 51, musicOff: 49 },
```

**Rendering:**
- Function: `chartABSplit()` (lines 2128-2138)
- Chart instance: `document.getElementById('chart-ab-split')` (line 2130)

---

### Powerups by Phase

**File:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`
**Lines:** 1640-1645

```javascript
powerups: {
  labels: ['Health','Double Laser','Shield','Quad Shot'],
  green: [420, 310, 280, 0],    // Quad Shot not in green
  red:   [510, 390, 340, 0],    // Quad Shot not in red
  purple:[280, 210, 430, 310],  // Quad Shot only in purple
},
```

**Rendering:**
- Function: `chartPowerup()` (lines 2141-2156)
- Chart instance: `document.getElementById('chart-powerup')` (line 2143)

---

### Funnel Data

**File:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`
**Lines:** 1646-1666

```javascript
funnel: [
  { name:'game_start',       n:2841, pct:100,  dropPct: null },
  { name:'wave_reached L4',  n:1562, pct:55.0, dropPct:45.0 },
  { name:'boss_attempt 1',   n:1034, pct:36.4, dropPct:33.8 },
  { name:'boss_defeated 1',  n: 687, pct:24.2, dropPct:33.6 },
  { name:'boss_defeated 2',  n: 382, pct:13.4, dropPct:44.4 },
  { name:'boss_defeated 3',  n: 271, pct: 9.5, dropPct:29.1 },
  { name:'player_won',       n: 239, pct: 8.4, dropPct:11.8 },
],
funnelMusicOn: [...],  // Lines 1655-1660
funnelMusicOff: [...], // Lines 1661-1666
```

**Rendering:**
- Function: `renderFunnel()` (lines 2159-2182)
- Containers:
  - `'funnel-main'` (line 2739)
  - `'funnel-music-on'` (line 2740)
  - `'funnel-music-off'` (line 2741)

---

### Deaths by Level

**File:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`
**Lines:** 1667-1673

```javascript
deathsByLevel: {
  labels:['L1','L2','L3','L4','Boss 1','L5','L6','L7','L8','Boss 2','L9','L10','L11','L12','Boss 3'],
  counts:[  88, 124, 210, 187,     347,  98, 143, 221, 195,     308,  62,  91,  128,  87,     118],
  phase: ['grn','grn','grn','grn','grn','red','red','red','red','red','pur','pur','pur','pur','pur'],
  isBoss:[false,false,false,false,true,false,false,false,false,true,false,false,false,false,true],
},
```

**Rendering:**
- Function: `chartDropoff()` (lines 2207-2295)
- Chart instance: `document.getElementById('chart-dropdoff')` (line 2257)

---

### Boss Data

**File:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`
**Lines:** 1675-1679

```javascript
bosses: [
  { id:1, name:'BOSS 1',  phase:'GREEN', threshold:'L4',  attempts:1034, defeats:687, defeat_rate:66.4, avg_attempts:1.5, color:'#39FF14' },
  { id:2, name:'BOSS 2',  phase:'RED',   threshold:'L8',  attempts: 690, defeats:382, defeat_rate:55.4, avg_attempts:1.8, color:'#FF3366' },
  { id:3, name:'BOSS 3',  phase:'PURPLE',threshold:'L12', attempts: 389, defeats:271, defeat_rate:69.7, avg_attempts:1.4, color:'#CC88FF' },
],
```

**Rendering:**
- Function: `buildBossCards()` (lines 2298-2335) → container: `'boss-cards'` (line 2299)
- Function: `chartBossRatio()` (lines 2337-2350) → chart: `'chart-boss-ratio'` (line 2339)
- Function: `chartBossPlatform()` (lines 2352-2369) → chart: `'chart-boss-platform'` (line 2353)
- Function: `buildBossTable()` (lines 2371-2403) → tbody: `'boss-table'` (line 2372)

---

### A/B Test Data

**File:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`
**Lines:** 1680-1687

```javascript
abMusic: {
  A: { label:'Music ON', sessions:1449, winRate:'9.6%', survival:'2:32', replay:'2.5×', lbRate:'34%', avgLevel:'5.7', musicToggle:'18%' },
  B: { label:'Music OFF', sessions:1392, winRate:'7.2%', survival:'2:11', replay:'2.1×', lbRate:'27%', avgLevel:'4.8', musicToggle:'22%' },
},
abMovement: {
  A: { label:'Scheme A', sessions:1389, winRate:'8.1%', survival:'2:19', avgLevel:'5.0' },
  B: { label:'Scheme B', sessions:1452, winRate:'8.7%', survival:'2:25', avgLevel:'5.4' },
},
```

**Rendering:**
- Function: `buildABCards()` (lines 2405-2490)
  - Music cards container: `'ab-music-cards'` (line 2416)
  - Movement cards container: `'ab-movement-cards'` (line 2447)
  - Significance table tbody: `'ab-sig-table'` (line 2470)

---

### Platform Data

**File:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`
**Lines:** 1688-1691

```javascript
platform: {
  desktop: { sessions:1534, winRate:'11.2%', survival:'2:38', replay:'2.5×', avgLevel:'6.1', lbRate:'36%', boss1:'28.4%', boss2:'17.1%', boss3:'12.8%' },
  mobile:  { sessions:1307, winRate:'5.7%',  survival:'2:04', replay:'2.1×', avgLevel:'4.3', lbRate:'24%', boss1:'19.6%', boss2:'10.1%', boss3: '6.7%' },
},
```

**Rendering:**
- Function: `chartPlatformFunnel()` (lines 2493-2511) → chart: `'chart-platform-funnel'` (line 2495)
- Function: `chartSurvivalDist()` (lines 2513-2530) → chart: `'chart-survival-dist'` (line 2514)
- Function: `buildPlatformTable()` (lines 2532-2557) → tbody: `'platform-table'` (line 2545)

---

### AI Agent Data (ALL EMPTY)

**File:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`
**Lines:** 1692-1723

```javascript
aiAgent: {
  kpis: {
    avgStartTier: '—',       // Line 1694
    avgFinalTier: '—',       // Line 1695
    speedLockRate: '—',      // Line 1696
    avgAdjustments: '—',     // Line 1697
  },
  tierDist: {
    labels: ['-3 Tutorial','-2 Beginner','-1 Easy','0 Normal','1 Challenge','2 Veteran','3 Expert'],
    counts: [0, 0, 0, 0, 0, 0, 0],  // Line 1701 — ALL ZEROS
  },
  tierFlow: {
    increases: 0,     // Line 1704
    decreases: 0,     // Line 1705
  },
  scoreMultDist: {
    labels: ['0.50×','0.70×','0.85×','1.00×','1.20×','1.40×','1.75×','1.50×+'],
    counts: [0, 0, 0, 0, 0, 0, 0, 0],  // Line 1709 — ALL ZEROS
  },
  tierScores: {
    labels: ['-3','-2','-1','0','1','2','3'],
    avgScores: [0, 0, 0, 0, 0, 0, 0],  // Line 1713 — ALL ZEROS
  },
  deathTriggers: {
    labels: ['Green','Red','Purple'],
    counts: [0, 0, 0],  // Line 1717 — ALL ZEROS
  },
  tierMetrics: [
    // Line 1720-1721 — EMPTY ARRAY
  ],
},
```

**Rendering Functions:**
- KPIs: `populateAIKPIs()` (lines 2560-2566)
- Tier Distribution: `chartAITierDist()` (lines 2568-2589) → chart: `'chart-ai-tier-dist'` (line 2570)
- Tier Flow: `chartAITierFlow()` (lines 2591-2610) → chart: `'chart-ai-tier-flow'` (line 2593)
- Score Multiplier: `chartAIScoreMult()` (lines 2612-2633) → chart: `'chart-ai-score-mult'` (line 2614)
- Tier Score: `chartAITierScore()` (lines 2635-2658) → chart: `'chart-ai-tier-score'` (line 2637)
- Death Triggers: `chartAIDeathTriggers()` (lines 2660-2682) → chart: `'chart-ai-death-triggers'` (line 2662)
- Tier Table: `buildAITierTable()` (lines 2684-2706) → tbody: `'ai-tier-table'` (line 2685)

---

## API DATA MAPPING

### Lambda Configuration

**File:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`
**Lines:** 1586-1606

```javascript
const API_CONFIG = {
  baseURL: 'https://6waopo3jh1.execute-api.us-east-2.amazonaws.com/prod',
  endpoints: { analytics: '/analytics' },
  apiKey: 'JWAeV8NkkK4W2uB0whSRQ1KTd05HakIV6v0nCr3x',  // 🔴 SECURITY RISK
  timeout: 15000,
  retryAttempts: 2,
  retryDelay: 2000,
  refreshInterval: 60 * 60 * 1000,  // Changed from 5 min to 1 hour (Apr 26)
  autoRefreshEnabled: true
};
```

---

### Data Fetch Function

**File:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`
**Lines:** 1850-1889

```javascript
async function fetchGA4Data(type = 'standard') {
  const versionSelect = document.getElementById('version-select');
  const version = versionSelect ? versionSelect.value : '4.3';
  const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.analytics}?version=${version}`;  // Line 1856

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': API_CONFIG.apiKey,  // Line 1865
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    // ... error handling ...
    const data = await response.json();
    return { success: true, data };
  }
  // ... catch block ...
}
```

---

### Data Mapping & KPI Calculation

**File:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`
**Lines:** 1736-1839

```javascript
function mapGA4ResponseToDATA(response, reportType = 'standard') {
  // Validation (lines 1737-1758)
  if (!response || !Array.isArray(response.rows) || response.rows.length === 0) {
    return { error: '...', eventCounts: {}, isEmpty: true };
  }

  // Extraction (lines 1760-1789)
  const eventCounts = {};
  response.rows.forEach((row) => {
    const eventName = row.dimensionValues[0].value;
    const eventCount = parseInt(row.metricValues[0].value, 10);
    eventCounts[eventName] = eventCount;
  });

  // KPI Calculations (lines 1791-1813)
  const sessions = eventCounts['session_start'] || 0;
  const gameStarts = eventCounts['game_start'] || 0;
  const playerWon = eventCounts['game_complete'] || 0;  // ⚠️ Line 1795
  const playerDeath = eventCounts['player_death'] || 0;
  const leaderboardSubmit = eventCounts['leaderboard_submit'] || 0;

  const winRate = gameStarts > 0
    ? ((playerWon / gameStarts) * 100).toFixed(1) + '%'
    : '0%';  // Lines 1800-1801

  const deathRate = (playerWon + playerDeath) > 0
    ? ((playerDeath / (playerWon + playerDeath)) * 100).toFixed(1) + '%'
    : '0%';  // Lines 1807-1809

  const lbRate = playerWon > 0
    ? ((leaderboardSubmit / playerWon) * 100).toFixed(0) + '%'
    : '0%';  // Lines 1811-1813

  // Return mapped data (lines 1817-1839)
  return {
    eventCounts,
    kpis: {
      sessions: sessions.toLocaleString(),
      winRate,
      deathRate,
      lbRate,
      newPct: '—',          // Unavailable
      replay: '—',          // Unavailable
      survival: '—',        // Unavailable
      avgLevel: '—',        // Unavailable
      deskWin: '—',         // Unavailable
      mobWin: '—',          // Unavailable
      deskLevel: '—',       // Unavailable
      mobLevel: '—',        // Unavailable
    },
    reportType,
    rowCount: response.rowCount || response.rows.length,
    timestamp: new Date().toISOString(),
    isEmpty: false
  };
}
```

---

### Load and Render Pipeline

**File:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`
**Lines:** 1896-1952

```javascript
async function loadAndRenderGA4Data(type = 'standard') {
  if (isRefreshing) return false;
  isRefreshing = true;
  updateAPIStatus('loading', 'Fetching data...');

  console.log(`[${new Date().toLocaleTimeString()}] Fetching GA4 data...`);

  const result = await fetchGA4Data(type);  // Line 1907

  if (!result.success) {
    updateAPIStatus('error', `Error: ${result.error}`);
    showToast(`Failed to load data: ${result.error}`, 'error');
    isRefreshing = false;
    return false;
  }

  console.log('Mapping GA4 response to DATA format...');
  const mappedData = mapGA4ResponseToDATA(result.data, type);  // Line 1918

  if (mappedData.error) {
    updateAPIStatus('error', `Mapping error: ${mappedData.error}`);
    showToast(`Failed to process data: ${mappedData.error}`, 'error');
    isRefreshing = false;
    return false;
  }

  if (mappedData.isEmpty) {
    updateAPIStatus('warning', mappedData.message || 'No data available');
    showToast(mappedData.message || 'No data in date range', 'warning');
    isRefreshing = false;
    return false;
  }

  // Update DATA object (only KPIs for now)
  console.log(`Successfully mapped ${mappedData.rowCount} events`);
  DATA.kpis = mappedData.kpis;  // Line 1938 ← KEY LINE: Updates live KPIs
  DATA.eventCounts = mappedData.eventCounts;

  // Re-render all charts
  reinitAllCharts();  // Line 1942 ← KEY LINE: Updates all visualizations

  // Update status
  lastUpdateTime = new Date();
  updateAPIStatus('success', 'Connected');
  updateLastUpdateTime();
  showToast('Live data updated successfully', 'success');

  isRefreshing = false;
  return true;
}
```

---

### Reinit All Charts

**File:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`
**Lines:** 2728-2768

```javascript
function reinitAllCharts() {
  // Populate KPIs
  populateKPIs();  // Line 2730 ← Only 4 KPIs get updated from live API

  // Overview tab charts
  chartDaily();      // Line 2733 ← Uses mock DATA.daily
  chartDevice();     // Line 2734 ← Uses mock DATA.deviceMix
  chartABSplit();    // Line 2735 ← Uses mock DATA.abSplit
  chartPowerup();    // Line 2736 ← Uses mock DATA.powerups

  // Funnel tab
  renderFunnel('funnel-main', DATA.funnel, CYAN);
  renderFunnel('funnel-music-on', DATA.funnelMusicOn, CYAN);
  renderFunnel('funnel-music-off', DATA.funnelMusicOff, MAG);
  buildFunnelTable();
  chartDropoff();

  // Boss Analysis tab
  buildBossCards();
  chartBossRatio();
  chartBossPlatform();
  buildBossTable();

  // A/B Tests tab
  buildABCards();

  // Platform Comparison tab
  chartPlatformFunnel();
  chartSurvivalDist();
  buildPlatformTable();

  // AI Agent tab
  populateAIKPIs();
  chartAITierDist();
  chartAITierFlow();
  chartAIScoreMult();
  chartAITierScore();
  chartAIDeathTriggers();
  buildAITierTable();
}
```

**Issue:** Only `populateKPIs()` uses the live API data. All charts continue using pre-initialized DATA object.

---

## CRITICAL ISSUES & LOCATIONS

### Issue 1: Event Name Mismatch

**File:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`
**Line:** 1795

```javascript
const playerWon = eventCounts['game_complete'] || 0;  // Fixed: GA4 sends 'game_complete', not 'player_won'
```

**Comment:** Indicates potential mismatch between game code and Lambda
**Impact:** Win Rate and Leaderboard Rate may calculate wrong values
**Action Required:** Verify actual event name in GA4 DebugView
**Effort:** 15 minutes

---

### Issue 2: API Key Exposed

**File:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`
**Line:** 1596

```javascript
apiKey: 'JWAeV8NkkK4W2uB0whSRQ1KTd05HakIV6v0nCr3x',
```

**Problem:** API key visible in browser JavaScript
**Impact:** Security risk — anyone can call the API
**Action Required:** Move to environment variables or AWS Secrets Manager
**Effort:** 1-2 hours

---

### Issue 3: Platform Filter Broken

**File:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`
**Lines:** 2074-2088

```javascript
function setDropoffPlatform(p) {
  // Guard: mobile/desktop split requires levelMobile/levelDesktop data
  const hasSplit = Object.values(DATA.deathsByLevel.levelMobile || {}).some(v => v > 0);
  if (!hasSplit && p !== 'all') {
    showToast('Load the Deaths CSV to enable platform split', 'warn');
    return;
  }
  // ...
}
```

**Problem:** References deprecated CSV upload; doesn't check for GA4 platform data
**Impact:** Platform toggle on Funnel page won't work with live API
**Action Required:** Update to check for platform dimension in GA4 response
**Effort:** 2-3 hours

---

### Issue 4: AI Agent Data All Empty

**File:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`
**Lines:** 1693-1723 (DATA initialization)

```javascript
aiAgent: {
  kpis: {
    avgStartTier: '—',     // Line 1694
    avgFinalTier: '—',     // Line 1695
    speedLockRate: '—',    // Line 1696
    avgAdjustments: '—',   // Line 1697
  },
  tierDist: { counts: [0, 0, 0, 0, 0, 0, 0] },  // Line 1701 — ALL ZEROS
  tierFlow: { increases: 0, decreases: 0 },     // Lines 1704-1706 — ZEROS
  scoreMultDist: { counts: [0, 0, 0, 0, 0, 0, 0, 0] },  // Line 1709 — ZEROS
  tierScores: { avgScores: [0, 0, 0, 0, 0, 0, 0] },    // Line 1713 — ZEROS
  deathTriggers: { counts: [0, 0, 0] },  // Line 1717 — ZEROS
  tierMetrics: [],  // Line 1720-1721 — EMPTY
},
```

**Problem:** All AI Agent metrics are empty/zero
**Root Cause:** Unknown — either:
1. AI Agent not implemented in game code
2. AI events not firing
3. Events not reaching GA4
**Action Required:** Check GA4 DebugView for ai_tier_assigned and ai_difficulty_adjusted events
**Effort:** 1-3 hours diagnosis

---

## LAMBDA API LIMITATIONS

**File:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/api/index.js`

### Current Request Structure (Lines 41-50)

```javascript
const standardRequest = {
  property: `properties/${propertyId}`,
  dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
  dimensions: [{ name: 'eventName' }],  // ← Only event name
  metrics: [{ name: 'eventCount' }],    // ← Only event count
};
```

### What's Missing for Full Dashboard

```javascript
// ❌ NOT SUPPORTED (would need)
dimensions: [
  { name: 'eventName' },
  { name: 'customEvent:platform' },    // For platform splits
  { name: 'customEvent:level_reached' },
  { name: 'customEvent:boss_id' },
  { name: 'customEvent:ab_music_group' },
  { name: 'date' },                    // For daily bucketing
]

// ❌ NOT SUPPORTED (would need)
metrics: [
  { name: 'eventCount' },
  { name: 'averageEventValue' },       // For averages
]

// ❌ NOT SUPPORTED (would need)
dimensionFilter: {
  andGroup: {
    expressions: [
      { fieldName: 'customEvent:analytics_version', stringFilter: { ... } },
      { fieldName: 'customEvent:platform', stringFilter: { value: 'desktop' } }
    ]
  }
}
```

---

## INSIGHT BOX WARNINGS

### Overview Page Warning

**File:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`
**Lines:** 975-977

```javascript
<div class="insight-box" id="overview-insight">
  <strong>📡 Connect your GA4 data source</strong> — This dashboard uses sample data.
  To populate with real data, connect GA4 via the Looker Studio guide (tab 6) and export event metrics to replace the placeholder values.
</div>
```

**Issue:** Text references deprecated Looker Studio export process (CSV drag-and-drop)
**Action Required:** Update to reflect live API architecture
**Suggested Text:**
```
✅ LIVE DATA: Sessions, Win Rate, Death Rate, Leaderboard Rate
⚠️ SAMPLE DATA: Platform splits, funnel analysis, A/B tests, AI agent metrics
See Dashboard Audit Report for complete status. Phase 6 enhancements coming soon.
```

---

## AUTO-REFRESH CONFIGURATION

**File:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`
**Lines:** 1603-1604, 2018-2034

```javascript
// Config
refreshInterval: 60 * 60 * 1000,  // 1 hour (changed from 5 min on Apr 26)

// Start function
function startAutoRefresh() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(async () => {
    console.log('Auto-refresh triggered');
    await loadAndRenderGA4Data('standard');
  }, API_CONFIG.refreshInterval);

  // Also update "last updated" display every 10 seconds
  setInterval(updateLastUpdateTime, 10000);
  console.log(`Auto-refresh enabled (every ${API_CONFIG.refreshInterval / 1000 / 60} minutes)`);
}
```

**Note:** Refresh interval was optimized from 5 minutes to 1 hour (per comment on line 51 of API_Task_List.md) to reduce API costs by 92%.

---

## INITIALIZATION

**File:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`
**Lines:** 2817-2837

```javascript
document.addEventListener('DOMContentLoaded', async () => {
  console.log('NON-X Analytics Live Dashboard - Initializing...');
  console.log('Version: 5.0 (Live API Integration)');
  console.log('API Endpoint:', API_CONFIG.baseURL + API_CONFIG.endpoints.analytics);

  updateAPIStatus('loading', 'Initializing...');

  // Load initial data from API
  const success = await loadAndRenderGA4Data('standard');  // Line 2826

  if (success) {
    // Start auto-refresh timer
    startAutoRefresh();  // Line 2830
    console.log('✅ Dashboard initialized successfully');
  } else {
    console.warn('⚠️ Dashboard initialized with errors - check console');
    // Still show sample data from DATA object defaults
    reinitAllCharts();  // Line 2835 — Fallback to mock data
  }
});
```

**Fallback:** If API fails, dashboard still renders using hardcoded sample data (line 2835)
