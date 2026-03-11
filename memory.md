# NON-X — Master Project Memory
_Last updated: March 10, 2026 | Merged: Game Dev + Analytics_

---

## 1. Project Overview

| Field | Value |
|---|---|
| Game | NON-X — browser-based top-scrolling space shooter |
| Live URL | https://kstanigar.github.io/Xenon_3/ |
| Repo | https://github.com/kstanigar/Xenon_3 |
| Local path | /Users/keithstanigar/Documents/Projects/Xenon_3/ |
| GA4 Property | NON-X (Account: NON-X Game) — Tracking ID: G-9ECFZ9JBE5 |
| Files | `index.html` (menu), `game.html` (desktop), `game_mobile.html` (mobile) |

### Game Structure
- **12 levels across 3 phases:**
  - Green phase: Levels 1–4 → Boss 1
  - Red phase: Levels 5–8 → Boss 2
  - Purple phase: Levels 9–12 → Boss 3
- **Bosses:** Spawn when `level >= 4/8/12` AND `!boss1/2/3Defeated` — NO score threshold gate (removed; levels 1–4 only yield ~370 pts max)
- **Power-ups:** Health, Shield, Double Laser, Triple Laser, Quad Laser
- **Win condition:** Defeat all 3 bosses → `player_won` fires

---

## 2. Repository & Git Workflow

- **Branch structure:** `main` (production) → feature branches → PR → merge to main
- **DO NOT use `develop` branch** — caused repeated sync issues
- **CI/CD:** GitHub Actions integrity checks on every PR to main
- **GitHub Pages:** auto-deploys from main, ~2–3 min after merge

### Pre-commit verification (always run before committing)
```bash
python3 -c "
c = open('game_mobile.html').read()
print('Lines:', len(c.splitlines()))
print('Brace diff:', c[c.find('<script>'):].count('{') - c[c.find('<script>'):].count('}'))
print('draw function:', 'function draw(' in c)
"
```
- `game.html` → ~5365 lines, brace diff 0
- `game_mobile.html` → ~5999 lines, brace diff 0, draw function present

### Commit message format
```bash
git commit -m "feat(mobile): short description here"
```

### CI Integrity Checks (`.github/workflows/integrity-check.yml`)
**Required functions — both files:**
`startFromCard`, `playAgain`, `showSurveyBanner`, `collapseSurveyBanner`, `submitSurvey`, `dismissSurvey`, `playerTakeDamage`, `shouldShowSurvey`, `buildBugButtonHTML`, `openBugReport`, `submitBugReport`, `fireEvent`, `if (playerBlinking) return`, `game_complete`, `'outcome': 'victory'`, `'outcome': 'death'`, `'outcome': 'abandoned'`, `bug_report_submitted`

**Banned patterns (both files):** `buildSurveyHTML`, `'phase'.*'standard'`

---

## 3. Active A/B Tests

| Test | Group A | Group B | Primary Metrics |
|---|---|---|---|
| Music default | Music ON (50%) | Music OFF (50%) | Win rate, replay rate, session duration |
| Movement scheme | Horizontal only | Full movement (player choice) | Avg level reached, session duration |

- Assignment stored in `localStorage.nonx_ab_music_group` and `movementABGroup`
- Never reassigned — same user always sees same variant
- Movement is now **player preference** (not random A/B) as of v3.0

---

## 4. Analytics Infrastructure

### Event wrapper functions
| File | Wrapper | Dev mode |
|---|---|---|
| `game.html` + `game_mobile.html` | `fireEvent(eventName, params)` | Shift+D suppresses to console |
| `index.html` | `trackEvent(name, data)` | Same dev mode flag |

### analytics_version history
| Version | Status | Notes |
|---|---|---|
| (none) | ❌ Discard | Pre-analytics, QA/test data |
| 2.0 | ❌ Discard | Broken boss spawn (score gate), indestructible mobile minions, untuned hitbox, random movement A/B |
| 3.0 | ✅ Use | Current — boss fix, hitbox inset, minion fix, movement as player preference, clean menu UX |
| 3.0+ | ✅ Use | Full instrumentation — `analytics_version` injected on ALL events via wrapper (deployed ~Mar 10, 2026). Use date ≥ deploy date when full event-level coverage is required. |

