# NON-X Analytics - Priorities

**Purpose:** Source of truth for all project tasks. Documents what needs to be done (Pending) and what has been completed (Completed). Updated when planning tasks and when marking tasks complete.

**Last Updated:** June 10, 2026

**Agent Instructions:** Cross-reference with HANDOFF_SUMMARY.md to ensure completed tasks are synced. Use hook to auto-move completed tasks from Pending to Completed section.

---

## 🎯 PENDING TASKS

Tasks organized by date added (newest first). Tasks include planning details, inline comments needed, and code changes required.

---

### Added: June 9, 2026 (Phase 6B/6C/6D: Continue Live Data Migration)

**Goal:** Continue getting dashboard to 100% live data using GA4 custom dimensions

**Priority Order (User-Specified):**
1. Phase 6B Task 1: Survival Time Fix (2-3 hours) ⚡ NEXT
2. Phase 6B Task 2: Powerup Analysis Endpoint (4-6 hours)
3. Phase 6C Task 3: Phase/Level Progression Endpoint (4-6 hours)
4. Phase 6D Task 4: AI Agent Deep Dive Endpoint (6-8 hours)

- [x] **Phase 6B Task 1: Survival Time Endpoint** ✅ COMPLETE
  - **Estimate:** 2-3 hours
  - **Time Invested:** ~2.5 hours (June 9, 2026)
  - **Completed:** June 9, 2026
  - **Impact:** HIGH - Fixed chart, added live survival metrics
  - **Complexity:** MEDIUM
  - **What:** Added session_duration_seconds dimension query with 8-bucket distribution
  - **Made Live:**
    - Survival Time Distribution chart (8 buckets: 0-0.5m, 0.5-1m, 1-2m, 2-3m, 3-4m, 4-6m, 6-8m, 8+m) ✅
    - Avg Survival Time by platform (Desktop: 3:34, Mobile: 6:35) ✅
    - Platform comparison table survival times ✅
  - **Custom Dimension:** `customEvent:session_duration_seconds`
  - **Query Structure:** deviceCategory × session_duration_seconds × eventName
  - **Files Modified:**
    - `api/index.js` - Survival-time handler (lines 104-124, +21 lines)
    - `live.html` - Parser, fetch, integration, chart (lines 2633-2719, 2348-2355, 3016-3061, 3204-3229, +188 lines)
  - **Result:** Chart shows live GA4 data with 8-bucket granular distribution
  - **Key Finding:** Mobile players survive 2x longer than desktop (6:35 vs 3:34 avg)
  - **Endpoint:** `?type=standard&subType=survival-time&version=4.3&dateRange=90day`
  - **Testing:** All tests pass ✅ (endpoint, chart, table, selector integration)
  - **Dashboard Progress:** +3 metrics live (47% total, up from 40%)

- [x] **Phase 6B Task 2: Powerup Analysis Endpoint** ✅ COMPLETE
  - **Estimate:** 4-6 hours
  - **Time Invested:** ~5 hours (June 9, 2026)
  - **Completed:** June 9, 2026
  - **Status:** Complete ✅ (Implementation + Testing + Deployment + Documentation)
  - **Impact:** MEDIUM - Makes powerup metrics live
  - **Complexity:** MEDIUM
  - **What:** Add powerup_type × phase dimension query
  - **Makes Live:**
    - Powerup Collection chart (currently mock) - Code ready ✅
    - Powerup effectiveness by type (future enhancement)
    - Powerup usage by platform (byPlatform data structure added)
  - **Custom Dimensions:** `customEvent:powerup_type`, `customEvent:phase`
  - **Query Structure:** powerup_type × phase × eventName × deviceCategory
  - **Files Modified:**
    - `api/index.js` - Powerup-analysis handler (lines 125-147, +23 lines) ✅
    - `live.html` - Parser, fetch, integration, chart updates (+158 lines) ✅
      - Lines 2729-2812: Parser in mapGA4ResponseToDATA() (+84 lines)
      - Lines 2296-2305: DATA.powerups initialization with byPlatform (+5 lines)
      - Lines 3147-3204: fetchPowerupAnalysisData() function (+58 lines)
      - Lines 3369-3378: Integration in loadAndRenderGA4Data() (+11 lines)
      - Lines 3607-3611: chartPowerup() with nullish coalescing (modified)
  - **Result:** Powerup chart shows 100% live GA4 data by phase (Green/Red/Purple) ✅
  - **Endpoint:** `https://6waopo3jh1.execute-api.us-east-2.amazonaws.com/prod/analytics?type=standard&subType=powerup-analysis&version=4.3&dateRange=90day`
  - **Testing:** ✅ Complete (80 rows returned, chart displays live data)
  - **Errors Fixed:** ISSUE-006 (CONFIG reference), ISSUE-007 (fetch pattern + variable name)
  - **Key Finding:** Mobile players collect ~5x more powerups than desktop; Quad Shot not being collected
  - **Dashboard Progress After:** ~51% live (23-25 of 44 metrics, +4 from Task 2)
  - **Dependencies:** Phase 6B Task 1 complete ✅

- [x] **Phase 6C Task 3: Phase/Level Progression Endpoint** ✅ COMPLETE
  - **Estimate:** 4-6 hours
  - **Time Invested:** ~3 hours (June 10, 2026)
  - **Completed:** June 10, 2026
  - **Impact:** MEDIUM - Wave Drop-off chart 100% live
  - **Complexity:** MEDIUM-HIGH
  - **What:** Add phase and level_reached dimension queries
  - **Made Live:**
    - Wave Drop-off chart (ALL / DESKTOP / MOBILE toggle) ✅
    - Per-level death distribution (levels 1–12) from real GA4 data ✅
    - Platform split toggle now unlocked (was previously locked on mock data) ✅
  - **Custom Dimensions:** `customEvent:phase`, `customEvent:level_reached`
  - **Query Structure:** phase × level_reached × eventName × deviceCategory
  - **Files Modified:**
    - `api/index.js` - progression-analysis handler (lines 147-168, already written, deployed) ✅
    - `live.html` - Parser, fetch function, integration, DATA comment (~95 lines) ✅
      - Lines 2330-2332: DATA.deathsByLevel comment update
      - Lines 2816-2850: progression-analysis parser in mapGA4ResponseToDATA()
      - Lines 3229-3265: fetchProgressionAnalysisData() function (AbortSignal.timeout())
      - Lines 3455-3472: Integration in loadAndRenderGA4Data()
      - Lines 3787-3791: chartDropoff() boss bar fix (DATA.bossAnalysis → DATA.bosses)
  - **Bug Fixed:** chartDropoff() was reading DATA.bosses (mock) instead of DATA.bossAnalysis (live) for boss death bars
  - **Bug Fixed:** Wave Drop-off toggle showed stale "Load the Deaths CSV" toast — replaced with "No data for this version and date range, select another version and date." and removed blocking return so toggle always works
  - **Endpoint:** `?type=standard&subType=progression-analysis&version=4.3&dateRange=90day`
  - **Testing:** ✅ Complete - chart displays correct live data, platform toggle unlocked
  - **Key Finding:** Death data is sparse but accurate — most deaths occur at early green levels (L1-L4) and Boss 2 (L8)
  - **Dashboard Progress After:** ~55% live (up from ~51%)
  - **Dependencies:** Phase 6B Tasks 1-2 complete ✅

