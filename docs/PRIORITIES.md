# NON-X Analytics - Priorities

**Purpose:** Source of truth for all project tasks. Documents what needs to be done (Pending) and what has been completed (Completed). Updated when planning tasks and when marking tasks complete.

**Last Updated:** July 3, 2026 (Session 26 — L-1 Google Fonts @import → link complete)

**Agent Instructions:** Cross-reference with HANDOFF_SUMMARY.md to ensure completed tasks are synced.

**Archive:** Completed tasks older than the last 10 are in `docs/archive/PRIORITIES_ARCHIVE.md`

---

## 🎯 PENDING TASKS

---

### 🔴 XEN-1: Leaderboard Privacy Disclosure — ⬜ IMPLEMENTATION PENDING (Xenon_3 repo)

**Plan complete** — `docs/XEN-1_Privacy_Disclosure_Plan.md` — 17 changes, GDPR/COPPA/CCPA verified
**Plan also copied to:** `Xenon_3/docs/XEN-1_Privacy_Disclosure_Plan.md` — July 2, 2026

**Implementation deferred** — will be implemented during a dedicated Xenon_3 session.

**Status per repo:**
- Xenon_3 — Changes 1–13b: ⬜ Pending
- non-x_analytics — Changes 14–17: ⬜ Pending

**Key decisions confirmed:**
- Banner: 3 independent checkboxes (analytics, leaderboard, age) + Confirm button
- Consent logged to Firestore `consent_log` collection (GDPR Article 30)
- Existing 27 entries purged ✅ DONE — July 2, 2026 (no grandfathering)
- Analytics toggle confirmed at `index.html:573–579` — preserved after XEN-1; Change 13b updates Section 3 description only

---

### 🟡 PRIORITY 2 — Outstanding Tasks (Backlog)

*All items below are unblocked or waiting on P1 clarification only where noted.*

**Security:**
- L-1: Google Fonts `@import` → `<link>` tag — ✅ COMPLETE July 3, 2026 — commit `0192f83`
- JS extraction to `dashboard.js` (L-1 complete — now unblocked)
- CSP drop `'unsafe-inline'` (blocked by JS extraction)
- Cloudflare proxy / M-5 `frame-ancestors`
- H-4: AWS WAF (post-launch trigger: bot patterns in CloudWatch)

**GA4 Admin:**
- Register `outcome` custom dimension in GA4 Admin → values: `victory` / `abandoned` / `death`

**BigQuery / MT-6:**
- MT-6 #1: Movement A/B Win Rate — ✅ COMPLETE (live data confirmed, 0% both groups)
- MT-6 #2: Tier Delta
- MT-6 #3: Sessions per User
- MT-6 #4: Win Rate by Starting Tier
- MT-6 #5: AI Adjustment Distribution
- MT-6 #6: Exact Funnel Completion
- MT-6 #7: Player Engagement Span
- MT-6 #8: User Cohort Retention

**Dashboard UX:**
- UX-6: Distinct Players KPI (BigQuery handler + tile)
- UX-7: Player Performance page (unblocked — `user_pseudo_id` confirmed available)
- UX-8: Leaderboard tab — **✅ COMPLETE + MERGED** — June 30, 2026
  - ✅ UX-8a: Single-column fix — 2-column grid → single vertical list (ranks 1–50); commit `1f8e9b1` — July 2, 2026
  - ✅ UX-8b: CSP connect-src — researched gstatic.com addition; reverted per OWASP least-privilege. Original CSP is correct. `.map` errors are dev-tool noise only — July 2, 2026
- UX-9: Traffic Source widget — query `sessionSource` + `sessionDefaultChannelGroup` via GA4 Data API; surface on Overview or new tab. No Xenon_3 changes needed — data already collected. (P1-C resolution — June 30, 2026)
- UX-10: Player profile linking — **⏸️ SHELVED** — privacy/legal lift too high at this stage. Full analysis in `docs/Player_Data_Privacy_Plan.md`. Revisit post-launch if needed.
- Tier Performance Metrics: `DATA.aiAgent.tierMetrics` never populated — decision needed: BigQuery handler vs CSV approach