**Filter rule:** Apply `analytics_version exactly matches 3.0` to ALL GA4 explorations and as a report-level filter in Looker Studio. Dimension appears in picker 24–48 hrs after first live event.

### analytics_version coverage — current state

**index.html (7 events):**
| Event | v3.0? |
|---|---|
| `menu_view` | ✅ |
| `play_clicked` | ✅ |
| `platform_selected` | ❌ Missing |
| `music_toggled` | ❌ Missing |
| `movement_toggled` | ❌ Missing |
| `analytics_toggled` | ❌ Missing |

**game.html + game_mobile.html (26 events each):**
| Event | v3.0? | Key Parameters |
|---|---|---|
| `session_start` | ✅ | analytics_version |
| `game_start` | ✅ | analytics_version, is_replay, games_played |
| `first_visit` | ❌ | ab_music_group, platform, music_variant |
| `returning_user` | ❌ | ab_music_group, platform, visit_count |
| `wave_reached` | ❌ | level_number, phase, score |
| `boss_attempt` | ❌ | boss_id, level_reached, score, session_duration_seconds |
| `boss_defeated` | ❌ | boss_id, level_reached, score, session_duration_seconds |
| `player_death` | ❌ | level_reached, phase, score, session_duration_seconds |
| `player_won` | ❌ | score, session_duration_seconds |
| `game_complete` | ❌ | outcome (victory/death/abandoned), level_reached, score, session_duration_seconds |
| `powerup_collected` | ❌ | powerup_type, level_reached, score |
| `play_again` | ❌ | score, level_reached, death_phase, replay_tier, bonus_hp, continue |
| `leave_game` | ❌ | outcome, score, level_reached |
| `leaderboard_submit` | ❌ | score, rank |
| `bug_report_submitted` | ❌ | — |
| `survey_submitted` | ❌ | — |
| `music_toggled` | ❌ | music_variant, score, level_reached |

**The fix:** Add `analytics_version: '3.0'` inside `fireEvent()` and `trackEvent()` wrappers — one line each, covers all events. **User will share updated files after next commit.**

### Handling pre-fix historical data
Data without `analytics_version` is still valid. Use date filter for older data.
Combined GA4 segment: `Date >= [deploy date] OR analytics_version = 3.0`

---

## 5. GA4 Custom Dimensions

All event-scoped. Register in: GA4 Admin → Property → Custom Definitions → Custom Dimensions → Create.

| Parameter | Description | Status |
|---|---|---|
| `platform` | 'desktop' or 'mobile' | ✅ Registered |
| `level_number` | 1–12 | ✅ Registered |
| `level_reached` | Highest level in session | ✅ Registered |
| `boss_id` | 1, 2, or 3 | ✅ Registered |
| `phase` | 'green', 'red', or 'purple' | ✅ Registered |
| `outcome` | 'victory', 'death', or 'abandoned' | ✅ Registered |
| `music_variant` | 'on' or 'off' | ✅ Registered |
| `ab_music_group` | A/B test group | ✅ Registered |
| `powerup_type` | Type of powerup collected | ✅ Registered |
| `analytics_version` | '3.0' — filter clean data | ✅ Registered |
| `rank` | Leaderboard rank at submission | ✅ Registered |
| `score` | Player score | ✅ Registered (Custom Metric) |
| `session_duration_seconds` | Seconds since game start | ✅ Registered (Custom Metric) |
| `death_phase` | Phase at time of death | ⚠️ Needs registration |
| `replay_tier` | Replay incentive tier: 1–4 | ⚠️ Needs registration |
| `bonus_hp` | HP bonus on replay: 15, 25, or 50 | ⚠️ Needs registration |
| `continue` | true = Continue from Level X | ⚠️ Needs registration |

---

## 6. GA4 Explorations Built

### Exploration 1: NON-X Completion Funnel
10 steps: Session Start → Game Start → Level 1 → Level 4 → Boss 1 Attempt → Level 8 → Boss 2 Attempt → Level 12 → Boss Attempt 3 → Game Complete
⚠️ Step 10 should be changed from `game_complete` → `player_won`

