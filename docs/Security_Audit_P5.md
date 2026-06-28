# P-5 Security Audit — NON-X Analytics Dashboard

**Created:** June 26, 2026 (Session 9)
**Status:** ✅ PHASES A–C COMPLETE — June 28, 2026
**Scope:** Full codebase audit post-parallel-fetch-refactor
**Prior audit:** `bc59894` (June 11, 2026)

---

## 🔒 MANDATORY SECURITY FIX PROTOCOL — NO EXCEPTIONS

This project was commissioned as enterprise-grade. Every security fix must follow this protocol without exception. Skipping any step is a violation.

### Step 1: Research
- Launch a Haiku agent to research the specific vulnerability
- Agent must return: exact CVE details, root cause, all known fix approaches, and 2026 best practice
- Do NOT guess or assume a fix. Research first, every time.

### Step 2: Document the Plan
- Add the fix to this document with:
  - Exact file path(s)
  - Exact line numbers to change
  - Before/after code for every change
  - Full task list (numbered steps)
  - Possible errors and mitigations
  - Estimated effort

### Step 3: Verify the Plan
- Launch a second Haiku agent to independently verify the plan
- Agent must confirm: fix is correct for 2026, no regressions introduced, no better alternative exists
- If agent flags an issue — revise the plan. Do not proceed.

### Step 4: User Approval
- Present the verified plan to the user
- Do not write a single line of code until the user explicitly approves

### Step 5: Implement
- Apply changes exactly as documented in the plan
- No improvising during implementation
- If something unexpected is encountered — STOP, document, notify user

### Step 6: Test and Verify
- Run verification checklist for the specific fix
- Confirm the vulnerability is resolved (re-run audit command where applicable)
- Update this document: mark fix ✅, add commit hash

### Protocol Enforcement

```
Research (Haiku agent)
    ↓
Document plan with exact lines
    ↓
Verify plan (Haiku agent)
    ↓
User approval
    ↓
Implement exactly as planned
    ↓
Test and confirm resolved
    ↓
Update this document
```

**If any step is skipped:** Stop work immediately, document what was skipped, notify user.

---

**Files audited:**
- `live.html` — frontend dashboard
- `api/index.js` — Lambda function
- `api/package.json` — Lambda dependencies
- `lambda-package/package.json` — alternate Lambda package
- `.github/workflows/deploy-production.yml`
- `.github/workflows/deploy-staging.yml`

---

## Audit Summary

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| C-1 | CRITICAL | Vulnerable npm dependencies in `api/` | ✅ Fixed — June 26, 2026 |
| H-1 | HIGH | No HTTP method validation in Lambda | ✅ Fixed — June 26, 2026 |
| H-2 | HIGH | No Content Security Policy (CSP) | 🔴 Open |
| H-3 | HIGH | `innerHTML` with unsanitized API data | ✅ Fixed — June 28, 2026 |
| H-4 | HIGH | No Lambda-level rate limiting | 🔴 Open |
| M-1 | MEDIUM | Missing security headers in Lambda responses | ✅ Fixed — June 26, 2026 |
| M-2 | MEDIUM | No clickjacking protection | 🔴 Open |
| M-3 | MEDIUM | GitHub Actions permissions too broad | 🔴 Open |
| M-4 | MEDIUM | `function.zip` committed to repo | 🔴 Open |
| M-5 | MEDIUM | GitHub Pages cannot set custom HTTP headers | ⚠️ Structural |
| L-1 | LOW | Google Fonts loaded via `@import` (no SRI) | 🔴 Open |
| L-2 | LOW | Dependency versions unverifiable | 🔴 Open |
| L-3 | LOW | API Gateway URL visible in client-side JS | ⚠️ Structural |

**Positive findings:** CORS locked to specific origin ✅ | All credentials in env vars ✅ | Input validation whitelists ✅ | Generic error messages ✅ | Chart.js has SRI ✅ | All resources HTTPS ✅ | `.env` gitignored ✅

---

## CRITICAL

---

### C-1: Vulnerable npm Dependencies in `api/`

**File:** `api/package.json` + `api/node_modules/`
**Risk:** Remote code execution, DoS, prototype pollution on Lambda

**Vulnerabilities found (`npm audit`):**

| Package | Version | CVE / Advisory | Type | Severity |
|---------|---------|----------------|------|----------|
| `protobufjs` | ≤7.6.2 | GHSA-66ff-xgx4-vchm, GHSA-2pr8-phx7-x9h3, GHSA-fx83-v9x8-x52w + 7 more | Code injection, prototype pollution, DoS | HIGH |
| `form-data` | <2.5.6 | GHSA-hmw2-7cc7-3qxx | CRLF injection in multipart fields | HIGH |
| `@grpc/grpc-js` | 1.14.0–1.14.3 | GHSA-5375-pq7m-f5r2, GHSA-99f4-grh7-6pcq | Server/client crash on malformed request | HIGH |
| + 6 MODERATE, 1 LOW | | | | |

**Exact vulnerabilities (all in production deps — transitive from `@google-analytics/data@4.12.1`):**

| Package | Severity | Advisory | Risk |
|---------|----------|----------|------|
| `@grpc/grpc-js` 1.14.0–1.14.3 | HIGH (x2) | GHSA-5375, GHSA-99f4 | Server crash on malformed request |
| `form-data` <2.5.6 | HIGH | GHSA-hmw2 | CRLF injection |
| `protobufjs` ≤7.6.2 | HIGH (x3) + MODERATE (x5) | Multiple | Code injection, prototype pollution, DoS |
| `@protobufjs/utf8` ≤1.1.0 | MODERATE | GHSA-q6x5 | Overlong UTF-8 decoding |
| `uuid` <11.1.1 | MODERATE | GHSA-w5hq | Missing buffer bounds check |
| `@tootallnate/once` <2.0.1 | LOW | GHSA-vpq2 | Control flow scoping |

**⚠️ Key finding: `npm audit fix` does NOT fully resolve all 10 vulnerabilities.**

After running `npm audit fix`, the same 10 issues remain listed. The root cause is that `api/package.json` pins `@google-analytics/data` at `^4.1.0` (installed: `4.12.1`), which pulls outdated transitive dependencies.

**The real fix — upgrade `@google-analytics/data` to v6:**

`lambda-package/package.json` already uses `@google-analytics/data: ^6.1.0` and has **0 vulnerabilities**. The `api/` package needs to match.

```bash
cd api
npm install @google-analytics/data@^6.1.0
npm audit  # verify 0 high/critical remain
```

**⚠️ Breaking change risk:** v4 → v6 may include API changes in the Google Analytics client. Must verify Lambda still works after upgrade. Test all endpoints before deploying.

**If breaking changes are found:** Run `npm audit fix` (patch-only) as interim, then schedule v6 migration separately.

**Estimated effort:** 15–30 min (upgrade + test)
**Deploy required:** Yes — Lambda must be redeployed after upgrade

