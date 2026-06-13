# KPI Tooltip Plan

**Purpose:** Complete classification of every KPI tile and chart in the NON-X Analytics dashboard for the hybrid tooltip system (Tier 1 CSS hover, Tier 2 Data Dictionary anchor, Tier 3 Case Study anchor).

**Status:** Research complete — all KPIs and charts classified

**Date:** June 13, 2026

---

## Tier 1 — CSS Hover Tooltips

Simple KPIs where formula + plain-English explanation fits inline (≤ 120 chars). No navigation needed.

| KPI / Chart | Element ID | Tooltip Text |
|-------------|-----------|--------------|
| Total Sessions | kpi-sessions | Count of unique game_start events. All platforms, all time. |
| Avg Survival | kpi-survival | Average session length (game_start to outcome). Minutes per run. |
| Avg Level Reached | kpi-avg-level | Weighted avg level where players died. Scale: 1–12 levels + 3 bosses. |
| Desktop Avg Level | kpi-desk-level | Weighted avg level (desktop only). Deaths used, not wins. |
| Mobile Avg Level | kpi-mob-level | Weighted avg level (mobile only). Deaths used, not wins. |
| Daily Plays & Wins Chart | chart-daily | Magenta: daily game_start count. Cyan: daily player_won count. |
| Device Mix Chart | chart-device | Sessions split: desktop % vs mobile %. GA4 deviceCategory. |
| Music A/B Split Chart | chart-ab-split | % of sessions in each A/B group (Music ON vs OFF). |
| Powerup Collection by Phase Chart | chart-powerup | Collection counts by powerup type × phase (green/red/purple). |
| Music ON — Funnel | funnel-music-on | Game progression funnel for Music ON group only (4 stages). |
| Music OFF — Funnel | funnel-music-off | Game progression funnel for Music OFF group only (4 stages). |
| Boss Attempt-to-Defeat Ratio Chart | chart-boss-ratio | Horizontal grouped bar: attempts (grey) vs defeats (cyan) per boss. |
| Boss Conversion by Platform Chart | chart-boss-platform | Boss defeat rate (%) by platform: desktop vs mobile per boss. |
| Player Distribution by Tier Chart | chart-ai-tier-dist | Bar chart: player count per difficulty tier (-3 Tutorial to +3 Master). |
| Tier Progression Flow Chart | chart-ai-tier-flow | Stacked bar: count of tier increases vs decreases. |
| Score Multiplier Distribution Chart | chart-ai-score-mult | Count of player_won events per score multiplier bucket (0.50× to 1.50×+). |
| Session Outcome Breakdown Chart | chart-session-outcome | Stacked bar (daily): wins (green) + deaths (red) + abandoned (yellow). |
| Death Triggers by Phase Chart | chart-ai-death-triggers | Horizontal bar: deaths by phase (green/red/purple) triggering tier decrease. |
| Completion Funnel (Desktop vs Mobile) Chart | chart-platform-funnel | Grouped bar: % completion at game_start → boss1 → boss2 → boss3 by platform. |
| Survival Time Distribution Chart | chart-survival-dist | Duration buckets (0–0.5m to 8+m): % of sessions per bucket, desktop vs mobile. |
| Wave Drop-off Chart (Deaths by Level) | chart-dropdoff | Deaths by level (L1–L12 + boss stages), color-coded by phase. Toggle: ALL/DESKTOP/MOBILE. |

---

## Tier 2 — ℹ Icon → Data Dictionary

Complex KPIs or charts where formula is multi-step, data source is non-obvious, or metric has nuance. ℹ icon navigates to `#dict-[metric]` anchor on Data Dictionary tab and auto-expands accordion.