### Exploration 2: NON-X Game Analytics (Free form, 6 tabs)
- Tab 1: Death Drop-off — ROWS: Level Number | COLUMNS: Platform | FILTER: player_death
- Tab 2: Boss Kill Rate — ROWS: Event name + Boss ID (nested) | FILTER: event contains boss
- Tab 3: Platform Comparison — ROWS: Platform | COLUMNS: Event name
- Tab 4: Music Impact — ROWS: Event name | COLUMNS: Music Variant | FILTER: game_complete
- Tab 5: Session Duration — ROWS: Platform | VALUES: Session duration
- Tab 6: Power-up Usage — ROWS: Powerup Type | FILTER: powerup_collected

### Exploration 3: NON-X Replay Funnel
Steps: game_start → player_death → play_again → game_start
Breakdown: Replay Tier | Filter: is_replay = true

### Exploration 4: NON-X Replay Incentive Breakdown (4 tabs)
- Tab 1: Tier Uptake | Tab 2: Continue vs Play Again | Tab 3: Bonus HP vs Level Reached | Tab 4: Death Phase Distribution

### Exploration 5: NON-X Phase Retention
ROWS: Death Phase | COLUMNS: Is Replay | FILTER: player_death

---

## 7. Data Baseline (Feb 10 – Mar 9, 2026) — ⚠️ QA/Self-Testing Data

> ⚠️ **This dataset is primarily QA/self-testing.** ~38 "unique users" were mostly the developer testing across incognito sessions and cache clears on phone + computer. Data is valid for pipeline validation only — not representative of real player behaviour. Do not calibrate Report Card benchmarks from this data. **Real player baseline starts: Mar 10, 2026.**

### Top-line KPIs (pipeline validation only — not real player data)
| Metric | Value | Assessment |
|---|---|---|
| Total Sessions | 136 | ⚠️ Mostly QA sessions |
| Total Unique Users | 38 | ⚠️ Developer across cache clears |
| Sessions per User | 3.58 | ⚠️ QA artifact, not replay signal |
| Engagement Rate | 79.41% | ⚠️ Skewed — developer knows the game |
| Avg Session Time | 8:07 | ⚠️ Skewed — developer plays deeper than new users |
| Games Won (Looker) | 139 | 🔴 ANOMALY + likely misconfigured field |
| Leaderboard Subs | 18 | ⚠️ QA artifact |
| Device split | 60.5% desktop / 39.5% mobile | ⚠️ Developer's test devices |

### Completion Funnel (CSV — QA data, pipeline validation only)
| Step | Users | % of Start | Abandonment |
|---|---|---|---|
| Session Start | 38 | 100% | 26.3% |
| Game Start | 28 | 73.7% | 21.4% |
| Level 1 | 22 | 57.9% | 40.9% 🔴 |
| Level 4 | 13 | 34.2% | 38.5% 🟡 |
| Boss 1 Attempt | 8 | 21.1% | 25% |
| Level 8 | 6 | 15.8% | 0% |
| Boss 2 Attempt | 6 | 15.8% | 50% 🔴 |
| Level 12 | 3 | 7.9% | 0% |
| Boss Attempt 3 | 3 | 7.9% | 0% |
| Game Complete | 3 | 7.9% | — |

### Boss Kill Rate (QA data — developer skill, not new player benchmark)
- Boss 1: 46/63 = **73.0%** 🟢
- Boss 2: 23/26 = **88.5%** 🟢
- Boss 3: 19/19 = **100%** 🟢 (small n)
- 6 `boss_defeated` with `(not set)` boss_id — unattributed ⚠️

---

## 8. Issues Log

### 🔴 Immediate Fixes

**F1 — Platform values fragmented**
GA4 shows `mobile`, `desktop`, `computer`, `not_set`, `(not set)` as 5 distinct values. `computer` → `desktop`. `not_set` = GA4 auto-events before platform param is attached.
Fix: Normalise to `desktop`/`mobile` only. Untagged events → `platform: 'unknown'`.

**F2 — analytics_version missing from 24/26 game events**
One-line fix to `fireEvent()` wrapper. Waiting for user to share committed files.

**F3 — "Games Won: 139" in Looker is wrong**
38 users, 3 actual completions, but Looker shows 139. Calculated field is counting `game_complete` (all outcomes) instead of `player_won` only.
Fix: Rewrite Looker calculated field to filter `event_name = "player_won"` exclusively.

