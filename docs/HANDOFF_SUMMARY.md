# NON-X Analytics - Handoff Summary

**Purpose:** Living document updated in real-time during each session. Documents all work, research, implementations, and fixes as they happen.

**Last Updated:** June 24, 2026 (Session 4)

**Agent Instructions:** On session start, read the last 4 session entries below and scan for any incomplete tasks across all entries. Cross-reference with PRIORITIES.md to ensure sync.

**Archive:** Entries before June 13 (KPI Tile Bug Fix and earlier) are in `docs/archive/HANDOFF_ARCHIVE.md`

---

## June 24, 2026 - Lambda Concurrency Issue (P-0) — BLOCKED

**Status:** 🟡 BLOCKED — AWS quota increase pending (1–3 business days)

### Problem
Parallel fetch refactor fires 17 simultaneous Lambda requests. Account-level concurrency limit is 10 → 7 endpoints throttled → HTTP 500 → fall back to mock data. Core KPIs (GA4 overview) still load correctly.

### Diagnosis
- CloudWatch confirmed cold-start invocations (Init: ~806ms)
- Lambda Configuration → Concurrency → Unreserved account concurrency: **10**
- 17 simultaneous requests exceed limit by 7 → explains exactly 7 failing endpoints

### Action Taken
- AWS Service Quotas → Lambda → Concurrent executions → increase requested to **50**
- Awaiting approval email (typically 1–3 business days)

### Next Session
1. Check email for quota approval
2. If approved: test staging with single-wave — all 17 should succeed
3. If not approved: implement sub-waves (two `Promise.allSettled` calls of ≤8 each) as fallback

### Fallback Plan (sub-waves)
- Wave A (8): fetchGA4Data, fetchBossAnalysisData, fetchMusicABData, fetchPlatformSplitData, fetchDailyTimeseriesData, fetchSurvivalTimeData, fetchPowerupAnalysisData, fetchAIAnalysisData
- Wave B (9): fetchDeathTriggersData, fetchNewUserPctData, fetchReplayRateData, fetchMovementABData, fetchAvgTierData, fetchTierScoreData, fetchEngagementData, fetchMusicFunnelData, fetchProgressionAnalysisData
- Map Wave A first (populates DATA dependencies), then fire + map Wave B

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

