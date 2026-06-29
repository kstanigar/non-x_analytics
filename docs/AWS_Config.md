# NON-X Analytics — AWS Configuration Reference

**Purpose:** Source of truth for all AWS infrastructure settings for this project. Updated whenever a setting is created, changed, or verified in the AWS console.

**Last Updated:** June 28, 2026 (Session 16)

**Rule:** Never store credential values or secret values here. Store names, settings, and structural config only. AWS account IDs are omitted from all ARNs.

---

## Lambda Function

| Setting | Value |
|---------|-------|
| Function name | `non-x-analytics-api` |
| Region | `us-east-2` (Ohio) |
| Runtime | Node.js 22.x |
| Handler | `index.handler` |
| Architecture | x86_64 |
| Layers | 0 |
| Update runtime version | Auto |
| Package size | ~7.5 MB |
| Timeout | (verify in console — not yet recorded) |
| Memory | (verify in console — not yet recorded) |

**Source file:** `api/index.js` — pasted manually into Lambda inline editor on each deploy

**Environment variables (names only — values in AWS console):**

| Variable | Purpose |
|----------|---------|
| `GOOGLE_CREDENTIALS` | Google service account JSON for GA4 Data API |
| `GA4_PROPERTY_ID` | GA4 property ID for NON-X analytics |

---

## API Gateway

| Setting | Value |
|---------|-------|
| API name | `NON-X_Analytics_Gateway` |
| API ID | `6waopo3jh1` |
| Type | REST API (v1 proxy integration) |
| Region | `us-east-2` (Ohio) |
| Stage | `prod` |
| Resource | `/analytics` (resource ID: `b33u3w`, child of root `/`, root resource ID: `k1j2yr744k`) |
| Endpoint URL | `https://6waopo3jh1.execute-api.us-east-2.amazonaws.com/prod/analytics` |
| Throttle — rate | 10,000 req/s (stage-level default — see ⚠️ note below) |
| Throttle — burst | 5,000 |
| Daily quota | (verify in usage plans — not visible on stage screen) |
| CORS | Handled in Lambda code (`ALLOWED_ORIGIN`, `CORS_HEADERS` constants in `api/index.js`) |
| CloudFront | None — API Gateway is accessed directly |

---

## Account-Level Lambda Concurrency

| Setting | Value |
|---------|-------|
| Account concurrency limit | 10 (default AWS free tier) |
| Quota increase requested | Yes — raise to 50 (status: pending as of June 24, 2026) |
| Current workaround | Two sub-waves of 8 + 9 parallel fetches (P-0 fix, commit `381123d`) |

**Note:** If quota increase to 50 is approved, revert `live.html` fetch waves to single `Promise.allSettled()` for max speed.

---

## GitHub Pages (Frontend Hosting)

| Setting | Value |
|---------|-------|
| Repo | `kstanigar.github.io` (or equivalent GitHub Pages repo) |
| Branch deployed | `main` |
| Deploy trigger | GitHub Actions — `.github/workflows/deploy-production.yml` |
| Staging branch | `staging` — `.github/workflows/deploy-staging.yml` |
| Custom headers | Not supported — GitHub Pages limitation (see M-5 in `docs/Security_Audit_P5.md`) |
| ALLOWED_ORIGIN in Lambda | `https://kstanigar.github.io` |

---

## CloudWatch Logs — API Gateway Access Logs

| Setting | Value |
|---------|-------|
| Status | Log group created — access logging not yet enabled on stage |
| Log group name | `/aws/apigateway/non-x-analytics` |
| Log group ARN | `arn:aws:logs:us-east-2:[ACCOUNT_ID]:log-group:/aws/apigateway/non-x-analytics:*` |
| Region | us-east-2 |
| Retention | 1 month (30 days) |
| Log class | Standard |
| Captures | sourceIp, userAgent, requestTime, status, httpMethod, resourcePath |
| **Next step** | Enable custom access logging on API Gateway prod stage — paste ARN into stage settings |

---

## WAF (Web Application Firewall)

| Setting | Value |
|---------|-------|
| Status | Not yet configured |
| Planned | H-4 in `docs/Security_Audit_P5.md` — AWSManagedRulesCommonRuleSet + rate-based rule |
| Rate limit threshold | 15–20 req/5min per IP (2–3x expected peak legitimate traffic) |
| Action on exceed | Block |
| Aggregation key | IP address |
| Urgency | Elevated — cost anomaly confirmed June 12–15, 2026 (see ISSUE-011) |

---

