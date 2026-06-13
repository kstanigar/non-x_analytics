const { BetaAnalyticsDataClient } = require('@google-analytics/data');

const analyticsDataClient = new BetaAnalyticsDataClient({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS)
});

const propertyId = process.env.GA4_PROPERTY_ID;

// CORS origin — set to production domain before Standing Tiger deploy (replace '*')
const ALLOWED_ORIGIN = 'https://kstanigar.github.io';

// Input validation whitelists — reject unknown values before hitting GA4
const VALID_TYPES      = ['standard', 'realtime'];
const VALID_SUBTYPES   = ['platform-split','daily-timeseries','boss-analysis','survival-time','powerup-analysis','progression-analysis','ai-analysis','death-triggers','new-user-pct','replay-rate','music-ab','music-funnel','movement-ab','engagement-events','avg-tier'];
const VALID_DATE_RANGES = ['7day','30day','90day','alltime'];

// BigQuery client — lazy-loaded only when avg-tier handler is called
let bigqueryClient = null;
const getBigQueryClient = () => {
    if (!bigqueryClient) {
        const { BigQuery } = require('@google-cloud/bigquery');
        bigqueryClient = new BigQuery({
            projectId: process.env.GCP_PROJECT_ID,
            credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS)
        });
    }
    return bigqueryClient;
};

// 24h in-memory cache — matches BigQuery daily export cadence
const tierCache = { data: null, timestamp: 0 };
const TIER_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Compute YYYYMMDD string for BigQuery _TABLE_SUFFIX filter
const getBQStartDate = (param) => {
    if (param === 'alltime') return '20260301';
    const days = parseInt(param); // '7day' → 7, '30day' → 30, '90day' → 90
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10).replace(/-/g, '');
};

