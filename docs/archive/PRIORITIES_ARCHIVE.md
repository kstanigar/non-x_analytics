# NON-X Analytics - Priorities Archive

**Purpose:** Historical record of completed tasks moved from PRIORITIES.md on June 13, 2026.
**Active doc:** `docs/PRIORITIES.md` (last 10 completed tasks only)

---

## Completed: June 13, 2026

- [x] **Case Study Page** ✅ — Commit: `daf9a12` | Tab 6, two-column layout | Security section removed
- [x] **Data Dictionary Page** ✅ — Commits: `d6f4346`, `0ba60c9`, `0e8c307` | Tab 7, 10 accordion sections | All `id="dict-[metric]"` anchors live
- [x] **KPI Tooltips — Hybrid Approach** ✅ — 10 commits (`6f5aaab` → `b7975ba`) | Tier 1 JS floating tooltip + Tier 2 ℹ→Dict + Tier 3 ℹ→Case Study
- [x] **Back-link Feature** ✅ — Final: `daf3a4a` | 22 Dict entries + 4 Case Study findings
- [x] **AI Agent KPI Label Updates** ✅ — `eca8478` | `Avg Tier Adjustments` → `Total Tier Adjustments`
- [x] **Returning Players KPI + Docs Alignment** ✅ — `3afd2c2` → `1ce6059`

---

## Completed: June 12, 2026

- [x] **BigQuery Integration** ✅ — Commit: `ecbdcd2` | Avg Start/Final Tier KPIs live | Dataset: `analytics_525680032`
- [x] **API Gateway Response Caching** ✅ — 0.5 GB, 300s TTL, 4 cache key params, quota raised to 10,000/day
- [x] **Dashboard Styling + Text Fixes** ✅ — Commit: `5c90a98` | 5 targeted edits

---

## Completed: June 11, 2026

- [x] **Remove Quad Shot from Powerup Chart** ✅ — 8 targeted changes, chart shows Health/Double Laser/Shield only
- [x] **Wire Statistical Significance Table to Live Sessions** ✅ — `live.html:4759–4778`; both rows show `⚠ Insufficient`
- [x] **Replace Tier vs Final Score Chart → Session Outcome Breakdown** ✅ — Stacked bar (Win/Death/Abandoned per day)
- [x] **Final Security Audit** ✅ — Commit: `bc59894` | Generic error, ALLOWED_ORIGIN, input validation, 27 console.log removals, SRI hash
- [x] **Deploy to AWS Standing Tiger Account + GitHub Pages CI/CD** ✅ — Staging + production branches live; Lambda + API Gateway deployed
- [x] **Data Completeness Banner** ✅ — `#completeness-banner` shown when completeness < 80%
- [x] **Dashboard Polish — June 11, 2026** ✅ — Player Behavior sub-text counts, default range → alltime-43, stale banners removed
- [x] **BigQuery Pre-Requisites** ✅ — GA4 export linked, `dashboard-reader` service account configured, Lambda env vars set
- [x] **New Engagement Metrics — 6 KPIs** ✅ — `engagement-events` Lambda endpoint; Player Behavior row on Overview
- [x] **Investigate ISSUE-002: Missing Outcome Events** ✅ — Not a bug; test/dev data pollution
- [x] **Add Data Completeness Warning** ✅ — `console.warn` at `live.html:~3197`
- [x] **Investigate Leaderboard Event Name** ✅ — `leaderboard_submit` confirmed correct; already live

---

## Completed: June 10, 2026

