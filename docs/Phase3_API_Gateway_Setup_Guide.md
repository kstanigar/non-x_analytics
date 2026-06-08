# Phase 3: AWS API Gateway Setup Guide

**Project:** NON-X Analytics - AWS Lambda & GA4 Bridge
**Phase:** 3 of 4 (API Gateway Configuration)
**Last Updated:** April 25, 2026
**Critical Fix:** TLS 1.3 Security Policy Requirement

---

## Overview

This document provides step-by-step instructions for setting up AWS API Gateway as the public front door for the NON-X Analytics Lambda function. This phase creates the REST API endpoint that `live.html` will call to fetch live GA4 data.

**⚠️ CRITICAL REQUIREMENT:** AWS API Gateway now enforces TLS 1.3 support for Regional endpoints. You **MUST** use `SecurityPolicy_TLS13_1_2_2021_06` (not legacy `TLS_1_2`).

---

## Prerequisites

Before starting Phase 3, confirm:

- ✅ **Phase 1 Complete:** Google Cloud Service Account created, GA4 API enabled, Service Account added to GA4 property
- ✅ **Phase 2 Complete:** Lambda function deployed with `lambda-payload.zip`
- ✅ **Lambda Environment Variables Set:**
  - `GOOGLE_CREDENTIALS` = Service Account JSON string
  - `GA4_PROPERTY_ID` = Your GA4 property ID
- ✅ **Lambda Tested:** Function executes successfully and returns GA4 data
- ✅ **AWS Console Access:** Permissions to create API Gateway resources

---

## Phase 3 Task Checklist

- [ ] Create REST API with TLS 1.3 security policy
- [ ] Create `/analytics` resource
- [ ] Add GET method linked to Lambda function
- [ ] Enable CORS for cross-origin requests
- [ ] Create Usage Plan for rate limiting
- [ ] Deploy API to `prod` stage
- [ ] Test endpoint with cURL
- [ ] Verify CORS headers in response
- [ ] Save API Gateway URL for Phase 4

**Estimated Time:** 30-45 minutes

---

## Step 1: Create REST API with TLS 1.3 Policy

### 1.1 Navigate to API Gateway
```
AWS Console → Services → API Gateway
```

### 1.2 Create New REST API

Click **"Create API"** button

**On the "Choose an API type" screen:**
- Find the **REST API** card (NOT HTTP API, NOT REST API Private)
- Click **"Build"** under REST API

### 1.3 Configure REST API Settings

**Protocol:**
- Select: **REST**

**Create new API:**
- Select: **New API** (radio button)

**Settings:**
```
API name: NON-X Analytics API
Description: Serverless bridge between GA4 Data API and live analytics dashboard
Endpoint Type: Regional
```

**🔴 CRITICAL - TLS Security Policy:**
```
Minimum TLS Version: TLS 1.2
Security Policy: SecurityPolicy_TLS13_1_2_2021_06
```

**⚠️ DO NOT SELECT:**
- ~~`TLS_1_2`~~ (legacy, deprecated - will cause deployment failure)
- ~~`SecurityPolicy_TLS13_1_2_Ext1_2021_06`~~ (extended policy, not needed)

**Why this matters:**
- AWS Regional API Gateway endpoints now require TLS 1.3 compliance
- The `SecurityPolicy_TLS13_1_2_2021_06` policy supports both TLS 1.3 and TLS 1.2 for backward compatibility
- This was discovered as a blocker in the previous session and is a mandatory fix

Click **"Create API"**

---

## Step 2: Create /analytics Resource

You should now see the API Gateway Console with a tree view showing:
```
/ (root)
```

### 2.1 Create Resource

- Click **Actions** dropdown → **Create Resource**

**Configure Resource:**
```
Resource Name: analytics
Resource Path: /analytics
Enable API Gateway CORS: ☐ (leave UNCHECKED - we'll configure manually)
```

**Note:** We'll configure CORS manually in Step 4 for better control over headers.

Click **"Create Resource"**

Your tree should now show:
```
/ (root)
  /analytics
```

---

## Step 3: Create GET Method

### 3.1 Add GET Method to /analytics