- [x] **AbortSignal.timeout() Cleanup** ✅ COMPLETE
  - **Completed:** June 10, 2026
  - **Time Invested:** ~20 min
  - **Files Modified:** `live.html` (12 edits across 6 functions + 1 stale comment removal)
  - **Functions Updated:** fetchGA4Data, fetchPlatformSplitData, fetchDailyTimeseriesData, fetchBossAnalysisData, fetchSurvivalTimeData, fetchPowerupAnalysisData
  - **Changes:** Removed AbortController + setTimeout + clearTimeout boilerplate; replaced with AbortSignal.timeout(); changed AbortError → TimeoutError in all catch blocks
  - **Result:** All 7 fetch functions (including fetchProgressionAnalysisData) now use consistent Baseline 2024 pattern

- [x] **Phase 6D Task 4: AI Agent Deep Dive Endpoint** ✅ COMPLETE
  - **Estimate:** 6-8 hours
  - **Time Invested:** ~2 hours (June 10, 2026)
  - **Completed:** June 10, 2026
  - **Impact:** HIGH - AI Agent tab now shows live GA4 data
  - **Complexity:** HIGH
  - **What:** Add old_tier × new_tier × direction × eventName × deviceCategory dimension query
  - **Made Live:**
    - AI Tier Distribution chart ✅ (counts by new_tier)
    - Tier Progression/Flow chart ✅ (increases: 25, decreases: 3)
    - avgAdjustments KPI ✅ (28 total adjustments)
  - **Custom Dimensions:** `customEvent:old_tier`, `customEvent:new_tier`, `customEvent:direction`
  - **Query Structure:** old_tier × new_tier × direction × eventName × deviceCategory
  - **Files Modified:**
    - `api/index.js` - ai-analysis handler (lines 169-191, +24 lines) ✅
    - `live.html` - Parser, fetch function, integration (+130 lines) ✅
      - Lines 2854-2896: ai-analysis parser in mapGA4ResponseToDATA()
      - Lines 3290-3325: fetchAIAnalysisData() function
      - Lines 3532-3554: Integration in loadAndRenderGA4Data()
  - **Bug Fixed:** ISSUE-008 — direction strings were 'up'/'down' in parser but GA4 sends 'increase'/'decrease' (live.html:2877-2878)
  - **Endpoint:** `?type=standard&subType=ai-analysis&version=4.3&dateRange=90day`
  - **Testing:** ✅ Complete — 28 adjustments returned, Tier Distribution bars visible, Flow chart shows 25/3 split
  - **Key Finding:** AI mostly increases difficulty (25 increases vs 3 decreases) — players trending harder over time
  - **Dashboard Progress After:** ~60% live (up from ~55%)
  - **Dependencies:** Phase 6C Task 3 complete ✅

**Phase 6 Total Estimate:** 16-23 hours additional (Phase 6A: 16 hours complete ✅)
**Phase 6 End Goal:** Dashboard 90-100% live data (currently ~40% live)

---

### Added: June 8, 2026 (Dashboard Audit - Immediate Actions)

- [x] ~~**Add Live/Mock Data Labels**~~ ❌ SKIPPED
  - **Reason:** Temporary work - labels removed after Phase 6 (all data live)
  - **Decision:** Skip, go straight to Phase 6 Lambda enhancements
  - **Skipped:** June 8, 2026, 7:15 PM

---

### Added: June 11, 2026 (Dashboard Polish)

- [x] **Remove Quad Shot from Powerup Chart** ✅ COMPLETE
  - **Completed:** June 11, 2026
  - **Estimate:** 10 min
  - **Files:** `live.html` only (8 targeted changes)
  - **Result:** Powerup chart shows Health, Double Laser, Shield only — Quad Shot bar removed ✅
  - **Note:** Triple Shot not yet tracked in GA4 — add when game update ships

- [x] **Wire Statistical Significance Table to Live Sessions** ✅ COMPLETE
  - **Completed:** June 11, 2026
  - **Estimate:** 10 min
  - **Files:** `live.html` lines 4759–4778
  - **Result:** Table shows live session counts (Music: 73/40, Movement: 19/94); both rows display `⚠ Insufficient` with "Gather more data" recommendation ✅

- [x] **Replace Tier vs Final Score Chart → Session Outcome Breakdown** ✅ COMPLETE
  - **Estimate:** 15 min
  - **Priority:** MEDIUM — chart currently shows flat line (all zeros); `final_score` dim not tracked in GA4
  - **Decision:** Replace with Session Outcome Breakdown — stacked bar (Win / Death / Abandoned per day)
  - **Why this replacement:** Uses existing `daily-timeseries` data — no new Lambda; `abandoned = game_start - player_won - player_death`
  - **Files:** `live.html` only — 5 changes
  - **Changes (exact):**
    1. Lines 2295–2300 — Add `deaths: [...]` mock array to `DATA.daily`
    2. Lines 2550–2562 — Extract `deaths` (player_death) per day in timeseries parser; add to return object
    3. Lines 1735–1741 — HTML: rename card title, canvas ID (`chart-session-outcome`), chart note
    4. Lines 4992–5015 — Replace `chartAITierScore()` with `chartSessionOutcome()` (stacked bar using `DATA.daily`)
    5. Line 5202 — Update call site from `chartAITierScore()` to `chartSessionOutcome()`
  - **Chart colors:** Wins=MAG, Deaths=RED, Abandoned=YEL (stacked)
  - **Edge case:** `abandoned` clamped to 0 (Math.max) to handle timing edge cases
  - **Dependencies:** None — `DATA.daily` already populated by timeseries fetch

---

### Added: June 10, 2026 (Pre-Launch Checklist)

- [x] **Final Security Audit** ✅ COMPLETE
  - **Completed:** June 11, 2026
  - **Time Invested:** ~1 hour (2 Haiku agents: AWS research + codebase investigation)
  - **Commit:** bc59894
  - **Critical fixes applied:**
    - `error.message` → `'Internal server error'` (no internal details exposed to client)
    - `ALLOWED_ORIGIN` constant added — flip one line at Standing Tiger deploy
    - Input validation whitelist for `type`, `subType`, `dateRange` params (returns 400 for unknowns)
    - 27 `console.log` statements removed from `live.html` (including one that logged the API endpoint URL)
    - SRI integrity hash added to Chart.js CDN script
  - **Clean:** No hardcoded API keys, credentials, or secrets found in source ✅
  - **AWS console actions remaining (user, ~5 min before deploy):**
    - Lambda timeout → 30s
    - CloudWatch log retention → 14 days
    - Update `ALLOWED_ORIGIN` to Standing Tiger domain