exports.handler = async (event) => {
    try {
        const requestType = event.queryStringParameters?.type || 'standard';
        const version = event.queryStringParameters?.version || '4.3';
        const subType = event.queryStringParameters?.subType || null;
        const dateRangeParam = event.queryStringParameters?.dateRange || '7day';

        // Validate inputs — return 400 for unknown values to prevent unexpected GA4 queries
        if (!VALID_TYPES.includes(requestType)) {
            return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN }, body: JSON.stringify({ error: 'Invalid request type' }) };
        }
        if (subType && !VALID_SUBTYPES.includes(subType)) {
            return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN }, body: JSON.stringify({ error: 'Invalid subType' }) };
        }
        if (!VALID_DATE_RANGES.includes(dateRangeParam)) {
            return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN }, body: JSON.stringify({ error: 'Invalid date range' }) };
        }

        const dateRangeMap = {
            '7day':    { startDate: '7daysAgo',  endDate: 'today' },
            '30day':   { startDate: '30daysAgo', endDate: 'today' },
            '90day':   { startDate: '90daysAgo', endDate: 'today' },
            'alltime': { startDate: '2026-03-01', endDate: 'today' } // v4.3 data start date
        };

        const dateRange = dateRangeMap[dateRangeParam] || dateRangeMap['7day'];

        let response;

        // Build version filter — omitted when version === 'all'
        const dimensionFilter = version === 'all' ? undefined : {
            filter: {
                fieldName: 'customEvent:analytics_version',
                stringFilter: {
                    matchType: 'EXACT',
                    value: version
                }
            }
        };

        // platform × deviceCategory × eventName
        if (requestType === 'standard' && subType === 'platform-split') {
            const platformSplitRequest = {
                property: `properties/${propertyId}`,
                dateRanges: [dateRange],
                dimensions: [
                    { name: 'platform' },       // 'WEB' or 'APP'
                    { name: 'deviceCategory' },  // 'desktop', 'mobile', 'tablet'
                    { name: 'eventName' }
                ],
                metrics: [{ name: 'eventCount' }],
            };
            if (dimensionFilter) {
                platformSplitRequest.dimensionFilter = dimensionFilter;
            }
            [response] = await analyticsDataClient.runReport(platformSplitRequest);

        // date × eventName daily trends
        } else if (requestType === 'standard' && subType === 'daily-timeseries') {
            const dailyTimeseriesRequest = {
                property: `properties/${propertyId}`,
                dateRanges: [dateRange],
                dimensions: [
                    { name: 'date' },        // YYYYMMDD format (e.g., "20260609")
                    { name: 'eventName' }    // game_start, player_won, etc.
                ],
                metrics: [{ name: 'eventCount' }],
            };
            if (dimensionFilter) {
                dailyTimeseriesRequest.dimensionFilter = dimensionFilter;
            }
            [response] = await analyticsDataClient.runReport(dailyTimeseriesRequest);

        // deviceCategory × boss_id × eventName
        } else if (requestType === 'standard' && subType === 'boss-analysis') {
            const bossAnalysisRequest = {
                property: `properties/${propertyId}`,
                dateRanges: [dateRange],
                dimensions: [
                    { name: 'deviceCategory' },       // 'desktop', 'mobile', 'tablet'
                    { name: 'customEvent:boss_id' },   // '1', '2', or '3'
                    { name: 'eventName' }              // 'boss_attempt', 'boss_defeated'
                ],
                metrics: [{ name: 'eventCount' }],
            };
            if (dimensionFilter) {
                bossAnalysisRequest.dimensionFilter = dimensionFilter;
            }
            [response] = await analyticsDataClient.runReport(bossAnalysisRequest);

        // deviceCategory × session_duration_seconds × eventName
        } else if (requestType === 'standard' && subType === 'survival-time') {
            const survivalTimeRequest = {
                property: `properties/${propertyId}`,
                dateRanges: [dateRange],
                dimensions: [
                    { name: 'deviceCategory' },                       // 'desktop', 'mobile', 'tablet'
                    { name: 'customEvent:session_duration_seconds' },  // duration in seconds (e.g., "45", "120")
                    { name: 'eventName' }                             // 'player_won', 'player_death', etc.
                ],
                metrics: [{ name: 'eventCount' }],
            };
            if (dimensionFilter) {
                survivalTimeRequest.dimensionFilter = dimensionFilter;
            }
            [response] = await analyticsDataClient.runReport(survivalTimeRequest);

        // powerup_type × phase × eventName × deviceCategory
        } else if (requestType === 'standard' && subType === 'powerup-analysis') {
            const powerupAnalysisRequest = {
                property: `properties/${propertyId}`,
                dateRanges: [dateRange],
                dimensions: [
                    { name: 'customEvent:powerup_type' },  // 'health', 'double_laser', 'shield', 'quad_shot'
                    { name: 'customEvent:phase' },          // 'green', 'red', 'purple'
                    { name: 'eventName' },                  // 'powerup_collected'
                    { name: 'deviceCategory' }              // 'desktop', 'mobile', 'tablet'
                ],
                metrics: [{ name: 'eventCount' }],
            };
            if (dimensionFilter) {
                powerupAnalysisRequest.dimensionFilter = dimensionFilter;
            }
            [response] = await analyticsDataClient.runReport(powerupAnalysisRequest);

        // phase × level_reached × eventName × deviceCategory
        } else if (requestType === 'standard' && subType === 'progression-analysis') {
            const progressionAnalysisRequest = {
                property: `properties/${propertyId}`,
                dateRanges: [dateRange],
                dimensions: [
                    { name: 'customEvent:phase' },          // 'green', 'red', 'purple'
                    { name: 'customEvent:level_reached' },  // integer level values
                    { name: 'eventName' },                  // 'wave_reached', 'player_won', 'player_death'
                    { name: 'deviceCategory' }              // 'desktop', 'mobile', 'tablet'
                ],
                metrics: [{ name: 'eventCount' }],
            };
            if (dimensionFilter) {
                progressionAnalysisRequest.dimensionFilter = dimensionFilter;
            }
            [response] = await analyticsDataClient.runReport(progressionAnalysisRequest);

        // old_tier × new_tier × direction × eventName × deviceCategory
        } else if (requestType === 'standard' && subType === 'ai-analysis') {
            const aiAnalysisRequest = {
                property: `properties/${propertyId}`,
                dateRanges: [dateRange],
                dimensions: [
                    { name: 'customEvent:old_tier' },              // tier before adjustment ('-3' to '3')
                    { name: 'customEvent:new_tier' },              // tier after adjustment ('-3' to '3')
                    { name: 'customEvent:direction' },             // 'increase' or 'decrease'
                    { name: 'eventName' },                         // 'ai_difficulty_adjusted'
                    { name: 'deviceCategory' },                    // 'desktop', 'mobile', 'tablet'
                    { name: 'customEvent:speed_locked' },          // 'true' or 'false'
                    { name: 'customEvent:effective_multiplier' }   // '0.5', '1.2', '1.75', etc.
                ],
                metrics: [{ name: 'eventCount' }],
            };
            if (dimensionFilter) {
                aiAnalysisRequest.dimensionFilter = dimensionFilter;
            }
            [response] = await analyticsDataClient.runReport(aiAnalysisRequest);

        // death_phase × eventName × deviceCategory
        } else if (requestType === 'standard' && subType === 'death-triggers') {
            const deathTriggersRequest = {
                property: `properties/${propertyId}`,
                dateRanges: [dateRange],
                dimensions: [
                    { name: 'customEvent:death_phase' },  // 'green', 'red', 'purple'
                    { name: 'eventName' },                 // 'player_death'
                    { name: 'deviceCategory' }             // 'desktop', 'mobile', 'tablet'
                ],
                metrics: [{ name: 'eventCount' }],
            };
            if (dimensionFilter) {
                deathTriggersRequest.dimensionFilter = dimensionFilter;
            }
            [response] = await analyticsDataClient.runReport(deathTriggersRequest);

        // newVsReturning × eventName
        } else if (requestType === 'standard' && subType === 'new-user-pct') {
            const newUserPctRequest = {
                property: `properties/${propertyId}`,
                dateRanges: [dateRange],
                dimensions: [
                    { name: 'newVsReturning' },  // 'new' or 'returning' (GA4 built-in dimension)
                    { name: 'eventName' }         // filtered to 'game_start'
                ],
                metrics: [{ name: 'eventCount' }],
            };
            if (dimensionFilter) {
                newUserPctRequest.dimensionFilter = dimensionFilter;
            }
            [response] = await analyticsDataClient.runReport(newUserPctRequest);

        // is_replay × eventName × deviceCategory
        } else if (requestType === 'standard' && subType === 'replay-rate') {
            const replayRateRequest = {
                property: `properties/${propertyId}`,
                dateRanges: [dateRange],
                dimensions: [
                    { name: 'customEvent:is_replay' },  // 'true' or 'false'
                    { name: 'eventName' },               // filtered to 'game_start'
                    { name: 'deviceCategory' }           // 'desktop', 'mobile', 'tablet'
                ],
                metrics: [{ name: 'eventCount' }],
            };
            if (dimensionFilter) { replayRateRequest.dimensionFilter = dimensionFilter; }
            [response] = await analyticsDataClient.runReport(replayRateRequest);

        // ab_music_group × eventName
        } else if (requestType === 'standard' && subType === 'music-ab') {
            const musicABRequest = {
                property: `properties/${propertyId}`,
                dateRanges: [dateRange],
                dimensions: [
                    { name: 'customEvent:ab_music_group' },  // 'A' or 'B'
                    { name: 'eventName' }                     // game_start, player_won, etc.
                ],
                metrics: [{ name: 'eventCount' }],
            };
            if (dimensionFilter) { musicABRequest.dimensionFilter = dimensionFilter; }
            [response] = await analyticsDataClient.runReport(musicABRequest);

        // ab_music_group × boss_id × eventName — max 12 rows (2 groups × 3 bosses × 2 events)
        } else if (requestType === 'standard' && subType === 'music-funnel') {
            const musicFunnelRequest = {
                property: `properties/${propertyId}`,
                dateRanges: [dateRange],
                dimensions: [
                    { name: 'customEvent:ab_music_group' },  // 'A' or 'B'
                    { name: 'customEvent:boss_id' },          // '1', '2', '3'
                    { name: 'eventName' }                     // 'boss_attempt', 'boss_defeated'
                ],
                metrics: [{ name: 'eventCount' }],
            };
            if (dimensionFilter) { musicFunnelRequest.dimensionFilter = dimensionFilter; }
            [response] = await analyticsDataClient.runReport(musicFunnelRequest);

        // movement_group × eventName
        } else if (requestType === 'standard' && subType === 'movement-ab') {
            const movementABRequest = {
                property: `properties/${propertyId}`,
                dateRanges: [dateRange],
                dimensions: [
                    { name: 'customEvent:movement_group' },  // values TBC from endpoint test
                    { name: 'eventName' }                     // game_start, player_won, etc.
                ],
                metrics: [{ name: 'eventCount' }],
            };
            if (dimensionFilter) { movementABRequest.dimensionFilter = dimensionFilter; }
            [response] = await analyticsDataClient.runReport(movementABRequest);

        // engagement eventName filter
        } else if (requestType === 'standard' && subType === 'engagement-events') {
            const engagementRequest = {
                property: `properties/${propertyId}`,
                dateRanges: [dateRange],
                dimensions: [{ name: 'eventName' }],
                metrics: [{ name: 'eventCount' }],
                dimensionFilter: {
                    andGroup: {
                        expressions: [
                            ...(dimensionFilter ? [dimensionFilter] : []),
                            {
                                filter: {
                                    fieldName: 'eventName',
                                    inListFilter: {
                                        values: ['scorecard_viewed', 'music_toggled', 'leave_game', 'survey_submitted']
                                    }
                                }
                            }
                        ]
                    }
                }
            };
            [response] = await analyticsDataClient.runReport(engagementRequest);

        // eventName=ai_difficulty_adjusted: first old_tier + last new_tier per session (BigQuery)
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
            const datasetId = process.env.BQ_DATASET_ID || `analytics_${propertyId}`;
            const bqStartDate = getBQStartDate(dateRangeParam);
            const queryOpts = { maxBytesBilled: '500000000' }; // 500MB safety cap

            const [[startRows], [endRows]] = await Promise.all([
                bq.query({
                    ...queryOpts,
                    query: `
                        SELECT ROUND(AVG(start_tier), 1) AS avg_start_tier
                        FROM (
                            SELECT DISTINCT user_pseudo_id,
                                (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS session_id,
                                FIRST_VALUE(
                                    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'old_tier')
                                ) OVER (
                                    PARTITION BY user_pseudo_id,
                                        (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id')
                                    ORDER BY event_timestamp ASC
                                ) AS start_tier
                            FROM \`${process.env.GCP_PROJECT_ID}.${datasetId}.events_*\`
                            WHERE _TABLE_SUFFIX >= '${bqStartDate}'
                                AND event_name = 'ai_difficulty_adjusted'
                        )
                    `
                }),
                bq.query({
                    ...queryOpts,
                    query: `
                        SELECT ROUND(AVG(final_tier), 1) AS avg_final_tier
                        FROM (
                            SELECT DISTINCT user_pseudo_id,
                                (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS session_id,
                                LAST_VALUE(
                                    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'new_tier')
                                ) OVER (
                                    PARTITION BY user_pseudo_id,
                                        (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id')
                                    ORDER BY event_timestamp ASC
                                    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
                                ) AS final_tier
                            FROM \`${process.env.GCP_PROJECT_ID}.${datasetId}.events_*\`
                            WHERE _TABLE_SUFFIX >= '${bqStartDate}'
                                AND event_name = 'ai_difficulty_adjusted'
                        )
                    `
                })
            ]);

            const result = {
                avgStartTier: startRows[0]?.avg_start_tier ?? null,
                avgFinalTier:  endRows[0]?.avg_final_tier  ?? null
            };
            tierCache.data = result;
            tierCache.timestamp = now;
            return {
                statusCode: 200,
                headers: { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Content-Type': 'application/json' },
                body: JSON.stringify(result)
            };

        // real-time event data
        } else if (requestType === 'realtime') {
            const realtimeRequest = {
                property: `properties/${propertyId}`,
                dimensions: [{ name: 'eventName' }],
                metrics: [{ name: 'eventCount' }],
            };
            if (dimensionFilter) {
                realtimeRequest.dimensionFilter = dimensionFilter;
            }
            [response] = await analyticsDataClient.runRealtimeReport(realtimeRequest);

        // historical event data fallback
        } else {
            const standardRequest = {
                property: `properties/${propertyId}`,
                dateRanges: [dateRange],
                dimensions: [{ name: 'eventName' }],
                metrics: [{ name: 'eventCount' }],
            };
            if (dimensionFilter) {
                standardRequest.dimensionFilter = dimensionFilter;
            }
            [response] = await analyticsDataClient.runReport(standardRequest);
        }

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(response),
        };

    } catch (error) {
        // Log full error server-side (CloudWatch); return generic message to client
        console.error('Lambda error:', error);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": ALLOWED_ORIGIN },
            body: JSON.stringify({ error: 'Internal server error' }),
        };
    }
};
