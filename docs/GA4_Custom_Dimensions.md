# NON-X Analytics — GA4 Custom Dimensions Reference

**Purpose:** Source of truth for all GA4 custom dimensions registered in the NON-X analytics property. Cross-reference when building API queries, parsing Lambda responses, or debugging `(not set)` values.

**Last Updated:** June 28, 2026 (Session 13 — DebugView verified: 15 custom events; 2 pending: player_won, survey_submitted)

**Total dimensions:** 31 (all Event-scoped)

**GA4 Property:** `analytics_525680032`

---

## All Custom Dimensions (A–Z)

| Dimension Name | Description | Scope | GA4 Parameter Key | Last Changed |
|----------------|-------------|-------|-------------------|--------------|
| AB Music Group | A/B test group for music default setting | Event | `ab_music_group` | Feb 23, 2026 |
| Analytics Version | Analytics Version 4.3 - AI Agent tracking enabled | Event | `analytics_version` | Apr 3, 2026 |
| Bonus HP | HP bonus granted on replay (15, 25, or 50) | Event | `bonus_hp` | Mar 2, 2026 |
| Boss ID | Which boss did the player reach? Coordinates with phase (green/red/purple) | Event | `boss_id` | Feb 27, 2026 |
| Continue | true = Resume Level X, false = Play Again | Event | `continue` | Mar 2, 2026 |
| Cycles Completed | Track how many full cycles players complete | Event | `cycles_completed` | Apr 3, 2026 |
| Death Phase | Phase player was in when they died | Event | `death_phase` | Mar 2, 2026 |
| Direction | Tier adjustment direction (increase or decrease) | Event | `direction` | Apr 3, 2026 |
| Effective Multiplier | Combined tier × movement multiplier | Event | `effective_multiplier` | Apr 3, 2026 |
| Game Phase | Which phase are players having difficulty completing? | Event | `phase` | Feb 27, 2026 |
| Games Played | How many games has the player played? | Event | `games_played` | Feb 27, 2026 |
| Instagram Provided | Did the player provide and submit their instagram handle and score | Event | `instagram_provided` | Feb 23, 2026 |
| Is Replay | Did the player play again? | Event | `is_replay` | Feb 27, 2026 |
| Level | Current level when ai_difficulty_adjusted fires | Event | `level` | Apr 3, 2026 |
| Level Number | Which level did the player end on? | Event | `level_number` | Feb 27, 2026 |
| Level Reached | Which level are players consistently dying on? | Event | `level_reached` | Feb 27, 2026 |
| Movement Group | Which control parameter did the player choose? | Event | `movement_group` | Mar 4, 2026 |
| Movement Multiplier | Score multiplier based on movement scheme | Event | `movement_multiplier` | Apr 3, 2026 |
| Music Variant | Actual music state when the event fired: 'on' or 'off'. Phase 2 will add track identifiers. | Event | `music_variant` | Feb 27, 2026 |
| New Tier | New tier after AI adjustment | Event | `new_tier` | Apr 3, 2026 |
| Old Tier | Previous tier before AI adjustment | Event | `old_tier` | Apr 3, 2026 |
| Platform | Which version of the game the player is using: 'desktop' or 'mobile' | Event | `platform` | Feb 27, 2026 |
| Powerup Type | Which powerups are players gathering the most? | Event | `powerup_type` | Feb 27, 2026 |
| Rank | Global leaderboard position (1-25) when game ended. Null if not in top 25. | Event | `rank` | Feb 27, 2026 |
| Replay Tier | Replay incentive tier applied (1-4) | Event | `replay_tier` | Mar 2, 2026 |
| Session Duration Seconds | How long is the player engaged with the game? | Event | `session_duration_seconds` | Feb 27, 2026 |
| Source | Where the action originated: 'game_over' or 'victory'. Used on leave_game events. | Event | `source` | Feb 27, 2026 |
| Speed Locked | Speed ratchet active after first cycle (true or false). Speed locked prevents players from slowing down. | Event | `speed_locked` | Apr 3, 2026 |
| Tier | Current difficulty tier (-3 to +3) at time of event | Event | `tier` | Apr 3, 2026 |
| Tier Multiplier | Score multiplier based on tier (0.50 to 1.75) | Event | `tier_multiplier` | Apr 3, 2026 |
| Visit Count | How many times has a player visited the site | Event | `visit_count` | Feb 27, 2026 |

