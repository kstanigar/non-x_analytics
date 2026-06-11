# Phase 7: Music Funnel Table — Implementation Plan

**Created:** June 10, 2026
**Goal:** Populate Music ON / Music OFF / Delta columns in the Conversion Rates Table
**Estimated time:** 1–2 hrs

---

## Problem

`buildFunnelTable()` has hardcoded `on: '—', off: '—', delta: '—'` for all 7 rows.
The music-ab endpoint returns aggregate counts per group but no `boss_id` breakdown,
so per-stage conversion rates cannot be computed from it alone.

---

## Solution

New `subType=music-funnel` endpoint: `ab_music_group × boss_id × eventName`
- Returns boss_attempt / boss_defeated counts per group per boss
- Parser combines with `DATA.abMusic.A/B.sessions` (already live from music-ab) to build full 8-stage funnels
- `buildFunnelTable()` reads `DATA.funnelMusicOn` / `DATA.funnelMusicOff` for ON/OFF/Delta columns

---

## 2026 Best Practice Research

**1. GA4 Data API — 3-dim query**
`ab_music_group × boss_id × eventName` is valid. GA4 allows up to 9 dimensions per `runReport` call.
Expected rows: 2 groups × 3 bosses × 2 events = max 12 rows. No sampling risk at these volumes (~100 game_starts) — GA4 only samples above 10M events/property/day. Standard `runReport` (not `runRealtimeReport`).

**2. AbortSignal.timeout() — still correct for 2026**
Baseline 2024 — Chrome 124+, Firefox 100+, Safari 17+. ~94% global browser coverage as of mid-2025. Throws `TimeoutError` (not `AbortError`). No changes since last session. Continue using this pattern.

**3. Parallel async fetches — Promise.all**
`Promise.all([fetchMusicABData(), fetchMusicFunnelData()])` is the correct pattern when two fetches are independent. Saves ~200–500ms per dashboard load. Caveat: if one rejects, both fail — use `Promise.allSettled()` if you want independent error handling. For this dashboard, `Promise.all` is fine since both have individual try/catch returning `{ success, error }` objects (they never reject).

Integration sequencing: process music-ab result FIRST (updates `DATA.abMusic.A.sessions`), THEN process music-funnel result (parser reads that value from global DATA).

**4. Conversion rate calculation**
Division-by-zero: guard with `prev.n > 0` before dividing. Use `toFixed(1)` for display consistency. Delta: `(onNum - offNum).toFixed(1) + 'pp'` with leading `+` sign for positive. Guard `isNaN` on both before computing delta.

