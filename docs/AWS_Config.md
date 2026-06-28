# NON-X Analytics — AWS Configuration Reference

**Purpose:** Source of truth for all AWS infrastructure settings for this project. Updated whenever a setting is created, changed, or verified in the AWS console.

**Last Updated:** June 26, 2026 (Session 11)

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

## WAF (Web Application Firewall)

| Setting | Value |
|---------|-------|
| Status | Not yet configured |
| Planned | H-4 in `docs/Security_Audit_P5.md` — AWSManagedRulesCommonRuleSet + rate-based rule |

---

**Stage settings — Edit Stage confirmed (June 27, 2026, screenshots):**

| Setting | Value |
|---------|-------|
| Provision API cache | **ON** (blue toggle) |
| Default method-level caching | **ON** (blue toggle — all GET methods) |
| Cache capacity | 0.5 GB |
| Encrypt cache data | OFF |
| Cache TTL | **300 seconds** |
| Per-key cache invalidation — Require authorization | OFF |
| Throttling | ON |
| Rate | 10,000 req/s |
| Burst | 5,000 requests |
| WAF | None |
| Client certificate | None |

**Stage description (set in console):**
> "Production stage — NON-X Analytics API. Serves GA4 analytics data to the NON-X game dashboard. Response caching enabled (0.5 GB, 300s TTL). Rate limited: 10 req/s, 10,000 req/day."

**⚠️ ROOT CAUSE — Task 13 smoke test failure (June 27, 2026):**
API Gateway caching IS active (0.5GB, 300s TTL). Default method-level caching is ON for all GET methods. Cache key does not include `subType`, `dateRange`, or `version` query parameters. First response (avg-tier BigQuery data) is cached and returned for ALL subsequent requests within the 300s TTL window, regardless of subType.

**⚠️ Throttle discrepancy — verify in console:**
Prior documentation (P-0, June 24, 2026) stated throttle was raised to 20 req/s. Edit Stage screen shows Rate: 10,000 / Burst: 5,000. Stage description mentions "Rate limited: 10 req/s, 10,000 req/day" — this likely refers to a usage plan throttle (separate from stage throttle). Check **API Gateway → Usage Plans** to confirm.

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
