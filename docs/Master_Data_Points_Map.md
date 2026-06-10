# Master Data Points Map — GA4 ↔ Dashboard

**Created:** June 10, 2026
**Purpose:** Single source of truth mapping every GA4 event/dimension to every dashboard component. Shows what's live, what's buildable now, and what needs game-side changes.

**Sources:**
- `docs/GA4_Custom_Dimensions_Reference.md` — 31 registered custom dimensions
- `docs/Dashboard_Data_Audit_June2026.md` — live vs hardcoded inventory
- `api/index.js` — current Lambda endpoints
- `live.html` — dashboard chart/KPI functions

**Note:** Xenon_3 game source not accessible from this machine. Dimension-to-event mappings are based on GA4 Admin registration records. Verify against game source (Xenon_3 repo) when available.

---

## GA4 EVENTS — Complete List

| Event Name | Parameters Sent (from GA4 dims) | Dashboard Usage | Status |
|---|---|---|---|
| `game_start` | `ab_music_group`, `music_variant`, `analytics_version`, `games_played`, `visit_count`, `is_replay` | Sessions KPI, Funnel stage 1 | ✅ Live (standard endpoint) |
| `player_won` | `session_duration_seconds`, `level_reached`, `ab_music_group`, `music_variant`, `analytics_version`, `cycles_completed`, `speed_locked`, `tier`, `effective_multiplier` | Win Rate KPI, Funnel endpoint, A/B test | ✅ Live (standard); Funnel ❌ not built |
| `player_death` | `death_phase`, `level_reached`, `phase`, `session_duration_seconds`, `ab_music_group`, `analytics_version`, `tier` | Death Rate KPI, Wave Drop-off chart | ✅ Live (standard + progression) |
| `wave_reached` | `level_reached`, `phase`, `analytics_version` | Wave Drop-off chart | ✅ Live (progression endpoint) |
| `boss_attempt` | `boss_id`, `phase`, `analytics_version` | Boss Analysis page | ✅ Live (boss-analysis endpoint) |
| `boss_defeated` | `boss_id`, `phase`, `analytics_version` | Boss Analysis page | ✅ Live (boss-analysis endpoint) |
| `ai_difficulty_adjusted` | `tier`, `old_tier`, `new_tier`, `direction`, `tier_multiplier`, `movement_multiplier`, `effective_multiplier`, `level`, `speed_locked`, `cycles_completed`, `analytics_version` | AI Agent tab | ⚠️ Partial (tier dist + flow live; multiplier/score not built) |
| `powerup_collected` | `powerup_type`, `phase`, `analytics_version` | Powerup Collection chart | ✅ Live (powerup-analysis endpoint) |
| `leaderboard_submit` | `rank`, `instagram_provided`, `analytics_version` | Leaderboard Rate KPI | ✅ Live (standard endpoint) |
| `play_again` | `is_replay`, `replay_tier`, `bonus_hp`, `continue`, `analytics_version` | Replay Rate KPI (hardcoded) | ❌ No endpoint built |
| `scorecard_viewed` | `rank`, `tier`, `effective_multiplier`, `analytics_version` | (not displayed) | ❌ Not used in dashboard |
| `music_toggled` | `music_variant`, `analytics_version` | A/B Music toggle rate | ❌ Not used (hardcoded) |
| `returning_user` | `games_played`, `visit_count`, `analytics_version` | New User % KPI (hardcoded) | ❌ No endpoint built |
| `leave_game` | `level_reached`, `phase`, `session_duration_seconds`, `analytics_version` | (abandoned games) | ❌ Not used |
| `first_visit` | `source`, `analytics_version` | (not displayed) | ❌ Not used |
| `session_start` | (GA4 built-in) | Sessions KPI | ✅ Live |
| `game_complete` | `session_duration_seconds`, `analytics_version` | (outcome umbrella event) | ❌ Not used (player_won/death used instead) |
| `survey_submitted` | (unknown params) | (not displayed) | ❌ Not used |

---

## GA4 CUSTOM DIMENSIONS — Full Map to Dashboard