- [x] **Deploy to AWS Standing Tiger Account + GitHub Pages CI/CD** ✅ COMPLETE
  - **Completed:** June 11, 2026
  - **GitHub Pages CI/CD:** ✅
    - `staging` branch → auto-deploys to `https://kstanigar.github.io/non-x_analytics/staging/`
    - `main` branch → auto-deploys to `https://kstanigar.github.io/non-x_analytics/`
  - **Lambda:** ✅
    - `non-x-analytics-api` updated with `ALLOWED_ORIGIN = 'https://kstanigar.github.io'`
    - Input validation, generic error response, all security fixes deployed
    - All 4 smoke tests pass (standard, platform-split, invalid subType → 400, invalid dateRange → 400)
  - **CloudWatch:** ✅ Log retention set to 14 days
  - **Dependencies:** Final Security Audit complete ✅
  - **Estimate:** 2–3 hours total
  - **Priority:** HIGH — production deployment
  - **Architecture (final decision):**
    - `staging` branch → GitHub Actions → GitHub Pages `/staging/` subfolder (QA)
    - `main` branch → GitHub Actions → GitHub Pages root `/` (production)
    - Lambda API deployed manually to AWS (separate from dashboard HTML)
  - **Why GitHub Pages for both:** Free, zero AWS credentials in GitHub, custom domain supported via CNAME. S3 is overkill for a static read-only dashboard.
  - **URLs:**
    - Staging: `https://kstanigar.github.io/non-x_analytics/staging/`
    - Production: `https://kstanigar.github.io/non-x_analytics/` (or custom domain)
  - **Workflow files:** Already created ✅
    - `.github/workflows/deploy-staging.yml`
    - `.github/workflows/deploy-production.yml`

  **Part 1 — GitHub Actions CI/CD Setup (~15 min):**
  1. Repo → Settings → Actions → General → **Read and write permissions** ✅
  2. Repo → Settings → Pages → Source: **Deploy from a branch** → branch: `gh-pages` → `/ (root)`
  3. Create `staging` branch: `git checkout -b staging && git push origin staging`
  4. Push to `staging` to trigger first staging deploy → verify URL loads
  5. Push/merge to `main` → verify production URL loads

  **Part 2 — Custom Domain (optional, ~20 min + DNS propagation up to 48h):**
  1. Buy/use a domain (e.g. `analytics.yourgame.com`)
  2. DNS provider → add CNAME record:
     - Host: `analytics` (or whatever subdomain you want)
     - Value: `kstanigar.github.io`
     - TTL: 3600 (or lowest available)
  3. Repo → Settings → Pages → Custom domain → enter `analytics.yourgame.com` → Save
  4. Repo → Settings → Variables → Add repository variable:
     - Name: `CUSTOM_DOMAIN`
     - Value: `analytics.yourgame.com`
  5. Wait for DNS propagation (minutes to 48h)
  6. Repo → Settings → Pages → tick **Enforce HTTPS** once DNS resolves
  7. After custom domain is set:
     - Update `ALLOWED_ORIGIN` in `api/index.js` to `https://analytics.yourgame.com`
     - Re-zip and re-upload Lambda
  - **Note:** Until `CUSTOM_DOMAIN` repo variable is set, production workflow writes an empty CNAME file — harmless, GitHub Pages ignores it.

  **Part 3 — AWS Lambda + API Gateway (~60 min):**
  1. Package Lambda zip:
     ```bash
     mkdir -p lambda-package && cp api/index.js lambda-package/
     cd lambda-package && npm init -y && npm install @google-analytics/data
     zip -r ../function.zip . && cd ..
     ```
  2. Lambda console (Standing Tiger account) → Create function
     - Name: `non-x-analytics-api`, Runtime: Node.js 20.x
     - Memory: 256 MB, Timeout: 30s
     - Upload `function.zip`, Handler: `index.handler`
     - Env vars: `GOOGLE_CREDENTIALS` (full JSON string), `GA4_PROPERTY_ID`
  3. API Gateway → Create REST API (Regional)
     - Resource: `/analytics`, Method: GET, Lambda Proxy integration ✅
     - Enable CORS on `/analytics`
     - Deploy to `prod` stage → copy Invoke URL
  4. Usage Plan: Rate 10 req/s, Burst 10, Quota 1000/day → attach to prod stage
  5. Smoke test:
     ```bash
     BASE="https://YOUR-NEW-API-ID.execute-api.us-east-2.amazonaws.com/prod"
     curl "$BASE/analytics?type=standard&version=4.3&dateRange=7day"
     curl "$BASE/analytics?type=standard&subType=platform-split&version=4.3&dateRange=7day"
     curl "$BASE/analytics?type=standard&subType=invalid-value"  # should return 400
     ```

  **Part 4 — Wire Everything (~15 min):**
  1. Update `API_CONFIG.baseURL` in `live.html` to new Standing Tiger Lambda URL
  2. Update `ALLOWED_ORIGIN` in `api/index.js` to `https://kstanigar.github.io` (or custom domain)
  3. Re-zip and re-upload Lambda
  4. CloudWatch → log group `/aws/lambda/non-x-analytics-api` → retention → 14 days
  5. Push to `staging` → QA at staging URL
  6. Merge to `main` → production auto-deploys

  **Day-to-day workflow:**
  ```
  Work on main (or feature branch)
        ↓
  git checkout staging && git merge main && git push origin staging
        ↓
  QA at https://kstanigar.github.io/non-x_analytics/staging/
        ↓
  git checkout main && git merge staging && git push origin main
        ↓
  GitHub Actions → gh-pages root updated → production live in ~30s
  ```

  **Full deploy checklist:**
  - [ ] Repo Settings → Actions → read/write permissions enabled
  - [ ] Repo Settings → Pages → source set to `gh-pages` branch
  - [ ] `staging` branch created and pushed
  - [ ] Push to `staging` → staging URL loads ✅
  - [ ] Lambda created (Node.js 20.x, 256MB, 30s, env vars set)
  - [ ] API Gateway deployed to `prod` stage
  - [ ] Usage Plan attached (10 req/s, 1000/day)
  - [ ] Smoke test passes (valid → data, invalid subType → 400)
  - [ ] `live.html` `API_CONFIG.baseURL` updated to Standing Tiger Lambda URL
  - [ ] `ALLOWED_ORIGIN` in `api/index.js` updated to GitHub Pages / custom domain
  - [ ] Lambda re-zipped and re-uploaded with updated `api/index.js`
  - [ ] CloudWatch log retention → 14 days
  - [ ] Merge to `main` → production auto-deploys ✅
  - [ ] (Optional) Custom domain CNAME configured + `CUSTOM_DOMAIN` repo variable set

  - **Dependencies:** Final Security Audit complete ✅

- [x] **Data Completeness Banner** ✅ COMPLETE
  - **Completed:** June 11, 2026
  - **Files:** `live.html` — 4 changes
    - HTML banner `#completeness-banner` after kpi-grid (line ~1506), hidden by default
    - `completeness` variable computed in `mapGA4ResponseToDATA()` (line ~3196)
    - `completeness` added to `DATA.kpis` defaults (default: 100) and return block
    - `populateKPIs()` shows/hides banner and populates `#completeness-pct` span
  - **Behavior:** Banner visible on Overview page when live data has <80% outcome coverage; hidden otherwise

- [x] **Dashboard Polish — June 11, 2026** ✅ COMPLETE
  - [x] A: Player Behavior sub-text counts (green/yellow colored raw counts under %)
  - [x] B: Default data range → `alltime-43` (All-Time Version 4.3)
  - [x] C: Remove stale banners (insight-box, header subtitle `GA4 + Looker Studio`, AI CSV toast)
  - [x] D: Lambda deploy procedure documented (see HANDOFF_SUMMARY)