| KPI / Chart | Element ID | Dict Anchor | Notes |
|-------------|-----------|-------------|-------|
| New vs Returning | kpi-new-pct | dict-new-pct | Formula: `new_game_starts / total_game_starts × 100`. Uses GA4 `newVsReturning` dimension. |
| Win Rate | kpi-winrate | dict-winrate | Formula: `player_won / game_start × 100`. Multi-platform metric. |
| Death Rate | kpi-deathrate | dict-deathrate | **CRITICAL:** Denominator is `(wins + deaths)` NOT `game_starts`. Abandoned sessions excluded. |
| Play-Again Rate | kpi-replay | dict-replay | Formula: `is_replay game_starts / total game_starts × 100`. Custom dimension. |
| Leaderboard Rate | kpi-lb-rate | dict-lbrate | Formula: `leaderboard_submit / player_won × 100`. Denominator: wins only. |
| Scorecard View Rate | kpi-scorecard-rate | dict-scorecard-rate | Formula: `scorecard_viewed / game_start × 100`. Engagement metric. |
| Music Toggle Rate | kpi-music-rate | dict-music-rate | Formula: `music_toggled / game_start × 100`. % sessions where player changed setting. |
| Leave Game Rate | kpi-leave-rate | dict-leave-rate | Formula: `leave_game / game_start × 100`. Early abandonment signal. |
| Boss Reach Rate | kpi-boss-reach-rate | dict-boss-reach | Formula: `boss_attempt (boss_id='1') / game_start × 100`. % reaching first boss. |
| Survey Response Rate | kpi-survey-rate | dict-survey-rate | Formula: `survey_submitted / game_start × 100`. In-game feedback collection. |
| Avg Start Tier | kpi-ai-avg-start | dict-avg-start-tier | **BigQuery only.** FIRST_VALUE of `old_tier` per session. Window function required. |
| Avg Final Tier | kpi-ai-avg-final | dict-avg-final-tier | **BigQuery only.** LAST_VALUE of `new_tier` per session. Window function required. |
| Speed Lock Rate | kpi-ai-speed-lock | dict-speed-lock | Formula: `ai_difficulty_adjusted where speed_locked='true' / total adjustments × 100`. |
| Avg Tier Adjustments | kpi-ai-avg-adjustments | dict-avg-adjustments | **NOTE:** Currently shows total count (not per-session avg). BigQuery backlog item. |
| Desktop Win Rate | kpi-desk-win | dict-platform-kpis | Formula: `desktop player_won / desktop game_start × 100`. Platform-filtered. |
| Mobile Win Rate | kpi-mob-win | dict-platform-kpis | Formula: `mobile player_won / mobile game_start × 100`. Platform-filtered. |
| Full Progression Funnel (8 stages) | funnel-main | dict-funnel | 8-stage funnel: game_start → boss1 attempt → boss1 defeated → ... → victory. |
| Conversion Rates Table | (table body) | dict-conversion-table | Stage transitions with Music ON/OFF split + delta. |
| Boss Defeat Rate Cards | boss-cards | dict-boss-cards | 3 cards: Boss 1/2/3 defeat rate (%), attempts, defeats, avg attempts to kill. |
| Boss Difficulty Assessment Table | (table body) | dict-boss-table | Boss | Phase | Level Gate | Attempts/Player | Defeat Rate | Avg Attempts to Kill | Assessment. |
| Music A/B Test Cards | ab-music-cards | dict-music-ab | Sessions + win rate + leaderboard rate + music toggle rate by group. |
| Movement A/B Test Cards | ab-movement-cards | dict-movement-ab | Sessions + win rate (partial: missing game-side tag) + survival + level by group. |
| A/B Statistical Significance Table | (table body) | dict-significance-table | Group sizes (n) + status + p-value target. Status: "Insufficient" if n < ~385 per group. |
| Platform Breakdown Table | (table body) | dict-platform-table | Metric | Desktop | Mobile | Winner | Delta. Rows: sessions, win rate, survival, replay %, avg level, LB rate, boss rates. |
| Tier Performance Metrics Table | (table body) | dict-tier-table | Tier | Name | Bullet Speed | Score Mult | Players | Avg Level | Win Rate | Avg Session Time. |

---

## Tier 3 — ℹ Icon → Case Study

Insights or findings that are better explained by the Case Study narrative (A/B test results, funnel interpretation, AI agent behavior patterns). ℹ icon navigates to Case Study tab and scrolls to relevant section.

| KPI / Chart | Element ID | Case Study Section | Reasoning |
|-------------|-----------|-------------------|-----------|
| (Overall A/B Test Results) | ab-music-cards | Key Findings | Music OFF wins on win rate (44% vs 23%). Desktop vs mobile survival gap (2×). Needs narrative context explaining counterintuitive result. |
| (Overall AI Tier Behavior) | kpi-ai-avg-adjustments | Key Findings | AI system showing 25 tier increases vs 3 decreases — signals that system is actively pushing players harder. Contextual insight. |
| (Death Distribution Pattern) | chart-dropdoff | Key Findings | Most deaths occur in early Green phase (L1–L4), NOT boss fights. Opening levels are retention bottleneck. |
| (Powerup Collection Gap) | chart-powerup | Key Findings | Mobile players collect 5× more powerups than desktop — likely touch-control advantage. Platform behavior insight. |

---

## Implementation Notes

### Missing or Incomplete Dict Anchors

All required anchors exist in `Data_Dictionary.md`. No new anchors need to be created.

**Existing anchors confirmed:**
- `dict-sessions` ✅
- `dict-new-pct` ✅
- `dict-winrate` ✅
- `dict-deathrate` ✅
- `dict-replay` ✅
- `dict-survival` ✅
- `dict-lbrate` ✅
- `dict-avglevel` ✅
- `dict-speedlock` ✅
- `dict-scorecard-rate` ✅
- `dict-music-rate` ✅
- `dict-leave-rate` ✅
- `dict-boss-reach` ✅
- `dict-survey-rate` ✅
- `dict-daily-chart` ✅
- `dict-session-outcome` ✅
- `dict-device-mix` ✅
- `dict-ab-split` ✅
- `dict-powerup` ✅
- `dict-funnel` ✅
- `dict-wave-dropdoff` ✅
- `dict-conversion-table` ✅
- `dict-boss-cards` ✅
- `dict-boss-ratio` ✅
- `dict-boss-platform` ✅
- `dict-boss-table` ✅
- `dict-platform-kpis` ✅
- `dict-platform-funnel` ✅
- `dict-survival-dist` ✅
- `dict-platform-table` ✅
- `dict-avg-start-tier` ✅
- `dict-avg-final-tier` ✅
- `dict-speed-lock` ✅
- `dict-avg-adjustments` ✅
- `dict-ai-tier-dist` ✅
- `dict-tier-flow` ✅
- `dict-score-mult` ✅
- `dict-death-triggers` ✅
- `dict-session-outcome-ai` ✅
- `dict-tier-table` ✅
- `dict-music-ab` ✅
- `dict-movement-ab` ✅
- `dict-significance-table` ✅

