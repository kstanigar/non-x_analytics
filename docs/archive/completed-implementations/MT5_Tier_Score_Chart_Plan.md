# MT-5: Tier vs Final Score — Scatter Chart Implementation Plan

**Status:** 📋 READY TO IMPLEMENT  
**Created:** June 23, 2026  
**Estimated Time:** 2–3 hours  
**Dependencies:** All resolved ✅

---

## Prerequisites Confirmed

- `final_score` sent on `player_won` in `game.html:5950` + `game_mobile.html:6573` ✅
- GA4 custom dimension `final_score` registered (event-scoped) ✅
- BigQuery confirmed: 2 `player_won` events with `final_score` present ✅
- BigQuery integration live (`@google-cloud/bigquery` in Lambda) ✅

---

## Open Question (Verify Before Implementing)

**Does `player_won` include `new_tier` as an event param?**

Run this in BigQuery console to check:

```sql
SELECT
  (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'new_tier') AS tier,
  COUNT(*) as count
FROM `non-x-analytics-server.analytics_525680032.events_*`
WHERE _TABLE_SUFFIX >= '20260301'
  AND event_name = 'player_won'
GROUP BY tier;
```

- **If `tier` returns values → use Option A (simple query)**
- **If `tier` returns NULL → use Option B (join query)**

---

## Task List

- [ ] **Task 1:** Verify `new_tier` param on `player_won` (BigQuery check above)
- [ ] **Task 2:** Add `tier-score` to `VALID_SUBTYPES` in `api/index.js:14`
- [ ] **Task 3:** Add BigQuery handler in `api/index.js` (before line 407)
- [ ] **Task 4:** Add chart card HTML in `live.html` (after line 1997)
- [ ] **Task 5:** Add fetch + Chart.js scatter render in `live.html`
- [ ] **Task 6:** Update `api/index.js` repo file, then deploy to Lambda
- [ ] **Task 7:** Update PRIORITIES.md — mark MT-5 complete
- [ ] **Task 8:** Update HANDOFF_SUMMARY.md

---

## File Changes

### File 1: `api/index.js`

#### Change 1A — Add metric to whitelist

**Location:** `api/index.js:14`

**Before:**
```javascript
const VALID_SUBTYPES   = ['platform-split','daily-timeseries','boss-analysis','survival-time','powerup-analysis','progression-analysis','ai-analysis','death-triggers','new-user-pct','replay-rate','music-ab','music-funnel','movement-ab','engagement-events','avg-tier'];
```

**After:**
```javascript
const VALID_SUBTYPES   = ['platform-split','daily-timeseries','boss-analysis','survival-time','powerup-analysis','progression-analysis','ai-analysis','death-triggers','new-user-pct','replay-rate','music-ab','music-funnel','movement-ab','engagement-events','avg-tier','tier-score'];
```

---

#### Change 1B — Add BigQuery handler

**Location:** Insert before `api/index.js:407` (before the else-fallback)

**Option A — `new_tier` IS on `player_won`:**
```javascript
} else if (requestType === 'standard' && subType === 'tier-score') {
    const now = Date.now();
    if (tierScoreCache.data && (now - tierScoreCache.timestamp) < TIER_CACHE_TTL_MS) {
        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Content-Type': 'application/json' },
            body: JSON.stringify(tierScoreCache.data)
        };
    }
    const bq = getBigQueryClient();
    const datasetId = process.env.BQ_DATASET_ID || `analytics_${propertyId}`;
    const bqStartDate = getBQStartDate(dateRangeParam);
    const [rows] = await bq.query({
        query: `
            SELECT
              (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'final_score') AS score,
              (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'new_tier')    AS tier
            FROM \`${process.env.GCP_PROJECT_ID}.${datasetId}.events_*\`
            WHERE _TABLE_SUFFIX >= '${bqStartDate}'
              AND event_name = 'player_won'
              AND (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'final_score') IS NOT NULL
              AND (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'new_tier')    IS NOT NULL
            ORDER BY score
        `,
        ...queryOpts
    });
    const result = { points: rows.map(r => ({ x: r.score, y: r.tier })) };
    tierScoreCache = { data: result, timestamp: now };
    return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
    };