## Cost Anomaly Detection

| Setting | Value |
|---------|-------|
| Status | Active (AWS-managed default monitor) |
| Monitor name | Default-Services-Monitor |
| Anomalies detected (90 days) | 2 — both root-caused to API Gateway |
| Total anomaly cost impact | $1.72 |

**Anomaly 1 — June 10, 2026:** 1 day, $0.01 cost impact  
**Anomaly 2 — June 12–15, 2026:** 4 days, $1.71 cost impact, 4375% above baseline

**Most likely cause:** Bot/scraper traffic hitting the public API Gateway endpoint directly (non-browser clients bypass CORS). See ISSUE-011 in `docs/Issues_And_Bugs.md`.

**Investigation in progress (June 28, 2026):**
- [ ] CloudWatch `Count` metric for June 10–15 — confirms request volume and sets WAF threshold
- [ ] API Gateway Access Logs — enable immediately (off by default; no forensic data for anomaly window)
- [ ] AWS Budget alert at $0.50 — early warning for future spikes

**AWS Budgets:**

| Setting | Value |
|---------|-------|
| Status | Not yet configured |
| Planned | $0.50 monthly threshold — email alert to ktstanigar@hotmail.com |

---

**Stage settings — Edit Stage confirmed (June 28, 2026, screenshots):**

| Setting | Value |
|---------|-------|
| Provision API cache | **OFF** ✅ (turned off June 28, 2026 — was causing $0.48/day cost) |
| Default method-level caching | **OFF** |
| Cache capacity | N/A (cache disabled) |
| Throttling | ON |
| Rate | 10,000 req/s (stage-level) |
| Burst | 5,000 requests |
| WAF | None (H-4 pending) |
| Client certificate | None |

**Stage description (set in console — ⚠️ STALE, needs update):**
> "Production stage — NON-X Analytics API. Serves GA4 analytics data to the NON-X game dashboard. Response caching enabled (0.5 GB, 300s TTL). Rate limited: 10 req/s, 10,000 req/day."

**Action needed:** Update stage description to remove "Response caching enabled" — cache is now OFF.

**⚠️ RESOLVED — Cache cost anomaly (June 28, 2026):**
0.5GB API Gateway cache was confirmed as root cause of $1.71 cost anomaly (June 12–15). Cache charged $0.020/hour regardless of traffic. CloudWatch Count data confirmed only 232 requests over the anomaly period — no bot traffic. Cache turned OFF June 28, 2026. Cost going forward: $0.00 cache charges.

**Cache bug (documented for reference):**
Cache key did not include `subType`, `dateRange`, or `version` query parameters. First response cached and returned for ALL subsequent requests within 300s TTL window — wrong data returned for most subtypes. This bug is moot now that cache is off.

**⚠️ Throttle note:**
Stage-level rate = 10,000 req/s. Stage description mentions "10 req/s, 10,000 req/day" — this refers to a usage plan throttle (separate from stage throttle). Verify in **API Gateway → Usage Plans**.

---

## Pending Verifications

These settings were not recorded and should be confirmed in the AWS console and added here:

- [ ] Lambda timeout (seconds)
- [ ] Lambda memory (MB)
- [ ] API Gateway burst limit
- [ ] Quota increase status (concurrency 10 → 50)
- [ ] Confirm no CloudFront distributions attached to API Gateway endpoint

---

## Change Log

| Date | Change | Session |
|------|--------|---------|
| June 24, 2026 | API Gateway throttle raised: 10 → 20 req/s | P-0 |
| June 24, 2026 | Lambda concurrency workaround: 2 sub-waves (8+9) | P-0 |
| June 26, 2026 | Lambda runtime confirmed: Node.js 22.x | Session 11 |
| June 26, 2026 | This document created | Session 11 |
| June 27, 2026 | Edit Stage screenshots captured — confirmed caching ON, 0.5GB, 300s TTL | Session 12 |
| June 27, 2026 | Root cause confirmed: cache key missing subType → all subtypes return avg-tier cached response | Session 12 |
| June 28, 2026 | API Gateway cache turned OFF — was causing $0.48/day ($14/month) ongoing cost; cache bug made it unreliable anyway | Session 16 |
| June 28, 2026 | Cost anomaly confirmed: $1.71 over June 12–15 was cache cost, not bot traffic (232 requests total = $0.001 in request charges) | Session 16 |
| June 28, 2026 | CloudWatch Log Group created: `/aws/apigateway/non-x-analytics` — 30-day retention, for API Gateway access logs | Session 16 |