**Xenon_3:**
- XEN-1: ✅ PLAN COMPLETE — implementation deferred to Xenon_3 repo. **Full plan:** `docs/XEN-1_Privacy_Disclosure_Plan.md` — 17 changes, GDPR/COPPA/CCPA verified — July 2, 2026

---

### ISSUE-010: Firebase API Key Security ✅ — July 3, 2026
- Firestore rules: `request.app.token.valid` on all writes + full field validation (deployed June 23)
- API key restricted to 4 domains: localhost, nonx.standingtiger.com, dev.nonx.standingtiger.com, kstanigar.github.io
- GitHub Secret Scanning alert dismissed as "False positive"
- `docs/Firebase_Config.md` created as permanent Firebase reference
- **Commit:** `a9814d2`

### P-1: Add Favicon ✅ — June 24, 2026
- **Commit:** `feature/favicon-and-logo` → merged to main
- `st_760.png` linked as `<link rel="icon">` + `<link rel="apple-touch-icon">` in `<head>`
- Deploy workflows updated to copy `images/` directory

### P-2: Add Logo Branding ✅ — June 24, 2026
- **Commit:** `feature/favicon-and-logo` → merged to main
- Logo moved to footer (32px circular, links to standingtiger.com)
- Removed from header; header restored to plain `<h1>NON-X</h1>`

### P-3: Terms & Privacy Pages ✅ — June 24, 2026
- **Commit:** `feature/favicon-and-logo` → merged to main
- `terms.html` + `privacy.html` created — dark theme matching dashboard
- Contact: `contact@standingtiger.com` (swap for real mailbox when ready)
- Deploy workflows updated to copy both files

### P-4: Add Copyright ✅ — June 24, 2026
- **Commit:** `feature/favicon-and-logo` → merged to main
- `© 2026 Standing Tiger. All rights reserved.` in `.site-footer`
- Footer: logo · copyright · Terms · Privacy

### P-0: Lambda Concurrency Fix ✅ — June 24, 2026

- **Commit:** `381123d` | Production: ✅ live
- **Root cause:** Account-level Lambda concurrency limit is 10 (applied); 17 simultaneous requests throttled 7 endpoints → 500
- **Fix:** Split into two sub-waves of 8 + 9 — stays under concurrency limit
- **Result:** All sections load with live data; load time significantly reduced vs. sequential
- **Note:** If AWS quota increase to 50 is ever approved, can revert to single-wave `Promise.allSettled` for max speed

### P-5: Full Security Audit — ✅ ALL PRE-LAUNCH ITEMS COMPLETE (Session 19)
- **Audit complete** — 13 findings (1 critical, 4 high, 5 medium, 3 low)
- **Full plan + task list:** `docs/Security_Audit_P5.md`
- **Phase A: C-1 ✅ COMPLETE** — `api/package.json` pinned to `6.1.0`; `npm audit` = 0 vulnerabilities
- **Phase B: H-1 + M-1 ✅ COMPLETE** — method validation + security headers + Permissions-Policy
- **Phase C: Tasks 8–14 ✅ ON MAIN** — smoke test passed June 28, 2026; merged to main commit `16a1947`
- **GA4 fixes on Xenon_3:** `death_phase` + `is_replay` — DebugView verified ✅ — merged to Xenon_3 main via PR #156 — June 29, 2026 ✅
- **H-3 ✅ COMPLETE** — `escHtml()` on all 22 API-sourced innerHTML values — commit `92177fd` — June 28, 2026
- **H-2 ✅ COMPLETE** — CSP meta tag in `live.html` — 9 directives, connect-src locked to API Gateway — commit `32c1bb0` — June 28, 2026
- **AWS Cleanup Tasks (Session 16/17):** `docs/AWS_Cleanup_Plan.md` — ✅ ALL 3 COMPLETE
  - ✅ API Gateway access logs ARN fixed + log format saved — June 28, 2026
  - ✅ AWS Budget `analytics-dashboard-monthly` created — $0.50, 50%+100% actual thresholds — June 28, 2026
  - ✅ API Gateway prod stage description updated — June 28, 2026
