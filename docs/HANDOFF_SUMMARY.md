# NON-X Analytics - Handoff Summary

**Purpose:** Living document updated in real-time during each session. Documents all work, research, implementations, and fixes as they happen.

**Last Updated:** June 28, 2026 (Session 14)

**Agent Instructions:** On session start, read the last 4 session entries below and scan for any incomplete tasks across all entries. Cross-reference with PRIORITIES.md to ensure sync.

**Archive:** Entries before June 13 (KPI Tile Bug Fix and earlier) are in `docs/archive/HANDOFF_ARCHIVE.md`

---

## June 28, 2026 - H-3 XSS Fix + Audit Cleanup (Session 14)

**Status:** ✅ H-3 complete — escHtml() on all 22 API-sourced innerHTML values

### Session 14 Summary

**Completed:**

**Audit doc reconciliation:**
- Reviewed `Security_Audit_P5.md` Phase C task list via Haiku agent
- Found 4 tasks (8, 9, 11, 12) and all 8 post-implementation checklist items had stale unchecked boxes
- Updated all checkboxes, doc status header, and current status line — commit `0f46c41`

**H-3 XSS Fix:**
- Planned H-3 using 2 Haiku agents — first found all 30 innerHTML sites (22 vulnerable, 8 safe); second found remaining *Sub construction sites inside `mapGA4ResponseToDATA`
- Verified escHtml() approach via third Haiku agent — confirmed OWASP 2026 compliant, all 5 required characters covered, no known bypasses, DOMPurify not required for GA4 numeric/enum data
- Added `escHtml()` utility function before `mapGA4ResponseToDATA` (line 3180)
- Applied 36 `escHtml()` wraps across 24 edit sites:
  - **Task 2a** (5 lines in `mapGA4ResponseToDATA`): `speedLockSub`, `replaySub`, `winSub`, `deathSub`, `lbRateSub`
  - **Task 2b** (10 lines in fetch handler): `deskWinSub`, `mobWinSub`, `newPctSub`, `scorecardSub`, `musicSub`, `leaveSub`, `surveySub`, `bossReachSub`
  - **Task 3** (9 HTML builder sites): funnel chart/table, boss cards, boss table, A/B music cards + rows, movement A/B cards + rows, platform table, AI metrics table
- Plan documented in `docs/H3_XSS_Fix_Plan.md`
- Tested on staging → merged to main — commit `92177fd`
- `Security_Audit_P5.md` H-3 row updated: `🔴 Open` → `✅ Fixed — June 28, 2026`

**Next priorities:**
1. Xenon_3 PR dev → main (check if Death Triggers + Replay Rate now populate after 24-48h GA4 propagation)
2. H-2: CSP meta tag in `live.html` (`connect-src` only)
3. H-4: AWS WAF (AWS console — AWSManagedRulesCommonRuleSet + rate-based rule)
4. GA4 doc — 2 events pending: `player_won` + `survey_submitted`

---

## June 28, 2026 - GA4 Event Documentation (Session 13)

**Status:** ✅ GA4 event schema documented — 15/17 events complete

### Session 13 Summary

**Completed:**
- DebugView verification of all Xenon_3 GA4 fixes:
  - `death_phase: 'green'` confirmed on dev build ✅
  - `is_replay: 'false'` on fresh start, `'true'` on play_again ✅
  - `phase: 'red'` / `'green'` on player_death ✅ (main + dev)
- `GA4_Custom_Dimensions.md` massively expanded — full DebugView-verified parameter tables for 15 events
- GA4 auto-collected events section added: `user_engagement`, `scroll`, `session_start`, `first_visit`, `page_view` flagged as metric opportunities (no new tracking needed)
- `game_start` parameter list completed with missing params from second capture
- `play_again` documented — rich event with `bonus_hp`, `continue`, `death_phase`, `replay_tier`
- `leave_game` documented — `source: 'game_over'` / `'victory'` distinguishes death vs win exits
- Unregistered parameters flagged across all events: `outcome` (game_complete), `referrer` (menu_view), `score`, `score_multiplier` — all sending but unqueryable via API
- `ai_difficulty_adjusted` — noted `ab_music_group` absent (only event without it)

**Events fully documented (15):**
`player_death`, `game_start`, `game_complete`, `menu_view`, `play_clicked`, `session_start`, `first_visit`, `returning_user`, `wave_reached`, `boss_attempt`, `boss_defeated`, `powerup_collected`, `ai_difficulty_adjusted`, `leave_game`, `play_again`

**Events still pending (2):**
- `player_won` — requires completing a full game run
- `survey_submitted` — seen in DebugView stream at 1:12:07 AM; click it next session to capture params

**Uncommitted changes (non-x_analytics) — `feature/security-p5-phase-a`:**
- `docs/GA4_Custom_Dimensions.md` — massively expanded with full event schema
- `docs/HANDOFF_SUMMARY.md` — Session 13 added
- `docs/PRIORITIES.md` — GA4 doc task added

**Xenon_3 status:**
- Fixes verified on dev; PR dev → main still pending (blocked on 24-48h GA4 propagation confirmation)
- Recommended: create slim `Xenon_3/docs/GA4_Event_Schema.md` (game-dev focused) referencing non-x_analytics doc as source of truth

**Completed end of Session 13:**
- `feature/security-p5-phase-a` committed (7 files, 2873 insertions) → pushed to staging → smoke test PASSED → merged to main ✅
- Smoke test confirmed: HTTP/2 200, 6 security headers, live GA4 data returning, `player_won` event appearing in data
- Feature branch deleted locally (no remote branch existed)
- `lambda-package/` added to `.gitignore` → committed → pushed
- Main branch clean ✅

