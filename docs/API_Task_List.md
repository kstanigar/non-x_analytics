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

## Phase 4: The "Live" Dashboard Evolution
- [ ] Duplicate the current analytics frontend `index.html` into a new "live" dashboard version (e.g., `live.html`).
- [ ] Remove the CSV Drag-and-Drop modules and logic.
- [ ] Create `fetch()` calls point to the newly generated AWS API Gateway URL.
- [ ] Map the incoming API JSON format natively into Chart.js dataset arrays.
- [ ] Add a timed interval (e.g., every 5 minutes) to automatically re-fetch real-time data from the API endpoint.
