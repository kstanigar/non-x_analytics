# P-5 Security Audit — NON-X Analytics Dashboard

**Created:** June 26, 2026 (Session 9)
**Status:** 📋 PLAN — Pending implementation approval
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
| H-1 | HIGH | No HTTP method validation in Lambda | 🔴 Open |
| H-2 | HIGH | No Content Security Policy (CSP) | 🔴 Open |
| H-3 | HIGH | `innerHTML` with unsanitized API data | 🔴 Open |
| H-4 | HIGH | No Lambda-level rate limiting | 🔴 Open |
| M-1 | MEDIUM | Missing security headers in Lambda responses | 🔴 Open |
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

**Current status:** ✅ Phase A complete (C-1 resolved, 0 vulnerabilities) → ⏳ Phase B next (H-1 + M-1 — `api/index.js`)

---

## Implementation Plan: api/index.js — C-1 + H-1 + M-1 (Unified Edit)

**Research status:** 3 parallel Haiku agents completed ✅
**Verification status:** Pending (verification agent runs after user approves this plan)
**Implementation status:** Not started

### Key Research Findings

- **C-1 (v4→v6):** Zero code changes to `api/index.js` — `runReport()`, `runRealtimeReport()`, client instantiation, and response shapes are identical across v4 and v6. Only `package.json` changes.
- **Breaking change check:** `getUniversalMetadata()` — NOT present in codebase. `SheetExportAudienceList()` — NOT present. `dayOfWeek`/`week` dimensions — NOT used. No dimension parsing logic to update.
- **Node runtime:** v6 requires Node 18+. Lambda runtime must be verified in AWS console before deploy.
- **Sequencing:** C-1, H-1, and M-1 are fully independent. C-1 touches only `package.json`. H-1 and M-1 touch `api/index.js` only. Recommended order: C-1 → H-1 → M-1.
- **H-1 adds 2 new return statements** (OPTIONS → 204, non-GET → 405). M-1 must include these in its header updates, bringing total returns to update from 9 to 11.
- **M-1 strategy:** Define two shared header constants at file top instead of updating 11 returns individually. Cleaner, maintainable, no risk of missing a return.

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
    'X-Frame-Options': 'DENY',
    'Cache-Control': 'public, max-age=86400',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};
