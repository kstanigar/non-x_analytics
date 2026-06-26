# BigQuery Future Metrics

**Purpose:** Documents BigQuery-only metrics identified on June 13, 2026 that are worth implementing in a future session.

**Created:** June 13, 2026
**Status:** 📋 BACKLOG — revisit after Case Study + Data Dictionary complete

---

## Context

The BigQuery export schema includes fields that enable session-level and user-level aggregations that the GA4 API cannot perform. The GA4 API works on pre-aggregated event counts — it cannot join events within the same session or track a single user across multiple sessions.

BigQuery-only capabilities:
- Join multiple events **within the same session** using `ga_session_id` (from `event_params`)
- Track a single user **across sessions** using `user_pseudo_id`
- Apply **window functions** (FIRST_VALUE, LAST_VALUE, COUNT) per session before aggregating

Already completed: Avg Start Tier + Avg Final Tier (first/last `ai_difficulty_adjusted` per session).

---

## Schema Fields Used

| Field | Type | Used For |
|-------|------|----------|
| `user_pseudo_id` | STRING | User identity across sessions |
| `user_first_touch_timestamp` | INTEGER | Cohort start date |
| `event_timestamp` | INTEGER | Event ordering within session |
| `event_name` | STRING | Filter to specific events |
| `event_params` | RECORD REPEATED | `ga_session_id`, `old_tier`, `new_tier`, `final_score`, etc. |

---

## Identified Metrics (BigQuery-only)

### HIGH VALUE — Session-Level Joins

**0. Movement A/B Win Rate**
- **What:** Win rate (`player_won / game_start`) grouped by `movement_group` (Group A: horizontal-only, Group B: full directional)
- **How:** Join `game_start` events (which carry `movement_group`) to `player_won` events within the same `ga_session_id`. Player can't change movement type mid-run, so the `game_start` value applies to the full session.
- **SQL pattern:** `SELECT g.movement_group, COUNT(w.ga_session_id)/COUNT(g.ga_session_id)*100 AS win_rate FROM game_start g LEFT JOIN player_won w USING (ga_session_id) GROUP BY g.movement_group`
- **Value:** Unlocks the currently empty "Win Rate" column in the Movement A/B test table on the A/B tab.
- **Effort:** Low — same `ga_session_id` join pattern as Avg Start Tier; extend existing `musicAB` or new small handler
- **KPI location:** A/B Test tab — Movement A/B test table, Win Rate column

**1. Tier Delta per Session**
- **What:** `avg(final_tier - start_tier)` across all sessions
- **How:** Reuse existing `avg-tier` query logic — subtract `avg_start_tier` from `avg_final_tier`, or compute per-session and average
- **Value:** Shows whether AI is net-increasing or net-decreasing difficulty over time. One number per day would reveal trends.
- **Effort:** Low — fits existing `avg-tier` Lambda handler; one additional computed field
- **KPI location:** AI Agent tab, alongside existing Avg Start/Final Tier tiles

**2. Win Rate by Starting Tier**
- **What:** % of sessions that end in `player_won`, grouped by the first `ai_difficulty_adjusted.old_tier` of that session
- **How:** Join `player_won` presence with first `ai_difficulty_adjusted` per session; group by `old_tier` value
- **Value:** Answers whether AI difficulty calibration is working as a game design tool. Does starting harder predict winning?
- **Effort:** Medium — new SQL query, new KPI tile or chart (bar chart: tier 0–6 on x-axis, win % on y-axis)
- **KPI location:** AI Agent tab — new chart or table

**3. AI Adjustment Count Distribution**
- **What:** Histogram of how many `ai_difficulty_adjusted` events fire per session
- **How:** `COUNT(event_name) WHERE event_name = 'ai_difficulty_adjusted' GROUP BY ga_session_id` → then bucket into 0, 1–2, 3–5, 6–10, 10+ adjustments
- **Value:** Currently we show `avgAdjustments = 28 total`. Distribution reveals whether most sessions have 0 adjustments and a few sessions have many, vs. even distribution.
- **Effort:** Medium — new Lambda handler or extend `avg-tier`; new bar chart on AI Agent tab
- **KPI location:** AI Agent tab