| # | Parameter | Registered | Events That Send It | Dashboard Component | Status |
|---|---|---|---|---|---|
| 1 | `ab_music_group` | Feb 23, 2026 | `game_start`, `player_won`, `player_death` | A/B Music Test cards + funnel | ❌ Endpoint not built |
| 2 | `analytics_version` | Apr 3, 2026 | All events | Version selector filter | ✅ Live (Lambda filter) |
| 3 | `bonus_hp` | Mar 2, 2026 | `play_again` | (not in dashboard) | ❌ Not used |
| 4 | `boss_id` | Feb 27, 2026 | `boss_attempt`, `boss_defeated` | Boss Analysis page | ✅ Live |
| 5 | `continue` | Mar 2, 2026 | `play_again` | (not in dashboard) | ❌ Not used |
| 6 | `cycles_completed` | Apr 3, 2026 | `player_won`, `ai_difficulty_adjusted` | Speed Lock Rate KPI | ❌ Endpoint not built |
| 7 | `death_phase` | Mar 2, 2026 | `player_death` | Death Triggers by Phase chart | ❌ Endpoint not built |
| 8 | `direction` | Apr 3, 2026 | `ai_difficulty_adjusted` | AI Tier Flow chart | ✅ Live |
| 9 | `effective_multiplier` | Apr 3, 2026 | `ai_difficulty_adjusted`, `player_won`, `scorecard_viewed` | Score Multiplier Distribution chart | ❌ Endpoint not built |
| 10 | `phase` | Feb 27, 2026 | `player_death`, `wave_reached`, `powerup_collected` | Wave Drop-off, Powerup chart | ✅ Live (progression + powerup) |
| 11 | `games_played` | Feb 27, 2026 | `game_start`, `returning_user` | Replay Rate KPI (hardcoded `'2.3×'`) | ❌ Endpoint not built |
| 12 | `instagram_provided` | Feb 23, 2026 | `leaderboard_submit` | (not displayed) | ❌ Not used |
| 13 | `is_replay` | Feb 27, 2026 | `game_start`, `play_again` | Replay Rate KPI | ❌ Endpoint not built |
| 14 | `level` | Apr 3, 2026 | `ai_difficulty_adjusted` | (AI tab — not mapped) | ❌ Not used |
| 15 | `level_number` | Feb 27, 2026 | `player_won`, `player_death` | Avg Level KPI (hardcoded `'5.2'`) | ❌ Endpoint not built |
| 16 | `level_reached` | Feb 27, 2026 | `wave_reached`, `player_death`, `player_won` | Wave Drop-off chart, Avg Level KPI | ✅ Live (progression); Avg Level ❌ not aggregated |
| 17 | `movement_group` | Mar 4, 2026 | `game_start`, `player_won`, `player_death` | Movement A/B Test cards (hardcoded) | ❌ Endpoint not built |
| 18 | `movement_multiplier` | Apr 3, 2026 | `ai_difficulty_adjusted` | (not in dashboard) | ❌ Not used |
| 19 | `music_variant` | Feb 27, 2026 | `game_start`, `player_won`, `player_death` | A/B funnel by music variant | ❌ Endpoint not built |
| 20 | `new_tier` | Apr 3, 2026 | `ai_difficulty_adjusted` | AI Tier Distribution chart | ✅ Live |
| 21 | `old_tier` | Apr 3, 2026 | `ai_difficulty_adjusted` | AI Tier Flow chart | ✅ Live |
| 22 | `platform` | Feb 27, 2026 | (platform events) | Platform split (using `deviceCategory` instead) | ⚠️ GA4 built-in used instead |
| 23 | `powerup_type` | Feb 27, 2026 | `powerup_collected` | Powerup Collection chart | ✅ Live |
| 24 | `rank` | Apr 3, 2026 | `leaderboard_submit`, `scorecard_viewed` | (not displayed) | ❌ Not used |
| 25 | `replay_tier` | Mar 2, 2026 | `play_again` | (not in dashboard) | ❌ Not used |
| 26 | `session_duration_seconds` | Feb 27, 2026 | `player_won`, `player_death`, `game_complete` | Survival Time chart, Survival KPI | ✅ Live (survival-time endpoint); KPI ❌ not aggregated |
| 27 | `source` | Feb 27, 2026 | Various UI events | (not displayed) | ❌ Not used |
| 28 | `speed_locked` | Apr 3, 2026 | `player_won`, `ai_difficulty_adjusted` | Speed Lock Rate KPI (shows `'—'`) | ❌ Endpoint not built |
| 29 | `tier` | Apr 3, 2026 | `ai_difficulty_adjusted`, `player_won`, `player_death` | AI Tier Distribution (via new_tier) | ⚠️ new_tier used instead of tier |
| 30 | `tier_multiplier` | Apr 3, 2026 | `ai_difficulty_adjusted` | Score Multiplier Distribution chart | ❌ Endpoint not built |
| 31 | `visit_count` | Feb 27, 2026 | `game_start`, `returning_user` | New User % KPI (hardcoded) | ❌ Endpoint not built |

---