---

## HIGH

---

### H-1: No HTTP Method Validation in Lambda

**File:** `api/index.js` — line 44 (handler entry point)
**Risk:** POST, PUT, DELETE requests accepted and processed identically to GET

**Current code (line 44):**
```javascript
exports.handler = async (event) => {
  // No HTTP method check — all methods pass through
```

**Fix — add at top of handler, after line 44:**
```javascript
exports.handler = async (event) => {
  // Allow OPTIONS through for CORS preflight — must not be rejected
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Allow': 'GET, OPTIONS' },
      body: ''
    };
  }
  if (event.httpMethod && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Allow': 'GET, OPTIONS'
      },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }
```

**Note:** OPTIONS must be explicitly allowed — rejecting it breaks CORS preflight and will cause fetch failures in the dashboard.

**Estimated effort:** 5 min
**Deploy required:** Yes

---

### H-2: No Content Security Policy (CSP)

**File:** `live.html` — `<head>` section (currently no CSP tag)
**Risk:** No browser-enforced restriction on script sources, connect targets, or framing

**Fix — add after line 18 (after `<meta name="viewport">`):**
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'none';
  script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src https://fonts.gstatic.com;
  img-src 'self' data:;
  connect-src https://6waopo3jh1.execute-api.us-east-2.amazonaws.com;
  frame-ancestors 'none';
">
```

**⚠️ Verification finding — two corrections:**

1. **`'unsafe-inline'` is not acceptable in 2026.** It defeats ~80% of CSP's XSS protection. A CSP with `'unsafe-inline'` is advisory-only and provides minimal real protection. Options:
   - **Option A (recommended):** Extract all inline JS to an external `dashboard.js` file. Removes `'unsafe-inline'`. This is a significant refactor (5,000+ lines) — tracked as future hardening.
   - **Option B (interim):** Add the CSP now with `'unsafe-inline'` for the `connect-src` and `frame-ancestors` protection only. Accept that script-src protection is weak until Option A is done.

2. **`frame-ancestors` does NOT work in a `<meta>` CSP tag.** It is only enforced via HTTP response headers. GitHub Pages does not support custom headers. Clickjacking mitigation via `frame-ancestors` requires Cloudflare or Netlify proxy (see M-5).

**Recommended interim fix — add meta CSP for `connect-src` protection only:**
```html
<meta http-equiv="Content-Security-Policy" content="
  script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src https://fonts.gstatic.com;
  img-src 'self' data:;
  connect-src https://6waopo3jh1.execute-api.us-east-2.amazonaws.com;
">
```

**Full CSP (script-src without `'unsafe-inline'`) requires extracting JS to external file — tracked as P-5b future task.**

**Estimated effort:** 15 min
**Deploy required:** Yes (GitHub Pages rebuild)

---

### H-3: `innerHTML` with Unsanitized API Data

**File:** `live.html`
**Risk:** If API is compromised or intercepted (MITM), attacker-controlled strings reach DOM via `innerHTML` → XSS

**Current risk level:** MEDIUM (API data is numeric/controlled today); escalates to CRITICAL if API is compromised.

**Affected lines:**

| Line | Pattern | Data source |
|------|---------|-------------|
| ~4695 | `DATA.kpis.deskWinSub = \`<span>...\${pd.desktop.playerWon}...\</span>\`` | API response |
| ~4697 | `DATA.kpis.mobWinSub = \`<span>...\${pd.mobile.playerWon}...\</span>\`` | API response |
| ~4780 | `DATA.kpis.newPctSub = \`<span>...\${nuData.newCount}...\</span>\`` | API response |
| ~4891–4894 | Multiple `DATA.kpis.*Sub` with template literals | API response |
| ~5033–5066 | `document.getElementById(...).innerHTML = k.*Sub` | DATA object |
| ~5185 | `div.innerHTML = \`<div>...\${s.name}...\${s.n}...\</div>\`` | API data |
| ~5229 | `tbody.innerHTML += \`<tr><td>\${r.from}...\${r.to}...\</td></tr>\`` | API data |

**Fix — add HTML escaper utility function (insert near top of `<script>` block):**
```javascript
function escHtml(str) {
  return String(str).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])
  );
}
```

**Then wrap all API-sourced values:**
```javascript
// Before:
DATA.kpis.deskWinSub = `<span style="color:var(--green)">${pd.desktop.playerWon}&nbsp;wins</span>`;

// After:
DATA.kpis.deskWinSub = `<span style="color:var(--green)">${escHtml(pd.desktop.playerWon)}&nbsp;wins</span>`;
```

**⚠️ Verification finding — updated approach:**

- For **numeric values** (win counts, percentages, player counts): use `textContent` directly — no innerHTML needed at all. Safer and simpler.
- For **HTML fragments** with spans/styling: `escHtml()` is acceptable as a secondary layer, but DOMPurify is the 2026 standard for any HTML content.
- Hand-rolled `escHtml()` may miss edge cases (attribute context, event handler injection in attributes).

**Recommended approach by value type:**
```javascript
// Numeric values — use textContent, skip innerHTML entirely
el.textContent = pd.desktop.playerWon;

// HTML spans with color styling — use createElement
const span = document.createElement('span');
span.style.color = 'var(--green)';
span.textContent = pd.desktop.playerWon + ' wins';
container.appendChild(span);

// Only if innerHTML is unavoidable — use escHtml() as minimum
el.innerHTML = `<span>${escHtml(value)}</span>`;
```

**Apply updated approach to all 7+ affected sites** — exact lines to be confirmed before implementation.

**Estimated effort:** 30–60 min
**Deploy required:** Yes

---

### H-4: No Lambda-Level Rate Limiting

**File:** `api/index.js`
**Risk:** Entirely dependent on API Gateway throttling; no per-IP tracking or 429 response at Lambda level

**Current API Gateway settings:** 10 req/sec, 1000 req/day (per inline comment, line ~3002 in `live.html`)

**Recommended fix:**
- Document and verify current API Gateway throttle settings in AWS console
- Add AWS WAF with `AWSManagedRulesCommonRuleSet` + rate-based rule (block IP > 1000 req/5 min)
- Lambda-level rate limiting (DynamoDB/ElastiCache) is overkill for this scale — WAF is the right layer

**This is an AWS console task, not a code change.**

**Estimated effort:** 1–2 hrs (AWS console)

---

## MEDIUM

---

### M-1: Missing Security Headers in Lambda Responses

**File:** `api/index.js` — lines 481–482 (response headers object)
**Risk:** MIME-sniffing, clickjacking via API responses, no cache directives

**Current (line 481–482):**
```javascript
headers: {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Content-Type': 'application/json'
}
```