**F4 — Funnel step 10 uses `game_complete` not `player_won`**
`game_complete` fires on death + victory + abandon — ambiguous as completion metric.
Fix: Change step 10 to `player_won` in GA4 Explore funnel config.

**F5 — Boss Difficulty exploration "No data available"**
`boss_id` was not registered as custom dimension. Now marked ✅ registered — data should appear within 24–48 hrs.

**F6 — Death Drop-off showing "(not set)" for Level Number**
`level_number`/`level_reached` were not registered. Now marked ✅ registered — data should appear within 24–48 hrs.

### 🟡 Improvements

**I1 — Level 1 is the primary retention leak (40.9% abandonment)**
~4 in 10 game starters never clear Level 1. Investigate by platform — likely worse on mobile.

**I2 — Boss 2: 50% funnel abandonment vs 88.5% kill rate contradiction**
Funnel = unique users; kill rate = total attempts. Players attempt multiple times then quit = frustration accumulation.

**I3 — Menu bounce: 73.7% Session Start → Game Start**
1 in 4 sessions loads the page and leaves. Cross-ref `menu_view` referrer.

**I4 — Acquisition is front-loaded (spike Mar 6)**
No sustained distribution channel. Organic sharing is sole current driver.

### 🟢 What's Working

- Engagement rate (79.41%) and avg session time (8:07) are exceptional for a web game
- Sessions/user (3.58) confirms replay loop is real
- Boss difficulty curve is well-tuned across all three bosses
- powerup_collected (882) + wave_reached (660) = players reaching mid-game depth
- `analytics_version: 3.0` confirmed firing on key events (verified via console log)
- Funnel structure correct in GA4 — just needs dimension registrations to unlock breakdowns

---

## 9. Mobile-Specific Features

### Difficulty tuning vs desktop
| Phase | Desktop bullet ×  | Mobile bullet × |
|---|---|---|
| Green | 1.0 | 1.0 |
| Red | 1.40 | 1.15 |
| Purple | 1.65 | 1.35 |

`arrowheadExploded` explode multiplier: 1.6 mobile (vs 2.4 desktop).
Enemy counts — Green L1–4: 9,9,10,9 | Red L5–8: 14,11,10,10 | Purple L9–12: 16,17,19,22

### Replay Incentive System (mobile only — desktop port pending)
`isReplay` = one-shot flag, resets after `game_start`. `isReplaySession` = captured before reset, persists full run. Without `isReplaySession`, Tiers 2–4 never fire.

| Tier | Condition | HP Bonus | Start Level |
|---|---|---|---|
| 1 | First visit death, any level | +15 | Level 1 |
| 2 | Replay death, levels 2–4 | +15 | Death level |
| 3 | Replay death, red phase | +25 | Level 1 |
| 4 | Replay death, purple phase | +50 | Level 1 |

To port to desktop: search `REPLAY INCENTIVES` in `game_mobile.html`.

---

## 10. Sensitive Code — Do Not Modify Without Full Trace

### ⚠️ Leaderboard Submit (`buildLeaderboardSubmitHTML`)
- `submittedScore` MUST be captured BEFORE `addHighScore()` runs
- Gate: `score > submittedScore` only — no other gates
- Called in 3 places per file: main death, `rebuildGameOverScreen`, dev mode death
- Firebase `leaderboard` collection must exist — **NEVER delete it** (archive instead)

### ⚠️ Boss Spawn (`advanceLevel`)
- Spawns at `level >= 4/8/12` + `!bossXDefeated` — no score threshold
- `boss.shieldStartTime` resets when `boss.entering = false`

### ⚠️ Mobile Boss Minions (`updateBossMinions`)
- Must NOT be inserted into `SpatialGrid` — causes indestructible minions + infinite score

### ⚠️ `isReplay` / `isReplaySession` timing
- `isReplaySession` must be captured from `isReplay` BEFORE `game_start` reset

### ⚠️ analytics_version
- Current: `3.0` — bump whenever gameplay mechanics change (hitbox, boss logic, scoring)
- **Do NOT bump for instrumentation-only fixes** — those are noted by deploy date, not version
- Full instrumentation baseline: ~Mar 10, 2026 (all events now carry version via wrapper)
- Pre-baseline 3.0 data is still valid — use date filter when full event-level coverage matters
- Set in: all events via `fireEvent()` / `trackEvent()` wrapper (one line, injected automatically)

