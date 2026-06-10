const { BetaAnalyticsDataClient } = require('@google-analytics/data');

// Initialize the Google Analytics client using Environment Variables
const analyticsDataClient = new BetaAnalyticsDataClient({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS)
});

const propertyId = process.env.GA4_PROPERTY_ID; // e.g., 'YOUR-GA4-PROPERTY-ID'

exports.handler = async (event) => {
    try {
        // Simple routing based on a query parameter (e.g., ?type=realtime)
        const requestType = event.queryStringParameters?.type || 'standard';
        const version = event.queryStringParameters?.version || '4.3'; // Default to version 4.3
        const subType = event.queryStringParameters?.subType || null;  // NEW: Enables multi-dimensional queries (platform-split, daily-timeseries, boss-analysis)
        const dateRangeParam = event.queryStringParameters?.dateRange || '7day'; // Extract date range parameter (default to 7 days)

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
                "Access-Control-Allow-Origin": "*", // Required for CORS
                "Content-Type": "application/json"
            },
            body: JSON.stringify(response),
        };
        
    } catch (error) {
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: error.message }),
        };
    }
};
