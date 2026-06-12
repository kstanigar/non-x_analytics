# BigQuery Integration Plan

**Purpose:** Implementation plan for Avg Starting Tier + Avg Final Tier KPIs using BigQuery session-level SQL.

**Created:** June 11, 2026
**Status:** 🟡 PLANNED — awaiting GA4 BigQuery Export connection
**Estimated time:** 3–5 hours (once pre-requisites are complete)

---

## Pre-requisites (GCP/AWS console — user completes before coding)

**Status: ⏳ PENDING — follow up after compact**

1. **Enable GA4 BigQuery Export**
   - GA4 Admin → BigQuery Linking → connect Standing Tiger GCP project
   - Select daily export, same project as GA4 property
   - Data appears within 24–48h after enabling

2. **Create GCP service account**
   - GCP Console → IAM → Service Accounts → Create
   - Roles: `BigQuery Data Viewer` + `BigQuery Job User`
   - Download JSON key file

3. **Add Lambda env vars** (Lambda console → Configuration → Environment variables)
   - `BQ_CREDENTIALS` — paste full JSON key file contents as a string
   - `GCP_PROJECT_ID` — GCP project ID (e.g. `standing-tiger-analytics`)

---

## Package

- **Package:** `@google-cloud/bigquery@8.3.1` (confirmed stable, June 11, 2026)
- **Preview:** `9.0.0-alpha.0` — do NOT use
- **Install alongside existing:** `@google-analytics/data`

---

## Files to Modify

| File | Change |
|------|--------|
| `api/index.js` | Add `avg-tier` to VALID_SUBTYPES, BigQuery client + cache + handler |
| `live.html` | Add 2 KPI tiles, DATA defaults, fetch function, populateKPIs wiring |

---

## Part 1 — `api/index.js` Changes

### Change 1 — VALID_SUBTYPES (line 14)

```javascript
// Before:
'engagement-events'

// After:
'engagement-events', 'avg-tier'
```

### Change 2 — Module-level cache + lazy BigQuery client (after line 16, before exports.handler)

```javascript
// BigQuery client — lazy-loaded only when avg-tier handler is called
let bigqueryClient = null;
const getBigQueryClient = () => {
    if (!bigqueryClient) {
        const { BigQuery } = require('@google-cloud/bigquery');
        bigqueryClient = new BigQuery({
            projectId: process.env.GCP_PROJECT_ID,
            credentials: JSON.parse(process.env.BQ_CREDENTIALS)
        });
    }
    return bigqueryClient;
};

// In-memory cache — 24h TTL matches BigQuery export lag
const tierCache = { data: null, timestamp: 0 };
const TIER_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
```

### Change 3 — avg-tier handler (before the `realtime` block)

```javascript
// eventName=ai_difficulty_adjusted: first old_tier + last new_tier per session
} else if (requestType === 'standard' && subType === 'avg-tier') {
    const now = Date.now();
    if (tierCache.data && (now - tierCache.timestamp) < TIER_CACHE_TTL_MS) {
        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Content-Type': 'application/json' },
            body: JSON.stringify(tierCache.data)
        };
    }
    const bq = getBigQueryClient();
    const projectId = process.env.GCP_PROJECT_ID;
    const datasetId = `analytics_${propertyId}`;
    const queryOptions = { maxBytesBilled: '500000000' }; // 500MB cap

    const [startRows] = await bq.query({
        ...queryOptions,
        query: `
            SELECT AVG(CAST(first_old_tier AS INT64)) AS avg_start_tier
            FROM (
                SELECT session_id,
                    FIRST_VALUE(ep.value.string_value) OVER (
                        PARTITION BY session_id ORDER BY event_timestamp
                    ) AS first_old_tier
                FROM \`${projectId}.${datasetId}.events_*\`,
                    UNNEST(event_params) AS ep
                WHERE event_name = 'ai_difficulty_adjusted'
                    AND ep.key = 'old_tier'
                    AND _TABLE_SUFFIX >= '${dateRange.startDate.replace(/-/g, '')}'
            )
        `
    });
    const [endRows] = await bq.query({
        ...queryOptions,
        query: `
            SELECT AVG(CAST(last_new_tier AS INT64)) AS avg_final_tier
            FROM (
                SELECT session_id,
                    LAST_VALUE(ep.value.string_value) OVER (
                        PARTITION BY session_id ORDER BY event_timestamp
                        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
                    ) AS last_new_tier
                FROM \`${projectId}.${datasetId}.events_*\`,
                    UNNEST(event_params) AS ep
                WHERE event_name = 'ai_difficulty_adjusted'
                    AND ep.key = 'new_tier'
                    AND _TABLE_SUFFIX >= '${dateRange.startDate.replace(/-/g, '')}'
            )
        `
    });

    response = {
        avgStartTier: startRows[0]?.avg_start_tier ?? null,
        avgFinalTier:  endRows[0]?.avg_final_tier  ?? null
    };
    tierCache.data = response;
    tierCache.timestamp = now;
    return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Content-Type': 'application/json' },
        body: JSON.stringify(response)
    };
```

---

## Part 2 — `live.html` Changes (5 targeted changes)

1. **2 KPI tiles** in the Player Behavior grid — Avg Start Tier + Avg Final Tier
2. **DATA.kpis defaults** — `avgStartTier: '—'`, `avgFinalTier: '—'`
3. **mapGA4ResponseToDATA() return block** — same 2 fields
4. **fetchAvgTierData()** — new fetch function, AbortSignal.timeout() pattern
5. **populateKPIs()** — 2 textContent lines

---

## Part 3 — Lambda Deploy (Zip Required)

Adding `@google-cloud/bigquery` requires a **new zip** — paste-into-editor won't install new npm packages.

**Correct zip structure (index.js at root, not inside lambda-package/):**

```bash
mkdir /tmp/lambda-build && cd /tmp/lambda-build
cp /Users/ks2026/Documents/Projects/2026/non-x_analytics/api/index.js ./index.js
npm init -y
npm install @google-analytics/data @google-cloud/bigquery@8.3.1
zip -r function.zip index.js node_modules/
```

Then: Lambda console → Upload from → .zip file. Handler stays `index.handler`.

---

## Possible Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `BQ_CREDENTIALS parse error` | JSON not properly escaped in env var | Paste raw JSON, not a stringified string |
| `Table not found` | Export not yet enabled or dataset name wrong | Confirm dataset ID in BigQuery console |
| `Query exceeded maxBytesBilled` | Table larger than expected | Raise limit to `'1000000000'` (1GB) |
| `Permission denied` | Service account missing roles | Re-check BigQuery Data Viewer + Job User |

---

## Testing Checklist

- [ ] Pre-requisites complete (export enabled, service account created, env vars set)
- [ ] Hit endpoint: `?type=standard&subType=avg-tier&version=4.3&dateRange=alltime`
- [ ] Response contains `avgStartTier` and `avgFinalTier` numbers (not null)
- [ ] KPI tiles populate on dashboard
- [ ] Second call within 24h returns cached response (CloudWatch shows single log entry)
- [ ] Push to staging, verify visually
- [ ] Merge to main

---

## Notes

- BigQuery export has 24–48h data lag — KPIs will not reflect today's sessions
- Cache TTL set to 24h to match export cadence; safe to lower to 6h if desired
- `alltime` date range maps to `2026-03-01` start in Lambda — `_TABLE_SUFFIX >= '20260301'`
- Dataset ID format: `analytics_` + GA4 property ID (numeric, e.g. `analytics_123456789`)