**Next priorities:**
1. Xenon_3 PR dev → main (after GA4 data propagation confirms Death Triggers + Replay Rate populate)
2. H-3: `innerHTML` → `textContent`/`createElement` in `live.html` (XSS fix)
3. H-2: CSP meta tag in `live.html` (`connect-src` only)
4. H-4: AWS WAF (AWS console — AWSManagedRulesCommonRuleSet + rate-based rule)

---

## June 27, 2026 - P-5 Security Audit (Session 12)

**Status:** ✅ Phase C COMPLETE (conditionally) — GA4 data propagation pending 24-48h

### Session 12 Summary

**Completed:**
- API Gateway Edit Stage screenshots captured → confirmed root cause: caching WAS active (0.5GB, 300s TTL, both toggles ON despite Stage Details showing "Inactive")
- Disabled API Gateway caching: "Provision API cache" OFF + "Default method-level caching" OFF → saved → confirmed
- curl tests post-fix: all subtypes returning distinct data ✅ (avg-tier, platform-split, music-ab all different)
- Diagnosed remaining console errors: `death-triggers` + `replay-rate` = GA4 instrumentation gaps, not API bugs
- Created `docs/GA4_Custom_Dimensions.md` — all 31 GA4 custom dimensions from console screenshots, never to be re-shared
- Confirmed `death_phase` registered since Mar 2, 2026 — game was sending `phase` not `death_phase` (different dimension keys)
- Confirmed `is_replay: false` (boolean) silently dropped by gtag() — causing `(not set)` for all fresh game starts
- Haiku agent researched Xenon_3 project: structure, CI/CD, exact line numbers — no test files, zero CI risk for param additions
- Implemented 4 changes across Xenon_3 `game.html` + `game_mobile.html`:
  - `death_phase` added to `player_death` (game.html:7036, game_mobile.html:7707)
  - `is_replay` boolean → string (game.html:8575, game_mobile.html:9452)
- Created `Xenon_3/docs/GA4_Tracking_Fix_Plan.md` + `Xenon_3/docs/HANDOFF_SUMMARY_2026-06-27.md`
- PR `feature/ga4-fix-death-phase-is-replay` → `dev` merged ✅ — CI passed (Game Integrity Check ✅, Test Game Build ✅)
- `AWS_Config.md` updated with Edit Stage settings + root cause + change log entries
- Tasks 13 + 14 marked complete in `Security_Audit_P5.md`

**Phase C status:** Conditionally complete. All API endpoints return correct data. Two dashboard metrics (`death-triggers`, `replay-rate`) will populate after 24-48h GA4 data propagation from Xenon_3 fix on dev.

**Pending before Xenon_3 dev → main merge:**
- GA4 DebugView verification: play NON-X game → confirm `death_phase` + `is_replay` appear in event parameters
- After 24-48h: confirm Death Triggers chart + Replay Rate populate on dashboard

**Uncommitted changes on `feature/security-p5-phase-a` (non-x_analytics):**
- `api/index.js` — Permissions-Policy in ERROR_HEADERS
- `docs/Security_Audit_P5.md` — full Phase C documentation
- `docs/HANDOFF_SUMMARY.md` — Sessions 11 + 12
- `docs/PRIORITIES.md` — P-5 status updates
- `docs/AWS_Config.md` — all AWS settings + root cause
- `docs/GA4_Custom_Dimensions.md` — new file, all 31 dimensions
- `CLAUDE.md` — Rules 9, 10, 11

**Next priorities (non-x_analytics):**
1. Commit all above to `feature/security-p5-phase-a` → push to staging → smoke test → merge to main
2. H-3: `innerHTML` → `textContent`/`createElement` in `live.html`
3. H-2: CSP meta tag in `live.html`
4. H-4: AWS WAF

---

## June 27, 2026 - P-5 Security Audit (Session 11)

**Status:** 🔴 BLOCKED — Phase C Task 13 (smoke test) failing — diagnostic in progress

### Session 11 Summary

**Completed:**
- Phase C pre-deploy research: Haiku agent verified all 13 Create method fields, all headers, curl test commands (June 27, 2026)
- `api/index.js` — `ERROR_HEADERS` updated: `Permissions-Policy` added (OWASP 2026 compliance, Decision 2)
- OPTIONS 204 kept as-is (Decision 1 — RFC 9110, Express.js ecosystem standard)
- `CLAUDE.md` — Rule 9 (Industry Standards), Rule 10 (AWS Config tracking), Rule 11 (Deployment descriptions) added
- `docs/AWS_Config.md` — created; populated with Lambda + API Gateway + Stage settings from console screenshots
- Task 8 ✅: `npm audit --omit=dev` → 0 vulnerabilities
- Task 9 ✅: Lambda deployed — Node.js 22.x confirmed, `api/index.js` pasted + "Successfully updated function code"
- Task 10 ✅: GET → 200 with all 7 security headers + live GA4 data
- Task 11 ✅ (after fix): POST → 405 + `Allow: GET, OPTIONS` + `Cache-Control: no-store` + `ALLOWED_ORIGIN`
- Task 12 ✅ (after fix): OPTIONS → 204 + `access-control-allow-origin: https://kstanigar.github.io` + `access-control-max-age: 7200`
- API Gateway reconfigured: explicit GET + mock OPTIONS replaced with ANY method (Lambda proxy) — fixes CORS wildcard + RFC 9110 405 compliance
- API Gateway redeployed to prod with description