- [ ] **BigQuery Integration** — Avg Starting Tier + Avg Final Tier KPIs
  - **Estimate:** 3–5 hours (setup + Lambda + dashboard wiring)
  - **Priority:** MEDIUM — unlocks 2 KPIs that GA4 API cannot provide
  - **Why BigQuery:** GA4 Data API aggregates across all events — it cannot find the first or last event within a session. BigQuery exports raw event-level data with timestamps, enabling session-level SQL queries.
  - **Data lag:** 24–48 hours (daily export, not real-time)
  - **Cost:** ~$0/month at indie game data volumes (~$5/TB scanned)
  - **Setup steps (one-time):**
    1. Enable GA4 BigQuery Export — GA4 Admin → BigQuery Linking → connect Standing Tiger GCP project (~5 min)
    2. Create GCP service account with BigQuery Data Viewer + Job User roles
    3. Add service account credentials to Lambda as env variable (same pattern as `GOOGLE_CREDENTIALS`)
  - **Lambda:** New `subType=avg-tier` handler using `@google-cloud/bigquery` npm package
  - **SQL queries:**
    ```sql
    -- Avg Starting Tier: old_tier from first ai_difficulty_adjusted per session
    SELECT AVG(CAST(first_old_tier AS INT64)) FROM (
      SELECT session_id,
        FIRST_VALUE(params.value.string_value) OVER (
          PARTITION BY session_id ORDER BY event_timestamp
        ) AS first_old_tier
      FROM events, UNNEST(event_params) AS params
      WHERE event_name = 'ai_difficulty_adjusted' AND params.key = 'old_tier'
    )

    -- Avg Final Tier: new_tier from last ai_difficulty_adjusted per session
    SELECT AVG(CAST(last_new_tier AS INT64)) FROM (
      SELECT session_id,
        LAST_VALUE(params.value.string_value) OVER (
          PARTITION BY session_id ORDER BY event_timestamp
          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) AS last_new_tier
      FROM events, UNNEST(event_params) AS params
      WHERE event_name = 'ai_difficulty_adjusted' AND params.key = 'new_tier'
    )
    ```
  - **Dashboard wiring:** `DATA.kpis.avgStartTier`, `DATA.kpis.avgFinalTier` → `#kpi-avg-start-tier`, `#kpi-avg-final-tier`
  - **Security note (June 11, 2026):** Haiku agent research on 2026 BigQuery best practices needed before implementation — credential storage pattern, query cost controls, caching strategy. Planned as next research task.
  - **Dependencies:** Standing Tiger AWS deploy complete ✅, GA4 BigQuery Export enabled

- [ ] **New Engagement Metrics — 6 KPIs on Overview Page** ⚠️ CODE COMPLETE — DEPLOY PENDING
  - **Estimate:** 3–4 hours total
  - **Decision (June 11, 2026):** Implement all 6 in a new "Player Behavior" row on the Overview page
  - **All 6 events already firing in GA4 — no game-side changes needed**

  **Metrics:**
  | KPI | Formula | Note |
  |-----|---------|------|
  | Scorecard View Rate | `scorecard_viewed / game_start` | % reaching end screen |
  | Music Toggle Rate | `music_toggled / game_start` | engagement with music feature |
  | Leave Game Rate | `leave_game / game_start` | rage quit / drop-off signal |
  | Boss Reach Rate | `boss_attempt / game_start` | how far players get |
  | Survey Response Rate | `survey_submitted / game_start` | feedback engagement |
  | Session Return Rate | already live as "New vs Returning" — reframe existing tile, no new Lambda |

  **Lambda (one new endpoint batches 4 events):**
  - [x] New `subType=engagement-events` handler: `eventName` dim, filter to `scorecard_viewed`, `music_toggled`, `leave_game`, `survey_submitted` ✅ COMPLETE June 11, 2026
  - [x] Add `'engagement-events'` to `VALID_SUBTYPES` at `api/index.js:15` ✅ COMPLETE June 11, 2026
  - Boss Reach Rate uses existing `DATA.bossAnalysis.boss1.overall.attempts` — no Lambda needed

  **Exact insertion points (verified by Haiku agent June 11, 2026):**

  | Change | File | Line(s) | Status |
  |--------|------|---------|--------|
  | VALID_SUBTYPES whitelist | `api/index.js` | **15** | ✅ COMPLETE |
  | New Lambda handler | `api/index.js` | Before **311** | ✅ COMPLETE |
  | HTML — new "Player Behavior" kpi-grid | `live.html` | After **1505** | ⏳ NEXT |
  | DATA.kpis defaults | `live.html` | After **2295** | ⏳ Pending |
  | `mapGA4ResponseToDATA()` return kpis | `live.html` | After **3228** | ⏳ Pending |
  | `populateKPIs()` updates | `live.html` | After **4211** | ⏳ Pending |

  **Dependencies:** None
  **Resume:** Deploy `api/index.js` to Lambda → test endpoint → commit → staging → main

- [ ] **KPI Tooltips — Hybrid Approach**
  - **Estimate:** 2–3 hours
  - **Approach (approved June 11, 2026):** Three-tier hybrid
    - **Simple KPIs** (Win Rate, Death Rate, Replay Rate, etc.): CSS `::after` tooltip on `:hover`; click/tap on mobile
    - **Complex KPIs** (Avg Level, AI Tier, Survival, A/B stats): Small `ℹ` icon inline with label → navigates to `#dict-[metric]` anchor on Data Dictionary page, accordion auto-expands
    - **Pattern:** Easy things show inline. Deep explanations live in the Data Dictionary.
  - **Implementation:**
    - One CSS block for `.kpi-tooltip` class + `::after` pseudo-element
    - One JS `click` handler on `[data-dict]` attributes to navigate + expand accordion
    - No third-party libraries needed
  - **Content per KPI:** formula, data source, what the value means, what "good" looks like
  - **Dependencies:** Data Dictionary page complete (so anchor targets exist)

---

### Added: June 8, 2026 (Phase 5 Completion)

- [ ] **Case Study Page** (Tab 6 — replaces Looker tab)
  - **Estimate:** 2–3 hours
  - **Decision (June 11, 2026):** Case Study and Data Dictionary are NOW SEPARATE TABS — both are too dense to share a page
  - **Location:** `live.html` — replace Looker tab content (lines ~1347–1575)
  - **Layout:** Two-column
    - Left (casual): Game overview, player behavior insights, key findings, design decisions made from data
    - Right (technical): Analytics methodology, statistical significance notes, chart interpretation, version history
  - **No sensitive info:** No API keys, Lambda URLs, or AWS infrastructure details
  - **Dependencies:** New Engagement Metrics done (so findings are final before writing)

- [ ] **Data Dictionary Page** (new Tab 7)
  - **Estimate:** 3–4 hours
  - **Decision (June 11, 2026):** Separate tab — too dense to share with Case Study
  - **Location:** `live.html` — add new tab button + new page `div` after the Case Study tab
  - **Layout:** Accordion sections by category:
    - Top-Line KPIs (formula, data source, what "good" looks like)
    - Engagement KPIs (new 6 metrics)
    - GA4 Events (all event names, when they fire, what params they carry)
    - Custom Dimensions (all 31 registered dims, possible values, which queries use them)
    - A/B Test Definitions (group assignments, metric definitions)
    - Version Filtering (what v4.3 means, why it matters)
  - **Anchor IDs:** Every section gets `id="dict-[metric]"` — used by KPI tooltip ℹ icons
  - **Dependencies:** New Engagement Metrics done (so all KPIs are final before writing)

- [x] **Investigate ISSUE-002: Missing Outcome Events** ✅ RESOLVED June 11, 2026
  - **Root Cause:** Test/dev data pollution (AWS security testing + Xenon_3 dev setup during v4.3 window)
  - **Resolution:** Not a bug. `console.warn` added at `live.html:~3197`. Visible banner planned (see below).
  - **Full details:** `docs/Issues_And_Bugs.md`

- [x] **Add Data Completeness Warning to Dashboard** ✅ COMPLETE
  - **Completed:** June 11, 2026
  - **Location:** `live.html` — after `completedGames` definition in `mapGA4ResponseToDATA()` (line ~3195)
  - **Change:** `console.warn()` fires when `completedGames / gameStarts < 0.8` — logs exact % and raw counts
  - **Dependencies:** None

