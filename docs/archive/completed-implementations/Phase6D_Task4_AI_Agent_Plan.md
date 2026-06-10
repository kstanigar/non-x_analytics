# Phase 6D Task 4: AI Agent Deep Dive Endpoint

**Created:** June 10, 2026
**Status:** Planned — Awaiting Implementation Approval
**Estimate:** 6-8 hours
**Impact:** HIGH — Makes AI Agent tab metrics live (currently all empty/zero)

---

## Research Summary

**Agents used:** Explore agent (codebase line numbers) + Haiku agent (GA4 API best practices)

**GA4 query:** 5 dims (old_tier, new_tier, direction, eventName, deviceCategory) — fits in one query (8 dim limit) ✓
**AbortSignal.timeout():** Still correct 2026 pattern ✓
**Chart.js Sankey:** No native support — existing `chartAITierFlow()` uses a bar chart (increases vs decreases), which is already the right approach. No new plugin needed ✓

### Realistic Scope from `ai_difficulty_adjusted` Event

| DATA.aiAgent field | Can populate from GA4? | Source |
|---|---|---|
| `tierDist.counts` | ✅ Yes | count by `customEvent:new_tier` |
| `tierFlow.increases/decreases` | ✅ Yes | `customEvent:direction` = "up"/"down" |
| `kpis.avgAdjustments` | ✅ Yes | total event count |
| `scoreMultDist` | ❌ No | requires score custom dim (not tracked) |
| `tierScores.avgScores` | ❌ No | requires score custom dim |
| `deathTriggers` | ❌ No | different event (player_death) |
| `avgStartTier`, `avgFinalTier`, `speedLockRate`, `tierMetrics` | ❌ No | requires session-level analysis |

**Net result:** AI Tier Distribution chart + Tier Flow chart + avgAdjustments KPI go live. Score/death charts remain empty (data not available from this event).

---

## Exact Line Numbers (Explore Agent Verified)

| Location | Line(s) | Purpose |
|---|---|---|
| `DATA.aiAgent` init block | 2363–2394 | Current AI data structure |
| `mapGA4ResponseToDATA()` insert point | after 2852 | New parser goes here (before EXTRACTION comment at 2854) |
| `fetchProgressionAnalysisData()` closing brace | 3243 | New fetch function goes after this |
| `loadAndRenderGA4Data()` progression block end | 3453 | New await call goes after this |
| `reinitAllCharts()` AI calls | 4515–4522 | Already wired — no changes needed |
| `populateAIKPIs()` | 4235–4241 | Already wired — no changes needed |
| `chartAITierDist()` | 4243 | Already wired — no changes needed |
| `chartAITierFlow()` | 4266 | Already wired — no changes needed |
| AI Agent UI page | 1672–1783 | No HTML changes needed |

---

## Files to Modify

- `api/index.js` — +~28 lines (1 change)
- `live.html` — +~130 lines (4 changes)
- Lambda deploy: 1 deployment required

---

## Change 1: `api/index.js` — Add ai-analysis handler

**After line 168** (end of progression-analysis block, before `} else if (requestType === 'realtime')`):

```javascript
} else if (requestType === 'standard' && subType === 'ai-analysis') {
    // ─── AI ANALYSIS REQUEST (Tier distribution and flow by direction) ───
    const aiAnalysisRequest = {
        property: `properties/${propertyId}`,
        dateRanges: [dateRange],
        // Multi-dimensional query: old_tier × new_tier × direction × eventName × deviceCategory
        // Returns AI adjustment counts split by tier transition and direction (up/down)
        dimensions: [
            { name: 'customEvent:old_tier' },   // Dimension 0: tier before adjustment ('-3' to '3')
            { name: 'customEvent:new_tier' },   // Dimension 1: tier after adjustment ('-3' to '3')
            { name: 'customEvent:direction' },  // Dimension 2: 'up' or 'down'
            { name: 'eventName' },              // Dimension 3: 'ai_difficulty_adjusted'
            { name: 'deviceCategory' }          // Dimension 4: 'desktop', 'mobile', 'tablet'
        ],
        metrics: [{ name: 'eventCount' }],
    };

    if (dimensionFilter) {
        aiAnalysisRequest.dimensionFilter = dimensionFilter;
    }

    [response] = await analyticsDataClient.runReport(aiAnalysisRequest);
```

---

## Change 2: `live.html` — Parser in `mapGA4ResponseToDATA()`

**After line 2852** (end of `if (reportType === 'progression-analysis')` block, before EXTRACTION comment at 2854):