**⚠️ Verification finding — corrections to header set:**
- `X-XSS-Protection` is **deprecated since ~2022** — do not add it
- `X-Frame-Options: DENY` is **redundant on JSON API responses** — browsers won't frame JSON; omit
- `Cache-Control: max-age=86400` is correct for 24h data refresh; add `s-maxage=86400` for CDN caching
- `Strict-Transport-Security` is harmless but redundant since API Gateway enforces HTTPS-only

**Fix — replace with:**
```javascript
headers: {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'public, max-age=86400, s-maxage=86400',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
}
```

**Note:** This header object appears in multiple return statements. Use Haiku agent to find all instances before implementing.

**Estimated effort:** 15 min
**Deploy required:** Yes

---

### M-2: No Clickjacking Protection

**File:** `live.html` — addressed by CSP `frame-ancestors 'none'` in H-2.
**Status:** Resolved by implementing H-2.

---

### M-3: GitHub Actions Permissions Too Broad

**File:** `.github/workflows/deploy-staging.yml` — lines 7–8
**Risk:** Staging workflow has `contents: write` — read-only access is sufficient

**Current:**
```yaml
permissions:
  contents: write
```

**⚠️ Verification finding:** `contents: read` alone is insufficient. GitHub Pages deploy via Actions requires all three permissions.

**Fix for staging workflow:**
```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

**Production workflow** (`deploy-production.yml`): `contents: write` is correct — no change needed.

**Estimated effort:** 10 min
**Deploy required:** No (workflow config only)

---

### M-4: `function.zip` Committed to Repo

**File:** repo root — `function.zip` (~15MB) is tracked despite `*.zip` in `.gitignore`
**Risk:** Bloated git history; stale Lambda package could be confused for current version

**Fix:**
```bash
git rm --cached function.zip
git commit -m "chore: remove function.zip from tracking"
```

**Note:** This does NOT delete the file locally — only removes it from git tracking.

**Estimated effort:** 5 min

---

### M-5: GitHub Pages Cannot Set Custom HTTP Headers

**Structural limitation** — GitHub Pages does not support `_headers` files or server config.

**Missing headers that require server-level config:**
- `X-Frame-Options` (partially mitigated by CSP `frame-ancestors`)
- `Referrer-Policy`
- `Permissions-Policy`

**Options:**
1. **Cloudflare free tier** — proxy GitHub Pages through Cloudflare; add headers via Transform Rules (recommended, low effort)
2. **Netlify** — supports `_headers` file; requires DNS migration
3. **Accept limitation** — CSP `frame-ancestors 'none'` covers the highest-risk gap

**This is a DNS/infrastructure task, not a code change.**

---

## LOW

---

### L-1: Google Fonts via `@import` (No SRI Possible)

**File:** `live.html` — line 24
**Risk:** `@import` in `<style>` block cannot have an `integrity` attribute per spec

**Current (inside `<style>` block):**
```css
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Exo+2:wght@300;400;600;800&display=swap');
```

**Fix — move to `<link>` tag in `<head>` (before the `<style>` block):**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Exo+2:wght@300;400;600;800&display=swap" rel="stylesheet" crossorigin>
```

**Note:** Google Fonts CDN does not publish SRI hashes for their CSS, so `integrity` attribute cannot be added. The `<link>` approach is still preferred over `@import` (eliminates render-blocking @import, follows best practice for external fonts).

**Estimated effort:** 5 min

---

### L-2: Dependency Versions Unverifiable

**File:** `api/package.json`
**Risk:** Floating version ranges (`^`, `~`) could pull in breaking or vulnerable updates

**Fix:** After `npm audit fix`, pin all versions:
```bash
cd api
npm shrinkwrap  # or ensure package-lock.json is committed
```

**Estimated effort:** 5 min (after C-1 fix)

---

### L-3: API Gateway URL Visible in Client-Side JS

**File:** `live.html` — line 2995
**Finding:** `baseURL: 'https://6waopo3jh1.execute-api.us-east-2.amazonaws.com/prod'`

**Research verdict (2026 consensus):** This is **not a critical vulnerability** for a public read-only analytics API. OWASP does not classify endpoint URL exposure as a top-10 issue when no credentials are embedded. The URL is discoverable via DevTools by any visitor regardless.

**Real risk:** Rate-limit abuse if WAF/throttling is weak.

**⚠️ Verification finding:** CloudFront does **not** hide the API Gateway URL from browser DevTools. The browser still shows the origin request. CloudFront hides the URL behind a CDN domain in the address bar only — a determined user can still find it.

**Real value of CloudFront:** DDoS protection, caching (reduces Lambda invocations), WAF integration, slightly better latency. Worth it for affiliate marketing traffic — but not for URL hiding.

**Mitigations (infrastructure, not code):**
1. **CloudFront distribution** — caching + DDoS protection + WAF integration; does NOT hide URL from DevTools; ~$1–3/month
2. **AWS WAF CommonRuleSet** — blocks automated attack patterns; rate-based rule per IP
3. **Custom domain** (`api.standingtiger.com`) — cosmetic improvement; URL still discoverable

**No code change required or recommended.** Infrastructure improvements tracked under H-4.

---

## Release Plan

### Pre-Launch Blockers — Must fix before public release (~4 hrs total)

These are the only items that present real risk to a public audience. Everything else is hardening that can follow after launch.

| # | Task | File | Risk if skipped | Est. Time |
|---|------|------|----------------|-----------|
| 1 | C-1: Upgrade `@google-analytics/data` to pinned `6.1.0` + `npm install` | `api/package.json` | RCE/DoS on Lambda | 20 min |
| 2 | H-1: HTTP method validation + OPTIONS | `api/index.js` | Non-GET processed unexpectedly | 15 min |
| 3 | H-3: `innerHTML` → `textContent`/`createElement` | `live.html` | XSS if API compromised | 45 min |
| 4 | M-1: Security headers in Lambda responses | `api/index.js` | MIME-sniffing, no cache control | 15 min |
| 5 | H-2: Interim CSP meta tag (connect-src only) | `live.html` | Fetch calls unrestricted by browser | 15 min |
| 6 | H-4: AWS WAF + rate-based rules | AWS Console | Affiliate traffic could exhaust Lambda quota | 1–2 hrs |

**Pre-launch total:** ~3–4 hours across two sessions (code + AWS console)

---

### Post-Launch Hardening — Within 30 days

Low urgency — no active exploit path. Safe to ship without these.

| Task | File | Est. Time |
|------|------|-----------|
| JS extraction to `dashboard.js` + full CSP (drop `'unsafe-inline'`) | `live.html` → `dashboard.js` | 1–2 days |
| M-5: Cloudflare proxy for `X-Frame-Options`, `Referrer-Policy` headers | DNS + Cloudflare | 30 min |
| M-3: Tighten staging workflow permissions | `.github/workflows/deploy-staging.yml` | 10 min |
| M-4: Remove `function.zip` from git tracking | git | 5 min |
| L-1: Google Fonts `@import` → `<link>` tag | `live.html` | 5 min |
| L-2: Pin exact dependency versions | `api/package.json` | 5 min |
| L-3: CloudFront distribution (caching + DDoS) | AWS Console | 1–2 hrs |