## DASHBOARD COMPONENTS — Build Status

### KPI Cards

| KPI | Current Value | GA4 Dim(s) Needed | Buildable Now? |
|---|---|---|---|
| Sessions | ✅ Live | `session_start` event count | — |
| Win Rate | ✅ Live | `player_won` / `game_start` | — |
| Death Rate | ✅ Live | `player_death` / (`player_won` + `player_death`) | — |
| Leaderboard Rate | ✅ Live | `leaderboard_submit` / `player_won` | — |
| Desktop Win Rate | ✅ Live | `deviceCategory` × `player_won` | — |
| Mobile Win Rate | ✅ Live | `deviceCategory` × `player_won` | — |
| Avg Adjustments (AI) | ✅ Live | `ai_difficulty_adjusted` count | — |
| New User % | ❌ `'—'` | `visit_count` = "1" filter or GA4 built-in `newVsReturning` | ✅ Yes — use `visit_count` |
| Replay Rate | ❌ `'—'` | `is_replay` = "true" on `game_start` events | ✅ Yes — use `is_replay` |
| Avg Survival | ❌ `'—'` | avg(`session_duration_seconds`) on `player_won`+`player_death` | ✅ Yes — extend survival endpoint |
| Avg Level | ❌ `'—'` | avg(`level_reached`) on `player_won`+`player_death` | ✅ Yes — extend progression endpoint |
| Desktop Avg Level | ❌ `'—'` | `level_reached` × `deviceCategory` | ✅ Yes — extend progression endpoint |
| Mobile Avg Level | ❌ `'—'` | `level_reached` × `deviceCategory` | ✅ Yes — extend progression endpoint |
| Avg Starting Tier | ❌ `'—'` | First `ai_difficulty_adjusted` per session | ⚠️ Complex — session-level stitching |
| Avg Final Tier | ❌ `'—'` | Last `ai_difficulty_adjusted` per session | ⚠️ Complex — session-level stitching |
| Speed Lock Rate | ❌ `'—'` | `speed_locked` = "true" on `ai_difficulty_adjusted` or `player_won` | ✅ Yes — use `speed_locked` dim |

---

### Charts

| Chart | Function | Status | GA4 Dims Needed | Buildable Now? |
|---|---|---|---|---|
| Daily Play/Wins | `chartDaily()` | ✅ Live | `date` × `eventName` | — |
| Device Mix | `chartDevice()` | ❌ Hardcoded 54/46 | Already in `DATA.platform` | ✅ Derive from existing data (no endpoint needed) |
| Music A/B Split | `chartABSplit()` | ❌ Hardcoded 51/49 | `ab_music_group` | ✅ Yes — new endpoint |
| Powerup Collection | `chartPowerup()` | ✅ Live | `powerup_type` × `phase` | — |
| Game Funnel | `renderFunnel()` | ❌ Hardcoded | `eventName` sequence | ✅ Yes — new `funnel` endpoint |
| Wave Drop-off | `chartDropoff()` | ✅ Live | `level_reached` × `phase` | — |
| Boss Defeat Rates | `chartBossRatio()` | ✅ Live | `boss_id` × `eventName` | — |
| Boss by Platform | `chartBossPlatform()` | ✅ Live | `boss_id` × `deviceCategory` | — |
| Platform Funnel | `chartPlatformFunnel()` | ⚠️ Partial | `deviceCategory` (boss rates mock) | ✅ Wire existing `DATA.bossAnalysis` |
| Survival Distribution | `chartSurvivalDist()` | ✅ Live | `session_duration_seconds` × `deviceCategory` | — |
| AI Tier Distribution | `chartAITierDist()` | ✅ Live | `new_tier` × `eventName` | — |
| AI Tier Flow | `chartAITierFlow()` | ✅ Live | `direction` × `eventName` | — |
| Score Multiplier Dist | `chartAIScoreMult()` | ❌ All zeros | `effective_multiplier` × `eventName` | ✅ Yes — extend ai-analysis endpoint |
| Tier vs Final Score | `chartAITierScore()` | ❌ All zeros | `tier` × `effective_multiplier` | ✅ Yes — extend ai-analysis endpoint |
| Death Triggers by Phase | `chartAIDeathTriggers()` | ❌ All zeros | `death_phase` on `player_death` | ✅ Yes — extend ai-analysis or progression endpoint |

---

### Tables