- [x] **Investigate Leaderboard Event Name** ✅ RESOLVED June 10, 2026
  - **Finding:** `leaderboard_submit` is the correct event — dashboard already uses it correctly
  - **Also firing:** `scorecard_viewed` (36 events) = passive end-screen view, not a submission action
  - **Leaderboard Rate KPI is already live** — standard GA4 query captures `leaderboard_submit` (15 events: 13 mobile, 2 desktop)
  - **No code changes needed**

- [x] **API Security Issue - Phase 2** ✅ COMPLETE
  - **Completed:** June 10, 2026
  - **Time Invested:** ~45 min
  - **Original Scope:** Create Lambda proxy to hide API key server-side
  - **Actual Resolution:** Haiku agent research confirmed Lambda proxy is unnecessary — correct security stack for a public browser-based dashboard is Usage Plan + TLS + CORS (no API key in browser code)
  - **Actions Taken:**
    - Verified existing API key (`NON-X-Analytics-Key-2026-04`) and usage plan (`NON-X-Analytics-Rate-Limit`) already correctly configured
    - Briefly re-enabled "API key required" on GET /analytics (ISSUE-009) — reverted after research confirmed wrong pattern
    - Redeployed API to prod with API key required = False
  - **Security Stack Confirmed:** Usage Plan (10 req/s, 1000/day) + TLS 1.3 + CORS ✅
  - **Future Upgrade:** AWS WAF (~$10/month) if traffic grows
  - **Documented:** ISSUE-009 in Issues_And_Bugs.md

- [x] **Investigate Unpopulated AI Agent Charts + Full Dashboard Audit** ✅ COMPLETE
  - **Completed:** June 10, 2026
  - **Output:** `docs/Master_Data_Points_Map.md`, `docs/Dashboard_Data_Audit_June2026.md`
  - **Finding:** All 31 GA4 custom dimensions already registered — no game-side changes needed, only new Lambda endpoints. Every hardcoded chart has a buildable GA4 query. Path to ~90% live is 20–30 hours across quick wins → medium → A/B/funnel endpoints. Only Avg Start/Final Tier KPIs require BigQuery (session-level joins).

- [ ] **Phase 7: Build Remaining Live Endpoints** ⭐ NEXT PRIORITY
  - **Added:** June 10, 2026
  - **Estimate:** 20–30 hours total across all tiers
  - **Priority:** HIGH - Dashboard shows ~60% live; path to ~90% is new Lambda endpoints only
  - **Key Finding (June 10, 2026):** All 31 GA4 custom dimensions already registered — no game-side changes needed. Every hardcoded chart has a buildable GA4 query. See `docs/Master_Data_Points_Map.md` for full mapping.
  - **Dependencies:** Phase 6D complete ✅

  **🟢 Quick Wins (< 2 hrs each, no new dims):**
  1. ✅ **Device Mix chart** — calculate from existing `DATA.platform` session counts (< 1 hr) — COMPLETE June 10, 2026
  2. ✅ **Boss rates by platform** — wire existing `DATA.bossAnalysis` to `chartPlatformFunnel()` (1–2 hrs) — COMPLETE June 10, 2026
  3. ✅ **Death Triggers by Phase chart** — new query: `death_phase` on `play_again` (1–2 hrs) — COMPLETE June 10, 2026
  4. ✅ **Speed Lock Rate KPI** — new query: `speed_locked` on `ai_difficulty_adjusted` (1–2 hrs) — COMPLETE June 10, 2026
  5. ✅ **Score Multiplier Distribution chart** — extend ai-analysis with `effective_multiplier` dim (1–2 hrs) — COMPLETE June 10, 2026

  **🟡 Medium (2–4 hrs each, existing dims) — see `docs/Phase7_Medium_Tier_Plan.md`:**
  6. ✅ **MT-1: Avg Survival KPI** — COMPLETE June 10, 2026 (format changed to minutes, mock values updated, `DATA.kpis.survival` wired)
  7. ✅ **MT-2: New User % KPI** — COMPLETE June 10, 2026 (25% live, colored counts `28 new / 83 returning`, Lambda deployed)
  8. ✅ **MT-3: Avg Level KPI + platform cols** — COMPLETE June 10, 2026 (weighted avg from player_death events, wired to Overview + Platform tab)
  9. ✅ **MT-4: Replay Rate KPI** — COMPLETE June 10, 2026 (7% live; 8 replay / 112 total starts; desktop 4%, mobile 10%)
  10. **MT-5: Tier vs Final Score chart** — UNBLOCKED (June 11, 2026): `final_score` does NOT need BigQuery or a separate DB. Game just needs to add `final_score` as an event param on `player_won` → register as GA4 custom dim → standard Lambda query works. Cost: $0. Waiting on game-side code change.

  **🔴 Large (4–8 hrs each) — see `docs/Phase7_Large_Tier_Plan.md` for full implementation plan:**
  11. ✅ **LT-1: Game Funnel** — COMPLETE June 10, 2026 (8-stage funnel live: game_start → boss_attempt/defeated ×3 → player_won; all from boss-analysis; `wave_reached` dropped — param not sent with that event)
  12. ✅ **LT-2: Music A/B Test** — COMPLETE June 10, 2026 (`music-ab` Lambda + parser + fetch + integration; `ab_music_group` returns `'A'`/`'B'` not `'music_on'`/`'music_off'` — parser fixed; A=73 sessions, B=39 sessions; Group B wins on win rate 44% vs 23%)
      - ✅ **LT-2b: Music Funnel Table** — COMPLETE June 10, 2026 (`music-funnel` Lambda handler + parser + `Promise.all` parallel fetch; Conversion Rates Table Music ON/OFF/Delta columns fully live; key finding: Music OFF players reach Boss 1 at 64% vs Music ON 37% — -27.1pp delta)
  13. ✅ **LT-3: Movement A/B Test** — COMPLETE June 11, 2026 (`movement-ab` Lambda + parser + fetch + integration; `movement_group` returns `'A'`/`'B'`; A=Horizontal (1.25× pts) 19 sessions, B=Full Direction 93 sessions; win rate `—` — `player_won` not tagged with `movement_group` in game code)

  **⚫ BigQuery required (session-level joins):**
  14. **Avg Starting Tier KPI** — first `ai_difficulty_adjusted` per session
  15. **Avg Final Tier KPI** — last `ai_difficulty_adjusted` per session

  See BigQuery Integration task below for setup details.

---

### Added: June 8, 2026 (Phase 6A: Lambda Multi-Dimensional Queries)

**Goal:** Get dashboard to 50% live data (25-30 of 44 metrics)

**Documentation:** See `docs/Phase6A_Implementation_Plan.md` for complete details