- **M-4 ✅ COMPLETE** — `function.zip` already untracked; `git ls-files` returns empty — verified June 28, 2026
- **H-4 ⏸️ DEFERRED POST-LAUNCH** — AWS WAF plan fully documented in `docs/Security_Audit_P5.md`; risk accepted at current traffic volume (~39 req/day); revisit after affiliate blog drives real traffic — June 29, 2026
- **Post-launch security backlog (June 30, 2026 audit status):**
  - **L-1:** Google Fonts still `@import` at `live.html:35` → ❌ P2 — needs `<link>` tag
  - **L-2:** `@google-analytics/data` pinned to `"6.1.0"` (exact) → ✅ DONE
  - **M-3:** Both GitHub Actions workflows have explicit `permissions: contents: write` blocks → ✅ ADDRESSED (no further tightening identified as needed)
  - **JS extraction to `dashboard.js`:** File does not exist; ~3,365 lines inline → ❌ P2 (large effort; blocked by L-1 first)
  - **CSP drop `unsafe-inline`:** `script-src 'self' 'unsafe-inline'` still present → ❌ P2 (blocked by JS extraction)
  - **Cloudflare proxy / `frame-ancestors` (M-5):** Not started → ❌ P2
- **Last Updated:** June 30, 2026 (Session 21 — L-2 + M-3 confirmed done; remaining items status updated)

---

### GA4-DOC: GA4 Event Schema Documentation — ✅ 17/17 COMPLETE (Session 20)

- **Full doc:** `docs/GA4_Custom_Dimensions.md`
- **Completed (17):** `player_death`, `game_start`, `game_complete`, `menu_view`, `play_clicked`, `session_start`, `first_visit`, `returning_user`, `wave_reached`, `boss_attempt`, `boss_defeated`, `powerup_collected`, `ai_difficulty_adjusted`, `leave_game`, `play_again`, `player_won`, `survey_submitted`
- **`player_won` + `survey_submitted` documented via BigQuery historical query — June 29, 2026 ✅**
- **`Xenon_3/docs/GA4_Event_Schema.md` — ✅ ALREADY EXISTS** (confirmed June 30, 2026 — no action needed)
- **Action items from documentation:**
  - `outcome` on `game_complete` — confirmed sending values `victory` / `abandoned` / `death` (June 30, 2026 Xenon_3 audit); still needs GA4 Admin registration to be queryable via API → **P2 task**
  - `referrer` on `menu_view` — ⚠️ MOOT: `menu_view` event not found in Xenon_3 source (no `fireEvent('menu_view')` call in game.html or game_mobile.html) → **P1 clarification needed** (Xenon_3 gap or intentional?)
  - `user_engagement` + `scroll` — GA4 auto events available for Avg Session Duration + scroll depth metrics today
- **`instagram_provided` + `rank` on `survey_submitted` — ✅ CONFIRMED NOT PRESENT** (code confirmed: only sent on `leaderboard_submit`, not `survey_submitted`; BigQuery findings correct)

---

### UX-1 through UX-5: QA Feedback + UX Improvements — PENDING

**Full plan:** `docs/QA_Feedback_UX_Plan.md`

**Priority order (next session):**
1. **UX-0: Hamburger menu color styling** ✅ — `9aee2ed`, live
2. **UX-2: White card + section titles** ✅ — `84e6ccc`, live
3. **UX-4: `⊞` → "View" label** ✅ — `ec33b20`, live
4. **UX-1: Rename metrics for player clarity** ✅ — `4c91766`, live
5. **UX-3: Clickable KPI cards + section-level tooltips** ✅ — `eac7416`, live
6. **UX-3b: Remove individual card hover tooltips** ✅ — `2187025`, live
7. **UX-5: Simplify Data Dictionary** ✅ — `dc40d80`, live