---

## 11. Dashboard & Tooling

### HTML Dashboard (`nonx-analytics-dashboard.html`)
- 6 tabs: Overview, Funnel, Boss Analysis, A/B Tests, Platform, Looker Guide
- CSV drag-and-drop loader — auto-detects report type, filters `analytics_version ≠ 3.0`
- Weekly update: GA4 CSV export → drag-and-drop → Ctrl+S
- **Smart Signal System** — week-over-week change detection with visual alerts, contextual tooltips, and drill-down guidance (see full spec below)

### Smart Signal System (planned — next major dashboard feature)

#### Concept — Final Design (Enterprise Pattern)
Two-layer system. Individual charts get **contextual benchmark tooltips** — no grades, no badges, just rich hover annotations that show the benchmark, current status, what it means, and what to watch. A dedicated **Report Card tab** aggregates every metric into a single scannable scorecard with grades, week-over-week delta, and a one-line interpretation.

This is the enterprise pattern used by Amplitude, Mixpanel, and internal Looker builds for game studios: annotate at the chart level, summarise at the report level.

---

#### Layer 1 — Contextual Benchmark Tooltips (on every chart)

Hover any data point, bar, or KPI card to see:

```
┌──────────────────────────────────────────────────┐
│  Boss 2 Abandonment — 50%                        │
│  ─────────────────────────────────────────────── │
│  Benchmark: 25–35% is healthy at this stage      │
│  Status: ⚠ Above threshold                       │
│                                                  │
│  What this means: Players are reaching Boss 2    │
│  but quitting after multiple failed attempts —   │
│  frustration wall, not a skill cliff.            │
│                                                  │
│  Watch: Does this improve as sample grows, or    │
│  persist? Cross-check with avg attempts/user.    │
└──────────────────────────────────────────────────┘
```

Tooltip structure (4 fields, always present):
1. **Metric name + current value** — header
2. **Benchmark** — what healthy looks like at this stage, with source rationale
3. **Status** — ✅ On track / ⚠ Watch / 🔴 Critical / 🔵 Improving / ⚪ Baseline (no prior data)
4. **What this means** — plain-English interpretation specific to NON-X's game context
5. **Watch** — one specific thing to look for next week, and what metric cross-confirms it

No grades on charts. No badges. Just context.

---

#### Layer 2 — Report Card Tab (dedicated weekly summary)

Single page. Every tracked metric as a row. Designed to be the first thing opened on Monday and the last thing screenshotted for a weekly digest.

**Row structure:**
```
Metric           | Value  | Grade | Δ Week  | One-liner
─────────────────|--------|-------|---------|──────────────────────────────
Win Rate         | 7.9%   |  C    | ↑ +1.7pp| Low but improving — watch L1 drop
L1 Abandonment   | 40.9%  |  D    | → stable| Biggest retention leak — priority fix
Boss 1 Kill Rate | 73.0%  |  A    | ↑ +4pp  | Healthy. Difficulty well-tuned.
Boss 2 Abandon   | 50.0%  |  D    | ↓ -5pp  | Frustration wall — worsening
Replay Rate      | 3.58x  |  B    | → stable| Strong. Music A/B test primary signal.
Session Duration | 8:07   |  A    | ↑ +0:45 | Far above web game norm (2–4 min)
Leaderboard Rate | 13%    |  B    | → stable| Healthy engagement signal
```

**Grade thresholds** — defined per metric against NON-X-specific benchmarks, not generic:
- **A** — at or above target for current user volume
- **B** — acceptable, minor improvement opportunity
- **C** — below target, trending watch
- **D** — significantly below target, needs attention
- **F** — critical failure or data anomaly

**Delta symbols:**
- ↑ green = improving
- ↓ red = worsening  
- → grey = stable (within ±threshold)
- ~ yellow = anomaly (change is large but data quality uncertain)

**Summary header** (top of Report Card tab):
Overall grade (weighted average), total game starts this period, confidence level (based on n), and one priority callout: "This week's focus: Level 1 abandonment is your biggest lever."

---

#### Persistence (snapshot storage)
- On each CSV load, previous DATA object saved as DATA_PREV embedded in HTML
- Ctrl+S saves both DATA (current week) and DATA_PREV (last week) — file is self-archiving
- Delta: relative = (current − prev) / prev × 100, absolute = current − prev
- No localStorage, no server required