- [x] **Phase 6A Task 5: Platform Splits Endpoint** ✅ COMPLETE
  - **Estimate:** 6-8 hours (revised to 7-9 hours with responsive fixes)
  - **Time Invested:** ~7.5 hours (Lambda ✅, Parser ✅, API fetch ✅, Funnel chart ✅, Table ✅, API Testing ✅, Responsive fixes ✅, Integration testing ✅)
  - **Completed:** June 9, 2026
  - **Files:** `api/index.js` (lines 13-15, 27-45), `live.html` (multiple sections)
  - **Changes:** Add platform dimension query (desktop vs mobile)
  - **Result:** 3 platform KPIs live + Platform funnel chart live + Platform table live + Responsive design optimized
  - **Progress:**
    - ✅ Subtask 1: Add subType parameter (api/index.js:14)
    - ✅ Subtask 2: Build platform-split query (api/index.js:29-52)
    - ✅ Subtask 3: Test Lambda setup (test files created)
    - ✅ Subtask 4: Deploy to AWS (endpoint live and tested)
    - ✅ Subtask 5: Extend mapGA4ResponseToDATA() (live.html:1760-1832)
    - ✅ Subtask 6: Add API fetch call (live.html:1970-2017, 2069-2120)
    - ✅ Subtask 7: Update chartPlatformFunnel() (live.html:2671-2717)
    - ✅ Subtask 8: Update buildPlatformTable() + KPI cards (live.html:2751-2794, 2116-2120)
    - ✅ Subtask 9: API Endpoint Testing (Task 9.1-9.3 all pass) - 30 min
    - [ ] Subtask 10: UI Display Testing - PAUSED (responsive issues found)
      - ✅ Task 10.1: KPI Cards Validation ✅
      - ✅ Task 10.2.1-10.2.2: Chart display and data accuracy ✅
      - [ ] Task 10.2.3: Chart responsiveness - NEXT (after responsive fixes)
      - [ ] Task 10.3: Platform table validation
      - [ ] Task 10.4: Survival Time Distribution chart validation
    - [ ] **RESPONSIVE FIX - Part 1** ✅ COMPLETE (65 min)
      - ✅ Charts: Add `maintainAspectRatio:false` to 14 instances
      - ✅ CSS: Add `@media (max-width: 479px)` block (50 lines)
      - ✅ Tables: Wrap 7 tables in `.table-wrapper` divs
      - ✅ Documentation: Created `Responsive_Design_Fix_Plan.md`
    - [x] **RESPONSIVE FIX - Part 2** ✅ COMPLETE (30 min)
      - ✅ Issue 3: Fix chart overflow (5 min)
      - ✅ Issue 4: Stack Analytics Version (3 min)
      - ✅ Issue 5: Hamburger menu with "DASHBOARDS" label (17 min + 4 min label)
      - ✅ Planning: Created `Responsive_Design_Fix_Part2_Plan.md`
    - [x] **Chart Legend Scaling Fix** ✅ COMPLETE (16 min)
      - ✅ Added `getLegendFontSize()` helper (8px mobile, 11px desktop)
      - ✅ Updated 10 chart legend configs with responsive font sizing
      - ✅ Result: Legends proportional to charts at all viewport sizes
    - [x] **Mobile UI Cleanup** ✅ COMPLETE (30 min)
      - ✅ Issue 6: Hide "WINNING" labels from A/B Test cards (line ~959)
      - ✅ Issue 7: Hide x-axis labels on mobile bar charts (line 2914-2928)
        - Bar colors identify bosses (Green=Boss 1, Red=Boss 2, Purple=Boss 3)
        - Charts affected: Boss Analysis, Powerup Usage, Boss by Platform, Survival Time, AI Tier
      - ✅ Documentation: Created `Mobile_UI_Cleanup_Plan.md`
    - [x] **Issue 8: Chart Overflow Fix** ✅ COMPLETE (5 min)
      - ✅ Added canvas width constraints (max-width: 100%, width: 100%) - line 380-384
      - ✅ Resolved Survival Time Distribution chart overflow on Platform tab
    - [x] **Issue 9: Active Tab Indicator** ✅ COMPLETE (15 min)
      - ✅ Added active tab name to mobile hamburger label (line 1424)
      - ✅ CSS styling for purple/magenta tab name (lines 1182-1187)
      - ✅ JavaScript updates label on tab switch (lines 3633-3645)
      - ✅ Documentation: Created `Issue9_Active_Tab_Indicator_Plan.md`
    - [x] Subtask 10: Resume UI Display Testing ✅ COMPLETE (30 min)
      - [x] Task 10.2.3: Retest chart responsiveness ✅
      - [x] Task 10.3: Platform table validation ✅ (data accuracy verified, Issue 8 resolved)
      - [x] Task 10.4: Survival Time Distribution chart validation ✅
    - [x] Subtask 11: Integration Testing ✅ COMPLETE (15 min)
      - [x] Test 11.1: Combined selector integration (API calls with version + dateRange) ✅
      - [x] Test 11.2: Date range data validation (40 → 105 sessions when 7day → 30day) ✅
      - [x] Test 11.3: Overview tab verification (win/death rates update correctly) ✅
    - [x] Subtask 12: Documentation ✅ COMPLETE (15 min)
      - [x] Updated HANDOFF_SUMMARY.md with test results
      - [x] Updated PRIORITIES.md marking task complete
  - **Code Changes:**
    - ✅ api/index.js: New request handler for `/analytics?subType=platform-split`
    - ✅ live.html:1760-1832: Platform-split response parser (73 lines)
    - ✅ live.html:1970-2017: fetchPlatformSplitData() function (48 lines)
    - ✅ live.html:2069-2120: Platform data integration + KPI cards update (52 lines)
    - ✅ live.html:2671-2717: chartPlatformFunnel() with live data (47 lines)
    - ✅ live.html:2751-2794: buildPlatformTable() dynamic winner logic (44 lines)
  - **AWS Changes:** None (backward compatible) ✅
  - **Endpoint:** `https://6waopo3jh1.execute-api.us-east-2.amazonaws.com/prod/analytics?type=standard&subType=platform-split&version=4.3`
  - **Testing:** Endpoint returns 18 rows, desktop/mobile split confirmed ✅
  - **Dependencies:** Phase 6A research complete ✅
  - **Status:** COMPLETE ✅ - All subtasks finished, integration tested, production-ready

- [x] **Phase 6A Task 5B: Combined Version + Date Range Selector** ✅ COMPLETE
  - **Estimate:** 2 hours
  - **Time Invested:** 90 minutes (June 9, 2026)
  - **Priority:** HIGH - Enables visibility into historical data and version comparisons
  - **Files:** `api/index.js`, `live.html` (CSS, HTML, JS for combined dropdown)
  - **Changes:** Replaced separate version selector with combined version + date range dropdown
  - **Result:** Users can view data for 7/30/90 days or all time, combined with version filtering (4.3 or all)
  - **Implementation:**
    - ✅ **Combined Selector Approach:** Single dropdown with version + date range combined
      - Format: "Last 7 Days - Version 4.3 (Current)" instead of separate dropdowns
      - Benefits: Cleaner UI, better mobile UX, easy to phase out old versions
    - ✅ **Selector Options (7 total):**
      - Last 7 Days - Version 4.3 (Current) [DEFAULT]
      - Last 30 Days - Version 4.3 (Current)
      - Last 90 Days - Version 4.3 (Current)
      - All Time - Version 4.3 (Current) ⭐ NEW (since March 1, 2026)
      - Last 7 Days - All Versions
      - Last 30 Days - All Versions
      - Last 90 Days - All Versions
    - ✅ **Version 4.2 Removed:** No data exists for v4.2, removed from dropdown
    - ✅ **CSS Styling Fixed:** Updated all `#version-select` → `#data-range-select`
  - **Code Changes:**
    - ✅ `api/index.js:16` - Extract `dateRange` parameter from query string
    - ✅ `api/index.js:18-23` - Map date range string to GA4 format (7day/30day/90day/alltime)
    - ✅ `api/index.js:45` - Platform-split uses dynamic `dateRange`
    - ✅ `api/index.js:77` - Standard request uses dynamic `dateRange`
    - ✅ `live.html:1388-1403` - Combined selector HTML (7 options)
    - ✅ `live.html:848,860,865,1150` - CSS updated for new selector ID
    - ✅ `live.html:2809-2826` - Renamed `applyDataRangeFilter()` with parsing logic
    - ✅ `live.html:2588-2599` - `fetchGA4Data()` parses combined value, adds dateRange param
    - ✅ `live.html:2639-2651` - `fetchPlatformSplitData()` parses combined value, adds dateRange param
  - **API Changes:**
    - Before: `GET /analytics?version=4.3`
    - After: `GET /analytics?version=4.3&dateRange=7day`
  - **AWS Changes:** Lambda deployed 3x (backward compatible) ✅
  - **Testing:** All selector options verified ✅
  - **Documentation:**
    - ✅ Created `docs/Version_Date_Range_Selector_Plan.md`
    - ✅ Updated HANDOFF_SUMMARY.md (June 9, 2026 session)
    - ✅ Line numbers verified with Haiku agent

