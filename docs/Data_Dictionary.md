# NON-X Analytics — Data Dictionary

**Purpose:** Source of truth for every metric, KPI, chart, table, event, and custom dimension in the NON-X Analytics dashboard.

**Created:** June 13, 2026
**Last Updated:** June 13, 2026
**Status:** 🟡 CURRENT — update after each new BigQuery metric or chart addition

**How to use this document:**
- `id="dict-[metric]"` anchors on each section will power KPI tooltip ℹ icons (Data Dictionary tab, pending)
- Sections are grouped by dashboard tab
- Live/mock status reflects the dashboard state as of the last update date above

---

## Table of Contents

1. [Lambda API Endpoints](#lambda-api-endpoints)
2. [GA4 Events](#ga4-events)
3. [GA4 Custom Dimensions](#ga4-custom-dimensions)
4. [Overview Tab — Top-Line KPIs](#overview-tab--top-line-kpis)
5. [Overview Tab — Player Behavior KPIs](#overview-tab--player-behavior-kpis)
6. [Overview Tab — Charts](#overview-tab--charts)
7. [Game Funnel Tab](#game-funnel-tab)
8. [Boss Analysis Tab](#boss-analysis-tab)
9. [Platform Tab](#platform-tab)
10. [AI Agent Tab](#ai-agent-tab)
11. [A/B Test Tab](#ab-test-tab)
12. [Case Study Tab](#case-study-tab)
13. [DATA Object Reference](#data-object-reference)
14. [Future Metrics (BigQuery Backlog)](#future-metrics-bigquery-backlog)

---

## Lambda API Endpoints

All endpoints share the same base URL: `GET /analytics`

**Common query parameters:**
- `type` — always `standard`
- `subType` — selects the endpoint (see table below)
- `version` — `4.3` or `all` (analytics version filter)
- `dateRange` — `7day`, `30day`, `90day`, `alltime`

**VALID_SUBTYPES list** (whitelist — unknown values return HTTP 400):

| subType | Dimensions Queried | Events Filtered | Returns |
|---------|-------------------|-----------------|---------|
| `platform-split` | `platform × deviceCategory × eventName` | all | desktop/mobile event counts |
| `daily-timeseries` | `date × eventName` | all | daily plays, wins, deaths by date |
| `boss-analysis` | `deviceCategory × customEvent:boss_id × eventName` | `boss_attempt`, `boss_defeated` | boss defeat rates by platform |
| `survival-time` | `deviceCategory × customEvent:session_duration_seconds × eventName` | `player_won`, `player_death` | survival time bucket distribution + avg by platform |
| `powerup-analysis` | `customEvent:powerup_type × customEvent:phase × eventName × deviceCategory` | `powerup_collected` | collection counts by powerup type, phase, and platform |
| `progression-analysis` | `customEvent:phase × customEvent:level_reached × eventName × deviceCategory` | `wave_reached`, `player_won`, `player_death` | deaths by level, avg level data |
| `ai-analysis` | `customEvent:old_tier × customEvent:new_tier × customEvent:direction × eventName × deviceCategory × customEvent:speed_locked × customEvent:effective_multiplier` | `ai_difficulty_adjusted`, `player_won` | tier distribution, tier flow, speed lock rate, score multiplier distribution |
| `death-triggers` | `customEvent:death_phase × eventName × deviceCategory` | `play_again` | phase-specific death counts |
| `new-user-pct` | `newVsReturning × eventName` | `game_start` | new vs returning user % |
| `replay-rate` | `customEvent:is_replay × eventName × deviceCategory` | `game_start` | replay % by platform |
| `music-ab` | `customEvent:ab_music_group × eventName` | all | Music A/B group sessions + event counts |
| `music-funnel` | `customEvent:ab_music_group × customEvent:boss_id × eventName` | `boss_attempt`, `boss_defeated` | per-stage funnel completion by music group |
| `movement-ab` | `customEvent:movement_group × eventName` | `game_start`, `player_won` | Movement A/B group sessions + win counts |
| `engagement-events` | `eventName` | `scorecard_viewed`, `music_toggled`, `leave_game`, `survey_submitted` | Player Behavior engagement event counts |
| `avg-tier` | **BigQuery** — session-level window functions | `ai_difficulty_adjusted` | avg starting tier (FIRST_VALUE per session) + avg final tier (LAST_VALUE per session) |

**Security:**
- Input validation whitelist on `type`, `subType`, `dateRange` — returns HTTP 400 for unknown values
- CORS locked to `https://kstanigar.github.io`
- Error sanitization: generic `'Internal server error'` to client; full details to CloudWatch only
- `maxBytesBilled: '500000000'` (500MB) safety cap on all BigQuery queries
- Cache: 5-min API Gateway response cache (GA4 endpoints) | 24h in-memory Lambda cache (BigQuery `avg-tier`)

---

## GA4 Events

All events are sent from the NON-X game client to Google Analytics 4 (Property ID: `525680332`).

| Event Name | When It Fires | Key Params | Used In |
|------------|---------------|------------|---------|
| `game_start` | Player begins a game session | `analytics_version`, `is_replay`, `ab_music_group`, `movement_group` | Sessions KPI, Win Rate, Death Rate, all funnels, platform split, A/B tests |
| `player_won` | Player wins (completes all 3 boss fights) | `analytics_version`, `final_score`* | Win Rate, Daily chart, Funnel, AI score mult |
| `player_death` | Player dies before winning | `analytics_version`, `level_reached`, `phase` | Death Rate, Daily chart, Wave Drop-off chart |
| `play_again` | Player triggers play-again action | `analytics_version`, `death_phase` | Death Triggers by Phase chart |
| `boss_attempt` | Player enters a boss fight | `analytics_version`, `boss_id`, `ab_music_group` | Game Funnel (all 3 boss stages), Boss Analysis |
| `boss_defeated` | Player defeats a boss | `analytics_version`, `boss_id`, `ab_music_group` | Game Funnel (all 3 boss stages), Boss Analysis |
| `leaderboard_submit` | Player submits score to leaderboard | `analytics_version` | Leaderboard Rate KPI |
| `powerup_collected` | Player picks up a powerup | `analytics_version`, `powerup_type`, `phase` | Powerup Collection chart |
| `scorecard_viewed` | Player views the end-screen scorecard | `analytics_version` | Scorecard View Rate KPI |
| `music_toggled` | Player toggles music on/off during gameplay | `analytics_version` | Music Toggle Rate KPI, Music A/B test |
| `leave_game` | Player exits game before completion | `analytics_version` | Leave Game Rate KPI |
| `survey_submitted` | Player submits in-game feedback survey | `analytics_version` | Survey Response Rate KPI |
| `ai_difficulty_adjusted` | AI system changes difficulty tier | `analytics_version`, `old_tier`, `new_tier`, `direction`, `speed_locked`, `effective_multiplier` | All AI Agent KPIs and charts |
| `wave_reached` | Player reaches a new level/wave | `analytics_version`, `level_reached` | Progression analysis |
| `session_start` | Browser session begins (GA4 built-in) | — | Not used for game KPIs (overcounts — players who land but don't play) |
| `game_complete` | Generic outcome (fires for both wins AND deaths) | — | NOT used in any KPI — `player_won` and `player_death` used instead |

*`final_score` param on `player_won` — planned but not yet implemented in game. Needed for MT-5 Tier vs Final Score chart.

---

## GA4 Custom Dimensions

All custom dimensions are registered in GA4 as `customEvent:` prefixed. 31 total registered as of June 2026.

**Version filter (applied to all endpoints):**

| Dimension | Values | Notes |
|-----------|--------|-------|
| `analytics_version` | `'4.3'` (current), `'4.2'` (legacy, no data) | Version 4.3 active since March 1, 2026. Filter used by all API calls. |

**Player / Session dimensions:**

| Dimension | Values | Sent On | Notes |
|-----------|--------|---------|-------|
| `is_replay` | `'true'`, `'false'` | `game_start` | Identifies sessions where player clicked Play Again |
| `ab_music_group` | `'A'` (Music ON), `'B'` (Music OFF) | `game_start`, `boss_attempt`, `boss_defeated` | A/B test group assignment at session start |
| `movement_group` | `'A'` (Horizontal, 1.25× pts), `'B'` (Full Direction) | `game_start`, `player_won` | Movement A/B — `player_won` not tagged (game-side gap) |
| `session_duration_seconds` | integer string (e.g., `'73'`) | `player_won`, `player_death` | Time from game_start to outcome in seconds |

**Gameplay / Boss dimensions:**

| Dimension | Values | Sent On | Notes |
|-----------|--------|---------|-------|
| `boss_id` | `'1'` (Green), `'2'` (Red), `'3'` (Purple) | `boss_attempt`, `boss_defeated` | Identifies which boss fight |
| `phase` | `'green'`, `'red'`, `'purple'` | `powerup_collected`, `wave_reached` | Game phase at time of event |
| `level_reached` | `'1'`–`'12'` | `player_death`, `wave_reached` | Level number where event occurred |
| `death_phase` | `'green'`, `'red'`, `'purple'` | `play_again` | Phase in which the player died |
| `powerup_type` | `'health'`, `'double_laser'`, `'shield'`, `'quad_shot'` | `powerup_collected` | Type of powerup collected. Note: `quad_shot` not currently in game — 0 events. |

**AI difficulty dimensions:**

| Dimension | Values | Sent On | Notes |
|-----------|--------|---------|-------|
| `old_tier` | `'-3'` to `'3'` (7 tiers) | `ai_difficulty_adjusted` | Difficulty tier before adjustment |
| `new_tier` | `'-3'` to `'3'` (7 tiers) | `ai_difficulty_adjusted` | Difficulty tier after adjustment |
| `direction` | `'increase'`, `'decrease'` | `ai_difficulty_adjusted` | Whether tier went up or down |
| `speed_locked` | `'true'`, `'false'` | `ai_difficulty_adjusted` | Whether bullet speed is locked at this tier |
| `effective_multiplier` | `'0.5'`, `'0.70'`, `'0.85'`, `'1.0'`, `'1.2'`, `'1.4'`, `'1.5'`, `'2.1875'`* | `player_won` | Score multiplier applied at session end |

*`2.1875` is a continuous multiplier value that maps to the `1.50×+` highest bucket.

**Tier name reference:**

| Tier Value | Display Name | Bullet Speed | Score Mult |
|-----------|-------------|-------------|-----------|
| `-3` | Tutorial | Slowest | 0.50× |
| `-2` | Beginner | Slow | 0.70× |
| `-1` | Easy | Moderate | 0.85× |
| `0` | Normal | Standard | 1.00× |
| `+1` | Hard | Fast | 1.20× |
| `+2` | Expert | Faster | 1.40× |
| `+3` | Master | Fastest | 1.50×+ |

**GA4 built-in dimensions used:**

| Dimension | Values | Used In |
|-----------|--------|---------|
| `deviceCategory` | `'desktop'`, `'mobile'`, `'tablet'` (tablet routed to desktop in parser) | platform-split, boss-analysis, survival-time, powerup-analysis, progression-analysis, ai-analysis, death-triggers, replay-rate |
| `newVsReturning` | `'new'`, `'returning'` | new-user-pct |
| `platform` | `'WEB'`, `'APP'` | platform-split |
| `date` | `YYYYMMDD` | daily-timeseries |
| `eventName` | all event names above | all endpoints |

---

## Overview Tab — Top-Line KPIs

<div id="dict-sessions">

### Total Sessions
- **Formula:** Count of `game_start` events
- **Data Source:** `platform-split` endpoint (standard query)
- **Variable:** `DATA.kpis.sessions`
- **Format:** Integer (e.g., `112`)
- **Live:** Yes
- **Note:** Uses `game_start` (not `session_start`) — `session_start` includes visitors who land without playing

</div>

<div id="dict-new-pct">

### New vs Returning (New User %)
- **Formula:** `new_game_starts / total_game_starts × 100`
- **Data Source:** `new-user-pct` endpoint — filters `game_start` events, groups by `newVsReturning`
- **Variable:** `DATA.kpis.newPct`
- **Format:** `XX%` (e.g., `25%`)
- **Sub-text:** `N new / N returning` (raw counts, green/yellow colored)
- **Live:** Yes

</div>

<div id="dict-winrate">

### Win Rate
- **Formula:** `player_won / game_start × 100`
- **Data Source:** `platform-split` endpoint
- **Variable:** `DATA.kpis.winRate`
- **Format:** `XX.X%`
- **Sub-text:** `N wins / N sessions` (raw counts)
- **Live:** Yes
- **Good value:** Higher is better. Low win rates suggest difficulty tuning needed.

</div>

<div id="dict-deathrate">

### Death Rate
- **Formula:** `player_death / (player_won + player_death) × 100`
- **Data Source:** `platform-split` endpoint
- **Variable:** `DATA.kpis.deathRate`
- **Format:** `XX.X%`
- **Sub-text:** `N deaths / N completed` (raw counts)
- **Live:** Yes
- **Note:** Denominator is `completedGames` (wins + deaths), NOT `game_starts`. Abandoned sessions excluded intentionally — they do not represent a completed outcome.

</div>

<div id="dict-replay">

### Play-Again Rate
- **Formula:** `game_start events where is_replay='true' / total game_start × 100`
- **Data Source:** `replay-rate` endpoint — filters `game_start` events by `is_replay` custom dimension
- **Variable:** `DATA.kpis.replay`
- **Format:** `XX%`
- **Sub-text:** `N replay starts / N total starts`
- **Live:** Yes

</div>

<div id="dict-survival">

### Avg Survival Time
- **Formula:** Average `session_duration_seconds` across all sessions with a game outcome (`player_won` or `player_death`)
- **Data Source:** `survival-time` endpoint
- **Variable:** `DATA.kpis.survival`
- **Format:** `X.Xm` (minutes, e.g., `4.6m`)
- **Live:** Yes

</div>

<div id="dict-lbrate">

### Leaderboard Rate
- **Formula:** `leaderboard_submit / player_won × 100`
- **Data Source:** `platform-split` endpoint
- **Variable:** `DATA.kpis.lbRate`
- **Format:** `XX%`
- **Sub-text:** `N submissions / N wins`
- **Live:** Yes
- **Note:** Denominator is `player_won` (wins only) — only winning players can submit a leaderboard score

</div>

<div id="dict-avglevel">

### Avg Level Reached
- **Formula:** Weighted average: `sum(level_number × death_count_at_level) / total_deaths`
- **Data Source:** `progression-analysis` endpoint — `player_death` events grouped by `level_reached`
- **Variable:** `DATA.kpis.avgLevel`
- **Format:** Integer (e.g., `3`)
- **Live:** Yes
- **Note:** Based on death events only — surviving players (wins) do not have a death level. Reflects where the median player stops.

</div>

<div id="dict-speedlock">

### Speed Lock Rate
- **Formula:** `ai_difficulty_adjusted events where speed_locked='true' / total ai_difficulty_adjusted × 100`
- **Data Source:** `ai-analysis` endpoint
- **Variable:** `DATA.aiAgent.kpis.speedLockRate`
- **Format:** `XX.X%`
- **Live:** Yes
- **Note:** Displayed on Overview page but data lives in `DATA.aiAgent.kpis` namespace (not `DATA.kpis`)

</div>

---

## Overview Tab — Player Behavior KPIs

<div id="dict-scorecard-rate">

### Scorecard View Rate
- **Formula:** `scorecard_viewed / game_start × 100`
- **Data Source:** `engagement-events` endpoint
- **Variable:** `DATA.kpis.scorecardRate`
- **Format:** `XX%`
- **Sub-text:** `N views / N sessions`
- **Live:** Yes
- **Interpretation:** % of sessions where the player saw the end-screen scorecard. High rate = players care about their score.

</div>

<div id="dict-music-rate">

### Music Toggle Rate
- **Formula:** `music_toggled / game_start × 100`
- **Data Source:** `engagement-events` endpoint
- **Variable:** `DATA.kpis.musicRate`
- **Format:** `XX%`
- **Sub-text:** `N toggles / N sessions`
- **Live:** Yes
- **Interpretation:** % of sessions where the player changed music setting during play.

</div>

<div id="dict-leave-rate">

### Leave Game Rate
- **Formula:** `leave_game / game_start × 100`
- **Data Source:** `engagement-events` endpoint
- **Variable:** `DATA.kpis.leaveRate`
- **Format:** `XX%`
- **Sub-text:** `N exits / N sessions`
- **Live:** Yes
- **Interpretation:** % of sessions abandoned before any outcome (win or death). High rate = early drop-off signal.

</div>

<div id="dict-boss-reach">

### Boss Reach Rate
- **Formula:** `boss_attempt (boss_id='1') / game_start × 100`
- **Data Source:** `boss-analysis` endpoint (reuses `DATA.bossAnalysis.boss1.overall.attempts`)
- **Variable:** `DATA.kpis.bossReachRate`
- **Format:** `XX%`
- **Sub-text:** `N players / N sessions`
- **Live:** Yes
- **Interpretation:** % of sessions that lasted long enough to trigger the first boss fight.

</div>

<div id="dict-survey-rate">

### Survey Response Rate
- **Formula:** `survey_submitted / game_start × 100`
- **Data Source:** `engagement-events` endpoint
- **Variable:** `DATA.kpis.surveyRate`
- **Format:** `XX%`
- **Sub-text:** `N submissions / N sessions`
- **Live:** Yes
- **Interpretation:** % of sessions where the player completed the in-game feedback survey.

</div>

---

## Overview Tab — Charts

<div id="dict-daily-chart">

### Daily Plays & Wins (Line Chart)
- **Canvas ID:** `chart-daily`
- **Data:** `DATA.daily.{labels, plays, wins}`
- **Lines:** Plays (magenta) = `game_start` count per day | Wins (cyan) = `player_won` count per day
- **Data Source:** `daily-timeseries` endpoint
- **Live:** Yes
- **X-axis:** Dates (`MM/DD` format) | **Y-axis:** Event count

</div>

<div id="dict-session-outcome">

### Session Outcome Breakdown (Stacked Bar)
- **Canvas ID:** `chart-session-outcome`
- **Data:** `DATA.daily.{labels, wins, deaths}` — derived per day
- **Bars (stacked):**
  - Wins (green) = `player_won` count
  - Deaths (red) = `player_death` count
  - Abandoned (yellow) = `game_start - player_won - player_death` (clamped to 0)
- **Data Source:** `daily-timeseries` endpoint (derived, no separate Lambda call)
- **Live:** Yes

</div>

<div id="dict-device-mix">

### Device Mix (Pie Chart)
- **Canvas ID:** `chart-device`
- **Data:** `DATA.deviceMix.{desktop, mobile}` (derived from platform-split session counts)
- **Data Source:** `platform-split` endpoint
- **Live:** Yes

</div>

<div id="dict-ab-split">

### Music A/B Split (Pie Chart)
- **Canvas ID:** `chart-ab-split`
- **Data:** `DATA.abSplit.{musicOn, musicOff}` — % of sessions in each group
- **Data Source:** `music-ab` endpoint
- **Live:** Yes

</div>

<div id="dict-powerup">

### Powerup Collection by Phase (Grouped Bar)
- **Canvas ID:** `chart-powerup`
- **Data:** `DATA.powerups.{labels, green, red, purple}`
- **X-axis:** Powerup types (Health, Double Laser, Shield)
- **Bars per powerup:** Green phase | Red phase | Purple phase (collection counts)
- **Data Source:** `powerup-analysis` endpoint
- **Live:** Yes
- **Note:** `quad_shot` removed from chart — not currently collectible in the game (0 events)

</div>

---

## Game Funnel Tab

<div id="dict-funnel">

### Main Game Funnel (8 Stages)
- **Render function:** `renderFunnel('funnel-main', DATA.funnel, CYAN)`
- **Data Source:** `boss-analysis` endpoint (stages 2–7) + `platform-split` (stages 1, 8)
- **Live:** Yes

| Stage | Name | GA4 Event | Condition |
|-------|------|-----------|-----------|
| 1 | Game Start | `game_start` | all sessions |
| 2 | Boss 1 Attempt | `boss_attempt` | `boss_id = '1'` |
| 3 | Boss 1 Defeated | `boss_defeated` | `boss_id = '1'` |
| 4 | Boss 2 Attempt | `boss_attempt` | `boss_id = '2'` |
| 5 | Boss 2 Defeated | `boss_defeated` | `boss_id = '2'` |
| 6 | Boss 3 Attempt | `boss_attempt` | `boss_id = '3'` |
| 7 | Boss 3 Defeated | `boss_defeated` | `boss_id = '3'` |
| 8 | Victory | `player_won` | all |

**Display:** Each stage shows count + % of previous stage. Drop-off % shown in yellow.

</div>

<div id="dict-wave-dropdoff">

### Wave Drop-off Chart (Deaths by Level)
- **Canvas ID:** `chart-dropdoff`
- **X-axis:** Levels L1–L12 + 3 boss stages, color-coded by phase (green/red/purple)
- **Y-axis:** Death count
- **Toggle:** ALL / DESKTOP / MOBILE
- **Data Source:** `progression-analysis` endpoint — `player_death` events grouped by `level_reached` + `deviceCategory`
- **Live:** Yes

</div>

<div id="dict-conversion-table">

### Conversion Rates Table
**Columns:** Stage Transition | Overall | Music ON | Music OFF | Delta (pp)
- **Data Source:** `DATA.funnel` (overall) + `DATA.funnelMusicOn/Off` (music split)
- **Live:** Yes

</div>

---

## Boss Analysis Tab

<div id="dict-boss-cards">

### Boss Defeat Rate Cards (3 cards: Boss 1, 2, 3)

For each boss:
- **Defeat Rate:** `boss_defeated / boss_attempt × 100` — shown as radial ring
- **Attempts:** total `boss_attempt` count
- **Defeats:** total `boss_defeated` count
- **Avg Attempts to Kill:** `attempts / defeats`

| Boss | Phase | Level Gate | Data Source |
|------|-------|-----------|-------------|
| Boss 1 | Green | L4 | `boss-analysis` endpoint, `boss_id='1'` |
| Boss 2 | Red | L8 | `boss-analysis` endpoint, `boss_id='2'` |
| Boss 3 | Purple | L12 | `boss-analysis` endpoint, `boss_id='3'` |

- **Live:** Yes

</div>

<div id="dict-boss-ratio">

### Boss Ratio Chart (Attempts vs Defeats)
- **Canvas ID:** `chart-boss-ratio`
- **Data:** Horizontal grouped bar — attempts (grey) vs defeats (cyan) per boss
- **Data Source:** `boss-analysis` endpoint
- **Live:** Yes

</div>

<div id="dict-boss-platform">

### Boss Conversion by Platform Chart
- **Canvas ID:** `chart-boss-platform`
- **Data:** Grouped bar — desktop defeat rate (%) vs mobile defeat rate (%) per boss
- **Data Source:** `boss-analysis` endpoint
- **Live:** Yes

</div>

<div id="dict-boss-table">

### Boss Difficulty Assessment Table
**Columns:** Boss | Phase | Level Gate | Attempts/Player | Defeat Rate | Avg Attempts to Kill | Assessment
- **Assessment logic:** Dynamically computed from defeat rate thresholds
- **Data Source:** `DATA.bosses` + `DATA.bossAnalysis`
- **Live:** Yes

</div>

---

## Platform Tab

<div id="dict-platform-kpis">

### Platform KPI Cards

| Display Name | Formula | Data Source | Live |
|--------------|---------|-------------|------|
| Desktop Win Rate | `desktop player_won / desktop game_start × 100` | `platform-split` | Yes |
| Mobile Win Rate | `mobile player_won / mobile game_start × 100` | `platform-split` | Yes |
| Desktop Avg Level | Weighted avg: `sum(level × desktop_deaths) / total_desktop_deaths` | `progression-analysis` | Yes |
| Mobile Avg Level | Weighted avg: `sum(level × mobile_deaths) / total_mobile_deaths` | `progression-analysis` | Yes |

</div>

<div id="dict-platform-funnel">

### Completion Funnel — Desktop vs Mobile (Grouped Bar)
- **Canvas ID:** `chart-platform-funnel`
- **Data:** Grouped bars — desktop % vs mobile % completion at: game_start → boss1 → boss2 → boss3
- **Data Source:** `boss-analysis` endpoint (`DATA.bossAnalysis` per-platform defeat rates)
- **Live:** Yes

</div>

<div id="dict-survival-dist">

### Survival Time Distribution (Bar Chart)
- **Canvas ID:** `chart-survival-dist`
- **X-axis:** Duration buckets (0–0.5m, 0.5–1m, 1–2m, 2–3m, 3–4m, 4–6m, 6–8m, 8+m)
- **Bars:** Desktop % | Mobile % (side-by-side per bucket)
- **Data Source:** `survival-time` endpoint
- **Live:** Yes

</div>

<div id="dict-platform-table">

### Platform Breakdown Table
**Columns:** Metric | Desktop | Mobile | Winner | Delta

**Rows:**

| Metric | Formula | Live |
|--------|---------|------|
| Sessions | game_start count | Yes |
| Win Rate | player_won / game_start | Yes |
| Avg Survival | avg session_duration_seconds | Yes |
| Replay % | is_replay game_starts / total game_starts | Yes |
| Avg Level Reached | weighted avg of level_reached at death | Yes |
| LB Rate | leaderboard_submit / player_won | Yes |
| Boss 1 Defeat Rate | boss1 defeats / boss1 attempts | Yes |
| Boss 2 Defeat Rate | boss2 defeats / boss2 attempts | Yes |
| Boss 3 Defeat Rate | boss3 defeats / boss3 attempts | Yes |

</div>

---

## AI Agent Tab

The AI difficulty system adjusts game difficulty in real-time via the `ai_difficulty_adjusted` event. The agent moves the player between 7 tiers (-3 Tutorial to +3 Master).

<div id="dict-avg-start-tier">

### Avg Start Tier
- **Formula:** For each game session, take the `old_tier` value of the FIRST `ai_difficulty_adjusted` event. Average across all sessions.
- **Data Source:** `avg-tier` endpoint — **BigQuery only** (session-level FIRST_VALUE window function — cannot be done via GA4 API)
- **Variable:** `DATA.aiAgent.kpis.avgStartTier`
- **Format:** Decimal (e.g., `0` = Normal tier)
- **Dataset:** `analytics_525680032` | **Cache TTL:** 24h (matches BigQuery daily export lag)
- **Live:** Yes (BigQuery)

</div>

<div id="dict-avg-final-tier">

### Avg Final Tier
- **Formula:** For each game session, take the `new_tier` value of the LAST `ai_difficulty_adjusted` event. Average across all sessions.
- **Data Source:** `avg-tier` endpoint — **BigQuery only** (session-level LAST_VALUE window function)
- **Variable:** `DATA.aiAgent.kpis.avgFinalTier`
- **Format:** Decimal
- **Dataset:** `analytics_525680032` | **Cache TTL:** 24h
- **Live:** Yes (BigQuery)

</div>

<div id="dict-speed-lock">

### Speed Lock Rate
- **Formula:** `ai_difficulty_adjusted where speed_locked='true' / total ai_difficulty_adjusted × 100`
- **Data Source:** `ai-analysis` endpoint (dim 6: `customEvent:speed_locked`)
- **Variable:** `DATA.aiAgent.kpis.speedLockRate`
- **Format:** `XX.X%`
- **Live:** Yes
- **Interpretation:** % of AI adjustments that occurred at a tier where bullet speed is locked. Indicates how often players hit the difficulty ceiling.

</div>

<div id="dict-avg-adjustments">

### Avg Tier Adjustments
- **Formula:** Total `ai_difficulty_adjusted` event count (not per-session average — raw total)
- **Data Source:** `ai-analysis` endpoint
- **Variable:** `DATA.aiAgent.kpis.avgAdjustments`
- **Format:** Integer (e.g., `28`)
- **Live:** Yes
- **Note:** Currently shows total count, not per-session average. BigQuery backlog item to compute true per-session average distribution.

</div>

<div id="dict-ai-tier-dist">

### AI Tier Distribution (Bar Chart)
- **Canvas ID:** `chart-ai-tier-dist`
- **X-axis:** 7 tiers (-3 Tutorial to +3 Master, labeled by `new_tier` value)
- **Y-axis:** Number of `ai_difficulty_adjusted` events ending at that tier
- **Data Source:** `ai-analysis` endpoint — `new_tier` dim, all `ai_difficulty_adjusted` events
- **Live:** Yes

</div>

<div id="dict-tier-flow">

### Tier Progression Flow (Bar Chart)
- **Canvas ID:** `chart-ai-tier-flow`
- **Bars:** Tier Increases (count) | Tier Decreases (count)
- **Data Source:** `ai-analysis` endpoint — `direction` dim (`'increase'` vs `'decrease'`)
- **Live:** Yes
- **Key finding (all-time v4.3):** 25 increases vs 3 decreases — players trending toward harder difficulty

</div>

<div id="dict-score-mult">

### Score Multiplier Distribution (Bar Chart)
- **Canvas ID:** `chart-ai-score-mult`
- **X-axis:** 8 multiplier buckets: `0.50×`, `0.70×`, `0.85×`, `1.00×`, `1.20×`, `1.40×`, `1.50×`, `1.50×+`
- **Y-axis:** Count of `player_won` sessions ending at each multiplier
- **Data Source:** `ai-analysis` endpoint — `effective_multiplier` dim, filtered to `player_won` events
- **Live:** Yes
- **Note:** `2.1875` raw value from GA4 maps to `1.50×+` bucket (continuous multiplier edge case)

</div>

<div id="dict-death-triggers">

### Death Triggers by Phase (Horizontal Bar)
- **Canvas ID:** `chart-ai-death-triggers`
- **Bars:** Green phase deaths | Red phase deaths | Purple phase deaths
- **Data Source:** `death-triggers` endpoint — `death_phase` dim on `play_again` events
- **Note:** `death_phase` is sent on `play_again` event (not `player_death`) — this is the game's design
- **Live:** Yes

</div>

<div id="dict-session-outcome-ai">

### Session Outcome Breakdown (same as Overview — see [chart-session-outcome](#dict-session-outcome))

</div>

<div id="dict-tier-table">

### Tier Performance Metrics Table
**Columns:** Tier | Name | Bullet Speed | Score Mult | Players | Avg Level Reached | Win Rate | Avg Session Time

| Column | Data Source | Live? |
|--------|-------------|-------|
| Tier (-3 to +3) | `DATA.aiAgent.tierMetrics[].tier` | Static |
| Name (Tutorial to Master) | Hardcoded in `DATA.aiAgent.tierMetrics[].name` | Static |
| Bullet Speed | Hardcoded in `DATA.aiAgent.tierMetrics[].speed` | Static |
| Score Mult | Hardcoded in `DATA.aiAgent.tierMetrics[].mult` | Static |
| Players | `ai_difficulty_adjusted` event counts by tier | Live |
| Avg Level Reached | Derived from progression data | Live |
| Win Rate | `player_won` count at this tier / sessions at this tier | Live |
| Avg Session Time | `session_duration_seconds` at this tier | Live |

</div>

---

## A/B Test Tab

<div id="dict-music-ab">

### Music A/B Test

**Groups:** Group A = Music ON | Group B = Music OFF
**Assignment:** `ab_music_group` custom dimension, set on `game_start`

**Metrics per group:**

| Metric | Formula | Live |
|--------|---------|------|
| Sessions | `game_start` count by group | Yes |
| Win Rate | `player_won / game_start × 100` by group | Yes |
| Leaderboard Rate | `leaderboard_submit / player_won × 100` by group | Yes |
| Music Toggle Rate | `music_toggled / game_start × 100` by group | Yes |

- **Data Source:** `music-ab` endpoint (sessions + event rates) + `music-funnel` endpoint (per-stage funnel)
- **Live:** Yes
- **Key finding (all-time v4.3):** Music OFF wins on win rate (44% vs 23%). Music OFF players reach Boss 1 at 64.1% vs Music ON's 37.0%.

</div>

<div id="dict-movement-ab">

### Movement A/B Test

**Groups:** Group A = Horizontal movement (1.25× pts) | Group B = Full Direction movement
**Assignment:** `movement_group` custom dimension, set on `game_start`

**Metrics per group:**

| Metric | Formula | Live | Notes |
|--------|---------|------|-------|
| Sessions | `game_start` count by group | Yes | A=19, B=93 — heavy imbalance |
| Win Rate | `player_won / game_start × 100` by group | Partial | `player_won` not tagged with `movement_group` in game — shows `—` |
| Avg Survival | avg `session_duration_seconds` by group | Mock | Needs game-side fix |
| Avg Level | avg level_reached by group | Mock | Needs game-side fix |

- **Data Source:** `movement-ab` endpoint
- **Live:** Partial
- **Known gap:** `player_won` events don't carry `movement_group` — game-side fix needed for win rate

</div>

<div id="dict-significance-table">

### Statistical Significance Table

**Columns:** Test | Group A (n) | Group B (n) | Status | Metric | P-value Target | Recommendation

| Test | Current n (A) | Current n (B) | Min Required | Status |
|------|--------------|--------------|-------------|--------|
| Music Test | 73 | 39 | ~385 per group | ⚠ Insufficient |
| Movement Test | 19 | 93 | ~385 per group | ⚠ Insufficient |

- **Status logic:** Live group sizes from API; status computed dynamically by `sigStatus()` function
- **P-value target:** 0.05 (95% confidence)
- **Live:** Partial (group sizes live; status text dynamic; p-value target hardcoded)

</div>

---

## Case Study Tab

Static HTML content only. No live data feeds. All statistics are manually curated narrative updated periodically by the developer.

**Last updated:** June 13, 2026

**Content sections:**
- About the project
- What We Measured (6 metric categories)
- Key Findings (6 stat highlights)
- Design Decisions Made from Data
- Technical Stack (8 rows)
- Scale Metrics (7 rows)
- Architecture overview
- Query Design patterns
- Security approach
- Statistical Notes

**When to update this page:**
- New BigQuery metric ships (update endpoint count, key findings stats, live data %)
- Dashboard reaches 100% live data
- `final_score` chart ships (update case study findings)
- See `docs/Case_Study_Plan.md` → Live Update Requirements table for exact lines

---

## DATA Object Reference

Full namespace reference for the JavaScript `DATA` object in `live.html`. All KPI tiles, charts, and tables read from this object.

```
DATA
├── kpis
│   ├── sessions           — Total game sessions (game_start count)
│   ├── newPct             — New user % ("25%")
│   ├── newPctSub          — Sub-text: "N new / N returning"
│   ├── winRate            — Win rate % ("33%")
│   ├── winSub             — Sub-text: "N wins / N sessions"
│   ├── deathRate          — Death rate % ("67%")
│   ├── deathSub           — Sub-text: "N deaths / N completed"
│   ├── replay             — Play-again rate % ("7%")
│   ├── replaySub          — Sub-text: "N replay / N total"
│   ├── survival           — Avg survival ("4.6m")
│   ├── lbRate             — Leaderboard rate % ("40%")
│   ├── lbRateSub          — Sub-text: "N submissions / N wins"
│   ├── avgLevel           — Avg level reached (integer)
│   ├── deskWin            — Desktop win rate %
│   ├── deskWinSub         — Sub-text for desktop win
│   ├── mobWin             — Mobile win rate %
│   ├── mobWinSub          — Sub-text for mobile win
│   ├── deskLevel          — Desktop avg level
│   ├── mobLevel           — Mobile avg level
│   ├── completeness       — Data completeness % (live outcome / game_starts)
│   ├── scorecardRate      — Scorecard View Rate %
│   ├── scorecardSub       — Sub-text: "N views / N sessions"
│   ├── musicRate          — Music Toggle Rate %
│   ├── musicSub           — Sub-text
│   ├── leaveRate          — Leave Game Rate %
│   ├── leaveSub           — Sub-text
│   ├── bossReachRate      — Boss Reach Rate %
│   ├── bossReachSub       — Sub-text
│   ├── surveyRate         — Survey Response Rate %
│   └── surveySub          — Sub-text
│
├── aiAgent
│   ├── kpis
│   │   ├── avgStartTier       — Avg starting tier (BigQuery)
│   │   ├── avgFinalTier       — Avg final tier (BigQuery)
│   │   ├── speedLockRate      — Speed lock % ("53.6%")
│   │   ├── speedLockSub       — Sub-text
│   │   └── avgAdjustments     — Total adjustment count (28)
│   ├── tierDist
│   │   ├── labels             — ["-3 Tutorial", ..., "+3 Master"]
│   │   └── counts             — [count per tier, 7 values]
│   ├── tierFlow
│   │   ├── increases          — Count of tier-up adjustments
│   │   └── decreases          — Count of tier-down adjustments
│   ├── scoreMultDist
│   │   ├── labels             — ["0.50×", ..., "1.50×+"]
│   │   └── counts             — [count per bucket, 8 values]
│   ├── tierMetrics            — [7 objects, one per tier]
│   │   └── { tier, name, speed, mult, players, avgLevel, winRate, avgTime }
│   └── deathTriggers
│       ├── labels             — ["Green", "Red", "Purple"]
│       └── counts             — [count per phase]
│
├── daily
│   ├── labels             — [date strings]
│   ├── plays              — [game_start count per day]
│   ├── wins               — [player_won count per day]
│   └── deaths             — [player_death count per day]
│
├── deviceMix
│   ├── desktop            — % desktop sessions
│   └── mobile             — % mobile sessions
│
├── abSplit
│   ├── musicOn            — % Music ON sessions
│   └── musicOff           — % Music OFF sessions
│
├── powerups
│   ├── labels             — ["Health", "Double Laser", "Shield"]
│   ├── green              — [count per powerup in green phase]
│   ├── red                — [count per powerup in red phase]
│   ├── purple             — [count per powerup in purple phase]
│   └── byPlatform         — { desktop: [...], mobile: [...] }
│
├── funnel                 — [8 stage objects: { name, n, pct, dropPct }]
├── funnelMusicOn          — [4 stage objects]
├── funnelMusicOff         — [4 stage objects]
│
├── deathsByLevel
│   ├── labels             — ["L1" ... "L12", boss stages]
│   ├── counts             — [death count per level]
│   ├── phase              — ["grn"/"red"/"pur" per level]
│   ├── isBoss             — [true/false per level]
│   ├── levelDeaths        — { "1": N, "2": N, ... } (live, from API)
│   ├── levelDesktop       — { "1": N, ... } (live)
│   ├── levelMobile        — { "1": N, ... } (live)
│   └── hasRealData        — boolean
│
├── bosses                 — [3 objects: { id, name, phase, threshold, attempts, defeats, defeat_rate, avg_attempts }]
│
├── bossAnalysis           — Live object from API
│   └── boss1/boss2/boss3
│       ├── overall        — { attempts, defeats, defeatRate }
│       ├── desktop        — { attempts, defeats, defeatRate }
│       └── mobile         — { attempts, defeats, defeatRate }
│
├── abMusic
│   ├── A                  — { label: 'Music ON', sessions, winRate, survival, replay, lbRate, avgLevel, musicToggle }
│   └── B                  — { label: 'Music OFF', sessions, winRate, survival, replay, lbRate, avgLevel, musicToggle }
│
├── abMovement
│   ├── A                  — { label: 'Horizontal (1.25× pts)', sessions, winRate, survival, avgLevel }
│   └── B                  — { label: 'Full Direction', sessions, winRate, survival, avgLevel }
│
├── platform
│   ├── desktop            — { sessions, winRate, survival, replay, avgLevel, lbRate, boss1Rate, boss2Rate, boss3Rate }
│   └── mobile             — { sessions, winRate, survival, replay, avgLevel, lbRate, boss1Rate, boss2Rate, boss3Rate }
│
└── survivalDist
    ├── labels             — ["0-0.5m", "0.5-1m", "1-2m", "2-3m", "3-4m", "4-6m", "6-8m", "8+m"]
    ├── desktop            — [% in each bucket]
    └── mobile             — [% in each bucket]
```

---

## Future Metrics (BigQuery Backlog)

These metrics are identified and planned but not yet implemented. Full details in `docs/BigQuery_Future_Metrics.md`.

Implementation order when revisited (after Data Dictionary tab ships):

| Priority | Metric | What It Shows | Effort | Location |
|----------|--------|---------------|--------|----------|
| 1 | **Tier Delta per Session** | `avg(final_tier - start_tier)` — net difficulty change | Low | AI Agent tab |
| 2 | **Sessions per User** | `COUNT(DISTINCT ga_session_id) per user_pseudo_id` | Low | Overview — Player Behavior |
| 3 | **Win Rate by Starting Tier** | % wins grouped by first tier of session | Medium | AI Agent tab (bar chart) |
| 4 | **AI Adjustment Count Distribution** | Histogram of adjustments-per-session | Medium | AI Agent tab |
| 5 | **Exact Funnel Completion Rate** | Session-deduped funnel (more accurate than current event counts) | Medium | Game Funnel tab |
| 6 | **Player Engagement Span** | Avg days between first and last session | Low | Overview — Player Behavior |
| 7 | **User Cohort Retention** | Week-over-week retention curve | High | New tab or Overview |

**BigQuery config for all future metrics:**
- Dataset: `analytics_525680032` (note: differs from GA4 property ID `525680332`)
- `maxBytesBilled: '500000000'` (500MB cap)
- Cache TTL: 24h (matches daily export lag)
- Client: `getBigQueryClient()` lazy-load pattern (see `avg-tier` handler in `api/index.js`)

---

*Data Dictionary — NON-X Analytics | Generated June 13, 2026*
