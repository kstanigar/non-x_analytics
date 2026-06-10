# AWS Lambda & GA4 Analytics Bridge Implementation Plan

## Project Overview
This document outlines the end-to-end architecture and step-by-step implementation plan for creating an enterprise-grade serverless bridge. This bridge will securely pull Google Analytics 4 (GA4) data using the Google Analytics Data API and expose it to the `non-x_analytics` frontend via AWS API Gateway and AWS Lambda.

---

## Assessment: Game Data Structure
**Status: SOLID**
Based on previous reviews, the game tracks roughly 26 discrete lifecycle events (`player_won`, `ai_difficulty_adjusted`, funnel steps, etc.). 
* **Why it works:** Modern analytics thrive on "flat," event-driven architectures. Because your events are granular and specific, they translate perfectly into serverless payloads. 
* **Recommendation:** Do not overhaul the data structure. Ensure that each event currently fired sends standard contextual payload metadata (e.g., `platform` [desktop/mobile], `current_ai_tier`, `level_number`). If it already does this, the foundation is robust and ready for this enterprise setup.

---

## Implementation Plan

### Phase 1: Google Cloud Platform (GCP) Preparation
We must generate a secure "key" (Service Account) so AWS Lambda can legally request data from your GA4 property.

* **Steps:**
  1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
  2. Create a new Project (e.g., "NON-X Analytics API").
  3. Enable the **Google Analytics Data API**.
  4. Navigate to IAM & Admin -> Service Accounts. Create a new Service Account.
  5. Generate and download a JSON Key for this Service Account.
  6. **CRITICAL STEP:** Copy the Service Account email address. Go to your actual GA4 Admin dashboard -> Property Access Management, and add that email address as a **Viewer**.
* **Estimated Time:** 20 - 30 minutes.
* **Potential Issues:** The most common failure point is forgetting step 6. If the Service Account is not added to the GA4 property, the API will return a `403 Permission Denied` error.

### Phase 2: AWS Lambda Setup (The Logic)
We will write the Node.js script that acts as the "brain." This bridge will be designed to handle routing for both the **Real-Time API** (`runRealtimeReport`) and the **Standard Report API** (`runReport`) depending on the request parameters, acting as a unified analytics endpoint.

* **Steps:**
  1. Locally initialize a Node.js project (`npm init -y`) and install the Google API client: `npm install @google-analytics/data`.
  2. Write an `index.js` file exporting a standard async AWS handler (`exports.handler = async (event) => {...}`).
  3. The handler will securely read the Google JSON key from AWS Environment Variables, route the query to either the realtime or standard API, and return a JSON payload.
  4. Zip the `index.js` and `node_modules`. (Important: Zip the files *inside* the folder, not the parent folder itself).
  5. Go to the AWS Console, create a new Lambda Function (Node.js runtime), and upload the zip.
  6. Add the Google Service Account JSON string to the Lambda Environment Variables (`GOOGLE_CREDENTIALS`) for security.
* **Estimated Time:** 1 - 2 hours.
* **Potential Issues:** AWS Lambda requires a very specific zip file structure. If the `node_modules` and `index.js` aren't at the root of the zip, Lambda will throw a "Cannot find module" error. Furthermore, Lambda cold starts might cause a 1-2 second delay on the first API hit of the day.

**Boilerplate Lambda Code (`index.js`):**
```javascript
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
        let response;

        if (requestType === 'realtime') {
            // ─── 1. REAL-TIME API (Last 30 Mins) ───
            [response] = await analyticsDataClient.runRealtimeReport({
                property: `properties/${propertyId}`,
                dimensions: [{ name: 'eventName' }],
                metrics: [{ name: 'activeUsers' }],
            });
        } else {
            // ─── 2. STANDARD API (Historical Data) ───
            [response] = await analyticsDataClient.runReport({
                property: `properties/${propertyId}`,
                dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
                dimensions: [{ name: 'eventName' }],
                metrics: [{ name: 'eventCount' }],
            });
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
```
### Phase 3: Amazon API Gateway (The Front Door)
Lambda functions are private by default. We must put an API Gateway in front of it to give your dashboard a public URL to call.

* **Steps:**
  1. In AWS Console, go to API Gateway and create a new **REST API**.
  2. Create a Resource (e.g., `/analytics`) and a Method (`GET`).
  3. Link the `GET` method to your specific Lambda function.
  4. **CRITICAL STEP: Enable CORS (Cross-Origin Resource Sharing)**. You must configure CORS to allow requests from your local server (`http://localhost:8000`) and your GitHub Pages domain. 
  5. Deploy the API to a stage (e.g., `prod`), which will generate your public invocation URL.
* **Estimated Time:** 45 - 60 minutes.
* **Potential Issues:** CORS is notoriously frustrating. If CORS headers (`Access-Control-Allow-Origin`) are not perfectly configured in both the API Gateway settings *and* explicitly returned in your Lambda's JSON response, the Chrome/Safari browser will aggressively block the dashboard from receiving the data.

### Phase 4: Dashboard Integration & UI Update
Connecting your `index.html` file to the new enterprise endpoint.

* **Steps:**
  1. In your `nonx-analytics-dashboard.html` (or separate JS file), write a `fetch()` function that pings the new AWS API Gateway URL.
  2. Remove or bypass the "Drag-and-Drop CSV" logic.
  3. Map the returned JSON payload directly into your Chart.js datasets.
  4. Set up an optional recursive timeout (e.g., every 5 minutes) to re-fetch the data to simulate real-time live monitoring.
* **Estimated Time:** 1 - 2 hours.
* **Potential Issues:** GA4 sometimes returns data in slightly obtuse, nested array formats. Time will be spent writing a small Javascript mapping function to translate Google's JSON arrays into the flat arrays that Chart.js requires.

---

## Important Security Notes
* **Never commit the `service-account.json` to GitHub.** It should only exist on your local machine and securely pasted into AWS Environment Variables. Add `*.json` to your `.gitignore` immediately if it isn't already there.
* The API Gateway URL will technically be public. To prevent a malicious actor from spamming your URL and running up your AWS bill, we can establish **Rate Limiting** natively inside AWS API Gateway (e.g., limiting calls to 10 per second). This is a vital enterprise safety feature.