---

## Parameters Used by Dashboard API (api/index.js)

| Dashboard Metric | GA4 Query Dimension | Status |
|-----------------|---------------------|--------|
| Death Triggers chart | `customEvent:death_phase` | ⚠️ Fix deployed to Xenon_3 `dev` — pending merge to `main` + 24-48h GA4 propagation |
| Replay Rate | `customEvent:is_replay` | ✅ FIXED — DebugView verified June 28, 2026: `'false'` on fresh start, `'true'` on play_again |
| Music A/B split | `customEvent:ab_music_group` | ✅ Returns data |
| Platform split | `customEvent:platform` | ✅ Returns data |
| AI Tier adjustments | `customEvent:tier`, `customEvent:new_tier`, `customEvent:old_tier` | ✅ Returns data |

---

## DebugView Verified Event Parameters (June 28, 2026)

### `player_death` — COMPLETE parameter list, verified in DebugView (June 28, 2026)

Two screenshots captured (scrolled top + bottom of same event). All 20 parameters fully documented.

| Parameter | Value(s) Seen | Custom Dimension | Type | Notes |
|-----------|--------------|-----------------|------|-------|
| `ab_music_group` | (string) | AB Music Group | Custom | ✅ Sending |
| `analytics_version` | (string) | Analytics Version | Custom | ✅ Sending |
| `batch_ordering_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `batch_page_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `death_phase` | `green`, `red`, `purple` | Death Phase | Custom | ✅ FIXED — verified on dev; absent on main until PR dev → main |
| `debug_mode` | (present in dev only) | — | GA4 auto | Only when gtag debug mode active |
| `engagement_time_msec` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ga_session_number` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ignore_referrer` | (auto) | — | GA4 auto | GA4 auto-collected |
| `level_reached` | (integer) | Level Reached | Custom | ✅ Sending |
| `movement_group` | (string) | Movement Group | Custom | ✅ Sending |
| `music_variant` | `on` / `off` | Music Variant | Custom | ✅ Sending |
| `page_location` | (URL) | — | GA4 auto | GA4 auto-collected |
| `page_referrer` | (URL) | — | GA4 auto | GA4 auto-collected |
| `page_title` | (string) | — | GA4 auto | GA4 auto-collected |
| `phase` | `red`, `green`, `purple` | Game Phase | Custom | ✅ Sending — verified on main + dev |
| `platform` | `desktop` / `mobile` | Platform | Custom | ✅ Sending |
| `score` | (integer) | — | Custom | ✅ Sending |
| `score_multiplier` | (float) | — | Custom | ✅ Sending |
| `session_duration_seconds` | (integer) | Session Duration Seconds | Custom | ✅ Sending |

**Total: 20 parameters** (10 custom, 8 GA4 auto-collected, 2 dev-only)

**Important:** `phase` (Game Phase dimension, key `phase`) and `death_phase` (Death Phase dimension, key `death_phase`) are **two separate registered dimensions**. The dashboard Death Triggers chart queries `customEvent:death_phase` — which requires the `death_phase` parameter, not `phase`.

---

### `game_start` — COMPLETE parameter list, verified in DebugView (June 28, 2026)

Two captures combined (fresh start + play_again replay) for full parameter list.