**Tasks 11 + 12 root fix — API Gateway ANY method:**
- Deleted explicit GET method and mock OPTIONS integration on `/analytics` resource
- Created ANY method with Lambda proxy integration (`non-x-analytics-api`, us-east-2, Buffered, 29000ms timeout)
- Deployed to prod — "Successfully created deployment for NON-X_Analytics_Gateway"
- Stage settings captured: Rate 10000, Burst 5000, Cache cluster: Inactive

### 🔴 BLOCKED — Task 13 Smoke Test (June 27, 2026)

**Problem:** Dashboard shows multiple console errors — "parsing failed or no data" for music-AB, AI-analysis, death-triggers, new-user-pct, replay-rate sections.

**Symptom:** Every `/analytics` endpoint returns `{"avgStartTier":2,"avgFinalTier":3}` (avg-tier BigQuery data) regardless of `?subType=` parameter. content-length: 35 on all responses.

**Confirmed NOT API Gateway caching** — cache cluster is Inactive (AWS docs: no caching without provisioned cluster).

**Throttling is unrelated** — Rate 10000 / Burst 5000 are rate limits, completely separate from caching.

**Root cause not yet confirmed** — Haiku research (Session 11) points to Lambda receiving incorrect/null `event.queryStringParameters`. ANY method passes query params identically to GET per AWS docs — no code change needed for that.

**Next diagnostic required:** CloudWatch Logs → `/aws/lambda/non-x-analytics-api` → inspect `event.queryStringParameters` in a recent platform-split invocation to confirm if `subType` is being received correctly.

**Uncommitted changes on `feature/security-p5-phase-a`:**
- `api/index.js` — Permissions-Policy added to ERROR_HEADERS (Session 11)
- `docs/Security_Audit_P5.md` — Phase C research, findings, task status updates
- `docs/HANDOFF_SUMMARY.md` — this entry
- `docs/PRIORITIES.md` — pending update
- `docs/AWS_Config.md` — new file, all AWS settings
- `CLAUDE.md` — Rules 9, 10, 11 added

---

## June 26, 2026 - P-5 Security Audit (Session 10)

**Status:** ⏳ IN PROGRESS — Phase A ✅ | Phase B ✅ | Phase C next (deploy + test)

### Phase B Complete — June 26, 2026

- **H-1 RESOLVED:** HTTP method validation added to `api/index.js` — OPTIONS → 204, non-GET → 405
- **M-1 RESOLVED:** 3 shared security header constants added; all 9 inline header objects replaced
- **Pre-implementation research:** Haiku agent re-verified all headers against OWASP 2026 — 3 corrections applied vs. Session 9 plan:
  - `X-Frame-Options: DENY` removed from all constants (OWASP 2026: redundant on JSON APIs)
  - `Access-Control-Max-Age` corrected `86400` → `7200` (Chrome silently caps at 7200s)
  - Added `Referrer-Policy` + `Permissions-Policy` to SUCCESS/ERROR headers (OWASP 2026 recommended; were missing)
- **`api/index.js` changes:**
  - Lines 12–34: `SUCCESS_HEADERS`, `ERROR_HEADERS`, `CORS_HEADERS` constants inserted after `ALLOWED_ORIGIN`
  - Lines 70–83: OPTIONS (204) + non-GET (405) method validation at handler entry
  - 9 inline header objects replaced with constants throughout file
- **Commit:** `ac7c080` on `feature/security-p5-phase-a` → pushed to staging ✅
- **Next:** Phase C — `npm audit` final → deploy Lambda → test endpoints → smoke test dashboard

### Phase A Complete — June 26, 2026

- **C-1 RESOLVED:** Upgraded `@google-analytics/data` `^4.1.0` → pinned `6.1.0` in `api/package.json`
- **`npm audit`:** 0 vulnerabilities (was 10 HIGH/CRITICAL) ✅
- **`package-lock.json`:** Generated and committed on `feature/security-p5-phase-a`
- **Pre-implementation verification:** Haiku agent confirmed 6.1.0 is latest stable (no v7), zero breaking changes to `runReport()` / `runRealtimeReport()` / `BetaAnalyticsDataClient`, exact pinning + lockfile is 2026 AWS Lambda best practice

---

## June 26, 2026 - P-5 Security Audit (Session 9)

**Status:** ✅ Planning complete — superseded by Session 10

### Completed This Session

- **Full security audit conducted** — 6 parallel Haiku agents researched codebase + 2026 best practices
- **`docs/Security_Audit_P5.md` created** — complete audit findings, release plan, and implementation plan
- **Mandatory security fix protocol established** — research → plan → verify → approve → implement → test (no exceptions)
- **13 findings documented** (1 critical, 4 high, 5 medium, 3 low) — see `docs/Security_Audit_P5.md`

### Key Findings