**5. Dimension cardinality at low volumes**
At ~112 game_starts (all-time v4.3), some cells will be 0. Boss 3 has ~33 attempts. Parser must handle missing rows gracefully — use `|| 0` fallback on all counts. No `(not set)` expected for `boss_id` on boss_attempt/boss_defeated events (it's always set when these events fire).

---

## Task List

- [ ] **Task 1** — Add `music-funnel` handler to `api/index.js` (line 259)
- [ ] **Task 2** — Deploy Lambda
- [ ] **Task 3** — Test endpoint raw (confirm `ab_music_group` = A/B, `boss_id` = 1/2/3)
- [ ] **Task 4** — Add `music-funnel` parser to `mapGA4ResponseToDATA()` (line 3063)
- [ ] **Task 5** — Add `fetchMusicFunnelData()` function (line 3586)
- [ ] **Task 6** — Upgrade integration to `Promise.all` parallel fetch (lines 3921–3942)
- [ ] **Task 7** — Update `buildFunnelTable()` to use live ON/OFF/Delta (lines 4214–4232)
- [ ] **Task 8** — Test dashboard — confirm table populates

---

## Change 1: api/index.js — music-funnel handler

**Location:** After line 259 (end of music-ab `[response]` line), before `} else if (requestType === 'realtime')`

**Before (line 259–260):**
```javascript
            [response] = await analyticsDataClient.runReport(musicABRequest);
        } else if (requestType === 'realtime') {
```

**After:**
```javascript
            [response] = await analyticsDataClient.runReport(musicABRequest);
        } else if (requestType === 'standard' && subType === 'music-funnel') {
            // ─── MUSIC FUNNEL REQUEST (Per-boss funnel split by ab_music_group) ───
            const musicFunnelRequest = {
                property: `properties/${propertyId}`,
                dateRanges: [dateRange],
                // 3-dim query: ab_music_group × boss_id × eventName
                // Returns boss_attempt/boss_defeated counts per group (A/B) per boss (1/2/3)
                // Expected rows: 2 groups × 3 bosses × 2 events = max 12 rows
                dimensions: [
                    { name: 'customEvent:ab_music_group' }, // Dimension 0: 'A' or 'B'
                    { name: 'customEvent:boss_id' },         // Dimension 1: '1', '2', '3'
                    { name: 'eventName' }                    // Dimension 2: 'boss_attempt', 'boss_defeated'
                ],
                metrics: [{ name: 'eventCount' }],
            };
            if (dimensionFilter) { musicFunnelRequest.dimensionFilter = dimensionFilter; }
            [response] = await analyticsDataClient.runReport(musicFunnelRequest);
        } else if (requestType === 'realtime') {
```

---

## Change 2: live.html — music-funnel parser

**Location:** Line 3063 (after music-ab parser `}`, before `// ─── EXTRACTION ───` at line 3064)

**Insert between lines 3062 and 3064:**
```javascript
        if (reportType === 'music-funnel') {
          // Parse ab_music_group × boss_id × eventName response
          // Builds 8-stage funnel arrays for Music ON (Group A) and Music OFF (Group B)
          const bossCounts = {
            a: { boss1: { attempts: 0, defeats: 0 }, boss2: { attempts: 0, defeats: 0 }, boss3: { attempts: 0, defeats: 0 } },
            b: { boss1: { attempts: 0, defeats: 0 }, boss2: { attempts: 0, defeats: 0 }, boss3: { attempts: 0, defeats: 0 } },
          };

          if (response.rows && response.rows.length > 0) {
            response.rows.forEach(row => {
              const group     = row.dimensionValues[0]?.value?.toLowerCase() || '';
              const bossId    = row.dimensionValues[1]?.value || '';
              const eventName = row.dimensionValues[2]?.value || '';
              const count     = parseInt(row.metricValues[0]?.value || '0', 10);
              if (!bossCounts[group]) return; // skip unknown groups (e.g. '(not set)')
              const bKey = `boss${bossId}`;
              if (!bossCounts[group][bKey]) return; // skip unexpected boss_id values
              if (eventName === 'boss_attempt')  bossCounts[group][bKey].attempts += count;
              if (eventName === 'boss_defeated') bossCounts[group][bKey].defeats  += count;
            });
          }

          // game_start counts come from DATA.abMusic (already populated by music-ab fetch)
          const gsA = DATA.abMusic?.A?.sessions || 0;
          const gsB = DATA.abMusic?.B?.sessions || 0;

          const buildArr = (grp, gs) => {
            const bc  = bossCounts[grp];
            const pct = (n) => gs > 0 ? parseFloat(((n / gs) * 100).toFixed(1)) : 0;
            return [
              { name: 'game_start',      n: gs,                    pct: 100              },
              { name: 'boss_attempt 1',  n: bc.boss1.attempts,     pct: pct(bc.boss1.attempts)  },
              { name: 'boss_defeated 1', n: bc.boss1.defeats,      pct: pct(bc.boss1.defeats)   },
              { name: 'boss_attempt 2',  n: bc.boss2.attempts,     pct: pct(bc.boss2.attempts)  },
              { name: 'boss_defeated 2', n: bc.boss2.defeats,      pct: pct(bc.boss2.defeats)   },
              { name: 'boss_attempt 3',  n: bc.boss3.attempts,     pct: pct(bc.boss3.attempts)  },
              { name: 'boss_defeated 3', n: bc.boss3.defeats,      pct: pct(bc.boss3.defeats)   },
              { name: 'player_won',      n: bc.boss3.defeats,      pct: pct(bc.boss3.defeats)   }, // proxy for player_won
            ];
          };

          return {
            funnelMusicOn:  buildArr('a', gsA),
            funnelMusicOff: buildArr('b', gsB),
            hasRealData: (gsA + gsB) > 0,
          };
        }
```

---

## Change 3: live.html — fetchMusicFunnelData()

**Location:** Line 3586 (after `fetchMusicABData()` closes, before `loadAndRenderGA4Data`)

**Insert between lines 3586 and 3588:**
```javascript
      async function fetchMusicFunnelData() {
        const dataRangeSelect = document.getElementById('data-range-select');
        const selectedValue = dataRangeSelect ? dataRangeSelect.value : '90day-43';
        const [dateRange, versionShort] = selectedValue.split('-');
        const version = versionShort === '43' ? '4.3' : versionShort === 'all' ? 'all' : '4.3';
        const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.analytics}?type=standard&subType=music-funnel&version=${version}&dateRange=${dateRange}`;
        try {
          const response = await fetch(url, {
            signal: AbortSignal.timeout(API_CONFIG.timeout), // AbortSignal.timeout() — Baseline 2024
            headers: { 'Content-Type': 'application/json' }
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          const data = await response.json();
          return { success: true, data };
        } catch (error) {
          if (error.name === 'TimeoutError') { // AbortSignal.timeout() throws TimeoutError, not AbortError
            console.error(`Music-Funnel request timeout after ${API_CONFIG.timeout}ms`);
            return { success: false, error: 'Request timeout', data: null };
          }
          console.error('Failed to fetch music funnel data:', error);
          return { success: false, error: error.message, data: null };
        }
      }
```

---

## Change 4: live.html — Integration block (lines 3921–3942)

**Location:** Replace current sequential music-ab fetch with parallel `Promise.all`

**Before (lines 3921–3942):**
```javascript
        // Fetch music A/B data (win rate / lb rate / toggle rate split by ab_music_group)
        const musicABResult = await fetchMusicABData();
        if (musicABResult.success && musicABResult.data) {
          const mabData = mapGA4ResponseToDATA(musicABResult.data, 'music-ab');
          if (!mabData.error && mabData.hasRealData) {
            DATA.abMusic.A.sessions    = mabData.musicAB.on.sessions;
            DATA.abMusic.A.winRate     = mabData.musicAB.on.winRate;
            DATA.abMusic.A.lbRate      = mabData.musicAB.on.lbRate;
            DATA.abMusic.A.musicToggle = mabData.musicAB.on.musicToggle;
            DATA.abMusic.B.sessions    = mabData.musicAB.off.sessions;
            DATA.abMusic.B.winRate     = mabData.musicAB.off.winRate;
            DATA.abMusic.B.lbRate      = mabData.musicAB.off.lbRate;
            DATA.abMusic.B.musicToggle = mabData.musicAB.off.musicToggle;
            DATA.abSplit.musicOn       = mabData.abSplit.musicOn;
            DATA.abSplit.musicOff      = mabData.abSplit.musicOff;
            console.log('Music A/B data updated:', DATA.abMusic, DATA.abSplit);
          } else {
            console.warn('Music-AB parsing failed or no data, using mock values');
          }
        } else {
          console.warn('Music-AB fetch failed:', musicABResult.error);
        }
```

**After (parallel fetch — saves ~300ms per load):**
```javascript
        // Fetch music A/B + funnel data in parallel (independent queries)
        // Promise.all is safe here — both fetches return {success, error} and never reject
        const [musicABResult, musicFunnelResult] = await Promise.all([
          fetchMusicABData(),
          fetchMusicFunnelData(),
        ]);

        // Process music-ab FIRST — music-funnel parser reads DATA.abMusic.A/B.sessions
        if (musicABResult.success && musicABResult.data) {
          const mabData = mapGA4ResponseToDATA(musicABResult.data, 'music-ab');
          if (!mabData.error && mabData.hasRealData) {
            DATA.abMusic.A.sessions    = mabData.musicAB.on.sessions;
            DATA.abMusic.A.winRate     = mabData.musicAB.on.winRate;
            DATA.abMusic.A.lbRate      = mabData.musicAB.on.lbRate;
            DATA.abMusic.A.musicToggle = mabData.musicAB.on.musicToggle;
            DATA.abMusic.B.sessions    = mabData.musicAB.off.sessions;
            DATA.abMusic.B.winRate     = mabData.musicAB.off.winRate;
            DATA.abMusic.B.lbRate      = mabData.musicAB.off.lbRate;
            DATA.abMusic.B.musicToggle = mabData.musicAB.off.musicToggle;
            DATA.abSplit.musicOn       = mabData.abSplit.musicOn;
            DATA.abSplit.musicOff      = mabData.abSplit.musicOff;
            console.log('Music A/B data updated:', DATA.abMusic, DATA.abSplit);
          } else {
            console.warn('Music-AB parsing failed or no data, using mock values');
          }
        } else {
          console.warn('Music-AB fetch failed:', musicABResult.error);
        }

        // Process music-funnel AFTER music-ab (parser reads DATA.abMusic.A/B.sessions)
        if (musicFunnelResult.success && musicFunnelResult.data) {
          const mfData = mapGA4ResponseToDATA(musicFunnelResult.data, 'music-funnel');
          if (!mfData.error && mfData.hasRealData) {
            DATA.funnelMusicOn  = mfData.funnelMusicOn;
            DATA.funnelMusicOff = mfData.funnelMusicOff;
            console.log('Music funnel data updated:', DATA.funnelMusicOn, DATA.funnelMusicOff);
          } else {
            console.warn('Music-Funnel parsing failed or no data, using mock values');
          }
        } else {
          console.warn('Music-Funnel fetch failed:', musicFunnelResult.error);
        }
```

---

## Change 5: live.html — buildFunnelTable() (line 4214)

**Location:** `buildFunnelTable()` function, lines 4214–4232

**Before:**
```javascript
      function buildFunnelTable() {
        // Dynamic conversion rates from live DATA.funnel; music ON/OFF columns are '—' until LT-2 is complete
        const conversions = DATA.funnel.slice(1).map((stage, i) => {
          const prev = DATA.funnel[i];
          const rate = prev.n > 0 ? ((stage.n / prev.n) * 100).toFixed(1) + '%' : '—';
          return { from: prev.name, to: stage.name, overall: rate, on: '—', off: '—', delta: '—' };
        });
```

**After:**
```javascript
      function buildFunnelTable() {
        // Dynamic conversion rates from live DATA.funnel, DATA.funnelMusicOn, DATA.funnelMusicOff
        const conversions = DATA.funnel.slice(1).map((stage, i) => {
          const prev = DATA.funnel[i];
          const rate = prev.n > 0 ? ((stage.n / prev.n) * 100).toFixed(1) + '%' : '—';

          // Music ON rate from DATA.funnelMusicOn (live after music-funnel fetch)
          const onStage  = DATA.funnelMusicOn?.[i + 1];
          const onPrev   = DATA.funnelMusicOn?.[i];
          const onRate   = (onPrev?.n > 0 && onStage) ? ((onStage.n / onPrev.n) * 100).toFixed(1) + '%' : '—';

          // Music OFF rate from DATA.funnelMusicOff (live after music-funnel fetch)
          const offStage = DATA.funnelMusicOff?.[i + 1];
          const offPrev  = DATA.funnelMusicOff?.[i];
          const offRate  = (offPrev?.n > 0 && offStage) ? ((offStage.n / offPrev.n) * 100).toFixed(1) + '%' : '—';

          // Delta in percentage points (positive = ON is better, negative = OFF is better)
          const onNum  = parseFloat(onRate);
          const offNum = parseFloat(offRate);
          const delta  = (!isNaN(onNum) && !isNaN(offNum))
            ? (onNum - offNum >= 0 ? '+' : '') + (onNum - offNum).toFixed(1) + 'pp'
            : '—';

          return { from: prev.name, to: stage.name, overall: rate, on: onRate, off: offRate, delta };
        });
```

---

## Possible Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `DATA.funnelMusicOn` reads before music-ab completes | Wrong Promise ordering | Always process music-ab integration BEFORE calling `mapGA4ResponseToDATA` for music-funnel |
| `boss_id` values not `'1'/'2'/'3'` | GA4 sends different format | Log raw response, check `dimensionValues[1].value` |
| All `—` in table after deploy | music-funnel fetch failing silently | Check console for `Music-Funnel fetch failed:` warning |
| `gsA = 0` in parser | music-ab not yet processed | Promise.all ordering correct — music-ab integration runs first |
| Delta shows `NaN` | `parseFloat('—')` returns NaN | Guard: `!isNaN(onNum) && !isNaN(offNum)` already covers this |

---

## Testing Checklist

- [ ] Console: `Music funnel data updated:` shows arrays with 8 stages and non-zero `n` values
- [ ] Conversion Rates Table: all 7 rows show % in Music ON, Music OFF, Delta columns
- [ ] Delta shows `+` for positive and `-` for negative values
- [ ] Selector change (7day → 90day) triggers re-fetch and table updates
- [ ] If music-funnel fetch fails: table falls back to `—` gracefully (no crash)

---

## Commit Message (after testing)

```bash
git add api/index.js live.html && git commit -m "feat(phase7-lt2b): populate music funnel conversion table

- New subType=music-funnel: ab_music_group × boss_id × eventName
- Parser builds 8-stage DATA.funnelMusicOn/Off arrays per group
- fetchMusicABData + fetchMusicFunnelData run in parallel (Promise.all)
- buildFunnelTable() reads live ON/OFF/Delta from funnelMusicOn/Off arrays"
```