| Parameter | Value(s) Seen | Custom Dimension | Type | Notes |
|-----------|--------------|-----------------|------|-------|
| `ab_music_group` | (string) | AB Music Group | Custom | ✅ Sending |
| `analytics_version` | (string) | Analytics Version | Custom | ✅ Sending |
| `batch_ordering_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `batch_page_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `debug_mode` | (dev only) | — | GA4 auto | Only when gtag debug mode active |
| `engagement_time_msec` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ga_session_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ga_session_number` | (auto) | — | GA4 auto | GA4 auto-collected |
| `games_played` | (integer) | Games Played | Custom | ✅ Sending — total games played by this user |
| `ignore_referrer` | (auto) | — | GA4 auto | GA4 auto-collected |
| `is_replay` | `'true'`, `'false'` | Is Replay | Custom | ✅ FIXED — string values verified; `'true'` on play_again, `'false'` on fresh start |
| `movement_group` | (string) | Movement Group | Custom | ✅ Sending |
| `music_variant` | `on` / `off` | Music Variant | Custom | ✅ Sending |
| `page_location` | (URL) | — | GA4 auto | GA4 auto-collected |
| `page_referrer` | (URL) | — | GA4 auto | GA4 auto-collected |
| `page_title` | (string) | — | GA4 auto | GA4 auto-collected |
| `platform` | `desktop` / `mobile` | Platform | Custom | ✅ Sending |
| `score_multiplier` | (float) | — | Custom (unregistered) | ✅ Sending — not a registered custom dimension |

**Fix history:** `is_replay` was previously sent as JavaScript boolean `false`. gtag() silently drops falsy values, causing `(not set)` for all non-replay starts. Fixed June 27, 2026 — changed to `isReplay ? 'true' : 'false'`.

---

### `menu_view` — COMPLETE parameter list, verified in DebugView (June 28, 2026)

| Parameter | Value(s) Seen | Custom Dimension | Type | Notes |
|-----------|--------------|-----------------|------|-------|
| `ab_music_group` | (string) | AB Music Group | Custom | ✅ Sending |
| `analytics_version` | (string) | Analytics Version | Custom | ✅ Sending |
| `batch_ordering_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `batch_page_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `debug_mode` | (dev only) | — | GA4 auto | Only when gtag debug mode active |
| `ga_session_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ga_session_number` | (auto) | — | GA4 auto | GA4 auto-collected |
| `music_variant` | `on` / `off` | Music Variant | Custom | ✅ Sending |
| `page_location` | (URL) | — | GA4 auto | GA4 auto-collected |
| `page_title` | (string) | — | GA4 auto | GA4 auto-collected |
| `platform` | `desktop` / `mobile` | Platform | Custom | ✅ Sending |
| `referrer` | `direct` | — | Custom (unregistered) | ⚠️ Sending but NOT registered as a custom dimension — value `direct` confirmed |

**Note:** `referrer` parameter is firing but has no corresponding registered GA4 custom dimension. Currently unqueryable via API.

---

### `play_clicked` — COMPLETE parameter list, verified in DebugView (June 28, 2026)

| Parameter | Value(s) Seen | Custom Dimension | Type | Notes |
|-----------|--------------|-----------------|------|-------|
| `ab_music_group` | (string) | AB Music Group | Custom | ✅ Sending |
| `analytics_version` | (string) | Analytics Version | Custom | ✅ Sending |
| `batch_ordering_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `batch_page_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `debug_mode` | (dev only) | — | GA4 auto | Only when gtag debug mode active |
| `engagement_time_msec` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ga_session_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ga_session_number` | (auto) | — | GA4 auto | GA4 auto-collected |
| `music_variant` | `on` / `off` | Music Variant | Custom | ✅ Sending |
| `page_location` | (URL) | — | GA4 auto | GA4 auto-collected |
| `page_title` | (string) | — | GA4 auto | GA4 auto-collected |
| `platform` | `desktop` / `mobile` | Platform | Custom | ✅ Sending |

---

### `session_start` — COMPLETE parameter list, verified in DebugView (June 28, 2026)

GA4 auto-collected event — fires once per session on first page load.

| Parameter | Value(s) Seen | Custom Dimension | Type | Notes |
|-----------|--------------|-----------------|------|-------|
| `ab_music_group` | (string) | AB Music Group | Custom | ✅ Sending |
| `analytics_version` | (string) | Analytics Version | Custom | ✅ Sending |
| `batch_ordering_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `batch_page_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `debug_mode` | (dev only) | — | GA4 auto | Only when gtag debug mode active |
| `engagement_time_msec` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ga_session_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ga_session_number` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ignore_referrer` | (auto) | — | GA4 auto | GA4 auto-collected |
| `music_variant` | `on` / `off` | Music Variant | Custom | ✅ Sending |
| `page_location` | (URL) | — | GA4 auto | GA4 auto-collected |
| `page_referrer` | (URL) | — | GA4 auto | GA4 auto-collected |
| `page_title` | (string) | — | GA4 auto | GA4 auto-collected |
| `platform` | `desktop` / `mobile` | Platform | Custom | ✅ Sending |

---

### `returning_user` — COMPLETE parameter list, verified in DebugView (June 28, 2026)

Custom event — fires when a returning player is detected on session start.

