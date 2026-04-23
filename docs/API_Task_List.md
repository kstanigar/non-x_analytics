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
- [ ] Inject actual `propertyId` for the GA4 property.
- [ ] Zip `index.js` and `node_modules` and upload to an AWS Node.js Lambda function.
- [ ] Add the Google JSON payload into the AWS Environment Variables (`GOOGLE_CREDENTIALS`).
- [ ] Test the function execution natively in the AWS Lambda console.

## Phase 3: Amazon API Gateway Setup (The Front Door)
- [ ] Create a new REST API within Amazon API Gateway.
- [ ] Add a `GET /analytics` method linked directly to the Lambda function.
- [ ] Configure CORS (Cross-Origin Resource Sharing) headers so the dashboard's domain can access it.
- [ ] Add a Rate-Limiter (Usage Plan) to protect the API from spam.
- [ ] Deploy the API to a "prod" stage to generate the live URL.

## Phase 4: The "Live" Dashboard Evolution
- [ ] Duplicate the current analytics frontend `index.html` into a new "live" dashboard version (e.g., `live.html`).
- [ ] Remove the CSV Drag-and-Drop modules and logic.
- [ ] Create `fetch()` calls point to the newly generated AWS API Gateway URL.
- [ ] Map the incoming API JSON format natively into Chart.js dataset arrays.
- [ ] Add a timed interval (e.g., every 5 minutes) to automatically re-fetch real-time data from the API endpoint.