- [x] **Phase 6A Task 6: Daily Timeseries Endpoint** ✅ COMPLETE
  - **Estimate:** 4-6 hours
  - **Time Invested:** ~3 hours (June 9, 2026)
  - **Completed:** June 9, 2026
  - **Files:** `api/index.js` (line 63), `live.html` (lines 2488, 2742, 2895, 1511)
  - **Changes:** Added date dimension query with dynamic date ranges
  - **Result:** Daily Plays & Wins chart now shows live GA4 data
  - **Code Changes:**
    - ✅ api/index.js:63 - Daily-timeseries request handler (+19 lines)
    - ✅ live.html:2488 - Parser in mapGA4ResponseToDATA() (+58 lines)
    - ✅ live.html:2742 - fetchDailyTimeseriesData() function (+49 lines)
    - ✅ live.html:2895 - Integration in loadAndRenderGA4Data() (+15 lines)
    - ✅ live.html:1511 - Removed "(last 14 days)" from title
  - **AWS Changes:** Lambda deployed successfully ✅
  - **Testing:** All tests pass ✅ (endpoint, parsing, rendering, version filtering)
  - **Endpoint:** `?type=standard&subType=daily-timeseries&version=4.3&dateRange=7day`
  - **Status:** Production-ready, chart showing live data
  - **Dependencies:** Task 5 complete (recommended, not required)
  - **Status:** Ready for implementation

- [x] **Phase 6A Task 7: Boss Analysis Endpoint** ✅ COMPLETE
  - **Estimate:** 4-6 hours
  - **Time Invested:** ~4 hours (June 9, 2026)
  - **Completed:** June 9, 2026
  - **Files:** `api/index.js` (line 83), `live.html` (lines 2546, 2876, 3046, boss UI components)
  - **Changes:** Added customEvent:boss_id dimension query with platform split
  - **Result:** Boss Analysis page 100% live ✅
  - **Code Changes:**
    - ✅ api/index.js:83-103 - Boss-analysis request handler (+21 lines)
    - ✅ live.html:2546-2636 - Parser in mapGA4ResponseToDATA() (+91 lines)
    - ✅ live.html:2876-2923 - fetchBossAnalysisData() function (+48 lines)
    - ✅ live.html:3046-3064 - Integration in loadAndRenderGA4Data() (+19 lines)
    - ✅ live.html:3448-3617 - Boss UI components updated (cards, charts, table)
  - **AWS Changes:** Lambda deployed successfully ✅
  - **Testing:** All tests pass ✅
    - Endpoint returns deviceCategory × boss_id × eventName
    - Boss cards: 100%, 75%, 80% defeat rates (live)
    - Charts: Attempts/defeats and platform split (live)
    - Table: Boss difficulty assessment (live)
  - **Endpoint:** `?type=standard&subType=boss-analysis&version=4.3&dateRange=7day`
  - **Boss Data Verified:**
    - Boss 1: 10 attempts, 10 defeats, 100% defeat rate
    - Boss 2: 8 attempts, 6 defeats, 75% defeat rate
    - Boss 3: 5 attempts, 4 defeats, 80% defeat rate
  - **Dependencies:** boss_id dimension verified ✅ (registered Feb 27, 2026)
  - **Status:** Production-ready, Boss Analysis page 100% live

**Phase 6A Total Time:** 14.5 hours actual (estimate: 14-20 hours) ✅
**Phase 6A Result:** Dashboard ~40% live (18-20 metrics), Boss Analysis page 100% live ✅

**Phase 6A Summary:**
- Task 5: Platform Splits Endpoint (7.5 hours) ✅
- Task 5B: Combined Version + Date Range Selector (1.5 hours) ✅
- Task 6: Daily Timeseries Endpoint (3 hours) ✅
- Task 7: Boss Analysis Endpoint (4 hours) ✅
- **Total:** 16 hours (including testing and integration)

**Live Data Sections:**
- Overview tab: Partial (platform KPIs, platform funnel)
- Boss Analysis tab: 100% live (3 cards, 2 charts, 1 table) ✅
- Daily Plays & Wins chart: 100% live ✅
- Platform data: 100% live ✅

---

### Added: June 7, 2026

- [ ] **Git Commit Phase 5 Changes**
  - **Estimate:** 10 minutes
  - **Files to Commit:**
    - `live.html` (death rate fix, event name fix, powerup fix)
    - `index.html` (powerup fix)
    - `api/index.js` (version filtering)
    - `docs/Issues_And_Bugs.md`
    - `docs/ISSUE-005_Fix_Documentation.md`
    - `docs/Session_Summary_June8_2026.md`
    - `docs/HANDOFF_SUMMARY.md`
    - `docs/PRIORITIES.md`
    - `docs/BLOG_NOTES.md`
  - **Commit Message:**
    ```
    feat: Phase 5 data accuracy fixes and analytics enhancements

    - Fix death rate calculation (ISSUE-001)
    - Fix event name mismatch (ISSUE-004)
    - Fix powerup phase data (ISSUE-005)
    - Add version filtering to Lambda
    - Add version dropdown to UI
    - Create centralized issue tracker
    - Update documentation structure
    ```
  - **Dependencies:** Complete testing after refresh

---

### Added: April 27, 2026

- [ ] **Create Pull Request for Phase 5**
  - **Estimate:** 15 minutes
  - **Branch:** `feature/phase4-live-dashboard`
  - **Base:** `main`
  - **PR Title:** "Phase 5: Analytics Version Filtering + Data Accuracy Fixes"
  - **PR Body:** Reference Phase5 handoff summary and session summary
  - **Dependencies:** Git commit complete

---

## ✅ COMPLETED TASKS

Tasks organized by completion date (newest first). Includes completion details and dates.

---

### Completed: June 8, 2026

- [x] **Phase 6A Research & Planning** ✅
  - **Completed:** June 8, 2026, 7:30 PM
  - **Total Time:** 29 minutes (Haiku agent research)
  - **Deliverables:** 5 comprehensive documents (2,225 lines)
    - Phase6A_Implementation_Plan.md (1,256 lines / 44 KB)
    - Phase6A_Quick_Reference.md (240 lines / 6.6 KB)
    - Phase6A_Research_Summary.md (407 lines / 13 KB)
    - Phase6A_DELIVERABLES.md (322 lines / 10 KB)
    - Phase6A_RESEARCH_COMPLETE.txt (completion report)
  - **Research Findings:**
    - GA4 multi-dimensional queries verified (up to 9 dimensions)
    - No AWS configuration changes needed (Lambda code only)
    - Exact code changes documented with line numbers
    - Inline comments prepared for all changes
    - ~198 lines of new code (52 in api/index.js, 146 in live.html)
  - **Implementation Ready:** Tasks 5-7 (14-20 hours) with zero ambiguity
  - **Blog-Worthy:** Comprehensive documentation suitable for technical blog post

