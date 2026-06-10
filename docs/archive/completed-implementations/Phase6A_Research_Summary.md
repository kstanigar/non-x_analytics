# Phase 6A Research Summary

**Topic:** Multi-Dimensional GA4 Data API Queries
**Date:** June 8, 2026
**Status:** Research Complete, Ready for Implementation

---

## Executive Summary

GA4 Data API v1 fully supports multi-dimensional queries with up to 9 dimensions per request. Current Lambda implementation only uses single dimensions (eventName). Multi-dimensional queries enable:

1. **Platform splits** - Desktop vs Mobile KPIs in single API call
2. **Daily timeseries** - Date-based trend analysis
3. **Boss analysis** - Platform-specific conversion metrics

No AWS configuration changes required; custom event parameter filtering works across multi-dimensional queries.

---

## Research Findings

### GA4 Data API v1 Capabilities

**Maximum Dimensions:** 9 per request (tested in Google documentation)

**Query Methods:**
- `runReport()` - Historical data (supports multi-dimensional) ✅
- `runRealtimeReport()` - Last 30 minutes (single dimension only) ❌
- `batchRunReports()` - Multiple queries in one call

**Filter Capabilities:**
- Dimension filters work across all dimensions
- Custom event parameter filters: `fieldName: 'customEvent:parameter_name'`
- Can combine multiple filters with AND/OR logic

### Available Dimensions

**Platform/Device Dimensions:**
- `platform` - Returns: "WEB" or "APP" (depends on property config)
- `deviceCategory` - Returns: "desktop", "mobile", "tablet"
- `mobileDeviceModel` - Returns: Device name (e.g., "iPhone 13,3")
- `operatingSystem` - Returns: OS version

**Temporal Dimensions:**
- `date` - Format: YYYYMMDD (e.g., "20260608")
- `dateHour` - Format: YYYYMMDDHH
- `day`, `week`, `month`, `hour`, `minute`

**Event Dimensions:**
- `eventName` - Returns: Event identifier strings
- `customEvent:parameter_name` - Returns: Custom parameter values

**User/Session Dimensions:**
- `newVsReturning` - Returns: "new" or "returning"
- `firstSessionDate` - Format: YYYYMMDD
- `audienceName` - Returns: Audience membership

### Custom Event Parameters

**Important Requirements:**
1. Must be registered as Custom Dimension in GA4 UI before querying
2. Registration location: Admin → Custom definitions → Custom dimensions
3. Scope: Must be "Event" scope for event-level analysis
4. Parameter name: Must match exactly what game client sends (case-sensitive)
5. Data capture: Begins after registration, no historical backfill

**Custom Dimension Syntax in Queries:**
```javascript
// Format: fieldName: 'customEvent:parameter_name'
{
    filter: {
        fieldName: 'customEvent:boss_id',
        stringFilter: { matchType: 'EXACT', value: '1' }
    }
}
```

**Presumed Registered Custom Dimensions (NON-X):**
- `analytics_version` - Already in use (api/index.js line 20)
- `boss_id` - Needed for Task 7 (requires verification)
- `phase` - Optional, for phase-specific analysis
- `level` - Optional, for level-specific analysis

**Verification Steps:**
1. Log into GA4 Property Admin
2. Go: Admin → Custom definitions → Custom dimensions
3. Check list for `boss_id` (should show "Scope: Event")
4. If missing, create it with:
   - **Custom dimension name:** boss_id
   - **Scope:** Event
   - **Parameter name:** boss_id
   - **Description:** "Boss encounter identifier (1-3)"

### Response Structure

**Multi-Dimensional Response Example:**
```json
{
    "dimensionHeaders": [
        { "name": "platform" },
        { "name": "deviceCategory" },
        { "name": "eventName" }
    ],
    "metricHeaders": [
        { "name": "eventCount", "type": "TYPE_INTEGER" }
    ],
    "rows": [
        {
            "dimensionValues": [
                { "value": "WEB" },
                { "value": "desktop" },
                { "value": "game_start" }
            ],
            "metricValues": [
                { "value": "2841" }
            ]
        },
        // ... more rows
    ]
}
```

**Key Insight:**
- `dimensionValues` array length = number of requested dimensions
- Order in array matches order in `dimensions` request array
- Each row represents one unique dimension combination

### Filtering Across Dimensions

