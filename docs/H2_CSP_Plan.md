# H-2: CSP Meta Tag — Implementation Plan

**Created:** June 28, 2026 (Session 15)
**Status:** ⏳ Pending user approval
**Research:** ✅ 2× Haiku agents — W3C CSP Level 3, OWASP CSP Cheat Sheet 2025, MDN

---

## What This Fixes

**H-2 finding:** No Content Security Policy. Browser has zero restriction on what scripts can load, what URLs `fetch()` can contact, or what can embed this page.

**What this interim tag adds:**
- Locks `connect-src` to our API Gateway URL only — `fetch()` to any other host is blocked
- Locks `script-src` to self + cdnjs.cloudflare.com — blocks most external script injection
- Adds `base-uri 'none'` — closes base-tag injection attack (OWASP mandatory)
- Adds `form-action 'none'` — navigation directives do NOT fall back to `default-src`; without this, form submissions are unrestricted
- Adds `default-src 'none'` — all unspecified directives default to blocked

**What it does NOT fix (requires JS extraction to `dashboard.js`):**
- `'unsafe-inline'` in `script-src` nullifies script injection protection
- Cannot use nonces (GitHub Pages is static — no per-request server injection)
- `frame-ancestors` CANNOT appear in a meta tag (W3C CSP Level 3 §6.6.2 — ignored)

---

## Research Findings

### Haiku Agent 1 — June 28, 2026

| Question | Answer | Authority |
|----------|--------|-----------|
| `frame-ancestors` in meta tag | Explicitly forbidden — always ignored | W3C CSP Level 3 §6.6.2 |
| `default-src 'none'` with `'unsafe-inline'` | Always include — orthogonal concerns | OWASP CSP Cheat Sheet 2025 |
| `'unsafe-inline'` XSS protection | Nullifies script injection protection — accepted interim | OWASP migration guidance |
| Chart.js `img-src` | Canvas only — no `<img>` injection; `data:` needed for `toBase64Image()` | MDN / Chart.js 4.x docs |
| Google Fonts `@import` governance | `style-src` (not `connect-src`) — confirmed same Chrome + Firefox | W3C CSP Level 3 §6.7 |
| `connect-src` host-only path matching | Host without path matches all subpaths; query strings ignored during matching | W3C CSP Level 3 §2.2.1 |
| `base-uri` and `default-src` | `default-src` does NOT cover `base-uri` — must be explicit | W3C CSP Level 3 |
| `worker-src` / `manifest-src` | Not needed — covered by `default-src 'none'` fallback | W3C CSP Level 3 |

### Haiku Agent 2 — Verification — June 28, 2026

**Two required corrections to Agent 1 plan:**

| # | Issue | Agent 1 Plan | Correction | Authority |
|---|-------|-------------|------------|-----------|
| 1 | `base-uri` value | `'self'` | **`'none'`** — `'self'` still allows `<base>` tag injection; no `<base>` elements in this dashboard | OWASP CSP Cheat Sheet 2025 |
| 2 | `form-action` missing | Not included | **Add `form-action 'none'`** — navigation directives do NOT fall back to `default-src` (W3C CSP Level 3 §8.2) | W3C CSP Level 3 §8.2 |

**Additional confirmations:**
- `https://cdnjs.cloudflare.com` (host-only, no path) is sufficient for Chart.js — full path not required and would break on version bumps (W3C CSP Level 3 §6.7.2)
- `upgrade-insecure-requests` not needed — all resources already HTTPS; would be a no-op
- No new 2026 `'unsafe-inline'` attack surface beyond what was known; accepted interim trade-off for static GitHub Pages
- `form-action` and `frame-ancestors` are **navigation directives** — explicitly excluded from `default-src` fallback per W3C CSP Level 3 §8.2

---

## Exact Code Change

**File:** `live.html`
**Type:** Insert — no deletions

**Insert after line 16** (`<meta name="viewport" content="width=device-width, initial-scale=1.0" />`):

**Before (lines 15–17):**
```html
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NON-X Analytics - Live Dashboard</title>
```

**After:**
```html
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src https://fonts.gstatic.com;
    img-src 'self' data:;
    connect-src https://6waopo3jh1.execute-api.us-east-2.amazonaws.com;
    form-action 'none';
    base-uri 'none';
    object-src 'none';
  ">
  <title>NON-X Analytics - Live Dashboard</title>
```

**Insert point:** After line 16, before line 17. The `<title>` tag shifts to line 27 after insertion.

---

## Directive Rationale