| Table | Function | Status | Fix Needed |
|---|---|---|---|
| Boss Table | `buildBossTable()` | ✅ Live | — |
| Platform Table | `buildPlatformTable()` | ⚠️ Partial | Avg level/survival columns hardcoded |
| A/B Music Cards | `buildABCards()` | ❌ All hardcoded | New `ab-analysis` endpoint |
| A/B Movement Cards | `buildABCards()` | ❌ All hardcoded | New `ab-analysis` endpoint |
| A/B Significance Table | (inline HTML) | ❌ All hardcoded | New `ab-analysis` endpoint |
| Funnel Conversion Table | `buildFunnelTable()` | ❌ All hardcoded | New `funnel` endpoint |
| AI Tier Metrics Table | `buildAITierTable()` | ❌ Empty | Complex multi-dim query |

---

## WHAT'S BUILDABLE RIGHT NOW (No game changes needed)

All of these use **already-registered GA4 dimensions** — just need new Lambda handlers and parser code:

### Priority 1 — Quick (< 2 hours each)
| Task | Fix | Dimensions Used |
|---|---|---|
| Device Mix chart | Derive from `DATA.platform` session counts | None (data already fetched) |
| Boss rates in Platform Funnel | Wire `DATA.bossAnalysis` to `chartPlatformFunnel()` | None (data already fetched) |
| Speed Lock Rate KPI | New query: `speed_locked` on `ai_difficulty_adjusted` or `player_won` | `speed_locked` |
| Death Triggers by Phase chart | New query: `death_phase` on `player_death` | `death_phase` |
| Score Multiplier Distribution chart | Extend ai-analysis: add `effective_multiplier` dim | `effective_multiplier` |

### Priority 2 — Medium (2–4 hours each)
| Task | Fix | Dimensions Used |
|---|---|---|
| Avg Level KPI + platform cols | Extend progression endpoint: add avg of `level_reached` | `level_reached` (already queried) |
| Avg Survival KPI | Extend survival endpoint: compute average across buckets | `session_duration_seconds` (already queried) |
| Replay Rate KPI | New query: `is_replay` = "true" count / total `game_start` | `is_replay` |
| New User % KPI | New query: `visit_count` = "1" count / total `game_start` | `visit_count` |
| Tier vs Final Score chart | Extend ai-analysis: add `tier` × `effective_multiplier` | `tier`, `effective_multiplier` |

### Priority 3 — Larger (4–8 hours each)
| Task | Fix | Dimensions Used |
|---|---|---|
| Game Funnel | New `funnel` subType endpoint | `eventName` sequence |
| Music A/B Test | New `ab-analysis` endpoint filtered by `ab_music_group` | `ab_music_group`, `music_variant` |
| Movement A/B Test | Extend ab-analysis: add `movement_group` | `movement_group` |
| A/B Significance Table | Calculate from live A/B data | All A/B dims |

### Not feasible (complex session-level queries)
| Task | Problem | Possible Solution |
|---|---|---|
| Avg Starting/Final Tier KPI | Requires first/last event per session — GA4 API aggregates across sessions | GA4 BigQuery export |
| AI Tier Metrics table | Per-tier win rate, avg level, avg time all require session joins | GA4 BigQuery export |

---

## GAME SOURCE VERIFICATION NEEDED

**Xenon_3 repo not accessible from this machine.** Before building new endpoints, verify these parameters are actually being sent by the game:

| Dimension | Sent On | Verify in Xenon_3 |
|---|---|---|
| `death_phase` | `player_death` | Confirm `death_phase` param present |
| `speed_locked` | `player_won`, `ai_difficulty_adjusted` | Confirm `speed_locked` param present |
| `effective_multiplier` | `ai_difficulty_adjusted` | Confirm value range 0.50–2.19 |
| `is_replay` | `game_start` | Confirm boolean flag sent |
| `visit_count` | `game_start` | Confirm counter increments correctly |
| `ab_music_group` | `game_start`, `player_won`, `player_death` | Confirm group assignment consistent |
| `movement_group` | `game_start`, `player_won` | Confirm all events send this param |

**How to verify:** Open Xenon_3 source → search for `gtag(` or analytics calls → check params object for each event.

---

## SUMMARY: PATH TO 100% LIVE DASHBOARD

| Phase | Tasks | Effort | Live % After |
|---|---|---|---|
| **Current** | — | — | ~50% |
| **Quick wins** | Device mix, boss platform rates, death triggers, score multiplier | 4–6 hrs | ~58% |
| **Medium** | Avg level, avg survival, replay rate, new user %, speed lock, tier scores | 8–12 hrs | ~72% |
| **Large** | Funnel endpoint, A/B test endpoints | 8–12 hrs | ~90% |
| **Complex** | Avg start/final tier, tier metrics table | BigQuery needed | ~95% |