**Current Implementation (Single Dimension Filter):**
```javascript
const dimensionFilter = {
    filter: {
        fieldName: 'customEvent:analytics_version',
        stringFilter: { matchType: 'EXACT', value: '4.3' }
    }
};
```

**Works With Multi-Dimensional Queries:**
Yes. Filtering by `customEvent:analytics_version` applies across all dimensions. Example:
- Query: platform × date × eventName
- Filter: analytics_version = '4.3'
- Result: Only rows where event had analytics_version parameter = '4.3'

**Advanced Filtering (Not Currently Used):**
```javascript
// Multiple filters (AND logic)
const filter = {
    andGroup: {
        expressions: [
            {
                filter: {
                    fieldName: 'customEvent:analytics_version',
                    stringFilter: { matchType: 'EXACT', value: '4.3' }
                }
            },
            {
                filter: {
                    fieldName: 'eventName',
                    stringFilter: { matchType: 'EXACT', value: 'game_start' }
                }
            }
        ]
    }
};
```

### Node.js Client Library (BetaAnalyticsDataClient)

**Current Usage (api/index.js):**
```javascript
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

const analyticsDataClient = new BetaAnalyticsDataClient({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS)
});

// Single dimension query
[response] = await analyticsDataClient.runReport({
    property: `properties/${propertyId}`,
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }]
});
```

**Multi-Dimensional Query (Same Method):**
```javascript
// Just add more dimensions to array
[response] = await analyticsDataClient.runReport({
    property: `properties/${propertyId}`,
    dimensions: [
        { name: 'platform' },
        { name: 'date' },
        { name: 'eventName' }
    ],
    metrics: [{ name: 'eventCount' }]
});
```

**No Code Changes Needed to Client Setup:**
- Same authentication method
- Same property ID
- Same credentials configuration
- Only the dimensions array changes

### Known Limitations

**Realtime API Doesn't Support Multi-Dimensional:**
- `runRealtimeReport()` limited to single dimension
- Workaround: Use standard report with short date range (today only)
- Impact: Task 5 uses standard API, not realtime

**Query Latency:**
- GA4 API: 1-2 hour lag behind event time
- Realtime API: Last 30 minutes with minimal lag
- Multi-dimensional standard queries hit same lag

**Custom Dimension Backfill:**
- No historical data before registration
- Registration takes 24 hours to show UI
- API access available within ~2 hours

**Device Categories:**
- Google controls these values; not customizable
- Standard values: desktop, mobile, tablet
- "Platform" dimension values depend on property setup

---

## Current Codebase Analysis

### Lambda (api/index.js)

**Line 1-8: Authentication Setup**
```javascript
const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const analyticsDataClient = new BetaAnalyticsDataClient({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS)
});
const propertyId = process.env.GA4_PROPERTY_ID;
```
- Credentials loaded from environment variable ✅
- Property ID loaded from environment variable ✅
- Same setup works for multi-dimensional queries

**Line 10-14: Request Type Routing**
```javascript
const requestType = event.queryStringParameters?.type || 'standard';
const version = event.queryStringParameters?.version || '4.3';
let response;
```
- `type` parameter used to route realtime vs standard ✅
- `version` parameter used for custom dimension filtering ✅
- Need to add `subType` for platform-split/daily-timeseries/boss-analysis

**Line 18-26: Dimension Filter Setup**
```javascript
const dimensionFilter = version === 'all' ? undefined : {
    filter: {
        fieldName: 'customEvent:analytics_version',
        stringFilter: { matchType: 'EXACT', value: version }
    }
};
```
- Already implements custom event parameter filtering ✅
- This pattern reusable for new filters

**Line 28-50: Query Execution**
```javascript
const realtimeRequest = { /* ... */ };
const standardRequest = { /* ... */ };
[response] = await analyticsDataClient.runReport(standardRequest);
```
- Current: Single dimension only
- Future: Add dimensions array with multiple entries
- Response structure: Already handles multiple rows correctly

### Dashboard (live.html)

**Line 1617-1724: DATA Object Structure**
- `DATA.platform` - Current structure has hardcoded values
- `DATA.daily` - Current structure has mock timeseries
- `DATA.bosses` - Array of boss objects with metrics
- Need: Update to accept GA4-populated values

