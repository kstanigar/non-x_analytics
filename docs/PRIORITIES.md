# NON-X Analytics - Priorities

**Purpose:** Source of truth for all project tasks. Documents what needs to be done (Pending) and what has been completed (Completed). Updated when planning tasks and when marking tasks complete.

**Last Updated:** June 24, 2026 (Session 4)

**Agent Instructions:** Cross-reference with HANDOFF_SUMMARY.md to ensure completed tasks are synced.

**Archive:** Completed tasks older than the last 10 are in `docs/archive/PRIORITIES_ARCHIVE.md`

---

## 🎯 PENDING TASKS

---

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

### P-5: Full Security Audit — PENDING
- Review current security posture post-refactor
- Check: CORS config, input validation, API Gateway settings, SRI hashes, error message exposure
- Prior audit: `bc59894` (June 11, 2026) — re-audit after parallel fetch refactor + quota change
- Output: updated `Issues_And_Bugs.md` entries + any fixes

---

### MT-6: BigQuery Future Metrics — BACKLOG

- **Full plan:** `docs/BigQuery_Future_Metrics.md`
- **Priority order (when revisited):**
  1. **Tier Delta** — `avg(final_tier - start_tier)` per session; low effort
  2. **Sessions per User** — `COUNT(DISTINCT ga_session_id) per user_pseudo_id`; single KPI tile
  3. **Win Rate by Starting Tier** — join `player_won` with first `ai_difficulty_adjusted` per session
  4. **AI Adjustment Distribution** — histogram of adjustment count per session
  5. **Exact Funnel Completion** — session-deduped funnel rates
  6. **Player Engagement Span** — days between first + last session per user
  7. **User Cohort Retention** — week-over-week retention curve; largest effort, highest strategic value
- **Dataset:** `analytics_525680032` | **Cache:** 24h TTL | **Cap:** 500MB maxBytesBilled
- **Dependencies:** None — BigQuery integration is already live ✅

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