| Parameter | Value(s) Seen | Custom Dimension | Type | Notes |
|-----------|--------------|-----------------|------|-------|
| `ab_music_group` | (string) | AB Music Group | Custom | ✅ Sending |
| `analytics_version` | (string) | Analytics Version | Custom | ✅ Sending |
| `batch_ordering_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `batch_page_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `debug_mode` | (dev only) | — | GA4 auto | Only when gtag debug mode active |
| `engagement_time_msec` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ga_session_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ga_session_number` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ignore_referrer` | (auto) | — | GA4 auto | GA4 auto-collected |
| `music_variant` | `on` / `off` | Music Variant | Custom | ✅ Sending |
| `page_location` | (URL) | — | GA4 auto | GA4 auto-collected |
| `page_referrer` | (URL) | — | GA4 auto | GA4 auto-collected |
| `page_title` | (string) | — | GA4 auto | GA4 auto-collected |
| `platform` | `desktop` / `mobile` | Platform | Custom | ✅ Sending |
| `visit_count` | (integer) | Visit Count | Custom | ✅ Sending — increments each return visit |

---

### `wave_reached` — COMPLETE parameter list, verified in DebugView (June 28, 2026)

Fires each time the player completes a wave.

| Parameter | Value(s) Seen | Custom Dimension | Type | Notes |
|-----------|--------------|-----------------|------|-------|
| `ab_music_group` | (string) | AB Music Group | Custom | ✅ Sending |
| `analytics_version` | (string) | Analytics Version | Custom | ✅ Sending |
| `batch_ordering_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `batch_page_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `debug_mode` | (dev only) | — | GA4 auto | Only when gtag debug mode active |
| `engagement_time_msec` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ga_session_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ga_session_number` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ignore_referrer` | (auto) | — | GA4 auto | GA4 auto-collected |
| `level_number` | (integer) | Level Number | Custom | ✅ Sending — which level player completed |
| `music_variant` | `on` / `off` | Music Variant | Custom | ✅ Sending |
| `page_location` | (URL) | — | GA4 auto | GA4 auto-collected |
| `page_referrer` | (URL) | — | GA4 auto | GA4 auto-collected |
| `page_title` | (string) | — | GA4 auto | GA4 auto-collected |
| `phase` | `green`, `red`, `purple` | Game Phase | Custom | ✅ Sending — phase when wave completed |
| `platform` | `desktop` / `mobile` | Platform | Custom | ✅ Sending |
| `score` | (integer) | — | Custom (unregistered) | ✅ Sending — not a registered custom dimension |
| `score_multiplier` | (float) | — | Custom (unregistered) | ✅ Sending — not a registered custom dimension |

---

### `game_complete` — COMPLETE parameter list, verified in DebugView (June 28, 2026)

Fires on every game end (death or win). `outcome` parameter distinguishes win vs loss.

| Parameter | Value(s) Seen | Custom Dimension | Type | Notes |
|-----------|--------------|-----------------|------|-------|
| `ab_music_group` | (string) | AB Music Group | Custom | ✅ Sending |
| `analytics_version` | (string) | Analytics Version | Custom | ✅ Sending |
| `batch_ordering_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `batch_page_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `debug_mode` | (dev only) | — | GA4 auto | Only when gtag debug mode active |
| `engagement_time_msec` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ga_session_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ga_session_number` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ignore_referrer` | (auto) | — | GA4 auto | GA4 auto-collected |
| `level_reached` | (integer) | Level Reached | Custom | ✅ Sending |
| `movement_group` | (string) | Movement Group | Custom | ✅ Sending |
| `music_variant` | `on` / `off` | Music Variant | Custom | ✅ Sending |
| `outcome` | (string, e.g. `win`/`loss`) | — | Custom (unregistered) | ⚠️ Sending but NOT registered as a custom dimension — unqueryable via API |
| `page_location` | (URL) | — | GA4 auto | GA4 auto-collected |
| `page_referrer` | (URL) | — | GA4 auto | GA4 auto-collected |
| `page_title` | (string) | — | GA4 auto | GA4 auto-collected |
| `platform` | `desktop` / `mobile` | Platform | Custom | ✅ Sending |
| `score` | (integer) | — | Custom (unregistered) | ✅ Sending — not a registered custom dimension |
| `session_duration_seconds` | (integer) | Session Duration Seconds | Custom | ✅ Sending |

**⚠️ Action item:** `outcome` is valuable (distinguishes wins from losses) but unregistered. To query via API, register it as a custom dimension in GA4 Admin → Custom definitions.

---

### `boss_attempt` — COMPLETE parameter list, verified in DebugView (June 28, 2026)

Fires when a boss fight begins.