- [x] **Phase 7 Quick Wins (QW1–5)** ✅ — Commit: `a8abd58` | Device Mix, Boss Platform Funnel, Death Triggers, Speed Lock Rate, Score Multiplier
- [x] **MT-1: Avg Survival KPI** ✅ — Format changed to minutes; wired from survival-time parser
- [x] **MT-2: New User % KPI** ✅ — New `new-user-pct` Lambda handler; 25% live; colored counts
- [x] **MT-3: Avg Level KPI** ✅ — Commit: `ee8c790` | Weighted avg from `player_death` events; Overview + Platform tab
- [x] **MT-4: Replay Rate KPI** ✅ — New `replay-rate` Lambda handler; 7% live (8/112 starts)
- [x] **LT-1: Game Funnel** ✅ — 8-stage funnel live from boss-analysis; dynamic `buildFunnelTable()`
- [x] **LT-2: Music A/B Test** ✅ — `music-ab` Lambda; Group B (Music OFF) wins 44% vs 23%
- [x] **LT-2b: Music Funnel Table** ✅ — `music-funnel` Lambda; Conversion Rates Table fully live
- [x] **LT-3: Movement A/B Test** ✅ — `movement-ab` Lambda; A=Horizontal 19 sessions, B=Full Direction 93 sessions
- [x] **Phase 6D Task 4: AI Agent Deep Dive Endpoint** ✅ — `ai-analysis` Lambda; Tier Distribution + Flow chart live; 28 adjustments
- [x] **AbortSignal.timeout() Cleanup** ✅ — All 6 fetch functions updated to Baseline 2024 pattern
- [x] **Phase 6C Task 3: Phase/Level Progression Endpoint** ✅ — Wave Drop-off chart live; platform toggle unlocked
- [x] **API Security Issue - Phase 2** ✅ — Confirmed correct stack: Usage Plan + TLS + CORS (no API key in browser)
- [x] **Investigate Unpopulated AI Agent Charts + Dashboard Audit** ✅ — Output: `Master_Data_Points_Map.md`

---

## Completed: June 9, 2026

- [x] **Phase 6B Task 1: Survival Time Endpoint** ✅ — 8-bucket distribution; Desktop 3:34, Mobile 6:35
- [x] **Phase 6B Task 2: Powerup Analysis Endpoint** ✅ — `powerup_type × phase × eventName × deviceCategory`; chart 100% live
- [x] **Phase 6A Task 5: Platform Splits Endpoint** ✅ — 3 platform KPIs + funnel chart + table live
- [x] **Phase 6A Task 5B: Combined Version + Date Range Selector** ✅ — 7 selector options; `dateRange` param added to all API calls
- [x] **Phase 6A Task 6: Daily Timeseries Endpoint** ✅ — Daily Plays & Wins chart live
- [x] **Phase 6A Task 7: Boss Analysis Endpoint** ✅ — Boss Analysis page 100% live (3 cards, 2 charts, 1 table)

---

## Completed: June 8, 2026

- [x] **Phase 6A Research & Planning** ✅ — 29 min, 5 docs (2,225 lines); Haiku agent research
- [x] **CRITICAL: Fix API Security Issue - Phase 1 (Remove API Key)** ✅ — Removed hardcoded key; rate limiting only
- [x] **Verify Event Names in GA4 DebugView** ✅ — All events confirmed correct
- [x] **Revert ISSUE-004: Incorrect Event Mapping Fix** ✅ — `game_complete` reverted to `player_won`
- [x] **Fix ISSUE-005: Powerup Phase Data Correction** ✅ — Quad Shot set to 0 for Green/Red phases
- [x] **Fix ISSUE-001: Death Rate Formula Bug** ✅ — `gameStarts` → `completedGames` denominator
- [x] **Create Issues_And_Bugs.md Tracker** ✅ — Centralized issue tracking with severity levels
- [x] **Add Live/Mock Data Labels** ❌ SKIPPED — Temporary work; went straight to Phase 6

---

## Completed: April 27, 2026

- [x] **Remove Duplicate A/B Test Charts** ✅ — `chartABWinRate()` + `chartABSurvival()` removed (47 lines)
- [x] **Add Version Selector Dropdown to Dashboard** ✅ — CSS, HTML, JS; All/v4.3/v4.2 options
- [x] **Add Analytics Version Filtering to Lambda** ✅ — `analytics_version` dimension filter; `?version=4.3` or `?version=all`
- [x] **Change Dashboard Auto-Refresh Rate** ✅ — 5 min → 1 hour; 92% reduction in API calls

---

## Completed: April 26, 2026

- [x] **Complete Phase 4: Live Dashboard with API Integration** ✅ — Auto-refresh, manual refresh, error handling, live GA4 data
- [x] **Deploy Lambda Function to AWS** ✅ — `non-x-analytics-api`, us-east-2, 256 MB, ~200ms avg response

---

## Completed: March 10, 2026

- [x] **Configure AWS API Gateway** ✅ — `/prod/analytics`, CORS enabled, rate limiting (10 req/s, 1,000 req/day), TLS 1.3
