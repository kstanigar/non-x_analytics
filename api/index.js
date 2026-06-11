const { BetaAnalyticsDataClient } = require('@google-analytics/data');

// Initialize the Google Analytics client using Environment Variables
const analyticsDataClient = new BetaAnalyticsDataClient({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS)
});

const propertyId = process.env.GA4_PROPERTY_ID; // e.g., 'YOUR-GA4-PROPERTY-ID'

// CORS origin — set to production domain before Standing Tiger deploy (replace '*')
const ALLOWED_ORIGIN = '*';

// Input validation whitelists — reject unknown values before hitting GA4
const VALID_TYPES      = ['standard', 'realtime'];
const VALID_SUBTYPES   = ['platform-split','daily-timeseries','boss-analysis','survival-time','powerup-analysis','progression-analysis','ai-analysis','death-triggers','new-user-pct','replay-rate','music-ab','music-funnel','movement-ab'];
const VALID_DATE_RANGES = ['7day','30day','90day','alltime'];

exports.handler = async (event) => {
    try {
        // Simple routing based on a query parameter (e.g., ?type=realtime)
        const requestType = event.queryStringParameters?.type || 'standard';
        const version = event.queryStringParameters?.version || '4.3'; // Default to version 4.3
        const subType = event.queryStringParameters?.subType || null;  // NEW: Enables multi-dimensional queries (platform-split, daily-timeseries, boss-analysis)
        const dateRangeParam = event.queryStringParameters?.dateRange || '7day'; // Extract date range parameter (default to 7 days)

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

        // Map date range string to GA4 date range object
        const dateRangeMap = {
            '7day': { startDate: '7daysAgo', endDate: 'today' },
            '30day': { startDate: '30daysAgo', endDate: 'today' },
            '90day': { startDate: '90daysAgo', endDate: 'today' },
            'alltime': { startDate: '2026-03-01', endDate: 'today' } // All data since v4.3 implementation (early-mid Apr 2026)
        };

        // Get date range object (fallback to 7 days if invalid value)
        const dateRange = dateRangeMap[dateRangeParam] || dateRangeMap['7day'];

        let response;

        // Build dimension filter for analytics_version (unless "all" is specified)
        const dimensionFilter = version === 'all' ? undefined : {
            filter: {
                fieldName: 'customEvent:analytics_version',
                stringFilter: {
                    matchType: 'EXACT',
                    value: version
                }
            }
        };

        // ─── PLATFORM SPLIT REQUEST (Desktop vs Mobile breakdown) ───
        if (requestType === 'standard' && subType === 'platform-split') {
            const platformSplitRequest = {
                property: `properties/${propertyId}`,
                dateRanges: [dateRange], // Dynamic date range from query parameter
                // Multi-dimensional query: platform × deviceCategory × eventName
                // Returns separate counts for desktop vs mobile gameplay
                dimensions: [
                    { name: 'platform' },      // Dimension 0: 'WEB' or 'APP'
                    { name: 'deviceCategory' }, // Dimension 1: 'desktop', 'mobile', 'tablet'
                    { name: 'eventName' }      // Dimension 2: event identifier
                ],
                metrics: [{ name: 'eventCount' }],
            };

            // Apply version filter if specified
            if (dimensionFilter) {
                platformSplitRequest.dimensionFilter = dimensionFilter;
            }

            [response] = await analyticsDataClient.runReport(platformSplitRequest);
        } else if (requestType === 'standard' && subType === 'daily-timeseries') {
            // ─── DAILY TIMESERIES REQUEST (14-day Play/Win trend) ───
            const dailyTimeseriesRequest = {
                property: `properties/${propertyId}`,
                dateRanges: [dateRange], // Dynamic date range from query parameter
                // Multi-dimensional query: date × eventName
                // Returns daily counts for game_start, player_won, etc.
                dimensions: [
                    { name: 'date' },         // Dimension 0: YYYYMMDD format (e.g., "20260609")
                    { name: 'eventName' }     // Dimension 1: game_start, player_won, etc.
                ],
                metrics: [{ name: 'eventCount' }],
            };

            // Apply version filter if specified
            if (dimensionFilter) {
                dailyTimeseriesRequest.dimensionFilter = dimensionFilter;
            }

            [response] = await analyticsDataClient.runReport(dailyTimeseriesRequest);
        } else if (requestType === 'standard' && subType === 'boss-analysis') {
            // ─── BOSS ANALYSIS REQUEST (Boss defeat rates by platform) ───
            const bossAnalysisRequest = {
                property: `properties/${propertyId}`,
                dateRanges: [dateRange], // Dynamic date range from query parameter
                // Multi-dimensional query: deviceCategory × boss_id × eventName
                // Returns boss attempts/defeats split by desktop vs mobile
                dimensions: [
                    { name: 'deviceCategory' },        // Dimension 0: 'desktop', 'mobile', 'tablet'
                    { name: 'customEvent:boss_id' },   // Dimension 1: '1', '2', or '3'
                    { name: 'eventName' }              // Dimension 2: 'boss_attempt', 'boss_defeated'
                ],
                metrics: [{ name: 'eventCount' }],
            };

            // Apply version filter if specified
            if (dimensionFilter) {
                bossAnalysisRequest.dimensionFilter = dimensionFilter;
            }

            [response] = await analyticsDataClient.runReport(bossAnalysisRequest);
        } else if (requestType === 'standard' && subType === 'survival-time') {
            // ─── SURVIVAL TIME REQUEST (Session duration distribution by platform) ───
            const survivalTimeRequest = {
                property: `properties/${propertyId}`,
                dateRanges: [dateRange], // Dynamic date range from query parameter
                // Multi-dimensional query: deviceCategory × session_duration_seconds × eventName
                // Returns session duration distribution split by desktop vs mobile
                dimensions: [
                    { name: 'deviceCategory' },                    // Dimension 0: 'desktop', 'mobile', 'tablet'
                    { name: 'customEvent:session_duration_seconds' }, // Dimension 1: duration in seconds (e.g., "45", "120", "180")
                    { name: 'eventName' }                          // Dimension 2: 'player_won', 'player_death', etc.
                ],
                metrics: [{ name: 'eventCount' }],
            };

            // Apply version filter if specified
            if (dimensionFilter) {
                survivalTimeRequest.dimensionFilter = dimensionFilter;
            }

            [response] = await analyticsDataClient.runReport(survivalTimeRequest);
        } else if (requestType === 'standard' && subType === 'powerup-analysis') {
            // ─── POWERUP ANALYSIS REQUEST (Powerup collection by phase and platform) ───
            const powerupAnalysisRequest = {
                property: `properties/${propertyId}`,
                dateRanges: [dateRange], // Dynamic date range from query parameter
                // Multi-dimensional query: powerup_type × phase × eventName × deviceCategory
                // Returns powerup collection counts split by phase (Green/Red/Purple) and platform (desktop/mobile)
                dimensions: [
                    { name: 'customEvent:powerup_type' },  // Dimension 0: 'health', 'double_laser', 'shield', 'quad_shot'
                    { name: 'customEvent:phase' },         // Dimension 1: 'green', 'red', 'purple'
                    { name: 'eventName' },                 // Dimension 2: 'powerup_collected'
                    { name: 'deviceCategory' }             // Dimension 3: 'desktop', 'mobile', 'tablet'
                ],
                metrics: [{ name: 'eventCount' }],
            };

            // Apply version filter if specified
            if (dimensionFilter) {
                powerupAnalysisRequest.dimensionFilter = dimensionFilter;
            }

            [response] = await analyticsDataClient.runReport(powerupAnalysisRequest);
        } else if (requestType === 'standard' && subType === 'progression-analysis') {
            // ─── PROGRESSION ANALYSIS REQUEST (Phase/level drop-off by event) ───
            const progressionAnalysisRequest = {
                property: `properties/${propertyId}`,
                dateRanges: [dateRange], // Dynamic date range from query parameter
                // Multi-dimensional query: phase × level_reached × eventName × deviceCategory
                // Returns progression counts split by phase (Green/Red/Purple) and level reached
                dimensions: [
                    { name: 'customEvent:phase' },         // Dimension 0: 'green', 'red', 'purple'
                    { name: 'customEvent:level_reached' }, // Dimension 1: integer level values
                    { name: 'eventName' },                 // Dimension 2: 'wave_reached', 'player_won', 'player_death'
                    { name: 'deviceCategory' }             // Dimension 3: 'desktop', 'mobile', 'tablet'
                ],
                metrics: [{ name: 'eventCount' }],
            };

            // Apply version filter if specified
            if (dimensionFilter) {
                progressionAnalysisRequest.dimensionFilter = dimensionFilter;
            }

            [response] = await analyticsDataClient.runReport(progressionAnalysisRequest);
        } else if (requestType === 'standard' && subType === 'ai-analysis') {
            // ─── AI ANALYSIS REQUEST (Tier distribution and flow by direction) ───
            const aiAnalysisRequest = {
                property: `properties/${propertyId}`,
                dateRanges: [dateRange], // Dynamic date range from query parameter
                // Multi-dimensional query: old_tier × new_tier × direction × eventName × deviceCategory
                // Returns AI adjustment counts split by tier transition and direction (up/down)
                dimensions: [
                    { name: 'customEvent:old_tier' },     // Dimension 0: tier before adjustment ('-3' to '3')
                    { name: 'customEvent:new_tier' },     // Dimension 1: tier after adjustment ('-3' to '3')
                    { name: 'customEvent:direction' },    // Dimension 2: 'increase' or 'decrease'
                    { name: 'eventName' },                // Dimension 3: 'ai_difficulty_adjusted'
                    { name: 'deviceCategory' },           // Dimension 4: 'desktop', 'mobile', 'tablet'
                    { name: 'customEvent:speed_locked' },          // Dimension 5: 'true' or 'false'
                    { name: 'customEvent:effective_multiplier' }  // Dimension 6: '0.5', '1.2', '1.75' etc.
                ],
                metrics: [{ name: 'eventCount' }],
            };

            // Apply version filter if specified
            if (dimensionFilter) {
                aiAnalysisRequest.dimensionFilter = dimensionFilter;
            }

            [response] = await analyticsDataClient.runReport(aiAnalysisRequest);
        } else if (requestType === 'standard' && subType === 'death-triggers') {
            // ─── DEATH TRIGGERS REQUEST (Death counts by phase) ───
            const deathTriggersRequest = {
                property: `properties/${propertyId}`,
                dateRanges: [dateRange],
                // Multi-dimensional query: death_phase × eventName × deviceCategory
                // Returns player_death counts split by game phase (green/red/purple)
                dimensions: [
                    { name: 'customEvent:death_phase' }, // Dimension 0: 'green', 'red', 'purple'
                    { name: 'eventName' },               // Dimension 1: 'player_death'
                    { name: 'deviceCategory' }           // Dimension 2: 'desktop', 'mobile', 'tablet'
                ],
                metrics: [{ name: 'eventCount' }],
            };
            if (dimensionFilter) {
                deathTriggersRequest.dimensionFilter = dimensionFilter;
            }
            [response] = await analyticsDataClient.runReport(deathTriggersRequest);
        } else if (requestType === 'standard' && subType === 'new-user-pct') {
            // ─── NEW USER % REQUEST (New vs returning players) ───
            const newUserPctRequest = {
                property: `properties/${propertyId}`,
                dateRanges: [dateRange],
                // Multi-dimensional query: newVsReturning × eventName
                // Returns game_start counts split by new vs returning users
                dimensions: [
                    { name: 'newVsReturning' }, // Dimension 0: 'new' or 'returning' (GA4 built-in)
                    { name: 'eventName' }        // Dimension 1: filter to 'game_start'
                ],
                metrics: [{ name: 'eventCount' }],
            };
            if (dimensionFilter) {
                newUserPctRequest.dimensionFilter = dimensionFilter;
            }
            [response] = await analyticsDataClient.runReport(newUserPctRequest);
        } else if (requestType === 'standard' && subType === 'replay-rate') {
            // ─── REPLAY RATE REQUEST (Replay sessions as % of total game starts) ───
            const replayRateRequest = {
                property: `properties/${propertyId}`,
                dateRanges: [dateRange],
                // Multi-dimensional query: is_replay × eventName × deviceCategory
                // Returns game_start counts split by replay vs first-play, per platform
                dimensions: [
                    { name: 'customEvent:is_replay' }, // Dimension 0: 'true' or 'false'
                    { name: 'eventName' },              // Dimension 1: filter to 'game_start'
                    { name: 'deviceCategory' }          // Dimension 2: 'desktop', 'mobile', 'tablet'
                ],
                metrics: [{ name: 'eventCount' }],
            };
            if (dimensionFilter) { replayRateRequest.dimensionFilter = dimensionFilter; }
            [response] = await analyticsDataClient.runReport(replayRateRequest);
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
        } else if (requestType === 'standard' && subType === 'movement-ab') {
            // ─── MOVEMENT A/B REQUEST (Win rate split by movement_group) ───
            const movementABRequest = {
                property: `properties/${propertyId}`,
                dateRanges: [dateRange],
                // Multi-dimensional query: movement_group × eventName
                // Returns event counts split by movement scheme cohort
                dimensions: [
                    { name: 'customEvent:movement_group' }, // Dimension 0: values TBC from endpoint test
                    { name: 'eventName' }                    // Dimension 1: game_start, player_won, etc.
                ],
                metrics: [{ name: 'eventCount' }],
            };
            if (dimensionFilter) { movementABRequest.dimensionFilter = dimensionFilter; }
            [response] = await analyticsDataClient.runReport(movementABRequest);
        } else if (requestType === 'realtime') {
            // ─── 1. REAL-TIME API (Last 30 Mins) ───
            const realtimeRequest = {
                property: `properties/${propertyId}`,
                dimensions: [{ name: 'eventName' }],
                metrics: [{ name: 'eventCount' }],
            };
            if (dimensionFilter) {
                realtimeRequest.dimensionFilter = dimensionFilter;
            }
            [response] = await analyticsDataClient.runRealtimeReport(realtimeRequest);
        } else {
            // ─── 2. STANDARD API (Historical Data) ───
            const standardRequest = {
                property: `properties/${propertyId}`,
                dateRanges: [dateRange], // Dynamic date range from query parameter
                dimensions: [{ name: 'eventName' }],
                metrics: [{ name: 'eventCount' }],
            };
            if (dimensionFilter) {
                standardRequest.dimensionFilter = dimensionFilter;
            }
            [response] = await analyticsDataClient.runReport(standardRequest);
        }

        // Return successful response to API Gateway
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
