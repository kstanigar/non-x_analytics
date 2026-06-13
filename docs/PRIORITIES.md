# NON-X Analytics - Priorities

**Purpose:** Source of truth for all project tasks. Documents what needs to be done (Pending) and what has been completed (Completed). Updated when planning tasks and when marking tasks complete.

**Last Updated:** June 13, 2026 (Session 2)

**Agent Instructions:** Cross-reference with HANDOFF_SUMMARY.md to ensure completed tasks are synced.

**Archive:** Completed tasks older than the last 10 are in `docs/archive/PRIORITIES_ARCHIVE.md`

---

## 🎯 PENDING TASKS

---

### MT-5: Tier vs Final Score Chart — BLOCKED

- **Status:** Waiting on game-side changes in Xenon_3
- **Estimate:** 1–2 hours (once game change ships)
- **Blocked by:** Game needs to add `final_score` as event param on `player_won` → register as GA4 custom dim
- **No BigQuery needed** — standard Lambda query once dim is registered. Cost: $0
- **Dashboard wiring:** Replace placeholder chart with `customEvent:final_score` × `customEvent:new_tier` scatter or bar

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

### 1. Game Links ✅ — June 13, 2026
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

### 3. Documentation Restructure ✅ — June 13, 2026
- **Commit:** `de71d11`
- PRIORITIES + HANDOFF trimmed to last 10 entries each; older entries → `docs/archive/`
- `docs/archive/PRIORITIES_ARCHIVE.md` created (40+ historical tasks, March–June 2026)
- `docs/archive/HANDOFF_ARCHIVE.md` created (2,587 lines of prior session entries)

### 4. Documentation Cleanup ✅ — June 13, 2026
- **Commits:** `ffbf919` → `4c6d895` → `483443e`
- 6 completed plan docs archived to `docs/archive/completed-implementations/`
- Stale PRIORITIES entries removed; `docs/README.md` updated to v4.3
- ISSUE-003 resolved — leaderboard rate capped at 100% (`live.html:3855`)
- 27 decimal rounding changes (`toFixed(1)` → `toFixed(0)`) across `live.html`

### 5. Returning Players KPI + Docs Alignment ✅ — June 13, 2026
- **Commits:** `3afd2c2` → `1ce6059`
- KPI flipped from new user % (26%) → returning user % (74%)
- Label → "Returning Players"; sub-text colors swapped (returning=green, new=yellow)
- Data Dictionary + Case Study updated to match

### 6. AI Agent KPI Label Updates ✅ — June 13, 2026
- **Commit:** `eca8478`
- `Avg Tier Adjustments` → `Total Tier Adjustments`; `Per session` → `Since Created`

### 7. Back-link Feature ✅ — June 13, 2026
- **Final commit:** `daf3a4a`
- `⊞` icons on 22 Data Dictionary entries (JS-injected) + 4 Case Study findings (HTML)
- Clicking navigates to correct tab, scrolls, pulses 5s cyan overlay
- 4 bugs fixed (glow inner div, wrong tab, box-shadow → background, A/B stat)

### 8. KPI Tooltips — Hybrid Approach ✅ — June 13, 2026
- **Final commit:** `b7975ba`
- Tier 1: JS floating tooltip (5 KPI tiles + 17 chart card-titles)
- Tier 2: ℹ icon → Data Dictionary accordion (16 KPI labels)
- Tier 3: ℹ icon → Case Study Key Findings (4 elements)
- 7 bugs fixed across tooltip implementation

### 9. BigQuery Integration ✅ — June 12/13, 2026
- **Commit:** `ecbdcd2`
- Avg Start Tier + Avg Final Tier KPIs live from BigQuery
- `@google-cloud/bigquery@8.3.1` added to Lambda; 24h in-memory cache; 500MB safety cap
- Dataset: `analytics_525680032`

### 10. API Gateway Response Caching ✅ — June 12, 2026
- 0.5 GB cache, 300s TTL, all 4 query params declared as cache keys
- Daily quota raised 1,000 → 10,000 req/day
- Cache hits verified via CloudWatch CacheHitCount

---

## 📁 ARCHIVE

Older completed tasks (Phase 6A/6B/6C/6D, Phase 5, Phase 4, April/March 2026 work) are in:
`docs/archive/PRIORITIES_ARCHIVE.md`

---

## 📊 STATISTICS

**Pending:** 2 tasks (1 blocked, 1 backlog)
**Completed (active doc):** 10
**Completion Rate (June 2026):** 40+ tasks completed total
**Dashboard:** ~88% live data

---

## 🔄 SYNC NOTES

**Last Sync with HANDOFF_SUMMARY.md:** June 13, 2026 (Session 2)
**Sync Status:** ✅ In sync