**Prerequisites status (June 30, 2026 audit):**
- `user_pseudo_id` on `player_won` — ✅ CONFIRMED available (`api/index.js:454` tier-score query already selects it) — UX-7 unblocked
- Leaderboard API for UX-8 — ⚠️ DOES NOT EXIST: no handler in `api/index.js`; QA plan note "already exists in Lambda" is outdated — needs to be built from scratch; format decision needed → **P1 clarification needed**

---

### UX-6 through UX-8: Player Metrics Expansion — BACKLOG

**Full plan:** `docs/QA_Feedback_UX_Plan.md`
- **UX-6: Distinct Players KPI** — implement during MT-6 BigQuery session
- **UX-7: Player Performance page** — after UX-6 + data verification
- **UX-8: Leaderboard tab** — after confirming leaderboard API format

---

### MT-6: BigQuery Future Metrics — BACKLOG

- **Full plan:** `docs/BigQuery_Future_Metrics.md`
- **Dataset:** `analytics_525680032` | **Cache:** 24h TTL | **Cap:** 500MB maxBytesBilled
- **Dependencies:** None — BigQuery integration is already live ✅

**June 30, 2026 audit findings:**

| # | Metric | Status | Notes |
|---|--------|--------|-------|
| 1 | Movement A/B Win Rate | ✅ COMPLETE | Live data confirmed on dashboard (0% both groups — low sample); mock badge removed from Data Dict `live.html:2932` — June 30, 2026 |
| 2 | Tier Delta | ❌ P2 | Not implemented; avg/final tier exist separately |
| 3 | Sessions per User | ❌ P2 | Not implemented |
| 4 | Win Rate by Starting Tier | ❌ P2 | Not implemented |
| 5 | AI Adjustment Distribution | ❌ P2 | Not implemented |
| 6 | Exact Funnel Completion | ❌ P2 | Not implemented |
| 7 | Player Engagement Span | ❌ P2 | Not implemented |
| 8 | User Cohort Retention | ❌ P2 | Not implemented; highest value, most effort |

---

## ✅ COMPLETED TASKS (last 10)

---

### 0. Parallel Fetch Refactor ✅ — June 24, 2026
- **Commit:** `8746a86` | Production: ✅ live
- **Plan doc:** `docs/Parallel_Fetch_Refactor_Plan.md`
- Replaced 17 sequential/partial-parallel fetches with single `Promise.allSettled()`
- All 17 fetches fire simultaneously; mapping in dependency order (GA4 → boss → musicAB → others → progression/engagement/musicFunnel)
- API Gateway throttle raised: 10 req/s → 20 req/s (AWS console)
- Expected load time: 15–20s → 2–4s; future metrics add zero additional load time

### 1. Tier vs Final Score Scatter Chart (MT-5) ✅ — June 24, 2026
- **Plan doc:** `docs/archive/completed-implementations/MT5_Tier_Score_Chart_Plan.md`
- Scatter chart on AI Agent tab — X: final score, Y: AI tier, color-coded per tier
- BigQuery Option B join query — `player_won` joined with last `ai_difficulty_adjusted` per session
- `api/index.js`: `tier-score` added to `VALID_SUBTYPES`; `tierScoreCache` var; full BigQuery handler
- `live.html`: chart card HTML + `fetchTierScoreData()` + `chartTierScore()` + `reinitAllCharts()` hook
- BUG-001 fixed: `ga_session_id` extracted from `event_params` (not top-level column)
- Lambda deployed ✅ | Endpoint verified: `{ "points": [{"x":3432,"y":2},{"x":6586,"y":2}] }` ✅