---

### Not Required — Accepted Risk

| Item | Reason |
|------|--------|
| L-3: API Gateway URL in JS source | Public read-only API; OWASP does not classify as vulnerability; no credentials embedded |
| M-2: `frame-ancestors` via meta CSP | Cannot be enforced via meta tag — requires HTTP header (GitHub Pages limitation); mitigated by Cloudflare post-launch |

---

## Verification Checklist

### Pre-Launch
- [ ] C-1: `npm audit` returns 0 HIGH/CRITICAL after fix
- [ ] H-1: Lambda returns 405 for POST/PUT/DELETE; OPTIONS returns 204
- [ ] H-3: All API-sourced values use `textContent` or `createElement` — no raw `innerHTML` with template literals
- [ ] M-1: Lambda responses include `X-Content-Type-Options: nosniff` and `Cache-Control: public, max-age=86400`
- [ ] H-2: CSP meta tag in `<head>` with `connect-src` locked to API Gateway URL
- [ ] H-4: AWS WAF enabled; rate-based rule active; verify in AWS console

### Post-Launch
- [ ] JS fully extracted to `dashboard.js`; `live.html` has `<script src="dashboard.js">` only
- [ ] CSP updated to remove `'unsafe-inline'`; verified no console CSP errors
- [ ] Cloudflare active; `X-Frame-Options: DENY` confirmed in response headers
- [ ] `function.zip` not tracked (`git ls-files function.zip` returns empty)
- [ ] Google Fonts loaded via `<link>` tag, not `@import`
- [ ] `package-lock.json` committed with pinned versions

---

**Current status:** ✅ Phase A complete (C-1) | ✅ Phase B complete (H-1 + M-1) | ✅ Phase C complete — merged to main June 28, 2026 (commit `16a1947`)

---

## Implementation Plan: api/index.js — C-1 + H-1 + M-1 (Unified Edit)

**Research status:** ✅ Complete — Session 9: 3 parallel Haiku agents | Session 10: Haiku re-verification (June 26, 2026)
**Verification status:** ✅ Complete — all corrections applied (see Key Research Findings → Phase B Research)
**Implementation status:** ⏳ Phase A complete — Phase B pending user approval

### Key Research Findings

#### Phase A Research — Session 9 (June 26, 2026)

- **C-1 (v4→v6):** Zero code changes to `api/index.js` — `runReport()`, `runRealtimeReport()`, client instantiation, and response shapes are identical across v4 and v6. Only `package.json` changes.
- **Breaking change check:** `getUniversalMetadata()` — NOT present in codebase. `SheetExportAudienceList()` — NOT present. `dayOfWeek`/`week` dimensions — NOT used. No dimension parsing logic to update.
- **Node runtime:** v6 requires Node 18+. Lambda runtime must be verified in AWS console before deploy.
- **Sequencing:** C-1, H-1, and M-1 are fully independent. C-1 touches only `package.json`. H-1 and M-1 touch `api/index.js` only. Recommended order: C-1 → H-1 → M-1.
- **H-1 adds 2 new return statements** (OPTIONS → 204, non-GET → 405). M-1 must include these in its header updates, bringing total returns to update from 9 to 11.
- **M-1 strategy:** Define two shared header constants at file top instead of updating 11 returns individually. Cleaner, maintainable, no risk of missing a return.

#### Phase B Research — Session 10 (June 26, 2026) — Haiku Agent Verification

**Corrections to prior plan:**

- **X-Frame-Options: REMOVE from all three constants.** OWASP 2026 HTTP Headers Cheat Sheet explicitly states X-Frame-Options is only useful when the response has interactive content (links, buttons). JSON API responses cannot be framed in exploitable ways. Including it adds bytes with no security value.
- **`Access-Control-Max-Age`: change `'86400'` → `'7200'`.** Chrome (v76+) silently caps preflight caching at 7200s (2 hours). Setting 86400 appears correct but Chrome ignores the excess — preflight still fires every 2h. Setting 7200 is consistent across Chrome and Firefox (which caps at 86400 but accepts lower values).
- **`Cross-Origin-Resource-Policy` (`same-origin`): DO NOT ADD.** Haiku agent suggested CORP `same-origin`, but this would block the cross-origin fetch from the GitHub Pages frontend (a different origin). CORS headers already restrict access to `ALLOWED_ORIGIN`. CORP `same-origin` would override CORS and break all dashboard API calls. Omitted.

**Additions confirmed correct:**

- **`Referrer-Policy: strict-origin-when-cross-origin`** — OWASP 2026 recommended. Controls referrer leakage. Add to `SUCCESS_HEADERS` and `ERROR_HEADERS`.
- **`Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=()`** — OWASP 2026 standard. Disables unused browser capabilities. Add to `SUCCESS_HEADERS` only (not needed on error responses or preflight).

#### Phase C Research — Session 11 (June 26, 2026) — Haiku Agent Pre-Deploy Verification

**Confirmed correct (no changes needed):**

- ✅ All headers in `SUCCESS_HEADERS`, `ERROR_HEADERS`, `CORS_HEADERS` — verified against OWASP 2026. No syntax changes.
- ✅ `Referrer-Policy: strict-origin-when-cross-origin` — still OWASP 2026 best practice
- ✅ `Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=()` — `()` empty-allowlist syntax unchanged in 2026. `payment=()` directive still valid (Payment Request API still active).
- ✅ `Cache-Control: public, max-age=86400` — appropriate for public JSON API with no PII
- ✅ `Strict-Transport-Security: max-age=31536000; includeSubDomains` — confirmed 2026 best practice
- ✅ `X-Content-Type-Options: nosniff` — still relevant in 2026
- ✅ `Allow: GET, OPTIONS` in 405 response — RFC 9110 requires this; `Cache-Control: no-store` does not conflict
- ✅ `{ error: 'Method Not Allowed' }` JSON body — acceptable; RFC 7807 Problem Details is optional, not required
- ✅ `Access-Control-Max-Age: '7200'` — Chrome cap unchanged; still 7200s in 2026
- ✅ npm audit command: `npm audit` (no-flag) or `npm audit --omit=dev` both valid. `--production` deprecated in npm 10+; `--omit=dev` is the correct flag.
- ✅ Lambda console deploy procedure: paste → Deploy button → "Successfully updated function code" message → `$LATEST` auto-updated. Runtime is NOT auto-detected — must verify Node.js 22.x is set in General configuration before paste.
- ✅ `curl -i` is correct for header verification (shows headers without verbose connection noise); include `Origin: https://kstanigar.github.io` on all three curl tests for full CORS validation

**Decision 1 — OPTIONS status code (204 vs 200): ✅ KEEP 204 (June 26, 2026)**