```

**Option B — `new_tier` NOT on `player_won` (join approach):**
```javascript
} else if (requestType === 'standard' && subType === 'tier-score') {
    const now = Date.now();
    if (tierScoreCache.data && (now - tierScoreCache.timestamp) < TIER_CACHE_TTL_MS) {
        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Content-Type': 'application/json' },
            body: JSON.stringify(tierScoreCache.data)
        };
    }
    const bq = getBigQueryClient();
    const datasetId = process.env.BQ_DATASET_ID || `analytics_${propertyId}`;
    const bqStartDate = getBQStartDate(dateRangeParam);
    const [rows] = await bq.query({
        query: `
            WITH wins AS (
              SELECT
                ga_session_id,
                user_pseudo_id,
                (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'final_score') AS score
              FROM \`${process.env.GCP_PROJECT_ID}.${datasetId}.events_*\`
              WHERE _TABLE_SUFFIX >= '${bqStartDate}'
                AND event_name = 'player_won'
            ),
            last_tier AS (
              SELECT
                ga_session_id,
                user_pseudo_id,
                LAST_VALUE((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'new_tier'))
                  OVER (PARTITION BY ga_session_id, user_pseudo_id ORDER BY event_timestamp
                        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS tier
              FROM \`${process.env.GCP_PROJECT_ID}.${datasetId}.events_*\`
              WHERE _TABLE_SUFFIX >= '${bqStartDate}'
                AND event_name = 'ai_difficulty_adjusted'
            )
            SELECT DISTINCT w.score, lt.tier
            FROM wins w
            JOIN last_tier lt USING (ga_session_id, user_pseudo_id)
            WHERE w.score IS NOT NULL AND lt.tier IS NOT NULL
            ORDER BY w.score
        `,
        ...queryOpts
    });
    const result = { points: rows.map(r => ({ x: r.score, y: r.tier })) };
    tierScoreCache = { data: result, timestamp: now };
    return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
    };
```

#### Change 1C — Add cache variable

**Location:** Near other cache variables (same pattern as `tierCache`). Add after the `tierCache` declaration (search for `let tierCache`):

```javascript
let tierScoreCache = { data: null, timestamp: 0 };
```

---

### File 2: `live.html`

#### Change 2A — Add chart card HTML

**Location:** After `live.html:1997` (inside "Tier Performance Metrics" section)

```html
<div class="card">
  <div class="card-title" data-tooltip="Each dot is one winning game session. Shows whether higher AI tiers correlate with higher final scores."><span class="dot"></span> Tier vs Final Score</div>
  <div class="chart-wrap">
    <canvas id="chart-tier-score"></canvas>
  </div>
</div>
```

---

#### Change 2B — Add fetch + Chart.js scatter render

**Location:** Near the existing `avg-tier` fetch block (search for `avg-tier` in the JS section, ~line 5300 area). Add a new fetch block in the same pattern:

```javascript
// Tier vs Final Score scatter
fetch(`/api/data?metric=standard&subType=tier-score&dateRange=${currentRange}`)
  .then(r => r.json())
  .then(d => {
    const tierColors = {
      '-3': '#FF3366', '-2': '#FF3366', '-1': '#FFD700',
      '0': '#39FF14', '1': '#00FFFF', '2': '#FF00FF', '3': '#CC88FF'
    };
    const datasets = {};
    (d.points || []).forEach(p => {
      const t = String(p.y);
      if (!datasets[t]) {
        datasets[t] = {
          label: `Tier ${p.y}`,
          data: [],
          backgroundColor: (tierColors[t] || '#00FFFF') + '99',
          borderColor: tierColors[t] || '#00FFFF',
          pointRadius: 6,
          pointHoverRadius: 8
        };
      }
      datasets[t].data.push({ x: p.x, y: p.y });
    });
    new Chart(document.getElementById('chart-tier-score'), {
      type: 'scatter',
      data: { datasets: Object.values(datasets) },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true, labels: { color: '#ccc', font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: ctx => `Score: ${ctx.parsed.x} | Tier: ${ctx.parsed.y}`
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Final Score', color: '#888' },
            ticks: { color: '#888' },
            grid: { color: '#222' }
          },
          y: {
            title: { display: true, text: 'AI Tier', color: '#888' },
            ticks: { color: '#888', stepSize: 1 },
            grid: { color: '#222' }
          }
        }
      }
    });
  })
  .catch(() => {});