**4. Exact Funnel Completion Rate**
- **What:** % of *sessions* (not raw event counts) that reach each funnel stage
- **How:** `COUNT(DISTINCT ga_session_id) WHERE event_name = 'boss_attempt' AND boss_id = '1'` / `COUNT(DISTINCT ga_session_id WHERE event_name = 'game_start')`
- **Value:** The current funnel uses raw event counts from the GA4 API, which can be inflated if a player attempts a boss multiple times. BigQuery gives true session-level conversion rates.
- **Effort:** Medium — new Lambda handler; replace existing funnel data source
- **KPI location:** Game Funnel tab (replaces current boss-analysis-derived funnel)

---

### MEDIUM VALUE — User-Level Aggregation

**5. Sessions per User (Retention Depth)**
- **What:** Average number of sessions per unique player
- **How:** `AVG(session_count) FROM (SELECT user_pseudo_id, COUNT(DISTINCT ga_session_id) AS session_count FROM events GROUP BY user_pseudo_id)`
- **Value:** Complements the existing "New vs Returning" KPI. A player who returns 5× is more engaged than one who returns 2×.
- **Effort:** Low — simple aggregation, single KPI tile
- **KPI location:** Overview tab, Player Behavior row

**6. User Cohort Retention**
- **What:** % of users who play again in week 2, week 3, etc. after `user_first_touch_timestamp`
- **How:** Group users by acquisition week; count who have sessions in subsequent weeks
- **Value:** True retention curve — tells whether the game has a retention problem or strong repeat play
- **Effort:** High — multi-cohort query + new visualization (line or heatmap chart)
- **KPI location:** New tab or Overview tab expansion

**7. Player Engagement Span**
- **What:** Average days between a player's first and most recent session
- **How:** `AVG(DATE_DIFF(MAX(event_date), MIN(event_date))) GROUP BY user_pseudo_id`
- **Value:** Engagement span shows how long players stay in the game's ecosystem
- **Effort:** Low — simple aggregation, single KPI tile
- **KPI location:** Overview tab, Player Behavior row

---

## Already Available from GA4 API (skip BigQuery)

These are in the schema but are built-in GA4 dimensions — no BigQuery needed:

| Field | GA4 Dimension | Already Live? |
|-------|--------------|---------------|
| `geo` | `country`, `city` | No, but easy to add |
| `traffic_source` | `sessionSource`, `sessionMedium` | No |
| `device` | `deviceCategory` | ✅ Yes |
| `event_date` (hour/day) | `hour`, `dayOfWeek` | No, but easy to add |
| `session_duration_seconds` | `customEvent:session_duration_seconds` | ✅ Yes |

---

## Recommended Implementation Order (when revisited)

1. **Movement A/B Win Rate** — low effort, unlocks broken A/B table column; same join pattern as Avg Start Tier
2. **Tier Delta** — lowest effort, highest insight, fits existing handler
3. **Sessions per User** — single KPI, low effort
4. **Win Rate by Starting Tier** — medium effort, high game design value
5. **AI Adjustment Distribution** — medium effort, strong AI Agent tab addition
6. **Exact Funnel Completion** — replaces existing funnel with more accurate data
7. **Player Engagement Span** — low effort KPI
8. **User Cohort Retention** — highest effort, highest strategic value

---

## Notes

- All queries should use `maxBytesBilled: '500000000'` (500MB cap) safety limit
- Dataset ID: `analytics_525680032` (note: differs from GA4 property ID `525680332`)
- Use existing `getBigQueryClient()` lazy-load pattern from `avg-tier` handler
- 24h cache TTL appropriate for all these metrics (BigQuery export has 24–48h lag anyway)