| Directive | Value | Why |
|-----------|-------|-----|
| `default-src` | `'none'` | Explicit safe default — all unspecified resource types blocked |
| `script-src` | `'self' 'unsafe-inline' https://cdnjs.cloudflare.com` | `'unsafe-inline'` = required for ~5,000 lines of inline JS (interim only); `cdnjs.cloudflare.com` = Chart.js (host-only covers all paths) |
| `style-src` | `'self' 'unsafe-inline' https://fonts.googleapis.com` | `'unsafe-inline'` = required for inline `<style>` block; `fonts.googleapis.com` = governs `@import` fetch (not `connect-src`) |
| `font-src` | `https://fonts.gstatic.com` | Where Google actually serves WOFF2 files from |
| `img-src` | `'self' data:` | `data:` = Chart.js `toBase64Image()` output; `'self'` = favicon/logo images |
| `connect-src` | `https://6waopo3jh1.execute-api.us-east-2.amazonaws.com` | Host-only matches all paths and query strings. All `fetch()` calls locked to this API Gateway. |
| `form-action` | `'none'` | Navigation directive — does NOT fall back to `default-src`. Required: without it, injected `<form>` tags could exfiltrate data. No forms in this dashboard. |
| `base-uri` | `'none'` | Does NOT fall back to `default-src`. `'none'` = no `<base>` tags permitted. Dashboard has no `<base>` elements — `'self'` would still allow injection. |
| `object-src` | `'none'` | Explicit Flash/plugin block. Covered by `default-src 'none'` but explicit per OWASP audit clarity guidance. |

---

## Task List

### Task 1 — Create feature branch
```bash
git checkout -b feature/h2-csp-meta
```

### Task 2 — Edit `live.html:16`

Insert the CSP `<meta>` tag after line 16 (after `<meta name="viewport">`), before line 17 (`<title>`).

**Exact insertion:**
```html
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src https://fonts.gstatic.com;
    img-src 'self' data:;
    connect-src https://6waopo3jh1.execute-api.us-east-2.amazonaws.com;
    form-action 'none';
    base-uri 'none';
    object-src 'none';
  ">
```

### Task 3 — Push to staging
```bash
git add live.html
git commit -m "feat: H-2 CSP meta tag — connect-src locked to API Gateway"
git push origin feature/h2-csp-meta:staging
```

### Task 4 — Verify on staging

Open staging URL in browser DevTools:

**4a — Console check:**
- Look for CSP violation messages (`Refused to ...`)
- Dashboard must load fully with NO CSP errors
- Expect zero violations if all directives are correct

**4b — Network tab check:**
- All 17 fetch requests to `6waopo3jh1.execute-api.us-east-2.amazonaws.com` return 200
- Chart.js loaded from cdnjs.cloudflare.com ✅
- Google Fonts loaded from fonts.googleapis.com ✅

**4c — Security tab check:**
- Chrome DevTools → Application → Security: CSP policy listed
- Firefox Developer Tools → Security: CSP policy listed

**4d — Functional check:**
- All dashboard sections render with live data
- All charts render (Chart.js not blocked)
- Fonts display correctly (Share Tech Mono + Exo 2)

### Task 5 — Merge to main (after staging passes)
```bash
git checkout main
git merge feature/h2-csp-meta
git push origin main
git branch -d feature/h2-csp-meta
```

### Task 6 — Update documentation

- `docs/Security_Audit_P5.md` — mark H-2 ✅ Fixed, add commit hash, check verification checklist item
- `docs/HANDOFF_SUMMARY.md` — add Session 15 H-2 entry
- `docs/PRIORITIES.md` — update P-5 next line (H-2 complete → H-4 next)

---

## Possible Errors

| Error | Cause | Resolution |
|-------|-------|-----------|
| `Refused to load script` for Chart.js | CSP blocking cdnjs.cloudflare.com | Verify exact hostname — `https://cdnjs.cloudflare.com` (no path) |
| `Refused to load stylesheet` for Google Fonts | `@import` inside `<style>` blocked | `fonts.googleapis.com` must be in `style-src` — confirmed correct |
| `Refused to load font` from fonts.gstatic.com | Missing or misspelled `font-src` | Verify `https://fonts.gstatic.com` in `font-src` |
| Any fetch to API Gateway blocked | `connect-src` mismatch | Confirm `https://6waopo3jh1.execute-api.us-east-2.amazonaws.com` — no trailing slash |
| Charts fail to render | Chart.js or inline script blocked | Check console — `Refused to execute inline script` means `'unsafe-inline'` not parsed |
| `data:` URI blocked | Missing `data:` in `img-src` | Already included — if still blocked, check for `blob:` URIs instead |

**If ANY CSP violation appears in console on staging → STOP. Document violation. Do not merge to main.**

---

## Verification Checklist

- [ ] No CSP violations in browser console on staging
- [ ] All 17 API fetch requests succeed (Network tab — status 200)
- [ ] Chart.js renders all charts
- [ ] Google Fonts display correctly (Share Tech Mono + Exo 2)
- [ ] DevTools Security/Application tab shows CSP policy active
- [ ] `docs/Security_Audit_P5.md` H-2 row updated ✅

---

## What This Does NOT Fix (Future Work)

- `frame-ancestors` (requires HTTP header — GitHub Pages limitation; tracked M-5, resolved by Cloudflare proxy post-launch)
- `'unsafe-inline'` in `script-src` (requires JS extraction to `dashboard.js` — P-5b post-launch)
- M-2 clickjacking (same as `frame-ancestors` — requires Cloudflare)

---

**Effort:** 15–20 min
**Files changed:** `live.html` (1 insertion, 10 lines)
**Deploy required:** Yes — GitHub Pages rebuild (~2–3 min)
**Risk:** LOW — insertion only; no existing code modified
**Verified by:** 2× Haiku agents — W3C CSP Level 3, OWASP 2025, MDN