- **Conflict:** Session 9 verified 204; Session 11 Haiku agent recommended 200
- **Authority:** RFC 9110 does not mandate a specific 2xx for OPTIONS preflight. Express.js `cors` (ecosystem standard) defaults to 204. 204 is semantically correct — no response body. Both are valid.
- **Resolution:** Keep 204. Already implemented and committed. No change needed.

**Decision 2 — Permissions-Policy in ERROR_HEADERS: ✅ ADDED (June 26, 2026)**

- **Authority:** OWASP HTTP Headers Cheat Sheet — apply security headers on all responses
- **Resolution:** `Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=()` added to `ERROR_HEADERS` in `api/index.js` (Session 11)
- **Rule added:** CLAUDE.md Rule 9 — Follow Industry Standards and Best Practices

**Exact curl test commands (documented for Task 10–12):**

```bash
# Task 10: GET → 200 with security headers
curl -i -H 'Origin: https://kstanigar.github.io' \
  'https://6waopo3jh1.execute-api.us-east-2.amazonaws.com/prod?type=standard'

# Task 11: POST → 405 with Allow header
curl -i -X POST -H 'Origin: https://kstanigar.github.io' \
  'https://6waopo3jh1.execute-api.us-east-2.amazonaws.com/prod'

# Task 12: OPTIONS → 204 with CORS headers
curl -i -X OPTIONS -H 'Origin: https://kstanigar.github.io' \
  'https://6waopo3jh1.execute-api.us-east-2.amazonaws.com/prod'
```

**Smoke test verification targets (Task 13):**
- All 17 parallel fetch requests return HTTP 200 (check Network tab)
- No CORS errors in browser console
- All dashboard sections render with live data (not empty `{}`)
- `Promise.allSettled()` — all 17 promises settle as `{status: 'fulfilled', value: [data]}`

**Confirmed correct, no change:**

- ✅ HTTP 204 for OPTIONS preflight — correct per RFC and MDN 2026
- ✅ HTTP 405 + `Allow: GET, OPTIONS` for non-GET — correct per RFC9110
- ✅ `Cache-Control: public, max-age=86400` for success — appropriate; GA4 analytics data contains no user PII
- ✅ `Cache-Control: no-store` for errors — correct per OWASP 2026
- ✅ `Strict-Transport-Security` on Lambda responses — NOT redundant; HSTS is application-layer; API Gateway HTTPS enforcement is network-layer. AWS documentation (Feb 2026) confirms both are needed.
- ✅ `event.httpMethod` — correct property name for both API Gateway v1 (REST) and v2 (HTTP) proxy integrations in 2026
- ✅ Module-level constants — safe for warm Lambda invocations; AWS best practice for avoiding re-initialization

---

### Change 1: C-1 — Upgrade @google-analytics/data v4 → v6

**File:** `api/package.json`
**Type:** Dependency version change only — zero code changes to `api/index.js`

**Before:**
```json
{
  "dependencies": {
    "@google-analytics/data": "^4.1.0"
  }
}
```

**After:**
```json
{
  "dependencies": {
    "@google-analytics/data": "6.1.0"
  }
}
```

**⚠️ Verification correction — pin exact version, not semver range:**
Using `^6.1.0` allows auto-pull of `6.2.0`, `6.3.0`, etc. on next install. Google has shipped breaking changes in minor versions historically. Production Lambda must be pinned to exact version `"6.1.0"` (no caret).

**Task list:**
1. Run `npm view @google-analytics/data version` to confirm `6.1.0` is current stable
2. Edit `api/package.json` — change `"^4.1.0"` to `"6.1.0"` (pinned, no caret)
3. Run `npm install` in `api/` directory
4. Run `npm audit` — confirm 0 HIGH/CRITICAL remain (if any remain, stop and notify user before proceeding)
5. Verify Lambda Node.js runtime is 18+ in AWS console (v6 minimum requirement)
6. Note pre-upgrade installed versions for rollback reference

**Rollback plan:** If `npm audit` after v6 install still shows HIGH vulnerabilities, revert `package.json` to `"4.12.1"` (pinned current) and run `npm install`. Lambda code is unchanged — no code rollback needed.

---

### Change 2: H-1 — HTTP Method Validation + OPTIONS Handling

**File:** `api/index.js`
**Insert after:** Line 45 (`try {`) — before any queryStringParameters logic

**Before (lines 44–46):**
```javascript
exports.handler = async (event) => {
    try {
        const { type, subType, dateRange } = event.queryStringParameters || {};
```

**After:**
```javascript
exports.handler = async (event) => {
    try {
        // Allow CORS preflight — must not be blocked or CORS fetch fails
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 204,
                headers: CORS_HEADERS,
                body: ''
            };
        }
        // Reject all non-GET methods
        if (event.httpMethod && event.httpMethod !== 'GET') {
            return {
                statusCode: 405,
                headers: { ...ERROR_HEADERS, 'Allow': 'GET, OPTIONS' },
                body: JSON.stringify({ error: 'Method Not Allowed' })
            };
        }

        const { type, subType, dateRange } = event.queryStringParameters || {};
```

**Note:** `CORS_HEADERS` and `ERROR_HEADERS` are defined in Change 3 (M-1). M-1 must be implemented in the same edit session, applied immediately before or after H-1 in the same file.

---

### Change 3: M-1 — Shared Security Header Constants + Update All Returns

**File:** `api/index.js`

**Step 3a — Add shared header constants**

`ALLOWED_ORIGIN` is currently defined at line 10. Insert immediately after it.

**Before (line 10):**
```javascript
const ALLOWED_ORIGIN = 'https://kstanigar.github.io';
```

**After:**
```javascript
const ALLOWED_ORIGIN = 'https://kstanigar.github.io';

// Shared security headers — use in all return statements
const SUCCESS_HEADERS = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'public, max-age=86400',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), camera=(), microphone=(), payment=()'
};
const ERROR_HEADERS = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
};
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '7200'
};
```

**Corrections applied (Session 9 → Session 10):**

| Header | Session 9 Plan | Session 10 Correction | Reason |
|--------|---------------|----------------------|--------|
| `X-Frame-Options: DENY` | In all 3 constants | **Removed** | OWASP 2026: redundant on JSON APIs; JSON cannot be framed exploitably |
| `Access-Control-Max-Age` | `'86400'` | **`'7200'`** | Chrome silently caps at 7200s; 86400 ignored by Chrome |
| `Referrer-Policy` | Missing | **Added to SUCCESS + ERROR** | OWASP 2026 recommended; controls referrer leakage |
| `Permissions-Policy` | Missing | **Added to SUCCESS only** | OWASP 2026 standard; disables unused browser capabilities |
| `Cross-Origin-Resource-Policy` | Not planned | **Omitted (do not add)** | `same-origin` would block cross-origin fetch from GitHub Pages; CORS already restricts by origin |
| `s-maxage` | Already removed | Confirmed correct | No CDN in place |

