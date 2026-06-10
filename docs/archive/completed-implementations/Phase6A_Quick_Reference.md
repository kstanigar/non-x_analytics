# Phase 6A Quick Reference Guide

**For:** Developers implementing Tasks 5-7
**Length:** 5 minutes to read
**Purpose:** Fast lookup during implementation

---

## File Changes at a Glance

### api/index.js
| Line | Change | Type |
|------|--------|------|
| 13-15 | Add `subType` parameter extraction | New code |
| 27-45 | Add platform-split request handler | New handler |
| 46-62 | Add daily-timeseries request handler | New handler |
| 63-79 | Add boss-analysis request handler | New handler |

### live.html - mapGA4ResponseToDATA()
| Line | Change | Type |
|------|--------|------|
| 1759-1795 | Add platform-split response parsing | New handler |
| 1796-1825 | Add daily-timeseries response parsing | New handler |
| 1826-1860 | Add boss-analysis response parsing | New handler |

### live.html - refreshData()
| Line | Change | Type |
|------|--------|------|
| ~2700 | Add platform-split fetch call | New call |
| ~2710 | Add daily-timeseries fetch call | New call |
| ~2720 | Add boss-analysis fetch call | New call |

### live.html - Chart Functions
| Function | Lines | Change |
|----------|-------|--------|
| chartPlatformFunnel() | 2504-2508 | Replace hardcoded data with live calculation |
| chartDaily() | 2104 | Uses updated DATA.daily from GA4 |
| chartBossPlatform() | 2362-2366 | Replace hardcoded data with live calculation |

---

## GA4 Query Templates

### Platform-Split Query
```javascript
{
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    dimensions: [
        { name: 'platform' },
        { name: 'deviceCategory' },
        { name: 'eventName' }
    ],
    metrics: [{ name: 'eventCount' }]
}
```

### Daily-Timeseries Query
```javascript
{
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: '13daysAgo', endDate: 'today' }],
    dimensions: [
        { name: 'date' },
        { name: 'eventName' }
    ],
    metrics: [{ name: 'eventCount' }]
}
```

### Boss-Analysis Query
```javascript
{
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    dimensions: [
        { name: 'deviceCategory' },
        { name: 'customEvent:boss_id' },
        { name: 'eventName' }
    ],
    metrics: [{ name: 'eventCount' }]
}
```

---

## Response Structure Examples

### Platform-Split Response Format
```json
{
    "rows": [
        {
            "dimensionValues": [
                { "value": "WEB" },
                { "value": "desktop" },
                { "value": "game_start" }
            ],
            "metricValues": [{ "value": "2841" }]
        }
    ]
}
```
**Parse:** `[0] = platform, [1] = deviceCategory, [2] = eventName`

### Daily-Timeseries Response Format
```json
{
    "rows": [
        {
            "dimensionValues": [
                { "value": "20260608" },
                { "value": "game_start" }
            ],
            "metricValues": [{ "value": "2841" }]
        }
    ]
}
```
**Parse:** `[0] = date (YYYYMMDD), [1] = eventName`

### Boss-Analysis Response Format
```json
{
    "rows": [
        {
            "dimensionValues": [
                { "value": "desktop" },
                { "value": "1" },
                { "value": "boss_attempted" }
            ],
            "metricValues": [{ "value": "1034" }]
        }
    ]
}
```
**Parse:** `[0] = deviceCategory, [1] = boss_id, [2] = eventName`

---

## Testing Checklist

### Unit Tests (Lambda Only)
- [ ] Platform-split query returns rows with 3 dimensionValues
- [ ] Daily-timeseries query returns rows with 2 dimensionValues
- [ ] Boss-analysis query returns rows with 3 dimensionValues
- [ ] All queries honor version filter parameter
- [ ] Custom dimension filtering works

### Integration Tests (Lambda + Dashboard)
- [ ] Platform data maps correctly: `DATA.platform.desktop.sessions` populated
- [ ] Daily data maps correctly: `DATA.daily.labels` has 14 dates
- [ ] Boss data maps correctly: `DATA.bossAnalysis.desktop.boss1.rate` calculated
- [ ] Charts render without errors
- [ ] KPIs update when version filter changes

### Validation Against GA4
- [ ] Platform split totals match GA4 event counts
- [ ] Daily plays match GA4 game_start events by date
- [ ] Boss rates match GA4 defeat/attempt ratio

---

## Common Gotchas

1. **Dimension Values Order Matters**
   - `dimensionValues[0]` is first dimension in array
   - `dimensionValues[1]` is second dimension
   - Count matches your dimensions array length

2. **Custom Dimension Syntax**
   - Format: `customEvent:parameter_name`
   - Must match GA4 registration exactly (case-sensitive)
   - If returns no data, check GA4 Admin → Custom definitions

3. **Date Format**
   - GA4 returns: YYYYMMDD (no separators)
   - Parse: `parseInt(date.substring(0,4), 10)` for year
   - Convert: Use Date constructor for locale formatting

4. **Platform vs DeviceCategory**
   - `platform` = WEB/APP (implementation-specific)
   - `deviceCategory` = desktop/mobile/tablet (browser/user agent)
   - Game analysis should use `deviceCategory`

5. **Data Freshness**
   - GA4 API lags 1-2 hours behind real events
   - Realtime API returns last 30 minutes (but not multi-dimensional)
   - Document this lag in dashboard tooltip

---

## Deployment Steps

```bash
# 1. Update api/index.js with three new handlers
# 2. Update live.html with three new mapGA4ResponseToDATA handlers
# 3. Update live.html refreshData() with three new fetch calls
# 4. Update chart functions to use live data instead of hardcoded

# 5. Test locally:
node api/test-multidim-queries.js

# 6. Deploy to Lambda:
cd api
zip -r lambda-payload.zip . -x "*.git*" "test*" "node_modules/aws*"
aws lambda update-function-code \
  --function-name non-x-analytics-api \
  --zip-file fileb://lambda-payload.zip

# 7. Verify:
curl "https://your-api-endpoint/api?type=standard&subType=platform-split"
```

---

## Troubleshooting

| Issue | Quick Fix |
|-------|-----------|
| "dimensionValues[1] is undefined" | Verify dimensions array in query has 2+ elements |
| "Cannot read property 'value' of undefined" | Use optional chaining: `row.dimensionValues[0]?.value` |
| Empty arrays in DATA object | Add `console.log(row)` in forEach to debug structure |
| Chart shows old data | Ensure fetch calls complete before chart render |
| Boss-analysis returns no rows | Check if boss_id registered in GA4 Admin |
| Platform data shows 0% | Verify game sends event parameters on events |

---

## Performance Notes

- **Single multi-dimensional query:** ~200ms
- **Three separate queries:** ~600ms total
- **Dashboard render:** ~100ms
- **Total end-to-end:** ~1.1s (first load), ~500ms (cached)

Consider batching with `batchRunReports()` if performance critical.

---

**Version:** 1.0 | **Updated:** June 8, 2026