### Edge Cases & Special Notes

1. **Death Rate KPI (kpi-deathrate)** — Tier 2 anchor needed because denominator is `completed_games` (wins + deaths), NOT `game_starts`. This is a critical nuance that must be explained.

2. **Avg Tier Adjustments (kpi-ai-avg-adjustments)** — Currently shows **total count**, not per-session average. Data Dictionary notes this as a BigQuery backlog item. Tooltip should reflect current behavior.

3. **Movement A/B Test (ab-movement-cards)** — Partial live status: `player_won` events don't carry `movement_group` custom dimension (game-side gap). Win rate shows "—". Dict anchor should note this gap.

4. **Speed Lock Rate (kpi-ai-speed-lock)** — Displayed on **Overview** tab but data lives in `DATA.aiAgent.kpis` namespace (not `DATA.kpis`). Tooltip text should clarify what "speed locked" means: tier where bullet speed no longer increases.

5. **Tier 3 (Case Study) Items** — These are insights that benefit from narrative context:
   - **A/B Test Results**: Music OFF counterintuitively wins. Desktop/mobile survival gap (2×). Needs explanation.
   - **AI Tier Behavior**: 25 increases vs 3 decreases shows system is responsive and pushing players.
   - **Death Distribution**: Early phase deaths (L1–L4) are the retention bottleneck, not boss fights.
   - **Powerup Collection**: 5× difference between mobile and desktop is a platform interaction pattern.

6. **Canvas Elements vs KPI Cards**:
   - All chart canvas elements are in Tier 1 (simple visual explanations).
   - All KPI value cards are either Tier 1 (if formula is one-liner) or Tier 2 (if multi-step or non-obvious).
   - Tier 3 is reserved for A/B test results and AI behavior patterns (narrative-heavy insights).

### Tabs & Coverage Summary

| Tab | KPIs | Charts | Tables | Tier 1 | Tier 2 | Tier 3 |
|-----|------|--------|--------|--------|--------|--------|
| Overview | 8 KPIs | 4 charts | 1 table | 5 KPIs + 4 charts | 8 KPIs (some overlap) | — |
| Game Funnel | — | 2 charts + 2 funnels | 1 table | 4 elements | 3 elements | — |
| Boss Analysis | — | 2 charts | 1 table | 2 elements | 3 elements | — |
| AI Agent | 4 KPIs | 5 charts | 1 table | 5 KPIs + 4 charts | 5 elements | 1 element |
| A/B Test | — | — | 1 table | — | 3 elements | 1 element |
| Platform | 4 KPIs | 2 charts | 1 table | 4 KPIs + 2 charts | 5 elements | — |
| **TOTAL** | **20 KPIs** | **15 charts** | **6 tables** | **20 elements** | **23 elements** | **2 elements** |

**Total coverage:** 45 UI elements (KPIs, charts, tables) across 7 tabs.

### Implementation Sequence

**Phase 1 (Tier 1 — CSS Hover):**
- Add title attribute or data-tooltip to each KPI value div
- Add title attribute or data-tooltip to each canvas element
- CSS: `.kpi:hover::after` and `.card:hover::after` to show tooltip on hover (desktop) or tap (mobile)

**Phase 2 (Tier 2 — Data Dictionary Anchors):**
- Add ℹ icon next to each Tier 2 KPI label
- Click handler: navigate to Data Dictionary tab, scroll to anchor, expand accordion section
- Animate scroll for UX

**Phase 3 (Tier 3 — Case Study Anchors):**
- Add ℹ icon next to Tier 3 chart titles / table headers
- Click handler: navigate to Case Study tab, scroll to relevant section
- Highlight or animate the relevant finding for visual focus

### Quality Checklist

- [x] Every KPI tile has been classified (20 total)
- [x] Every chart canvas has been classified (15 total)
- [x] Every table has been mapped to Data Dictionary anchor (6 total)
- [x] All Tier 2 anchors exist in Data Dictionary
- [x] Tier 1 tooltip text ≤ 120 chars
- [x] Death Rate formula nuance documented (Tier 2, critical note)
- [x] BigQuery-only metrics flagged (Avg Start/Final Tier, Avg Adjustments)
- [x] Edge cases and gaps documented (Movement A/B, Speed Lock definition)
- [x] Tier 3 justifications provided (narrative context for A/B + AI insights)

---

**Plan Version:** 1.0  
**Created:** June 13, 2026  
**Ready for implementation:** Yes