### 3. Game Links ✅ — June 13, 2026
- **Commit:** `66fc1fe` | Production: ✅ live
- "NON-X" heading → anchor link to `https://nonx.standingtiger.com/` (opens new tab)
- Case Study "About the Project" → `▶ Play NON-X` CTA button (`.play-btn` class)
- CSS: `.logo-block h1 a` hover opacity + `.play-btn` styled to match `.refresh-btn`

### 2. Hamburger Menu at 900px ✅ — June 13, 2026
- **Commit:** `5b777a5` | Production: ✅ live
- Extended hamburger menu breakpoint from 479px → 900px
- `@media (max-width: 479px)` → `(max-width: 900px)` at line 1052
- `@media (min-width: 480px)` → `(min-width: 901px)` at line 1348
- No JS changes needed — existing `toggleMobileMenu()` / `switchTab()` functions work as-is

### 4. Documentation Restructure ✅ — June 13, 2026
- **Commit:** `de71d11`
- PRIORITIES + HANDOFF trimmed to last 10 entries each; older entries → `docs/archive/`
- `docs/archive/PRIORITIES_ARCHIVE.md` created (40+ historical tasks, March–June 2026)
- `docs/archive/HANDOFF_ARCHIVE.md` created (2,587 lines of prior session entries)

### 5. Documentation Cleanup ✅ — June 13, 2026
- **Commits:** `ffbf919` → `4c6d895` → `483443e`
- 6 completed plan docs archived to `docs/archive/completed-implementations/`
- Stale PRIORITIES entries removed; `docs/README.md` updated to v4.3
- ISSUE-003 resolved — leaderboard rate capped at 100% (`live.html:3855`)
- 27 decimal rounding changes (`toFixed(1)` → `toFixed(0)`) across `live.html`

### 6. Returning Players KPI + Docs Alignment ✅ — June 13, 2026
- **Commits:** `3afd2c2` → `1ce6059`
- KPI flipped from new user % (26%) → returning user % (74%)
- Label → "Returning Players"; sub-text colors swapped (returning=green, new=yellow)
- Data Dictionary + Case Study updated to match

### 7. AI Agent KPI Label Updates ✅ — June 13, 2026
- **Commit:** `eca8478`
- `Avg Tier Adjustments` → `Total Tier Adjustments`; `Per session` → `Since Created`

### 8. Back-link Feature ✅ — June 13, 2026
- **Final commit:** `daf3a4a`
- `⊞` icons on 22 Data Dictionary entries (JS-injected) + 4 Case Study findings (HTML)
- Clicking navigates to correct tab, scrolls, pulses 5s cyan overlay
- 4 bugs fixed (glow inner div, wrong tab, box-shadow → background, A/B stat)

### 9. KPI Tooltips — Hybrid Approach ✅ — June 13, 2026
- **Final commit:** `b7975ba`
- Tier 1: JS floating tooltip (5 KPI tiles + 17 chart card-titles)
- Tier 2: ℹ icon → Data Dictionary accordion (16 KPI labels)
- Tier 3: ℹ icon → Case Study Key Findings (4 elements)
- 7 bugs fixed across tooltip implementation

### 10. BigQuery Integration ✅ — June 12/13, 2026
- **Commit:** `ecbdcd2`
- Avg Start Tier + Avg Final Tier KPIs live from BigQuery
- `@google-cloud/bigquery@8.3.1` added to Lambda; 24h in-memory cache; 500MB safety cap
- Dataset: `analytics_525680032`

---

## 📁 ARCHIVE

Older completed tasks (Phase 6A/6B/6C/6D, Phase 5, Phase 4, April/March 2026 work) are in:
`docs/archive/PRIORITIES_ARCHIVE.md`

---

## 📊 STATISTICS

**Pending:** 1 task (MT-6 backlog)
**Completed (active doc):** 10
**Completion Rate (June 2026):** 40+ tasks completed total
**Dashboard:** ~90% live data

---

## 🔄 SYNC NOTES

**Last Sync with HANDOFF_SUMMARY.md:** June 24, 2026 (Session 3)
**Sync Status:** ✅ In sync