```javascript
if (reportType === 'ai-analysis') {
    // Parse old_tier × new_tier × direction × eventName × deviceCategory response
    // Populates tier distribution counts and flow (up/down) for AI Agent charts
    const tierDistCounts = {};   // keyed by new_tier string e.g. '-3', '0', '3'
    let increases = 0;
    let decreases = 0;
    let totalAdjustments = 0;

    if (response.rows && response.rows.length > 0) {
        response.rows.forEach(row => {
            const newTier    = row.dimensionValues[1]?.value || '';  // tier after adjustment
            const direction  = row.dimensionValues[2]?.value || '';  // 'up' or 'down'
            const eventName  = row.dimensionValues[3]?.value || '';
            const count      = parseInt(row.metricValues[0]?.value || '0', 10);

            if (eventName !== 'ai_difficulty_adjusted') return;

            // Tier distribution: count adjustments landing on each tier
            if (newTier) {
                tierDistCounts[newTier] = (tierDistCounts[newTier] || 0) + count;
            }

            // Tier flow: direction breakdown
            if (direction === 'up')   increases += count;
            if (direction === 'down') decreases += count;

            totalAdjustments += count;
        });
    }

    // Map tier string keys to 7-position array matching tierDist.labels order (-3 to 3)
    const tierLabels = ['-3', '-2', '-1', '0', '1', '2', '3'];
    const tierDistArray = tierLabels.map(t => tierDistCounts[t] || 0);

    return {
        aiData: {
            tierDistCounts: tierDistArray,
            increases,
            decreases,
            totalAdjustments,
            hasRealData: totalAdjustments > 0,
        }
    };
}
```

---

## Change 3: `live.html` — `fetchAIAnalysisData()` function

**After line 3243** (end of `fetchProgressionAnalysisData()`):

```javascript
async function fetchAIAnalysisData() {
    const dataRangeSelect = document.getElementById('data-range-select');
    const selectedValue = dataRangeSelect ? dataRangeSelect.value : '90day-43';

    const [dateRange, versionShort] = selectedValue.split('-');
    const version = versionShort === '43' ? '4.3' :
                    versionShort === 'all' ? 'all' : '4.3';

    const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.analytics}?type=standard&subType=ai-analysis&version=${version}&dateRange=${dateRange}`;

    try {
        // AbortSignal.timeout() — Baseline 2024 (replaces AbortController + setTimeout boilerplate)
        const response = await fetch(url, {
            signal: AbortSignal.timeout(API_CONFIG.timeout),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return { success: true, data };

    } catch (error) {
        if (error.name === 'TimeoutError') { // AbortSignal.timeout() throws TimeoutError, not AbortError
            console.error(`AI-analysis request timeout after ${API_CONFIG.timeout}ms`);
            return { success: false, error: 'Request timeout', data: null };
        }
        console.error(`Failed to fetch AI analysis data:`, error);
        return { success: false, error: error.message, data: null };
    }
}
```

---

## Change 4: `live.html` — Integration in `loadAndRenderGA4Data()`

**After line 3453** (end of progression-analysis block, before `reinitAllCharts()` on line 3456):

```javascript
// Fetch AI analysis data (tier distribution and flow by direction)
console.log('Fetching AI-analysis data...');
const aiResult = await fetchAIAnalysisData();

if (aiResult.success && aiResult.data) {
    const aiData = mapGA4ResponseToDATA(aiResult.data, 'ai-analysis');

    if (!aiData.error && aiData.aiData?.hasRealData) {
        // Populate tierDist counts — chartAITierDist() reads DATA.aiAgent.tierDist.counts
        DATA.aiAgent.tierDist.counts = aiData.aiData.tierDistCounts;
        // Populate tierFlow — chartAITierFlow() reads DATA.aiAgent.tierFlow
        DATA.aiAgent.tierFlow.increases = aiData.aiData.increases;
        DATA.aiAgent.tierFlow.decreases = aiData.aiData.decreases;
        // Populate KPI — populateAIKPIs() reads DATA.aiAgent.kpis.avgAdjustments
        DATA.aiAgent.kpis.avgAdjustments = aiData.aiData.totalAdjustments.toString();
        console.log('AI analysis data updated:', aiData.aiData.totalAdjustments, 'adjustments');
    } else {
        console.warn('AI-analysis parsing failed or no data, charts remain empty');
    }
} else {
    console.warn('AI-analysis fetch failed:', aiResult.error);
}
```

---

## Possible Errors

| Error | Cause | Solution |
|---|---|---|
| `customEvent:old_tier` not registered | Dimension not in GA4 property | Verify in GA4 Admin → Custom Definitions |
| Empty rows returned | No `ai_difficulty_adjusted` events in date range | Switch to 90day or alltime in selector |
| Tier values outside -3 to 3 | Unexpected tier strings from GA4 | Array map returns 0 for unmatched keys (safe) |
| Parser returns `{}` | Wrong event name in GA4 | Check DebugView for actual event name |
| Lambda 500 error | Dimension not registered in GA4 property | Register custom dims in GA4 Admin first |

---

## Testing Checklist

- [ ] Deploy Lambda — verify `?subType=ai-analysis` returns rows with old_tier/new_tier/direction dims
- [ ] Check console for `AI analysis data updated: X adjustments`
- [ ] AI Tier Distribution chart shows non-zero bars
- [ ] Tier Flow chart shows increases vs decreases split
- [ ] avgAdjustments KPI shows a number (not `—`)
- [ ] Date range selector changes AI data correctly (7day vs 90day vs alltime)
- [ ] All other charts unaffected (regression check on Overview, Boss, Platform tabs)

---

## Implementation Order

1. `api/index.js` — add ai-analysis handler (Change 1)
2. Deploy Lambda to AWS
3. Test endpoint directly (`curl` or browser)
4. `live.html` — add parser (Change 2)
5. `live.html` — add fetch function (Change 3)
6. `live.html` — add integration (Change 4)
7. Load dashboard, verify console logs, test charts