| Parameter | Value(s) Seen | Custom Dimension | Type | Notes |
|-----------|--------------|-----------------|------|-------|
| `ab_music_group` | (string) | AB Music Group | Custom | ✅ Sending |
| `analytics_version` | (string) | Analytics Version | Custom | ✅ Sending |
| `batch_ordering_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `batch_page_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `boss_id` | (string/integer) | Boss ID | Custom | ✅ Sending — identifies which boss |
| `debug_mode` | (dev only) | — | GA4 auto | Only when gtag debug mode active |
| `engagement_time_msec` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ga_session_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ga_session_number` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ignore_referrer` | (auto) | — | GA4 auto | GA4 auto-collected |
| `level_reached` | (integer) | Level Reached | Custom | ✅ Sending |
| `music_variant` | `on` / `off` | Music Variant | Custom | ✅ Sending |
| `page_location` | (URL) | — | GA4 auto | GA4 auto-collected |
| `page_referrer` | (URL) | — | GA4 auto | GA4 auto-collected |
| `page_title` | (string) | — | GA4 auto | GA4 auto-collected |
| `platform` | `desktop` / `mobile` | Platform | Custom | ✅ Sending |
| `score` | (integer) | — | Custom (unregistered) | ✅ Sending — not a registered custom dimension |
| `session_duration_seconds` | (integer) | Session Duration Seconds | Custom | ✅ Sending |

---

### `boss_defeated` — COMPLETE parameter list, verified in DebugView (June 28, 2026)

Fires when a boss is defeated. Same as `boss_attempt` plus `score_multiplier`.

| Parameter | Value(s) Seen | Custom Dimension | Type | Notes |
|-----------|--------------|-----------------|------|-------|
| `ab_music_group` | (string) | AB Music Group | Custom | ✅ Sending |
| `analytics_version` | (string) | Analytics Version | Custom | ✅ Sending |
| `batch_ordering_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `batch_page_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `boss_id` | (string/integer) | Boss ID | Custom | ✅ Sending — identifies which boss was defeated |
| `debug_mode` | (dev only) | — | GA4 auto | Only when gtag debug mode active |
| `engagement_time_msec` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ga_session_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ga_session_number` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ignore_referrer` | (auto) | — | GA4 auto | GA4 auto-collected |
| `level_reached` | (integer) | Level Reached | Custom | ✅ Sending |
| `music_variant` | `on` / `off` | Music Variant | Custom | ✅ Sending |
| `page_location` | (URL) | — | GA4 auto | GA4 auto-collected |
| `page_referrer` | (URL) | — | GA4 auto | GA4 auto-collected |
| `page_title` | (string) | — | GA4 auto | GA4 auto-collected |
| `platform` | `desktop` / `mobile` | Platform | Custom | ✅ Sending |
| `score` | (integer) | — | Custom (unregistered) | ✅ Sending — not a registered custom dimension |
| `score_multiplier` | (float) | — | Custom (unregistered) | ✅ Sending — not a registered custom dimension |
| `session_duration_seconds` | (integer) | Session Duration Seconds | Custom | ✅ Sending |

---

### `powerup_collected` — COMPLETE parameter list, verified in DebugView (June 28, 2026)

Fires when a player collects a powerup during gameplay.

| Parameter | Value(s) Seen | Custom Dimension | Type | Notes |
|-----------|--------------|-----------------|------|-------|
| `ab_music_group` | (string) | AB Music Group | Custom | ✅ Sending |
| `analytics_version` | (string) | Analytics Version | Custom | ✅ Sending |
| `batch_ordering_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `batch_page_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `debug_mode` | (dev only) | — | GA4 auto | Only when gtag debug mode active |
| `engagement_time_msec` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ga_session_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ga_session_number` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ignore_referrer` | (auto) | — | GA4 auto | GA4 auto-collected |
| `level_number` | (integer) | Level Number | Custom | ✅ Sending — level when powerup was collected |
| `music_variant` | `on` / `off` | Music Variant | Custom | ✅ Sending |
| `page_location` | (URL) | — | GA4 auto | GA4 auto-collected |
| `page_referrer` | (URL) | — | GA4 auto | GA4 auto-collected |
| `page_title` | (string) | — | GA4 auto | GA4 auto-collected |
| `phase` | `green`, `red`, `purple` | Game Phase | Custom | ✅ Sending — phase when powerup collected |
| `platform` | `desktop` / `mobile` | Platform | Custom | ✅ Sending |
| `powerup_type` | (string) | Powerup Type | Custom | ✅ Sending — which powerup was collected |
| `score` | (integer) | — | Custom (unregistered) | ✅ Sending — not a registered custom dimension |