**Why three header sets:**
- `SUCCESS_HEADERS` — 200 responses: full security headers, 24h public cache, HSTS, Referrer-Policy, Permissions-Policy
- `ERROR_HEADERS` — 400/500 responses: `no-store` (errors must never be cached), CORS + essential security headers only
- `CORS_HEADERS` — OPTIONS preflight only: no Content-Type or cache body headers; 2h preflight cache (7200s)

**Step 3b — Replace all 9 existing inline header objects**

| Line(s) | Status | Current | Replace with |
|---------|--------|---------|-------------|
| 53 | 400 | `{ 'Access-Control-Allow-Origin': ALLOWED_ORIGIN }` | `ERROR_HEADERS` |
| 56 | 400 | `{ 'Access-Control-Allow-Origin': ALLOWED_ORIGIN }` | `ERROR_HEADERS` |
| 59 | 400 | `{ 'Access-Control-Allow-Origin': ALLOWED_ORIGIN }` | `ERROR_HEADERS` |
| 328–332 | 200 | `{ 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Content-Type': 'application/json' }` | `SUCCESS_HEADERS` |
| 389–393 | 200 | `{ 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Content-Type': 'application/json' }` | `SUCCESS_HEADERS` |
| 399–403 | 200 | `{ 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Content-Type': 'application/json' }` | `SUCCESS_HEADERS` |
| 446–450 | 200 | `{ 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Content-Type': 'application/json' }` | `SUCCESS_HEADERS` |
| 478–485 | 200 | `{ "Access-Control-Allow-Origin": ALLOWED_ORIGIN, "Content-Type": "application/json" }` | `SUCCESS_HEADERS` |
| 490–494 | 500 | `{ "Access-Control-Allow-Origin": ALLOWED_ORIGIN }` | `ERROR_HEADERS` |

**Step 3c — The 2 new returns added by H-1 (from Change 2)**

These use the constants directly in their definition — no separate update needed if H-1 and M-1 constants are applied in the same session.

---

### Full Task List — Apply in This Exact Order

**Pre-implementation blockers: ✅ Both cleared June 26, 2026**
- Node.js runtime: 22.x ✅ (exceeds v6 minimum of Node 18)
- CloudFront: None on API Gateway ✅ (`s-maxage` correctly excluded)

---

**Phase A: Dependency Upgrade (C-1) — ✅ COMPLETE June 26, 2026**

- [x] Task 1: `npm view @google-analytics/data versions --json | tail -5` — confirmed `6.1.0` latest, no v7 ✅
- [x] Task 2: Edit `api/package.json` — `"^4.1.0"` → `"6.1.0"` (pinned, no caret) ✅
- [x] Task 3: `npm install` in `api/` — 49 added, 37 removed, 28 changed ✅
- [x] Task 4: `npm audit` — **0 vulnerabilities** (was 10 HIGH/CRITICAL) ✅ gate passed
- [x] Task 4b: `package-lock.json` generated — commit alongside `package.json` before branch merge ✅
- [x] Task 4c: Smoke test — validate `BetaAnalyticsDataClient`, `runReport()`, `runRealtimeReport()` response shapes ✅ June 28, 2026 (confirmed via Task 13 + live data smoke test)

---

**Phase B: Edit `api/index.js` (single atomic session — do not split across sessions)**

**Research status:** ✅ Haiku verification complete — Session 10 (June 26, 2026). Header constants corrected. See Key Research Findings → Phase B Research section above.

- [x] Task 5: Insert 3 shared header constants immediately after `ALLOWED_ORIGIN` on line 10 (M-1 setup) ✅ June 26, 2026
  - `SUCCESS_HEADERS` — lines 13–21: nosniff, 24h cache, HSTS, Referrer-Policy, Permissions-Policy
  - `ERROR_HEADERS` — lines 22–28: nosniff, no-store, Referrer-Policy
  - `CORS_HEADERS` — lines 29–34: CORS headers + `Access-Control-Max-Age: '7200'`

- [x] Task 6: Insert OPTIONS (204) + non-GET (405) method validation after `try {` on line 68 (H-1) ✅ June 26, 2026
  - OPTIONS → 204 with `CORS_HEADERS` — lines 70–76
  - non-GET → 405 with `{ ...ERROR_HEADERS, 'Allow': 'GET, OPTIONS' }` — lines 77–83

- [x] Task 7: Replace 9 existing inline header objects with constants (M-1 cleanup) ✅ June 26, 2026
  - `api/index.js` line 92 → `ERROR_HEADERS` (400: invalid type)
  - `api/index.js` line 95 → `ERROR_HEADERS` (400: invalid subType)
  - `api/index.js` line 98 → `ERROR_HEADERS` (400: invalid date range)
  - `api/index.js` lines 351–353 → `SUCCESS_HEADERS` (200: avg-tier cache hit)
  - `api/index.js` lines 409–411 → `SUCCESS_HEADERS` (200: avg-tier BigQuery result)
  - `api/index.js` lines 419–421 → `SUCCESS_HEADERS` (200: tier-score cache hit)
  - `api/index.js` lines 466–468 → `SUCCESS_HEADERS` (200: tier-score BigQuery result)
  - `api/index.js` lines 517–521 → `SUCCESS_HEADERS` (200: main GA4 response)
  - `api/index.js` lines 526–530 → `ERROR_HEADERS` (500: catch block)

---

**Phase C: Verify + Deploy**

**Research status:** ✅ Complete — Session 11: Haiku agent pre-deploy verification (June 26, 2026). See Key Research Findings → Phase C Research section.
**Decisions resolved:** ✅ Keep 204 for OPTIONS | ✅ Permissions-Policy added to ERROR_HEADERS (api/index.js updated Session 11)

### Phase C Code Change — ERROR_HEADERS Update (Session 11)

**File:** `api/index.js` — `ERROR_HEADERS` constant (lines 22–28 pre-change, 22–29 post-change)
**Authority:** OWASP 2026 — apply security headers on all responses

**Before (lines 22–28):**
```javascript
const ERROR_HEADERS = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
};
```

**After (lines 22–29):**
```javascript
const ERROR_HEADERS = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), camera=(), microphone=(), payment=()'
};
```

**Status:** ✅ Applied — June 26, 2026 (Session 11). Uncommitted — will be included in Phase C commit.

- [x] Task 8: Run `npm audit --omit=dev` in `api/` directory — confirm still 0 HIGH/CRITICAL ✅ June 28, 2026 (0 vulnerabilities confirmed pre-deploy)
- [x] Task 9: Deploy Lambda — verify Node.js 22.x runtime in General configuration tab, then paste `api/index.js` into AWS Lambda console inline editor and click Deploy → confirm "Successfully updated function code" ✅ June 28, 2026 (deployed; Task 10 GET test passed immediately after)
- [x] Task 10: Test GET: ✅ June 26, 2026
  ```bash
  curl -i -H 'Origin: https://kstanigar.github.io' \
    'https://6waopo3jh1.execute-api.us-east-2.amazonaws.com/prod/analytics?type=standard'
  ```
  Result: 200 with all 7 security headers confirmed + live GA4 data in body ✅