- **C-1 CRITICAL:** 10 npm vulnerabilities in `api/` (protobufjs RCE, grpc-js DoS, form-data CRLF) — fix: upgrade `@google-analytics/data` `^4.1.0` → pinned `6.1.0`; zero code changes to `api/index.js`
- **H-1 HIGH:** No HTTP method validation — POST/PUT/DELETE accepted by Lambda; no OPTIONS handling for CORS preflight
- **H-2 HIGH:** No CSP — interim meta tag planned (connect-src only); full CSP requires JS extraction (post-launch P-5b)
- **H-3 HIGH:** 7+ `innerHTML` with unsanitized API data in `live.html` — fix: `textContent`/`createElement`
- **H-4 HIGH:** No Lambda-level rate limiting — AWS WAF planned (Phase 2, AWS console)
- **M-1 MEDIUM:** Missing security headers in Lambda responses — fix: shared header constants
- **L-3 LOW:** API Gateway URL in client JS — confirmed NOT a critical vulnerability for public read-only API (OWASP 2026)
- **H-2 finding:** `frame-ancestors` in CSP meta tag doesn't work — requires HTTP header; GitHub Pages limitation; Cloudflare needed post-launch

### Infrastructure Confirmed

- **Lambda runtime:** Node.js 22.x ✅ — exceeds v6 minimum (Node 18)
- **CloudFront:** None for NON-X Analytics API — two distributions exist for `nonx.standingtiger.com` (the game only)
- **`s-maxage` excluded** from SUCCESS_HEADERS — no CDN in place

### Implementation Plan: C-1 + H-1 + M-1 (unified `api/index.js` edit)

**Research:** 3 parallel Haiku agents ✅
**Plan documented:** `docs/Security_Audit_P5.md` — Implementation Plan section ✅
**Verification:** Haiku verification agent ✅ — corrections applied (pinned version, X-Frame-Options, Access-Control-Max-Age, s-maxage removed)
**Pre-implementation blockers:** Both cleared ✅ (Node 22.x confirmed, no CloudFront confirmed)
**User approval:** ✅ Approved
**Status:** ⏳ Ready to implement

### Changes Queued (not yet implemented)

**`api/package.json`:**
- `"@google-analytics/data": "^4.1.0"` → `"6.1.0"` (pinned exact)

**`api/index.js`:**
- Add 3 shared header constants after line 10 (`SUCCESS_HEADERS`, `ERROR_HEADERS`, `CORS_HEADERS`)
- Add OPTIONS (204) + non-GET (405) method validation after `try {` on line 45
- Replace 9 existing inline header objects with constants (lines 53, 56, 59, 328–332, 389–393, 399–403, 446–450, 478–485, 490–494)

### 14-Step Task List (documented + verified — ready to execute next session)

- **Phase A (Tasks 1–4):** Confirm v6.1.0 stable → edit package.json → npm install → npm audit gate
- **Phase B (Tasks 5–7):** Add header constants (line 10) → add method validation (line 45) → replace 9 inline headers
- **Phase C (Tasks 8–14):** npm audit final → deploy Lambda → test GET/POST/OPTIONS → smoke test dashboard → update docs

### Release Plan Summary

**Next session:** C-1 + H-1 + M-1 (api/index.js) → then H-3 (live.html innerHTML) → H-2 (CSP meta)
**Separate AWS session:** H-4 — WAF + rate-based rules
**Post-launch (30 days):** JS extraction + full CSP, Cloudflare headers, M-3/M-4/L-1/L-2
**Full plan + exact code:** `docs/Security_Audit_P5.md`

---

## June 26, 2026 - UX Sprint: Simplify Data Dictionary (Session 8)

**Status:** ✅ COMPLETE | Commit: `dc40d80` (amended), pending merge to main

### Completed This Session

- **UX-5: Simplify Data Dictionary** ✅ — `feature/ux-5-simplify-dict`, staging confirmed
  - **CSS (4 new rules):** `.dict-summary` paragraph style + `details.dict-technical` + `summary` hover — inserted after line 1564
  - **26 dict entries restructured:** Plain-English summary added to each entry; Source, Format, Note, Why BQ, Status logic rows removed (47 rows total); remaining `<dl>` wrapped in `<details class="dict-technical">` collapse
  - **New entry created:** `dict-platform-kpis` — Desktop Win % and Mobile Win % KPI cards now link to a real dict entry (was previously missing)
  - **Movement A/B note updated:** Removed "game-side fix required" language; replaced with BigQuery join solution reference (MT-6 backlog)
  - **Lambda API Endpoints Reference section removed** — internal backend detail, not user-facing content
  - **Future Metrics BigQuery Backlog section removed** — internal dev planning, not user-facing content
  - **"Chart ↗" back-links unaffected** — JS-injected into `dict-entry-title`, not the `<dl>`
  - Full plan: `docs/QA_Feedback_UX_Plan.md`

- **BigQuery Future Metrics doc updated:** Movement A/B Win Rate added as top-priority item — `ga_session_id` join pattern, same as Avg Start Tier; unlocks empty Win Rate column in A/B tab

- **Security finding flagged for P-5:** AWS API Gateway URL (`https://6waopo3jh1.execute-api.us-east-2.amazonaws.com/prod`) hardcoded in JS source — inherent client-side limitation, can't be hidden in Dict; add to P-5 security audit scope

### Next Priority Order
1. ~~UX-0: Hamburger colors~~ ✅
2. ~~UX-2: White titles~~ ✅
3. ~~UX-4: `⊞` → "View" label~~ ✅
4. ~~UX-1: Metric renames~~ ✅
5. ~~UX-3: Clickable cards + section tooltips~~ ✅
6. ~~UX-3b: Remove individual card `data-tooltip` text~~ ✅
7. ~~UX-5: Simplify Data Dictionary~~ ✅ — `dc40d80`, live
8. P-5: Security audit (AWS URL exposure flagged as first item)
9. UX-6 + MT-6: Distinct Players + BigQuery metrics (separate session)