---

### `first_visit` — COMPLETE parameter list, verified in DebugView (June 28, 2026)

GA4 auto-collected event — fires once ever on first page load for a new user.

| Parameter | Value(s) Seen | Custom Dimension | Type | Notes |
|-----------|--------------|-----------------|------|-------|
| `ab_music_group` | (string) | AB Music Group | Custom | ✅ Sending |
| `analytics_version` | (string) | Analytics Version | Custom | ✅ Sending |
| `batch_ordering_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `batch_page_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `debug_mode` | (dev only) | — | GA4 auto | Only when gtag debug mode active |
| `engagement_time_msec` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ga_session_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ga_session_number` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ignore_referrer` | (auto) | — | GA4 auto | GA4 auto-collected |
| `music_variant` | `on` / `off` | Music Variant | Custom | ✅ Sending |
| `page_location` | (URL) | — | GA4 auto | GA4 auto-collected |
| `page_referrer` | (URL) | — | GA4 auto | GA4 auto-collected |
| `page_title` | (string) | — | GA4 auto | GA4 auto-collected |
| `platform` | `desktop` / `mobile` | Platform | Custom | ✅ Sending |

---

### `ai_difficulty_adjusted` — parameter list, verified in DebugView (June 28, 2026)

Fires automatically when the AI adjusts the difficulty tier mid-game. **Notable: `ab_music_group` is NOT sent on this event** — list starts at `analytics_version`.

| Parameter | Value(s) Seen | Custom Dimension | Type | Notes |
|-----------|--------------|-----------------|------|-------|
| `analytics_version` | (string) | Analytics Version | Custom | ✅ Sending |
| `batch_ordering_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `batch_page_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `debug_mode` | (dev only) | — | GA4 auto | Only when gtag debug mode active |
| `direction` | `increase` / `decrease` | Direction | Custom | ✅ Sending — which way tier adjusted |
| `engagement_time_msec` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ga_session_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ga_session_number` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ignore_referrer` | (auto) | — | GA4 auto | GA4 auto-collected |
| `level` | (integer) | Level | Custom | ✅ Sending — level when adjustment fired |
| `new_tier` | (integer, -3 to +3) | New Tier | Custom | ✅ Sending |
| `old_tier` | (integer, -3 to +3) | Old Tier | Custom | ✅ Sending |
| `page_location` | (URL) | — | GA4 auto | GA4 auto-collected |
| `page_referrer` | (URL) | — | GA4 auto | GA4 auto-collected |
| `page_title` | (string) | — | GA4 auto | GA4 auto-collected |
| `phase` | `green`, `red`, `purple` | Game Phase | Custom | ✅ Sending |
| `speed_locked` | `true` / `false` | Speed Locked | Custom | ✅ Sending — whether speed ratchet is active |

**Note:** `ab_music_group` is absent from this event. Additional params (`tier`, `tier_multiplier`, `effective_multiplier`, `movement_multiplier`, `cycles_completed`) may also be present but were not visible in the two screenshots captured — scroll may have been cut off below `speed_locked`.

---

## Events Observed in DebugView (last 30 mins, June 28, 2026)

These are all event names confirmed firing in real sessions:

| Event Name | Max Count (30min) | Notes |
|------------|------------------|-------|
| `wave_reached` | 16 | High frequency — fires each wave |
| `game_complete` | 7 | Fires on game end (win or loss) |
| `game_start` | 5 | Fresh start + replays |
| `scroll` | 5 | Auto-collected by GA4 |
| `user_engagement` | 4 | Auto-collected by GA4 |
| `player_death` | 5 | Fires on death |
| `play_again` | 3 | Replay button clicked |
| `menu_view` | 3 | Main menu displayed |
| `play_clicked` | 2 | Play button clicked |
| `returning_user` | 2 | Returning player detected |
| `session_start` | 2 | Auto-collected by GA4 |
| `boss_attempt` | 2 | Boss encounter started |
| `powerup_collected` | (seen) | Powerup gathered |
| `survey_submitted` | (seen) | Instagram/survey form submitted |
| `leave_game` | (seen) | Player exited game |