- [x] Task 11: Test POST: ✅ PASSED — June 27, 2026
  ```bash
  curl -i -X POST -H 'Origin: https://kstanigar.github.io' \
    'https://6waopo3jh1.execute-api.us-east-2.amazonaws.com/prod/analytics'
  ```
  Expected: 405 with `allow: GET, OPTIONS` and `cache-control: no-store`
  **✅ PASSED — June 27, 2026:** 405 + `allow: GET, OPTIONS` + `cache-control: no-store` + `access-control-allow-origin: https://kstanigar.github.io` + `permissions-policy` confirmed. Lambda's 405 handler firing correctly via ANY method proxy integration.

- [x] Task 12: Test OPTIONS: ✅ PASSED — June 27, 2026
  ```bash
  curl -i -X OPTIONS -H 'Origin: https://kstanigar.github.io' \
    'https://6waopo3jh1.execute-api.us-east-2.amazonaws.com/prod/analytics'
  ```
  Expected: 204 with `access-control-allow-origin: https://kstanigar.github.io`, `access-control-allow-methods: GET, OPTIONS`, `access-control-max-age: 7200`
  **✅ PASSED — June 27, 2026:** 204 + `access-control-allow-origin: https://kstanigar.github.io` + `access-control-allow-methods: GET, OPTIONS` + `access-control-max-age: 7200` confirmed. Lambda's 204 handler firing correctly. No wildcard origin.

  ### Task 11 + 12 Finding — API Gateway Intercepts Before Lambda (June 26, 2026)

  **Root cause:** API Gateway has two behaviors that intercept before Lambda:
  1. **POST (and all non-GET/OPTIONS methods):** Not configured as a method on `/analytics` resource → API Gateway returns 403 instead of passing to Lambda for 405
  2. **OPTIONS:** API Gateway has a mock OPTIONS integration (enabled when CORS was configured in console) → returns 200 with `Access-Control-Allow-Origin: *` instead of passing to Lambda for our 204 + `ALLOWED_ORIGIN`

  **Security impact:**
  - Task 11: POST blocked at 403 (not 405). RFC 9110 requires 405 + `Allow` header for unsupported methods. Security is equivalent but non-compliant.
  - Task 12: CORS preflight returns wildcard `*` origin. Inconsistent with actual GET response (`ALLOWED_ORIGIN`). OWASP 2026: inconsistent CORS policy is a security misconfiguration. Attackers probe with `*` and assume broad access.

  ---

  ### Task 11 + 12 Fix Plan — API Gateway Reconfiguration (AWS Console)

  **Research status:** ✅ Complete — Session 11 Haiku agent (June 26, 2026)
  **Authority:** AWS Lambda Proxy Integration docs (2026) | RFC 9110 | OWASP WSTG

  **Key finding from AWS 2026 docs:** For Lambda proxy integrations, AWS explicitly states the Lambda should handle OPTIONS — not a mock integration. The mock is recommended only for non-proxy integrations. Our setup is a proxy integration, so the mock is the wrong pattern.

  **Recommended fix — `ANY` method with Lambda proxy integration:**

  Replace explicit GET + mock OPTIONS with a single `ANY` method. All HTTP methods route to Lambda. Lambda already handles:
  - `OPTIONS` → 204 + `CORS_HEADERS` (specific origin)
  - non-GET → 405 + `Allow: GET, OPTIONS`
  - `GET` → data responses

  **Why `ANY` over keeping explicit methods:**
  - Fixes Task 11: POST/DELETE/etc. reach Lambda → proper 405 with `Allow` header (RFC 9110 compliant)
  - Fixes Task 12: OPTIONS reaches Lambda → 204 with specific `ALLOWED_ORIGIN` (not wildcard)
  - Eliminates the mock OPTIONS integration conflict permanently
  - Lambda code requires zero changes — all handlers already exist

  **Trade-off:** POST/DELETE/etc. now invoke Lambda (billable) before returning 405. At this API's traffic scale, cost impact is negligible.

  **Exact AWS console steps:**

  **Step 1 — Delete existing GET method:**
  1. API Gateway console → select API → Resources pane → click `/analytics`
  2. Click **GET** method → click **Delete method** (top right) → confirm

  **Step 2 — Delete mock OPTIONS method:**
  1. Click **OPTIONS** method under `/analytics` → click **Delete method** → confirm

  **Step 3 — Create ANY method with Lambda proxy:**
  1. Select `/analytics` resource → click **Create method**
  2. Method type: **ANY**
  3. Integration type: **AWS Lambda**
  4. Enable **Lambda Proxy Integration** toggle → ON
  5. Lambda Region: `us-east-2`
  6. Lambda Function: `non-x-analytics-api`
  7. Click **Save** → click **OK** on permission confirmation popup

  **Step 4 — Deploy:**
  1. Click **Deploy API** (top toolbar)
  2. Stage: `prod`
  3. Click **Deploy** → wait for confirmation

  **Step 5 — Re-run Tasks 10, 11, 12 to verify:**
  - Task 10: GET → 200 + `ALLOWED_ORIGIN` (should be unchanged)
  - Task 11: POST → 405 + `Allow: GET, OPTIONS` + `Cache-Control: no-store` (from Lambda ERROR_HEADERS)
  - Task 12: OPTIONS → 204 + `access-control-allow-origin: https://kstanigar.github.io` + `access-control-max-age: 7200`

  **⚠️ Risk:** Deleting and recreating methods resets any method-level settings (throttling overrides, request validators). Verify throttle settings in API Gateway after deploy. Current throttle: 20 req/s (document in `docs/AWS_Config.md` after confirming).

  **Create method field configuration — verified Session 11 Haiku agent (June 27, 2026):**

  | Field | Value | Action |
  |-------|-------|--------|
  | Method type | ANY | ✅ Correct |
  | Integration type | Lambda function | ✅ Correct |
  | Lambda proxy integration | ON | ✅ Correct — Lambda reads `event.httpMethod`, `event.queryStringParameters`; returns `{statusCode, headers, body}` |
  | Response transfer mode | Buffered | ✅ Correct — Lambda returns complete JSON; no streaming |
  | Lambda function | ARN `arn:aws:lambda:us-east-2:032614958698:function:non-x-analytics-api` | ✅ Correct |
  | Integration timeout | 29000ms (max) | ✅ Correct — BigQuery queries can take 2-8s; max provides safety margin |
  | Authorization | None | ✅ Correct — public API, API key removed June 8, 2026 |
  | Request validator | None | ✅ Correct — Lambda handles all validation (whitelists lines 92-100) |
  | API key required | Unchecked | ✅ Correct |
  | Operation name | Leave blank | ✅ Leave blank — no OpenAPI spec generation planned |
  | URL query string parameters | None | ✅ Correct — Lambda proxy passes all params via `event.queryStringParameters` automatically |
  | HTTP request headers | None | ✅ Correct — Lambda proxy passes all headers automatically |
  | Request body | None | ✅ Correct — GET-only API; non-GET returns 405 |

  **Status:** ⏳ Pending user clicking Create method in AWS console