---

#### Benchmark Reference (NON-X-specific — ⚠️ Do not calibrate until real organic user data accumulates post Mar 10, 2026)
| Metric | Benchmark healthy range | Grade A threshold | Notes |
|---|---|---|---|
| Win rate | 10–20% | >15% | Early stage — 7.9% is expected |
| L1 abandonment | <25% | <20% | 40.9% is primary retention problem |
| Boss 1 kill rate | 65–80% | 70%+ | Too high = too easy; too low = wall |
| Boss 2 kill rate | 70–85% | 75%+ | Should be harder than Boss 1 |
| Boss 3 kill rate | 75–90% | 80%+ | Final boss — earned difficulty |
| Menu → game start | >80% | >85% | Currently 73.7% — below target |
| Avg session duration | >5 min | >8 min | Currently A-grade at 8:07 |
| Replay rate | >2.5x | >3.5x | Currently B-grade at 3.58x |
| Leaderboard submit | >10% | >15% | Currently B at 13% |
| Mobile/desktop parity | <10pp gap | <5pp gap | Benchmark once platform data is clean |

---

#### Sample size guardrails
- n < 20 game_starts: suppress all grades, show "Insufficient data — Report Card activates at 20+ game starts"
- n 20–50: grades shown with "Low confidence" label, delta arrows suppressed
- n > 50: full Report Card active with deltas

### Looker Studio
- Real-time ops and portfolio sharing
- Apply `analytics_version = 3.0` as report-level filter first
- Theme: `#0D1B2A` bg, `#00B4C8` cyan, `#CC00CC` magenta, Space Mono + Exo 2 fonts
- 6-page portfolio dashboard planned (see Next Actions)

### Documents produced
- `NON-X_Analytics_Export_Guide.docx` — full GA4 + Looker Studio setup guide
- `nonx-analytics-dashboard.html` — interactive dashboard with CSV loader

---

## 12. Workflow Rules (User-Defined)

1. **Data-first:** Confirm capture before building any visual. Audit: Good / Improve / Fix.
2. **Every metric gets a G/I/F audit** before being added to the dashboard.
3. **Share updated files after each commit** for code fixes to be applied.
4. **Dashboard updates:** Weekly GA4 CSV → drag-and-drop.
5. **Looker = real-time ops. HTML dashboard = polished weekly + portfolio.**
6. **Data sharing:** Screenshots + CSV exports (no direct GA4/Looker access possible).
7. **Claude rule:** Never recommend destructive operations without full dependency trace.
8. **Claude rule:** Never diagnose game over bugs without asking level + score + context first.

---

## 13. Next Actions Queue

| Priority | Action | Owner |
|---|---|---|
| 🔴 P1 | Fix "Games Won" Looker field → use `player_won` only | User |
| 🔴 P1 | Change funnel step 10: `game_complete` → `player_won` in GA4 | User |
| 🔴 P1 | Normalise platform values (`computer` → `desktop`) | User (after commit) |
| 🔴 P1 | Add `analytics_version` to `fireEvent()` + `trackEvent()` wrappers | User (share files) |
| 🔴 P1 | Register 4 pending dimensions: `death_phase`, `replay_tier`, `bonus_hp`, `continue` | User in GA4 |
| 🟡 P2 | Investigate Level 1 drop-off by platform | After F1 fix |
| 🟡 P2 | Resolve Boss 2 funnel vs kill rate contradiction | Needs more data |
| 🟡 P2 | Cross-ref `menu_view` referrer vs menu bounce rate | — |
| 🟡 P2 | Port replay incentive system (Tiers 1–4) to desktop | User |
| 🟡 P2 | Code comments debt pass on high-risk areas | User |
| 🟢 P3 | Build music A/B comparison once v3.0 data accumulates | — |
| 🟢 P3 | **Build Smart Signal System** — week-over-week change detection, glow/pulse alerts, hover tooltips, drill-down panels (full spec in Section 11) | Claude |
| 🟢 P3 | Export CSVs + load into HTML dashboard | User |
| 🟢 P3 | Build 6-page Looker Studio portfolio dashboard | After F1 + F3 |
| 🟢 P3 | Song choice feature on victory screen | Pending audio assets |