- Select `/analytics` in the tree (click on it to highlight)
- Click **Actions** dropdown → **Create Method**
- A dropdown will appear under `/analytics` - select **GET**
- Click the checkmark ✓

### 3.2 Configure GET Method Integration

**Integration type:**
- Select: **Lambda Function** (radio button)

**Lambda Function Settings:**
```
Use Lambda Proxy integration: ☑ (CRITICAL - MUST BE CHECKED)
Lambda Region: <select your region, e.g., us-east-1>
Lambda Function: <type your Lambda function name - it should autocomplete>
```

**⚠️ Important Settings:**

1. **Lambda Proxy integration MUST be enabled**
   - This passes query parameters (`?type=realtime`) directly to your Lambda function
   - Without this, Lambda won't receive the `event.queryStringParameters` object
   - Your Lambda routing logic depends on this

2. **Lambda Function Name**
   - Start typing your function name - AWS will autocomplete if found
   - If autocomplete doesn't work, verify you're in the correct region

**Use Default Timeout:** ☑ (checked)

Click **"Save"**

### 3.3 Grant API Gateway Permission

**Permission Dialog:**
- AWS will display: "Add Permission to Lambda Function"
- Message: "You are about to give API Gateway permission to invoke your Lambda function"
- Click **"OK"**

**What this does:** Adds a resource-based policy to your Lambda function allowing `apigateway.amazonaws.com` to invoke it.

---

## Step 4: Configure CORS (Cross-Origin Resource Sharing)

CORS is critical for browser-based `fetch()` calls from `live.html` to your API.

### 4.1 Enable CORS for /analytics

- Select `/analytics` in the resource tree (click to highlight)
- Click **Actions** dropdown → **Enable CORS**

### 4.2 CORS Configuration Settings

**Access-Control-Allow-Headers:**
```
Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token
```

**Access-Control-Allow-Methods:**
```
GET,OPTIONS
```

**Access-Control-Allow-Origin:**
```
*
```

**Access-Control-Allow-Credentials:**
- Leave unchecked (No)

**Access-Control-Expose-Headers:**
- Leave empty

**Access-Control-Max-Age:**
- Leave empty (default)

Click **"Enable CORS and replace existing CORS headers"**

Click **"Yes, replace existing values"** in the confirmation dialog

### 4.3 What CORS Does

When you enable CORS, API Gateway:
1. Creates an **OPTIONS** method (for preflight requests)
2. Adds CORS response headers to **OPTIONS** responses
3. Adds CORS response headers to **GET** responses
4. Allows browsers to make cross-origin `fetch()` calls

**Why `*` for Access-Control-Allow-Origin:**
- During development, `*` allows requests from any domain
- Useful for testing from `localhost:8000` and GitHub Pages
- **For production:** Replace with specific domains:
  ```
  http://localhost:8000,https://kstanigar.github.io
  ```

**Security Note:** Your Lambda function ALSO returns CORS headers in the response object. API Gateway and Lambda CORS headers should match.

---

## Step 5: Add Rate Limiting (Usage Plan)

Protect your API from abuse, spam, and runaway AWS costs.

### 5.1 Create Usage Plan

- In the left sidebar, click **"Usage Plans"**
- Click **"Create"** button

**Usage Plan Configuration:**
```
Name: NON-X Analytics Rate Limit
Description: Protects GA4 API from spam and excessive calls
```

**Throttling:**
```
Enable throttling: ☑ (checked)
Rate: 10 requests per second
Burst: 20 requests
```

**Quota:**
```
Enable quota: ☑ (checked)
Requests per: Day
Number of requests: 1000 per day
```

**⚠️ Why These Limits:**

| Setting | Value | Reasoning |
|---------|-------|-----------|
| Rate | 10 req/sec | Prevents rapid-fire spam attacks |
| Burst | 20 requests | Allows brief traffic spikes |
| Daily Quota | 1000 req/day | `live.html` refreshes every 5 min = ~288 req/day (3.5× headroom) |

**Cost Protection:**
- Prevents malicious actors from running up your AWS bill
- GA4 API has its own quotas - this protects your Lambda invocations
- If you exceed limits, API returns `429 Too Many Requests`