**User Property observed:** `non_personalized_ads` — GA4 auto-collected consent signal.

---

---

### `leave_game` — COMPLETE parameter list, verified in DebugView (June 28, 2026)

Fires when the player exits to menu after a game ends. Fires immediately after `game_complete` in the event stream. `source` distinguishes how the game ended.

| Parameter | Value(s) Seen | Custom Dimension | Type | Notes |
|-----------|--------------|-----------------|------|-------|
| `ab_music_group` | (string) | AB Music Group | Custom | ✅ Sending |
| `analytics_version` | (string) | Analytics Version | Custom | ✅ Sending |
| `batch_ordering_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `batch_page_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `debug_mode` | (dev only) | — | GA4 auto | Only when gtag debug mode active |
| `ga_session_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ga_session_number` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ignore_referrer` | (auto) | — | GA4 auto | GA4 auto-collected |
| `music_variant` | `on` / `off` | Music Variant | Custom | ✅ Sending |
| `page_location` | (URL) | — | GA4 auto | GA4 auto-collected |
| `page_referrer` | (URL) | — | GA4 auto | GA4 auto-collected |
| `page_title` | (string) | — | GA4 auto | GA4 auto-collected |
| `platform` | `desktop` / `mobile` | Platform | Custom | ✅ Sending |
| `score` | (integer) | — | Custom (unregistered) | ✅ Sending — not a registered custom dimension |
| `source` | `game_over`, `victory` | Source | Custom | ✅ Sending — distinguishes death exit vs win exit |

**Notable absences vs other events:** `engagement_time_msec` and `movement_group` are NOT sent on `leave_game`.

**Event sequence:** `game_complete` fires first, then `leave_game` fires ~1 second later when player returns to menu.

---

### `play_again` — COMPLETE parameter list, verified in DebugView (June 28, 2026)

Fires when the player clicks Play Again after dying. Rich event — captures death context, replay incentive, and whether it's a fresh start or level resume.

| Parameter | Value(s) Seen | Custom Dimension | Type | Notes |
|-----------|--------------|-----------------|------|-------|
| `ab_music_group` | (string) | AB Music Group | Custom | ✅ Sending |
| `analytics_version` | (string) | Analytics Version | Custom | ✅ Sending |
| `batch_ordering_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `batch_page_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `bonus_hp` | `15`, `25`, or `50` | Bonus HP | Custom | ✅ Sending — HP bonus granted on replay, varies by tier |
| `continue` | `false` | Continue | Custom | ✅ Sending — `false` = Play Again (fresh start); `true` = Resume Level X |
| `death_phase` | `green`, `red`, `purple` | Death Phase | Custom | ✅ Sending — phase player was in when they died (confirms fix works on dev) |
| `debug_mode` | (dev only) | — | GA4 auto | Only when gtag debug mode active |
| `engagement_time_msec` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ga_session_id` | (auto) | — | GA4 auto | GA4 auto-collected |
| `ignore_referrer` | (auto) | — | GA4 auto | GA4 auto-collected |
| `level_reached` | (integer) | Level Reached | Custom | ✅ Sending — level player reached before dying |
| `movement_group` | (string) | Movement Group | Custom | ✅ Sending |
| `music_variant` | `on` / `off` | Music Variant | Custom | ✅ Sending |
| `page_location` | (URL) | — | GA4 auto | GA4 auto-collected |
| `page_referrer` | (URL) | — | GA4 auto | GA4 auto-collected |
| `page_title` | (string) | — | GA4 auto | GA4 auto-collected |
| `platform` | `desktop` / `mobile` | Platform | Custom | ✅ Sending |
| `replay_tier` | `1`, `2`, `3`, `4` | Replay Tier | Custom | ✅ Sending — replay incentive tier applied; value `1` confirmed |
| `score` | (integer) | — | Custom (unregistered) | ✅ Sending — score at time of death |

**Notable:** `death_phase` appears on `play_again` as well as `player_death` — providing a second data point confirming which phase the player died in. `continue: false` distinguishes Play Again (level 1 restart) from Resume Level X (`continue: true`).

---

### `player_won` — PENDING

Not yet captured in DebugView — requires completing a full game run. Expected parameters: similar to `game_complete` with win-specific values.

---

### `survey_submitted` — PENDING

Not yet captured in DebugView — requires submitting Instagram handle on leaderboard. Expected parameters: `ab_music_group`, `analytics_version`, `instagram_provided`, `platform`, `rank`.