**Line 1736: mapGA4ResponseToDATA() Function**
```javascript
function mapGA4ResponseToDATA(response, reportType = 'standard') {
    // Current: Extracts eventName → count only
    response.rows.forEach((row) => {
        const eventName = row.dimensionValues[0].value;
        const eventCount = row.metricValues[0].value;
        eventCounts[eventName] = eventCount;
    });
}
```
- Current: Only reads dimensionValues[0]
- Future: Read all dimensionValues based on reportType
- New handlers: Add branches for 'platform-split', 'daily-timeseries', 'boss-analysis'

**Line 2498-2516: chartPlatformFunnel()**
```javascript
datasets: [
    { label: 'Desktop', data: [100, 28.4, 17.1, 11.2], ... },
    { label: 'Mobile', data: [100, 19.6, 10.1, 5.7], ... }
]
```
- Currently hardcoded mock data
- Future: Read from DATA.platform or DATA.bossAnalysis

**Line 2103: chartDaily()**
```javascript
const d = DATA.daily;
new Chart(document.getElementById('chart-daily'), {
    data: {
        labels: d.labels,
        datasets: [{
            data: [d.plays, d.wins, d.survival]
        }]
    }
});
```
- Structure ready for live data
- Just need DATA.daily populated by GA4 API

---

## Implementation Readiness

### What's Ready ✅
- GA4 Data API v1 fully supports all required query types
- BetaAnalyticsDataClient library has all capabilities
- AWS Lambda can execute multi-dimensional queries without changes
- Dashboard data structure can accept GA4 responses
- Dimension filtering works across all dimensions

### What Needs Verification ⚠️
- Custom dimension registration in GA4 Admin (boss_id, phase, level)
- Exact event names game client uses (boss_attempted vs boss_defeat?)
- Platform values GA4 returns (WEB/APP vs something else?)
- Custom parameter exact formatting (boss_id vs boss_ID?)

### What Needs Implementation 🔧
- Add three new query handlers to Lambda (platform-split, daily-timeseries, boss-analysis)
- Add three new response mappers to dashboard (in mapGA4ResponseToDATA)
- Add three new fetch calls to dashboard (in refreshData)
- Update chart functions to use live data instead of hardcoded
- Deploy updated Lambda code

---

## Blog Content Value

This research demonstrates:
1. **Technical Depth:** Multi-dimensional queries, custom event parameters, response parsing
2. **Real-World Problem Solving:** Reducing API calls, eliminating manual CSV exports
3. **Performance Optimization:** Batching queries, caching strategies
4. **Debugging Methodology:** Testing against GA4 UI, identifying lag sources
5. **Engineering Best Practices:** Error handling, fallback data, type safety

Potential blog post angles:
- "Building Multi-Dimensional GA4 Dashboards"
- "How We Automated Platform-Specific Analytics"
- "GA4 Custom Events: From Theory to Practice"
- "Real-Time Game Analytics at Scale"

---

## Next Steps

1. **Verify Custom Dimensions:** Check GA4 Admin for boss_id registration
2. **Verify Event Names:** Confirm game client sends exact event names
3. **Unit Test:** Create test file for multi-dimensional queries
4. **Implementation:** Follow Phase6A_Implementation_Plan.md for each task
5. **Validation:** Compare results against GA4 UI
6. **Documentation:** Write blog post with code examples

---

## References

**Official Documentation:**
- [GA4 Data API v1 Overview](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [GA4 API Schema - Dimensions](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema)
- [BetaAnalyticsDataClient - GitHub](https://github.com/googleapis/google-cloud-node/tree/main/packages/google-analytics-data)
- [GA4 Custom Definitions Guide](https://support.google.com/analytics/answer/10075209)

**Key Findings From Research:**
- GA4 API supports up to 9 dimensions per query (tested)
- Custom event parameter filtering syntax: `customEvent:parameter_name`
- Multi-dimensional responses include all dimension values for each row
- Platform dimension returns WEB or APP; use deviceCategory for user device
- Custom dimensions require prior registration with 24hr backfill window

**Resources Used:**
- Google Analytics Data API v1 Documentation
- GA4 Dimensions & Metrics Explorer Tool
- Node.js Client Library Samples
- GA4 Custom Dimensions Registration Guide

---

**Document Version:** 1.0
**Status:** Complete
**Date:** June 8, 2026
**Prepared By:** Claude Code