- [x] Task 13: Smoke test ⚠️ CONDITIONALLY PASSED — June 27, 2026 (Session 12)

  **Root causes found and resolved:**

  **Issue 1 — API Gateway response caching (FIXED):**
  - Edit Stage screenshots confirmed: "Provision API cache" ON, "Default method-level caching" ON, 0.5GB, 300s TTL
  - First avg-tier response was cached and served for all subtypes within the 300s TTL window
  - Fix: Disabled both toggles in Edit Stage → saved → confirmed "Successfully updated stage: prod"
  - Post-fix curl tests: avg-tier ✅, platform-split ✅, music-ab ✅ — all returning distinct data

  **Issue 2 — GA4 instrumentation gaps (FIXED in Xenon_3 — pending 24-48h data propagation):**
  - `death-triggers` chart empty: `player_death` sent `phase` but dashboard queries `death_phase` (different GA4 dimension key). Fix: added `death_phase` parameter to `player_death` event in `Xenon_3/game.html` + `game_mobile.html`
  - `replay-rate` shows `—`: `is_replay: false` (boolean) silently dropped by gtag(). Fix: changed to `isReplay ? 'true' : 'false'` (string) in `game_start` event
  - Xenon_3 PR `feature/ga4-fix-death-phase-is-replay` → merged to `dev` ✅ — CI passed (Game Integrity Check ✅, Test Game Build ✅)
  - `music_toggled` event: 0 occurrences in 7 days — accurate, not a bug (no one toggled music)

  **Remaining console warnings (not security issues — data gaps only):**
  - `death-triggers`: will populate after 24-48h GA4 data propagation from Xenon_3 fix
  - `replay-rate`: same — will populate after data propagation
  - All other sections loading correctly with live GA4 data

  **AWS_Config.md updated:** Edit Stage settings documented; caching root cause recorded; change log updated.
  **docs/GA4_Custom_Dimensions.md created:** All 31 GA4 custom dimensions documented — never needs to be re-shared from console screenshots.

- [x] Task 14: Docs updated — June 27, 2026 (Session 12)
  - `docs/Security_Audit_P5.md` — Task 13 + 14 marked complete with full root cause documentation
  - `docs/HANDOFF_SUMMARY.md` — Session 12 entry added
  - `docs/PRIORITIES.md` — P-5 status updated
  - `docs/AWS_Config.md` — Edit Stage caching settings documented; root cause recorded
  - `docs/GA4_Custom_Dimensions.md` — Created; all 31 GA4 dimensions from console screenshots
  - `Xenon_3/docs/GA4_Tracking_Fix_Plan.md` — Created; implementation plan + CI results
  - `Xenon_3/docs/HANDOFF_SUMMARY_2026-06-27.md` — Created; session summary

---

**Why this order:** npm audit must pass before touching `index.js` — no point hardening a handler on vulnerable deps. Constants defined (Task 5) before H-1 references them (Task 6). All `index.js` edits are one atomic session — partial edits leave the file in a broken state.

**Verification status:** ✅ Complete — two rounds: Session 9 (initial) + Session 10 Haiku re-verification (June 26, 2026). All corrections applied.

**Session 9 verification findings:**
- ✅ 204 correct for OPTIONS CORS preflight
- ✅ `Allow: GET, OPTIONS` header format correct for 405
- ✅ Object spread `{ ...ERROR_HEADERS, 'Allow': '...' }` safe in Lambda response headers
- ✅ Module-level constants safe for Lambda warm invocations
- ✅ `X-Content-Type-Options: nosniff` still relevant in 2026
- ✅ `Strict-Transport-Security` on Lambda response — NOT redundant; HSTS is application-layer (API Gateway HTTPS is network-layer)
- ✅ `no-store` for error responses — correct and conservative
- ✅ Sequencing order confirmed correct
- ❌ Fixed: `^6.1.0` → pinned `6.1.0` (floating caret risks auto-pull of unvetted minor versions)
- ❌ Fixed (now reversed — see Session 10): `X-Frame-Options: DENY` added to all three constants
- ⚠️ Fixed: `Access-Control-Max-Age: '86400'` added to `CORS_HEADERS`
- ⚠️ Fixed: `s-maxage` removed from `SUCCESS_HEADERS` — no CDN in place

**Session 10 Haiku re-verification corrections:**
- ❌ Fixed: `X-Frame-Options: DENY` **removed** from all three constants — OWASP 2026 explicitly states it is redundant on non-interactive JSON responses
- ❌ Fixed: `Access-Control-Max-Age: '86400'` → **`'7200'`** — Chrome silently caps at 7200s; 86400 was being ignored
- ✅ Added: `Referrer-Policy: strict-origin-when-cross-origin` to SUCCESS + ERROR (OWASP 2026 recommended)
- ✅ Added: `Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=()` to SUCCESS only (OWASP 2026 standard)
- ⚠️ Rejected: `Cross-Origin-Resource-Policy: same-origin` (Haiku suggested it) — would break cross-origin fetch from GitHub Pages; CORS already restricts by origin; omitted

**Pre-implementation blockers — confirmed June 26, 2026:**
- [x] Lambda Node.js runtime: **Node.js 22.x** ✅ — exceeds v6 minimum of Node 18. No blocker.
- [x] CloudFront: **None for NON-X Analytics API** ✅ — two CloudFront distributions exist for `nonx.standingtiger.com` (the game) only. API Gateway has no CDN in front. `s-maxage` correctly excluded from `SUCCESS_HEADERS`.

---

### Post-Implementation Checklist

- [x] `npm audit` returns 0 HIGH/CRITICAL ✅ June 28, 2026
- [x] Lambda runtime is Node 18+ (verified in AWS console) ✅ Node.js 22.x confirmed
- [x] POST request to Lambda returns 405 ✅ June 27, 2026
- [x] OPTIONS request to Lambda returns 204 ✅ June 27, 2026
- [x] GET request returns 200 with all security headers present ✅ June 26, 2026 (6 headers confirmed)
- [x] 400 validation error includes `Cache-Control: no-store` ✅ confirmed via curl test
- [x] 500 error includes `Cache-Control: no-store` ✅ confirmed via ERROR_HEADERS constant
- [x] All existing dashboard endpoints load correctly after deploy ✅ June 28, 2026 — smoke test passed, all 17 sections loading live GA4 data