const ERROR_HEADERS = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Cache-Control': 'no-store'
};
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'X-Frame-Options': 'DENY'
};
```

**Verification corrections applied:**
- `X-Frame-Options: DENY` added to all three constants — prevents iframe embedding even on JSON API
- `s-maxage` removed from `SUCCESS_HEADERS` — only meaningful with a CDN (CloudFront); no CDN currently in place. Re-add if CloudFront is added in Phase 2.
- `Access-Control-Max-Age: '86400'` added to `CORS_HEADERS` — without it, browser repeats OPTIONS preflight on every single request, causing unnecessary Lambda invocations
- Version pinned to `"6.1.0"` (exact) not `"^6.1.0"` — prevents auto-pull of unvetted minor updates

**Why three header sets:**
- `SUCCESS_HEADERS` — 200 responses: 24h public cache, HSTS, full security headers
- `ERROR_HEADERS` — 400/500 responses: `no-store` (errors must never be cached), full security headers
- `CORS_HEADERS` — OPTIONS preflight only: no Content-Type or cache; includes Max-Age to cache preflight for 24h

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
- [ ] Task 4c: Smoke test — validate `BetaAnalyticsDataClient`, `runReport()`, `runRealtimeReport()` response shapes (performed in Phase C after Lambda deploy)

---

**Phase B: Edit `api/index.js` (single atomic session — do not split across sessions)**

- [ ] Task 5: Insert 3 shared header constants immediately after `ALLOWED_ORIGIN` on line 10 (M-1 setup):
  - `SUCCESS_HEADERS` — 200 responses
  - `ERROR_HEADERS` — 400/500 responses
  - `CORS_HEADERS` — OPTIONS preflight only
  - Exact code: see Change 3 / Step 3a above

- [ ] Task 6: Insert OPTIONS (204) + non-GET (405) method validation after `try {` on line 45 (H-1)
  - Exact code: see Change 2 above

- [ ] Task 7: Replace 9 existing inline header objects with constants (M-1 cleanup):
  - Line 53 → `ERROR_HEADERS`
  - Line 56 → `ERROR_HEADERS`
  - Line 59 → `ERROR_HEADERS`
  - Lines 328–332 → `SUCCESS_HEADERS`
  - Lines 389–393 → `SUCCESS_HEADERS`
  - Lines 399–403 → `SUCCESS_HEADERS`
  - Lines 446–450 → `SUCCESS_HEADERS`
  - Lines 478–485 → `SUCCESS_HEADERS`
  - Lines 490–494 → `ERROR_HEADERS`

---

**Phase C: Verify + Deploy**

- [ ] Task 8: Run `npm audit` one final time — confirm still 0 HIGH/CRITICAL
- [ ] Task 9: Deploy Lambda — paste updated `api/index.js` into AWS Lambda console and deploy
- [ ] Task 10: Test — GET request to any endpoint → confirm 200 with security headers present
- [ ] Task 11: Test — POST request → confirm 405 response
- [ ] Task 12: Test — OPTIONS request → confirm 204 response
- [ ] Task 13: Test — all existing dashboard endpoints load correctly with live data
- [ ] Task 14: Update `docs/Security_Audit_P5.md` — mark C-1, H-1, M-1 ✅ with commit hash

---

**Why this order:** npm audit must pass before touching `index.js` — no point hardening a handler on vulnerable deps. Constants defined (Task 5) before H-1 references them (Task 6). All `index.js` edits are one atomic session — partial edits leave the file in a broken state.

**Verification status:** ✅ Complete — verification agent ran June 26, 2026. All corrections applied.

**Verification findings summary:**
- ✅ 204 correct for OPTIONS CORS preflight
- ✅ `Allow: GET, OPTIONS` header format correct for 405
- ✅ Object spread `{ ...ERROR_HEADERS, 'Allow': '...' }` safe in Lambda response headers
- ✅ Module-level constants safe for Lambda warm invocations
- ✅ `X-Content-Type-Options: nosniff` still relevant in 2026
- ✅ `Strict-Transport-Security` on Lambda response — defense-in-depth, harmless
- ✅ `no-store` for error responses — correct and conservative
- ✅ Sequencing order confirmed correct
- ❌ Fixed: `^6.1.0` → pinned `6.1.0` (floating caret risks auto-pull of unvetted minor versions)
- ❌ Fixed: `X-Frame-Options: DENY` missing — added to all three header constants
- ⚠️ Fixed: `Access-Control-Max-Age: '86400'` missing from `CORS_HEADERS` — added (browser was repeating preflight on every request)
- ⚠️ Fixed: `s-maxage` removed from `SUCCESS_HEADERS` — only meaningful with CDN; no CloudFront in place yet

**Pre-implementation blockers — confirmed June 26, 2026:**
- [x] Lambda Node.js runtime: **Node.js 22.x** ✅ — exceeds v6 minimum of Node 18. No blocker.
- [x] CloudFront: **None for NON-X Analytics API** ✅ — two CloudFront distributions exist for `nonx.standingtiger.com` (the game) only. API Gateway has no CDN in front. `s-maxage` correctly excluded from `SUCCESS_HEADERS`.

---

### Post-Implementation Checklist

- [ ] `npm audit` returns 0 HIGH/CRITICAL
- [ ] Lambda runtime is Node 18+ (verified in AWS console)
- [ ] POST request to Lambda returns 405
- [ ] OPTIONS request to Lambda returns 204
- [ ] GET request returns 200 with all security headers present
- [ ] 400 validation error includes `Cache-Control: no-store`
- [ ] 500 error includes `Cache-Control: no-store`
- [ ] All existing dashboard endpoints load correctly after deploy
