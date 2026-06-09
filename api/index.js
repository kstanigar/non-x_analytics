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
                dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
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
                dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
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