Click **"Next"**

### 5.2 Associate API Stage (Deferred)

- Click **"Add API Stage"**
- **Note:** We don't have a deployed stage yet
- Click **"Cancel"** (we'll associate after Step 6)

---

## Step 6: Deploy API to Production Stage

### 6.1 Create Deployment

- Click on your API name in the top breadcrumb to return to the API view
- Click **Actions** dropdown → **Deploy API**

**Deployment Stage:**
```
Deployment stage: [New Stage]
Stage name: prod
Stage description: Production endpoint for live analytics dashboard
Deployment description: Initial deployment - Phase 3 complete with TLS 1.3, CORS, and rate limiting
```

Click **"Deploy"**

### 6.2 Copy Your API Gateway URL

After deployment, you'll be taken to the **prod Stage Editor**. At the top of the screen, you'll see:

```
Invoke URL: https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod
```

**Your full endpoint URL is:**
```
https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod/analytics
```

**🎯 ACTION REQUIRED:**
1. **Copy this URL** to a safe place (text file, password manager, etc.)
2. You'll need it for:
   - Testing (Step 8)
   - Phase 4 integration (`live.html`)
   - Usage Plan association (Step 7)

**Example URL Structure:**
```
https://[api-id].execute-api.[region].amazonaws.com/[stage]/[resource]
         ↓                        ↓              ↓         ↓
    abc123xyz              us-east-1          prod    analytics
```

---

## Step 7: Finish Usage Plan Association

Now that we have a deployed stage, complete the usage plan setup:

### 7.1 Return to Usage Plan

- Left sidebar → **"Usage Plans"**
- Click on **"NON-X Analytics Rate Limit"**
- Go to **"Associated API Stages"** tab
- Click **"Add API Stage"**

**Select:**
```
API: NON-X Analytics API
Stage: prod
```

Click **✓ checkmark** to confirm

**What this does:** Applies the rate limits (10 req/sec, 1000 req/day) to your `prod` stage.

---

## Step 8: Test Your API Endpoint

### 8.1 Test with cURL (Terminal)

Open your terminal and run:

```bash
# Test realtime endpoint (last 30 minutes data)
curl "https://YOUR_API_URL/analytics?type=realtime"

# Test standard endpoint (7 days historical data)
curl "https://YOUR_API_URL/analytics?type=standard"
```

**Replace `YOUR_API_URL`** with your actual Invoke URL from Step 6.2

**Expected Response (Example):**
```json
{
  "rowCount": 10,
  "rows": [
    {
      "dimensionValues": [
        { "value": "game_start" }
      ],
      "metricValues": [
        { "value": "42" }
      ]
    }
  ],
  "dimensionHeaders": [
    { "name": "eventName" }
  ],
  "metricHeaders": [
    { "name": "eventCount" }
  ]
}
```

**Success Criteria:**
- ✅ HTTP Status: 200
- ✅ Response body contains GA4 data structure
- ✅ No error messages

### 8.2 Verify CORS Headers

```bash
curl -I "https://YOUR_API_URL/analytics?type=realtime"
```

**Expected Headers:**
```
HTTP/2 200
access-control-allow-origin: *
access-control-allow-methods: GET,OPTIONS
access-control-allow-headers: Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token
content-type: application/json
```

**Success Criteria:**
- ✅ `access-control-allow-origin` header present
- ✅ `access-control-allow-methods` includes GET
- ✅ `content-type` is `application/json`

### 8.3 Test in Browser Console

Open your browser (Chrome, Firefox, Safari), press **F12** to open DevTools, and run:

```javascript
fetch('https://YOUR_API_URL/analytics?type=realtime')
  .then(res => res.json())
  .then(data => {
    console.log('✅ GA4 Data received:', data);
    console.log('Row count:', data.rowCount);
  })
  .catch(err => console.error('❌ Error:', err));
```

**Expected Console Output:**
```
✅ GA4 Data received: {rowCount: 10, rows: Array(10), ...}
Row count: 10
```

**Success Criteria:**
- ✅ No CORS errors in console
- ✅ GA4 data object logged
- ✅ Network tab shows 200 status

**If you see CORS error:**
```
Access to fetch at 'https://...' from origin 'null' has been blocked by CORS policy
```
**Fix:** Redeploy API (Step 6) after verifying CORS settings (Step 4)

### 8.4 Test Directly in API Gateway Console

- Return to **API Gateway** → **APIs** → **NON-X Analytics API**
- Click on `/analytics` → **GET** in the resource tree
- Click the **"TEST"** button (lightning bolt icon ⚡)

**Query Strings:**
```
type: realtime
```

Click **"Test"** button at the bottom

**Expected Response:**
```
Status: 200
Latency: ~500-2000ms

Response Body:
{
  "rowCount": 10,
  "rows": [...],
  ...
}

Response Headers:
{
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json"
}
```

**Success Criteria:**
- ✅ Status: 200 (not 403, 500, or 502)
- ✅ Response body contains GA4 data
- ✅ Response headers include CORS headers

---

## Validation Checklist

Before proceeding to Phase 4, confirm all items:

### API Gateway Configuration
- [ ] API created with `SecurityPolicy_TLS13_1_2_2021_06` (TLS 1.3)
- [ ] `/analytics` resource exists
- [ ] GET method created
- [ ] Lambda Proxy integration enabled
- [ ] OPTIONS method created (CORS preflight)
- [ ] CORS enabled with `Access-Control-Allow-Origin: *`

### Rate Limiting & Security
- [ ] Usage Plan created
- [ ] Throttling: 10 req/sec, 20 burst
- [ ] Quota: 1000 req/day
- [ ] Usage Plan associated with `prod` stage

### Deployment
- [ ] API deployed to `prod` stage
- [ ] Invoke URL copied and saved
- [ ] URL format: `https://[api-id].execute-api.[region].amazonaws.com/prod/analytics`

### Testing
- [ ] cURL test returns GA4 data (200 status)
- [ ] cURL test shows CORS headers (`access-control-allow-origin: *`)
- [ ] Browser fetch() test works without CORS errors
- [ ] API Gateway console test returns 200 status
- [ ] Both `?type=realtime` and `?type=standard` work

### Documentation
- [ ] API Gateway URL saved to secure location
- [ ] Update `docs/API_Task_List.md` with Phase 3 checkmarks
- [ ] Ready to proceed to Phase 4

---

## Troubleshooting Guide

### Issue: 403 Forbidden Error

**Symptom:**
```json
{
  "error": "Request had insufficient authentication scopes."
}
```

**Cause:** Lambda doesn't have permission to access GA4 (Service Account issue)

**Fix:**
1. Verify `GOOGLE_CREDENTIALS` environment variable is set in Lambda
2. Verify JSON is valid (no extra quotes, proper escaping)
3. Confirm Service Account email is added to GA4 property as "Viewer"
4. Check Service Account has "Google Analytics Data API" enabled

---

### Issue: CORS Error in Browser

**Symptom:**
```
Access to fetch at '...' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present
```

**Cause:** CORS headers missing or misconfigured

**Fix:**
1. Verify CORS is enabled on `/analytics` resource (Step 4)
2. Check Lambda response includes CORS headers:
   ```javascript
   return {
     statusCode: 200,
     headers: {
       "Access-Control-Allow-Origin": "*",
       "Content-Type": "application/json"
     },
     body: JSON.stringify(data)
   };
   ```
3. **Redeploy API** after making CORS changes (Step 6)
4. Clear browser cache and retry

---

### Issue: 502 Bad Gateway

**Symptom:**
```json
{
  "message": "Internal server error"
}
```

**Cause:** Lambda function error or timeout

**Fix:**
1. Check Lambda **CloudWatch Logs**:
   - AWS Console → Lambda → Your function → Monitor → View logs in CloudWatch
2. Look for JavaScript errors, timeout errors, or memory errors
3. Test Lambda function directly in Lambda console
4. Verify Lambda has correct IAM permissions
5. Check Lambda timeout setting (default: 3 seconds, may need 10+ seconds for GA4 API calls)

---

### Issue: 429 Too Many Requests

**Symptom:**
```json
{
  "message": "Too Many Requests"
}
```

**Cause:** Rate limit exceeded (Usage Plan)

**Fix:**
1. **Temporary:** Wait for quota reset (daily quota resets at midnight UTC)
2. **Permanent:** Increase Usage Plan limits:
   - Left sidebar → Usage Plans → NON-X Analytics Rate Limit
   - Edit throttling: increase from 10 to 20 req/sec
   - Edit quota: increase from 1000 to 5000 req/day
3. For testing: Temporarily remove Usage Plan association

---

### Issue: API Test Works, Browser Fetch Fails

**Symptom:**
- API Gateway console test: ✅ 200 status
- cURL test: ✅ 200 status
- Browser fetch(): ❌ CORS error

**Cause:** Preflight OPTIONS request failing

**Fix:**
1. Test OPTIONS method explicitly:
   ```bash
   curl -X OPTIONS "https://YOUR_API_URL/analytics" \
     -H "Origin: http://localhost:8000" \
     -H "Access-Control-Request-Method: GET"
   ```
2. Verify OPTIONS returns CORS headers
3. Re-enable CORS on `/analytics` resource (Step 4)
4. Redeploy API

---

### Issue: Lambda Returns 200, But Data is Empty

**Symptom:**
```json
{
  "rowCount": 0,
  "rows": []
}
```

**Cause:** No GA4 data in requested time range, or GA4 property ID incorrect

**Fix:**
1. Verify `GA4_PROPERTY_ID` environment variable is correct
2. Check GA4 property has recent data (last 30 minutes for realtime, last 7 days for standard)
3. Test with different time ranges in Lambda code
4. Verify GA4 dimensions/metrics exist in your property

---

## Next Steps: Phase 4 Integration

Once all validations pass:

### 1. Save Your API URL

Create a reference file or add to your notes:

```
API_GATEWAY_URL=https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod/analytics
```

### 2. Update Task List

Mark Phase 3 complete in `docs/API_Task_List.md`:

```markdown
## Phase 3: Amazon API Gateway Setup (The Front Door)
- [x] Create a new REST API within Amazon API Gateway.
- [x] Add a `GET /analytics` method linked directly to the Lambda function.
- [x] Configure CORS (Cross-Origin Resource Sharing) headers.
- [x] Add a Rate-Limiter (Usage Plan) to protect the API from spam.
- [x] Deploy the API to a "prod" stage to generate the live URL.
```

### 3. Proceed to Phase 4

Integrate this URL into `live.html`:

```javascript
// At the top of live.html <script> section
const API_GATEWAY_URL = 'https://YOUR_API_URL/analytics';

// Start live monitoring on page load
document.addEventListener('DOMContentLoaded', () => {
  // Fetch initial data
  fetchAnalyticsData(API_GATEWAY_URL);

  // Auto-refresh every 5 minutes
  startLiveMonitoring(API_GATEWAY_URL, 300000);
});
```

See `docs/Phase4_Data_Mapping_Guide.md` (to be created) for JSON → Chart.js data mapping implementation.

---

## Summary

**Phase 3 Deliverables:**
- ✅ AWS API Gateway REST API created with TLS 1.3 security policy
- ✅ `/analytics` endpoint linked to Lambda function
- ✅ CORS enabled for cross-origin browser requests
- ✅ Rate limiting configured (10 req/sec, 1000 req/day)
- ✅ API deployed to `prod` stage
- ✅ Public API URL generated and tested
- ✅ All validations passed

**What You Built:**
```
Browser (live.html)
    ↓ fetch(https://API_URL/analytics?type=realtime)
API Gateway (/analytics GET)
    ↓ invoke Lambda (with CORS, rate limiting)
Lambda Function (index.js)
    ↓ Google Analytics Data API
GA4 Property (G-9ECFZ9JBE5)
```

**Ready for Phase 4:** Live dashboard integration and JSON data mapping.

---

**Document Version:** 1.0
**Last Updated:** April 25, 2026
**Author:** Claude Sonnet 4.5 (PAIM)
**Project:** NON-X Analytics - AWS Serverless Infrastructure