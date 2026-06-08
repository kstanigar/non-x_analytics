# AWS Lambda & GA4 Bridge Task List

A checklist for building the serverless API connecting GA4 to the NON-X analytics dashboard.

## Phase 1: Google Cloud Setup
- [x] Log into Google Cloud Console and Create a Project.
- [x] Enable the "Google Analytics Data API".
- [x] Create a "Service Account" and save the JSON key locally (Do NOT commit to GitHub).
- [x] Copy the Service Account email.
- [x] Go to GA4 Admin -> Property Access Management and add the Service Account email as a "Viewer".

## Phase 2: AWS Lambda Setup (The API)
- [x] Scaffold local Node.js structure (`index.js` and `package.json` created).
- [x] Inject actual `propertyId` for the GA4 property.
- [x] Zip `index.js` and `node_modules` and upload to an AWS Node.js Lambda function.
- [x] Add the Google JSON payload into the AWS Environment Variables (`GOOGLE_CREDENTIALS` and `GA4_PROPERTY_ID`).
- [x] Configure Lambda function settings (512 MB memory → optimized to 256 MB on Apr 26, 2026, 20 sec timeout, x86_64 architecture).
- [x] Test the function execution (tested via API Gateway - working perfectly).

## Phase 3: Amazon API Gateway Setup (The Front Door)

**📘 Detailed Guide:** See `docs/Phase3_API_Gateway_Setup_Guide.md` for step-by-step instructions with screenshots and troubleshooting.

**🔴 CRITICAL:** Use `SecurityPolicy_TLS13_1_2_2021_06` (NOT legacy `TLS_1_2`) - AWS now requires TLS 1.3 support.

- [x] Create a new REST API within Amazon API Gateway with TLS 1.3 security policy.
- [x] Create `/analytics` resource.
- [x] Add a `GET /analytics` method linked directly to the Lambda function (with Lambda Proxy integration).
- [x] Configure CORS (Cross-Origin Resource Sharing) headers so the dashboard's domain can access it.
- [x] Add a Rate-Limiter (Usage Plan) to protect the API from spam (10 req/sec, 1000 req/day).
- [x] Deploy the API to a "prod" stage to generate the live URL.
- [x] Test endpoint with cURL and verify CORS headers.
- [x] Save API Gateway URL for Phase 4 integration.

## Phase 4: The "Live" Dashboard Evolution ✅ COMPLETE (April 26, 2026)
- [x] Duplicate the current analytics frontend `index.html` into a new "live" dashboard version (e.g., `live.html`).
- [x] Remove the CSV Drag-and-Drop modules and logic.
- [x] Create `fetch()` calls point to the newly generated AWS API Gateway URL.
- [x] Map the incoming API JSON format natively into Chart.js dataset arrays.
- [x] Add a timed interval (e.g., every 5 minutes) to automatically re-fetch real-time data from the API endpoint.

**Status:** Production-ready live dashboard with API integration
**API Endpoint:** `https://6waopo3jh1.execute-api.us-east-2.amazonaws.com/prod/analytics`
**Features:** Auto-refresh every 1 hour, manual refresh button, error handling with fallback to sample data
**KPIs Working:** Sessions, Win Rate, Death Rate, Leaderboard Rate (4 of 12 metrics)
**Known Limitations:** Current Lambda returns basic event counts only; enhanced multi-dimensional queries planned for Phase 5

## Phase 5: Analytics Enhancement ⏸️ IN PROGRESS (80% Complete - April 27, 2026)
- [x] Add `analytics_version` dimension filtering to Lambda ✅ DEPLOYED (filter for version 4.3 vs all versions)
- [x] Add version selector dropdown to dashboard UI ✅ COMPLETE (3 options: all, 4.3, 4.2)
- [x] Change auto-refresh from 5 minutes to 1 hour ✅ COMPLETE (92% API cost reduction)
- [x] Remove duplicate A/B test charts ✅ COMPLETE (keep comparison cards only)
- [ ] Convert Looker tab to public-facing Case Study page ⏸️ PENDING (two-column: casual + technical)
- [ ] Data investigation and validation ⚠️ REQUIRED before deployment (see Phase5_Handoff_Summary_April27_2026.md)
- [ ] Enhance Lambda to support multi-dimensional queries (platform, date ranges, custom parameters) - Future Phase 6
- [ ] Update dashboard to display all 12 KPIs with live data - Future Phase 6

**Current Status:** Lambda deployed with version filtering. Dashboard changes local only (not yet committed).
**Blocker:** Data accuracy investigation required before git commit/deployment.
**Documentation:** See `docs/Phase5_Handoff_Summary_April27_2026.md` for complete session report.