---

## June 25, 2026 - UX Sprint: Clickable KPI Cards + Section Tooltips (Session 7)

**Status:** ✅ COMPLETE | Commit: `eac7416`, merged to main

### Completed This Session
- **UX-3: Clickable KPI cards + section-level tooltips** ✅ — `eac7416`, live
  - **CSS (2 rules):** `.kpi[data-dict]` → `cursor: pointer` + cyan border glow on hover; `.section-info` → inline ⓘ styling; `.section-info[data-case]` → pointer cursor
  - **KPI cards (16 cards):** All per-card ⓘ spans removed from `.kpi-label`; `data-dict` moved to parent `.kpi` div — existing `[data-dict]` click handler navigates to Data Dictionary automatically
  - **Total Tier Adjustments:** Both ⓘ spans removed; only `data-dict="avg-adjustments"` kept (Case Study link dropped — Dict + Case Study are on separate tabs, can't highlight simultaneously)
  - **Section headers (5):** `.section-info` ⓘ spans added with `data-tooltip` — picked up by existing `querySelectorAll('[data-tooltip]')` at page load
    - Top-Line KPIs (line 1722): "Core metrics — how many people played, won, and came back."
    - Player Behavior (line 1766): "What players do during a run — deaths, drop-offs, and feature usage."
    - AI Agent (line 1964): "How the difficulty AI is adjusting in response to player performance."
    - A/B Test 1 (line 2087): "Live split test comparing music toggle and player performance and the two movement control schemes used by the player." — also retains `data-case="cs-ab-findings"` click to Case Study
    - Desktop vs Mobile (line 2129): "Side-by-side comparison of Desktop vs. Mobile player outcomes."
  - **No JS changes needed** — existing `[data-dict]` handler + `querySelectorAll('[data-tooltip]')` covered both behaviors
  - Full plan: `docs/QA_Feedback_UX_Plan.md`

### Next Priority Order
1. ~~UX-0: Hamburger colors~~ ✅
2. ~~UX-2: White titles~~ ✅
3. ~~UX-4: `⊞` → "View" label~~ ✅
4. ~~UX-1: Metric renames~~ ✅
5. ~~UX-3: Clickable cards + section tooltips~~ ✅
6. ~~UX-3b: Remove individual card `data-tooltip` text~~ ✅ — `2187025`, live
7. UX-5: Simplify Data Dictionary (M-L, separate session)
8. P-5: Security audit (when ready)
9. UX-6 + MT-6: Distinct Players + BigQuery metrics (separate session)

---

## June 25, 2026 - UX Sprint: Hamburger Colors + Metric Renames (Session 6)

**Status:** ✅ DOCUMENTED | Branch: `feature/ux-1-metric-renames` → staging

### Completed This Session
- **UX-0: Hamburger menu color styling** ✅ — `9aee2ed`, live
  - Hamburger bars + "DASHBOARDS" label → `var(--green)` (#39FF14)
  - "- OVERVIEW" active tab name → `var(--yellow)` (#FFD700)
  - 3 CSS-only changes: `.hamburger-label:1256`, `.active-tab-name:1262`, `.hamburger-btn span:1299`
  - Added UX-3 section tooltip one-liners to `docs/QA_Feedback_UX_Plan.md`
- **UX-1: Full metric rename pass** ✅ — `4c91766`, merged to main
  - `Total Sessions` → `Total Plays`
  - `Win Rate` → `Win %` (KPI labels, Dict h4, JS label objects, comparison tables)
  - `Death Rate` → `Death %`
  - `Play-Again Rate` → `Play-Again %`
  - `Leaderboard Rate` → `Leaderboard Entries`
  - `Scorecard View Rate` → `Scorecard Views`
  - `Music Toggle Rate` → `Music Toggle %`
  - `Leave Game Rate` → `Drop-off Rate`
  - `Boss Reach Rate` → `Boss Reach %`
  - `Survey Response Rate` → `Survey Response %`
  - `Speed Lock Rate` → `Speed Lock %`
  - `Desktop/Mobile Win Rate` → `Desktop/Mobile Win %`
  - Haiku agent confirmed all exact line numbers; full plan in `docs/QA_Feedback_UX_Plan.md`
  - Note: QA plan had 3 wrong label names (event names, not display labels) — corrected during research

---

## June 24, 2026 - QA Feedback + UX Planning (Session 5)

**Status:** ✅ DOCUMENTED | Plan: `docs/QA_Feedback_UX_Plan.md` | Tier rounding: ✅ live (`7678761`)

### Changes This Session
- **Tier rounding fix:** Avg Start Tier + Avg Final Tier now display as whole numbers (`Math.round()` applied before render) — `live.html:4795-4796`
- **Git branches cleaned:** No stale feature branches; only `main` + `staging` remain
- **QA feedback incorporated** from external testers — 8 UX tasks documented

### QA Feedback Summary
External testers flagged:
1. Dashboard purpose unclear — needs to signal "game analyst portfolio" + be legible to players
2. Metric names too technical ("Total Sessions" → "Total Plays")
3. Overview page overwhelming; card titles need to be white for contrast
4. `ⓘ` icons on each card feel cluttered — move to section headers instead; make entire card clickable → Data Dictionary
5. `⊞` icon in Data Dictionary/Case Study cryptic — rename to "Chart"
6. Data Dictionary too dense for average user
7. Requested: Distinct Players count, Player Performance page, Leaderboard tab

### Tooltip/Card Interaction Plan (UX-3)
- Remove per-card `ⓘ` icons
- Each KPI card → fully clickable → jumps to its Data Dictionary entry
- Single `ⓘ` on section headers ("TOP-LINE KPIS", "PLAYER BEHAVIOR") for section-level context
- Screenshot annotation confirmed: tooltips move to section header level

### Completed This Session
- **UX-2: White titles** ✅ — `84e6ccc`, merged to main
  - `.section-label:246`, `.kpi-label:314`, `.card-title:402` → `color: #fff`
- **UX-4: `⊞` → "View" label** ✅ — `ec33b20`, merged to main
  - `BACKLINK_ICON` constant + 4 Case Study HTML instances → `'View'`
  - `.dict-link` CSS: added `border: 1px solid var(--cyan)`, `padding: 1px 6px`, `border-radius: 3px`

### Next Priority Order
1. ~~UX-2: White titles~~ ✅
2. ~~UX-4: `⊞` → "View" label~~ ✅
3. UX-1: Metric renames (S) ← **next**
3. UX-1: Metric renames (S)
4. UX-3: Clickable cards + section tooltips (M)
5. UX-5: Simplify Data Dictionary (M-L, separate session)
6. P-5: Security audit (when ready)
7. UX-6 + MT-6: Distinct Players + BigQuery metrics (separate session)

---

## June 24, 2026 - Lambda Concurrency Issue (P-0) — BLOCKED

**Status:** ✅ COMPLETE | Commit: `381123d` | Production: ✅ live

### Problem
Parallel fetch refactor fires 17 simultaneous Lambda requests. Account-level concurrency limit is 10 → 7 endpoints throttled → HTTP 500 → fall back to mock data. Core KPIs (GA4 overview) still load correctly.

### Diagnosis
- CloudWatch confirmed cold-start invocations (Init: ~806ms)
- Lambda Configuration → Concurrency → Unreserved account concurrency: **10**
- 17 simultaneous requests exceed limit by 7 → explains exactly 7 failing endpoints

### Action Taken
- AWS Service Quotas → Lambda → Concurrent executions → increase requested to **50**
- Awaiting approval email (typically 1–3 business days)

### Fix Implemented (same session)
- Wave A (8): fetchGA4Data, fetchBossAnalysisData, fetchMusicABData, fetchPlatformSplitData, fetchDailyTimeseriesData, fetchSurvivalTimeData, fetchPowerupAnalysisData, fetchAIAnalysisData
- Map Wave A dependency results (DATA.kpis, DATA.bossAnalysis, DATA.abMusic)
- Wave B (9): fetchDeathTriggersData, fetchNewUserPctData, fetchReplayRateData, fetchMovementABData, fetchAvgTierData, fetchTierScoreData, fetchEngagementData, fetchMusicFunnelData, fetchProgressionAnalysisData
- All sections load with live data — confirmed fast load in incognito ✅

---

## June 24, 2026 - Favicon, Logo, Footer, Terms & Privacy (P-1 – P-4)

**Status:** ✅ COMPLETE | Branch: `feature/favicon-and-logo` | Production: ✅ live

### Changes

**`live.html`:**
- Favicon: `<link rel="icon" type="image/png" href="images/st_760.png">` + `<link rel="apple-touch-icon">` added to `<head>`
- Logo removed from header (`.logo-row` / `.logo-img` CSS removed); `<h1>` restored to plain link
- `.site-footer` added before `</body>` — Standing Tiger logo (32px) + copyright + Terms/Privacy links
- `.footer-logo`, `.footer-text`, `.footer-links` CSS added

**`images/st_760.png`:** committed to git (was untracked — caused broken image on staging)

**`terms.html` + `privacy.html`:** created from scratch
- Dark theme matching dashboard (`#0a0a0f` bg, cyan headings, mono font)
- Terms: 6 sections (Acceptance, Use, IP, Disclaimers, Changes, Contact)
- Privacy: 6 sections (Collection, Use, Third-Party Services — GA4/AWS/BigQuery, Retention, Rights, Contact)
- Contact: `contact@standingtiger.com` (placeholder — swap when business email is ready)
- Each page has `← Back to Dashboard` link and cross-links to the other

**`.github/workflows/deploy-staging.yml` + `deploy-production.yml`:**
- Added `cp -r images deploy/images` (was missing — caused favicon/logo to 404 on staging)
- Added `cp terms.html deploy/terms.html` and `cp privacy.html deploy/privacy.html`

### Issues Encountered
- `images/` was never committed to git → favicon + logo broken on staging → fixed by `git add images/`
- Deploy workflows only copied `live.html` → static assets 404'd → fixed by adding `cp` commands to both workflows

---

## June 24, 2026 - Parallel Fetch Refactor

**Status:** ✅ COMPLETE | Commit: `8746a86` | Production: ✅ live

### Problem
`loadAndRenderGA4Data()` fired 17 fetches sequentially — total load time = sum of all fetch durations (15–20s). Would grow linearly with each new metric added.

### Solution
Single-wave `Promise.allSettled()` — all 17 fetches fire simultaneously. Total load time = duration of slowest single fetch (~2–4s). Future metrics join the single `allSettled` at zero additional load time cost.

### Changes

**`live.html:4493–4888`** — `loadAndRenderGA4Data()` refactored:
- Sequential `await` chain (17 fetches) → single `Promise.allSettled([...17 fetches])`
- Mapping order controlled for data dependencies:
  1. `ga4Result` → DATA.kpis (required by engagement + progression mappers)
  2. `bossResult` → DATA.bossAnalysis (required by engagement + progression mappers)
  3. `musicABResult` → DATA.abMusic (required by musicFunnel mapper)
  4. All remaining results (any order)
  5. `progressionResult`, `engagementResult`, `musicFunnelResult` mapped last
- Each result wrapped in `status === 'fulfilled'` check — one failed fetch does not block others
- `console.warn` per failure with `reason ?? value?.error` pattern

**AWS API Gateway:**
- Usage plan `NON-X-Analytics-Rate-Limit` throttle raised: **10 req/s → 20 req/s**
- Required: Wave of 17 simultaneous requests would have exceeded old 10 req/s limit
- Burst remains 20; quota remains 10,000 req/day

**Docs:**
- `docs/Parallel_Fetch_Refactor_Plan.md` created — full research, dependency analysis, security audit, implementation plan
- PRIORITIES.md + HANDOFF_SUMMARY.md updated

### Research (3 Haiku agents)
- Dependency analysis: 3 hard dependencies (engagement/musicFunnel/progression) — all resolved via mapping order, not separate fetch waves
- Best practices: `Promise.allSettled()` confirmed as 2026 standard for dashboards
- Security: only real concern was rate limiting (addressed by quota raise); race conditions impossible in single-threaded JS

---

## June 24, 2026 - Tier vs Final Score Scatter Chart (MT-5)

**Status:** ✅ COMPLETE | Lambda: ✅ deployed + verified | Git: pending push

### Changes

**`api/index.js`:**
- `'tier-score'` added to `VALID_SUBTYPES` array (`api/index.js:14`)
- `let tierScoreCache = { data: null, timestamp: 0 }` added alongside `tierCache`
- Option B BigQuery handler inserted before realtime block — joins `player_won` (`final_score`) with last `ai_difficulty_adjusted` per session (`new_tier`) via `LAST_VALUE() OVER()`
- Reuses `TIER_CACHE_TTL_MS` (24h) and `getBigQueryClient()` lazy-loader

**`live.html`:**
- Chart card with `<canvas id="chart-tier-score">` added after Tier Performance Metrics table
- `DATA.aiAgent.tierScorePoints: []` added to DATA object
- `fetchTierScoreData()` function added (same pattern as `fetchAvgTierData`)
- Both BigQuery fetches run in parallel via `Promise.all([fetchAvgTierData(), fetchTierScoreData()])`
- `chartTierScore()` scatter chart function — color-coded by tier using existing `RED/YEL/GRN/CYAN/MAG/PUR` constants
- `chartTierScore()` called in `reinitAllCharts()`

**BUG-001 — `Unrecognized name: ga_session_id`:**
- Root cause: `ga_session_id` referenced as top-level BigQuery column — it lives in `event_params`
- Fix: extracted via `(SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS ga_session_id` in both CTEs; PARTITION BY uses same subquery expression (matches `avg-tier` pattern)
- Verified via CloudWatch; endpoint now returns `{"points":[{"x":3432,"y":2},{"x":6586,"y":2}]}` ✅

**Docs:**
- `docs/MT5_Tier_Score_Chart_Plan.md` created — full plan with bug log → archived to `completed-implementations/`
- `docs/Decimal_Rounding_Plan.md` → archived to `completed-implementations/`
- PRIORITIES.md: MT-5 marked ✅ complete; API Gateway Caching pushed to PRIORITIES_ARCHIVE.md
- HANDOFF_SUMMARY.md: this entry

---

## June 13, 2026 - Game Links + Production Deploy

**Status:** ✅ COMPLETE | Commit: `66fc1fe` | Production: ✅ live

### Changes
- **Heading anchor:** `<h1>NON-X</h1>` → `<h1><a href="https://nonx.standingtiger.com/" target="_blank" rel="noopener">NON-X</a></h1>` (`live.html:1548`)
- **CSS added:** `.logo-block h1 a` (color inherit, no underline, 0.15s opacity hover) (`live.html:~115`)
- **Case Study CTA:** `▶ Play NON-X` button after "About the Project" paragraphs (`live.html:~2119`)
- **CSS added:** `.play-btn` class — cyan border/text, mono font, hover lift — styled to match `.refresh-btn`
- Pushed to staging then production

---

## June 13, 2026 - Hamburger Menu at 900px

**Status:** ✅ COMPLETE | Commit: `5b777a5` | Production: ✅ live

### Changes
- `@media (max-width: 479px)` → `(max-width: 900px)` (`live.html:1052`) — shows hamburger on tablets
- `@media (min-width: 480px)` → `(min-width: 901px)` (`live.html:1348`) — desktop nav threshold raised
- Hamburger menu was already fully implemented; this was a CSS-only boundary change
- No JS changes needed

---

## June 13, 2026 - Documentation Restructure

**Status:** ✅ COMPLETE | Commit: `de71d11`

### Changes
- `docs/archive/PRIORITIES_ARCHIVE.md` created — 40+ historical completed tasks (March–June 2026)
- `docs/archive/HANDOFF_ARCHIVE.md` created — 2,587 lines of prior session entries
- PRIORITIES.md trimmed to last 10 completed tasks
- HANDOFF_SUMMARY.md trimmed to last 10 session entries
- Haiku agent verified all 4 files correct before commit

---

## June 13, 2026 - Decimal Rounding + Documentation Cleanup

**Status:** ✅ COMPLETE | Commits: `ffbf919` → `4c6d895` → `483443e` | Staging: pushed

### Decimal Rounding (27 changes, `live.html`)
- All `toFixed(1)` → `toFixed(0)` on user-visible values dashboard-wide
- Kept: `m.mult.toFixed(2)×` (game score multiplier), `m.speed.toFixed(1)` (speed tier), `attemptsPerDefeat.toFixed(1)` (ratio), internal `parseFloat` calcs, CSS width at line 5091
- Plan doc: `docs/Decimal_Rounding_Plan.md`

### Documentation Cleanup
- **6 plan docs archived** → `docs/archive/completed-implementations/`
- **Stale PRIORITIES entries removed** — Phase 5 commit + PR tasks from June 7/April 27
- **`docs/README.md` updated** — v3.0 → v4.3, old GA4 property ID → 525680332, CSV-based → live API
- **ISSUE-003 resolved** — leaderboard rate capped at 100% (`live.html:3855`)
- **Multi-agent audit** — 4 Haiku agents audited all docs, PRIORITIES, HANDOFF, and archive dir
- **PRIORITIES + HANDOFF restructured** — last 10 entries kept active, older entries → `docs/archive/`

---

## June 13, 2026 - Returning Players KPI + Docs Update

**Status:** ✅ COMPLETE | Commits: `3afd2c2` (KPI) → `1ce6059` (docs) | Production: pending merge

### Changes
- **KPI value:** Flipped from new user % (26%) → returning user % (74%) (`live.html:3641`)
- **KPI label:** `New vs Returning` → `Returning Players` (`live.html:1651`)
- **KPI sub-text placeholder:** `% first-time players` → `% returning sessions` (`live.html:1653`)
- **Sub-text colors:** returning = green, new = yellow (was reversed) (`live.html:4707`)
- **Data Dictionary:** Title, formula, and "Good value" updated to match (`live.html:2246–2251`)
- **Case Study:** Stat updated `75%` → `74%` to match live data (`live.html:2138`)

---

## June 13, 2026 - AI Agent KPI Label Updates

**Status:** ✅ COMPLETE | Commit: `eca8478` | Production: pending merge

### Changes
- **KPI label:** `Avg Tier Adjustments` → `Total Tier Adjustments` (`live.html:1912`)
- **KPI sub-text:** `Per session` → `Since Created` (`live.html:1914`)
- **Why:** The value (28) is a cumulative total since launch, not a per-session average

---

## June 13, 2026 - Back-link Feature Implementation + Bug Fix

**Status:** ✅ COMPLETE | Commits: `5b86f7c` → `daf3a4a` (final)

### What shipped
- `⊞` icons injected into 22 Data Dictionary entries via JS lookup table at page load
- `⊞` icons on 4 Case Study findings (HTML)
- Clicking `⊞` navigates to correct tab, scrolls to element, pulses 5s cyan semi-transparent overlay
- **Bugs fixed:**
  - Glow firing on inner `.kpi-value` div → fixed: `closest('.kpi') || closest('.card') || el`
  - `cs-ab-findings` pointed to wrong tab → fixed to `funnel-table` on Funnel tab
  - `@keyframes card-glow` → `background-color` cyan overlay (`rgba(0,255,255,0.18)`)
  - A/B case study stat updated `+21pp` → `+23pp`

---

## June 13, 2026 - Back-link Feature Planning

**Status:** 📋 PLAN COMPLETE — superseded by implementation above

### Key Design Decisions
- **Icon:** `⊞` (U+229E) — stored as constant for easy sitewide changes
- **Icon injection:** JS-driven at page load from lookup table — avoids 40+ HTML edits
- **Glow color:** Reads element's existing color class, defaults to cyan
- **Chart targets:** Glow fires on `.card` wrapper, not `<canvas>`
- **Coverage:** 22 Data Dictionary entries + 4 Case Study findings

---

## June 13, 2026 - Tier 3 Tooltips + Highlight Flash (Final)

**Status:** ✅ COMPLETE | Final commit: `b7975ba`

### What Was Built
- Tier 3 Case Study ⓘ icons — 4 elements linking to Case Study Key Findings
- Case Study `id` anchors added to 4 `.case-study-finding` divs
- `@keyframes cs-flash` — pulsing yellow `#FFD700`, 5s, 2 pulses. Shared by `.cs-highlight` and `.dict-highlight`
- **Bug fixed:** Avg Tier Adjustments `data-dict` was `"death-triggers"` → corrected to `"avg-adjustments"`
- `void el.offsetWidth` reflow trick restarts animation on repeated clicks

---

## June 13, 2026 - KPI Tooltips + Bug Fixes (Final)

**Status:** ✅ COMPLETE | Final commit: `f7043d0`

### Bug Fixes Applied
1. Overflow clipping — CSS `::after` clipped by `.kpi { overflow: hidden }` → floating `<div id="kpi-tooltip">` using `position: fixed`
2. Tooltip width — `max-width: 240px` → `140px`
3. Icon opacity — `var(--cyan-dim)` 55% → `var(--cyan)` 85%
4. Icon character — `ℹ` → `ⓘ` (U+24D8) across all 16 spans
5. Accordion not opening — fixed to traverse anchor's parent `.dict-body`, call `toggleDict()` on section
6. Accordion scroll timing — `scrollIntoView` wrapped in `setTimeout(150ms)`
7. Icon size — `0.68rem` → `0.8rem`

---