```

---

## Possible Errors & Solutions

| Error | Cause | Solution |
|-------|-------|---------|
| Chart blank / no points | `new_tier` not on `player_won` | Switch to Option B (join query) |
| `tierScoreCache is not defined` | Cache var missing | Add `let tierScoreCache = { data: null, timestamp: 0 };` near `tierCache` |
| `tier-score` returns 403 | Not in VALID_SUBTYPES | Verify Change 1A was applied |
| Scatter dots all same color | Tier values not strings in color lookup | Change `String(p.y)` check — verify tier is int not float |
| BigQuery cost overrun | Query too broad | Add `LIMIT 1000` to the SELECT as a safety cap |
| **`Unrecognized name: ga_session_id at [4:25]`** | **`ga_session_id` is not a top-level column in GA4 BigQuery export — it lives inside `event_params`** | **Extract via `(SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS session_id` in both CTEs; use `session_id` alias in JOIN** |

---

## Bug Log

### BUG-001: `Unrecognized name: ga_session_id` — June 24, 2026

**Status:** ✅ RESOLVED — June 24, 2026  
**CloudWatch:** `ApiError: Unrecognized name: ga_session_id at [4:25]`

**Root Cause:** In the GA4 BigQuery daily export schema, `ga_session_id` is NOT a top-level column. It is stored as a nested param inside the `event_params` RECORD array, alongside all other event params like `final_score`, `new_tier`, etc. Referencing it as `ga_session_id` bare in a SELECT or USING clause fails with `INVALID_ARGUMENT`.

**Failed Approach (Option B v1):**
```sql
WITH wins AS (
  SELECT
    ga_session_id,  -- ❌ WRONG — not a top-level column
    user_pseudo_id,
    ...
```

**Fix:** Extract using `UNNEST(event_params)` — same pattern as the existing working `avg-tier` handler:
```sql
WITH wins AS (
  SELECT
    user_pseudo_id,
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS session_id,
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'final_score') AS score
  FROM `...events_*`
  WHERE _TABLE_SUFFIX >= '...' AND event_name = 'player_won'
),
last_tier AS (
  SELECT DISTINCT
    user_pseudo_id,
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS session_id,
    LAST_VALUE((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'new_tier'))
      OVER (
        PARTITION BY user_pseudo_id,
          (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id')
        ORDER BY event_timestamp
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
      ) AS tier
  FROM `...events_*`
  WHERE _TABLE_SUFFIX >= '...' AND event_name = 'ai_difficulty_adjusted'
)
SELECT DISTINCT w.score, lt.tier
FROM wins w
JOIN last_tier lt USING (session_id, user_pseudo_id)
WHERE w.score IS NOT NULL AND lt.tier IS NOT NULL
ORDER BY w.score
```

**Note:** The PARTITION BY still uses the full subquery expression (not the `session_id` alias) — this matches the proven pattern in the `avg-tier` handler.

---

## Testing Checklist

- [ ] BigQuery query runs without error in console (verify `new_tier` param first)
- [ ] Lambda returns `{ points: [{x, y}...] }` from `/api/data?metric=standard&subType=tier-score&dateRange=alltime`
- [ ] Chart renders on dashboard with scatter dots
- [ ] Dots color-coded by tier correctly
- [ ] Tooltip shows `Score: X | Tier: Y` on hover
- [ ] Card title tooltip appears on hover
- [ ] Chart displays on both desktop and mobile breakpoints

---

## Deploy Steps (after implementation)

1. Edit `api/index.js` in repo (Changes 1A, 1B, 1C)
2. Verify file is correct
3. Copy `api/index.js` contents into AWS Lambda console
4. Deploy Lambda
5. Test endpoint directly
6. Push `live.html` changes to GitHub

**Git commands (present to user, do not execute):**
```bash
git add live.html api/index.js && \
git commit -m "feat: add Tier vs Final Score scatter chart (MT-5)"
```

---

## Notes

- Only 2 data points currently in BigQuery — chart will look sparse until more players complete games. This is expected and will fill in naturally.
- The `TIER_CACHE_TTL_MS` constant is already defined for the `avg-tier` handler — reuse it.
- Tier color mapping follows the existing dashboard convention from `live.html:5705`.