- [x] **CRITICAL: Fix API Security Issue - Phase 1 (Remove API Key)** ✅
  - **Completed:** June 8, 2026, 7:12 PM
  - **Total Time:** 18 minutes (estimate: 15 min)
  - **Files Modified:** `live.html:1595-1596, 1871`
  - **AWS Changes:** API Gateway - Unchecked "API key required", deployed to prod
  - **Code Changes:**
    - Removed hardcoded API key from config
    - Removed x-api-key header from fetch call
    - Added comment explaining removal (rate limiting protection)
  - **Testing:** Dashboard successfully connects without API key
  - **Result:** Security vulnerability eliminated, endpoint now uses rate limiting only (10 req/sec, 1000 req/day)

- [x] **Verify Event Names in GA4 DebugView** ✅
  - **Completed:** June 8, 2026, 4:30 PM
  - **Action:** Enabled debug mode, played game twice (win + death)
  - **Critical Discovery:** ISSUE-004 fix was INCORRECT
  - **Finding:** `game_complete` fires for BOTH wins AND deaths
  - **Result:** Reverted ISSUE-004 fix, added clarifying comments
  - **Events Verified:** All events firing correctly (player_won, player_death, leaderboard_submit, powerup_collected, ai_difficulty_adjusted)

- [x] **Revert ISSUE-004: Incorrect Event Mapping Fix** ✅
  - **Completed:** June 8, 2026, 4:30 PM
  - **File:** `live.html:1795-1801`
  - **Reverted:** `game_complete` back to `player_won`
  - **Added:** Inline comments explaining event mapping (verified via DebugView)
  - **Reason:** `game_complete` = generic outcome (fires for wins AND deaths)
  - **Correct Mapping:** Use `player_won` for wins, `player_death` for deaths
  - **Documentation:** Updated Issues_And_Bugs.md with mistake analysis

- [x] **Check AI Agent Events** ✅ PARTIAL
  - **Completed:** June 8, 2026, 4:30 PM
  - **Finding:** `ai_difficulty_adjusted` IS firing (verified in DebugView 4:11:01 PM)
  - **Status:** AI Agent events ARE being sent to GA4
  - **Note:** Dashboard shows 0 for AI metrics (Lambda issue, not event tracking)

- [x] **Fix ISSUE-005: Powerup Phase Data Correction**
  - **Completed:** June 8, 2026, 5:05 AM
  - **Files:** `live.html:1640-1644`, `index.html:1634-1638`
  - **Change:** Set Quad Shot values to 0 for Green/Red phases
  - **Result:** Powerup chart now shows Quad Shot only in Purple phase
  - **Documentation:** `ISSUE-005_Fix_Documentation.md`

- [x] **Fix ISSUE-004: Event Name Mapping** ⚠️ CORRECTED
  - **Initial Fix:** June 8, 2026, 4:55 AM (INCORRECT)
  - **Correction:** June 8, 2026, 4:30 PM (REVERTED)
  - **File:** `live.html:1795`
  - **Initial Change:** `player_won` → `game_complete` ❌
  - **Corrected:** Reverted to `player_won` ✅
  - **Lesson:** Always verify with DebugView before changing event mappings

- [x] **Fix ISSUE-001: Death Rate Formula Bug**
  - **Completed:** June 8, 2026, 4:50 AM
  - **File:** `live.html:1803-1809`
  - **Change:** Calculate death rate using `completedGames` (wins + deaths) instead of `gameStarts`
  - **Result:** Death Rate corrected from 15.8% → 44.4%
  - **Code Added:**
    ```javascript
    const completedGames = playerWon + playerDeath;
    const deathRate = completedGames > 0
      ? ((playerDeath / completedGames) * 100).toFixed(1) + '%'
      : '0%';
    ```

- [x] **Create Issues_And_Bugs.md Tracker**
  - **Completed:** June 8, 2026, 4:30 AM
  - **File:** `docs/Issues_And_Bugs.md` (16K)
  - **Purpose:** Centralized issue tracking with severity levels
  - **Structure:** Critical/Medium/Low sections + Resolved section

- [x] **Investigate Data Accuracy with Haiku Agent**
  - **Completed:** June 8, 2026, 4:00 AM
  - **Duration:** 45 minutes
  - **Findings:** Identified ISSUE-001 (death rate formula) and ISSUE-004 (event name mismatch)
  - **Documentation:** Comprehensive investigation report in session summary

---

### Completed: April 27, 2026

- [x] **Remove Duplicate A/B Test Charts**
  - **Completed:** April 27, 2026
  - **File:** `live.html`
  - **Removed:** `chartABWinRate()` and `chartABSurvival()` functions
  - **Lines Deleted:** 47 lines
  - **Reason:** Redundant with comparison cards

- [x] **Add Version Selector Dropdown to Dashboard**
  - **Completed:** April 27, 2026
  - **File:** `live.html`
  - **Added:** CSS styling, HTML dropdown, JavaScript functions
  - **Options:** All Versions, Version 4.3, Version 4.2

- [x] **Add Analytics Version Filtering to Lambda**
  - **Completed:** April 27, 2026
  - **File:** `api/index.js`
  - **Added:** `analytics_version` dimension filter
  - **Deployed:** AWS Lambda (us-east-2)
  - **API:** Supports `?version=4.3` or `?version=all`

- [x] **Change Dashboard Auto-Refresh Rate**
  - **Completed:** April 27, 2026
  - **File:** `live.html:1566`
  - **Change:** 5 minutes → 1 hour
  - **Impact:** 92% reduction in API calls

---

### Completed: April 26, 2026

- [x] **Complete Phase 4: Live Dashboard with API Integration**
  - **Completed:** April 26, 2026
  - **Files:** `live.html`, `api/index.js`
  - **Features:** Auto-refresh, manual refresh, error handling, live GA4 data
  - **API Endpoint:** `https://6waopo3jh1.execute-api.us-east-2.amazonaws.com/prod/analytics`
  - **Status:** Production-ready

- [x] **Deploy Lambda Function to AWS**
  - **Completed:** April 26, 2026
  - **Function:** `non-x-analytics-api`
  - **Region:** us-east-2
  - **Memory:** 256 MB
  - **Response Time:** ~200ms average

---

### Completed: March 10, 2026

- [x] **Configure AWS API Gateway**
  - **Completed:** March 10, 2026
  - **Endpoint:** `/prod/analytics`
  - **Features:** CORS enabled, rate limiting (10 req/sec, 1000 req/day)
  - **Security:** TLS 1.3

---

## 📊 STATISTICS

**Pending Tasks:** 4 (Phase 7 medium/large tasks + 4 lower priority)
**Completed Tasks:** 34
**Completion Rate (June 2026):** 30 tasks completed

**Phase 7 Progress:** ~82% live data (QW1–5 ✅, MT-1 ✅, MT-2 ✅, MT-3 ✅, MT-4 ✅, LT-1 ✅)

**Average Task Completion Time:**
- Quick fixes (< 30 min): 7 tasks
- Medium tasks (30-90 min): 5 tasks
- Large tasks (1-4 hours): 7 tasks
- Research tasks: 1 task (29 min)

---

## 🔄 SYNC NOTES

**Last Sync with HANDOFF_SUMMARY.md:** June 10, 2026 (Phase 6D complete)
**Sync Status:** ✅ In sync
**Pending Hook Execution:** None