---

## GA4 Auto-Collected Events — Metric Opportunities

These events fire automatically without any game code. They appear in DebugView and are available for dashboard metrics today — no new tracking implementation needed.

| Event | Trigger | Key Parameters | Potential Dashboard Metric |
|-------|---------|---------------|--------------------------|
| `user_engagement` | Fires after 1+ second of active engagement on page | `engagement_time_msec`, `ga_session_id` | **Total engagement time**, avg time on page per session |
| `scroll` | Fires once at 90% page scroll depth | `page_location`, `ga_session_id` | **Scroll depth rate** — % of visitors who scroll full page (engagement funnel) |
| `session_start` | First event of every session | `ga_session_id`, `ga_session_number` | **Sessions over time**, new vs returning session volume |
| `first_visit` | Fires once ever per new user | `ga_session_id` | **New user acquisition rate**, first-visit trends |
| `page_view` | Every page load | `page_location`, `page_referrer`, `page_title` | **Traffic source**, direct vs referral breakdown |

**⚠️ Flagged for dashboard — `user_engagement`:**
- `engagement_time_msec` is sent on every `user_engagement` event
- Could power a **"Avg Session Duration"** KPI on the dashboard Overview tab
- Queryable today via GA4 Data API: `eventName == 'user_engagement'`, metric `eventCount`, dimension `customEvent:engagement_time_msec`
- No custom dimension registration needed — `engagement_time_msec` is a standard GA4 parameter

**⚠️ Flagged for dashboard — `scroll`:**
- Tracks what % of dashboard visitors actually scroll to see charts below the fold
- Could surface which tabs/sections have low scroll-through rates
- Queryable via `eventName == 'scroll'` — count of sessions where scroll fired vs total sessions

---

## Known Issues (updated June 28, 2026)

### `death_phase` — fix verified on dev, pending merge to main

- **Dimension registered:** ✅ Yes (Mar 2, 2026)
- **Expected values:** `green`, `red`, `purple`
- **Root cause:** Game was sending `phase` (Game Phase dimension) not `death_phase` (Death Phase dimension) — two different GA4 parameter keys
- **Fix:** Added `'death_phase': purplePhase ? 'purple' : redPhase ? 'red' : 'green'` alongside `'phase'` in `player_death` fireEvent calls in `game.html` and `game_mobile.html`
- **Deploy status:** Merged to Xenon_3 `dev` branch, CI passed ✅ — **pending PR dev → main**
- **DebugView (June 28, 2026):** `death_phase: 'green'` ✅ CONFIRMED on dev build. Live game (main) still absent — expected.
- **Impact:** Death Triggers chart empty — will populate after dev → main merge + 24-48h GA4 propagation

### `is_replay` — ✅ FIXED (June 27, 2026)

- **Dimension registered:** ✅ Yes (Feb 27, 2026)
- **Root cause:** JavaScript boolean `false` silently dropped by gtag() — only `true` (replays) was ever recorded
- **Fix:** Changed to `isReplay ? 'true' : 'false'` — always sends a non-empty string
- **DebugView verified:** `is_replay: 'false'` on fresh `game_start` ✅ | `is_replay: 'true'` on play_again → `game_start` ✅
- **Deploy status:** Merged to Xenon_3 `dev` — **pending PR dev → main**
- **Dashboard:** Replay Rate will populate after dev → main merge + 24-48h propagation

### `music_toggled` — event not appearing in GA4 at all

- **Note:** This is an event name, not a custom dimension
- **Expected:** `music_toggled` event fires when player toggles music on/off
- **Current GA4 data:** 0 occurrences in last 7 days; not seen in DebugView sessions June 28, 2026
- **Status:** Unconfirmed — could be implemented under a different name, or no players toggled music
- **Check:** GA4 → Admin → Data display → DebugView → toggle music → confirm event fires

---

## DebugView Navigation (for real-time verification)

1. GA4 → Admin (gear icon, bottom left) → Data display → DebugView
2. Trigger the event in the game
3. Click the event in the stream → Parameters tab
4. Confirm parameter name and value are present

---

## Custom Metrics (separate from dimensions — verify in GA4 console)

Custom metrics were not captured in these screenshots. Navigate to:
> GA4 → Admin → Data display → Custom definitions → **Custom metrics** tab

Document any custom metrics found and add them here.
