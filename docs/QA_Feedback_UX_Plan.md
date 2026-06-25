# QA Feedback + UX Improvement Plan

**Created:** June 24, 2026
**Source:** External QA session feedback + owner discussion
**Status:** Planning — not yet implemented

---

## 🎯 Purpose Clarification

The dashboard serves two audiences:
1. **Game analysts / portfolio viewers** — demonstrate analytical capability
2. **Players** — understand their game's health and performance

Current language skews technical. Goal: make metrics legible to both without dumbing them down.

---

## 📋 Proposed Changes

---

### UX-1: Rename Metrics for Player Clarity ✅ — June 25, 2026

**Problem:** Labels like "Total Sessions" and "Leave Game Rate" are developer-speak. Players don't think in "sessions."

**Confirmed renames (Haiku agent research — June 25, 2026):**

| Current Label | Proposed Label | Note |
|---------------|----------------|------|
| Total Sessions | Total Plays | |
| Death Rate | Deaths | QA plan had wrong name ("Player Death") — actual label is "Death Rate" |
| Leaderboard Rate | Leaderboard Entries | QA plan had wrong name ("Leaderboard Submit") — actual label is "Leaderboard Rate" |
| Scorecard View Rate | Scorecard Views | |
| Leave Game Rate | Drop-off Rate | |
| Game Starts | *(skip)* | Doesn't exist as a UI label — `game_start` is an internal GA4 event name only |

**Effort:** S — 12 line changes, no logic changes
**Files:** `live.html` — KPI labels + Data Dictionary titles + 2 Case Study table cells

#### Implementation Plan (Haiku Agent Research — June 25, 2026)

**12 changes total across 5 renames:**

| Rename | Location | Line | Current | Change to |
|--------|----------|------|---------|-----------|
| Total Sessions → Total Plays | KPI label | 1725 | `Total Sessions` | `Total Plays` |
| Total Sessions → Total Plays | Data Dictionary `<h4>` | 2323 | `Total Sessions` | `Total Plays` |
| Death Rate → Deaths | KPI label | 1740 | `Death Rate` | `Deaths` |
| Death Rate → Deaths | Data Dictionary `<h4>` | 2353 | `Death Rate` | `Deaths` |
| Leaderboard Rate → Leaderboard Entries | KPI label | 1755 | `Leaderboard Rate` | `Leaderboard Entries` |
| Leaderboard Rate → Leaderboard Entries | Data Dictionary `<h4>` | 2383 | `Leaderboard Rate` | `Leaderboard Entries` |
| Scorecard View Rate → Scorecard Views | KPI label | 1769 | `Scorecard View Rate` | `Scorecard Views` |
| Scorecard View Rate → Scorecard Views | Data Dictionary `<h4>` | 2423 | `Scorecard View Rate` | `Scorecard Views` |
| Scorecard View Rate → Scorecard Views | Case Study table cell | 2646 | `Scorecard View Rate KPI` | `Scorecard Views KPI` |
| Leave Game Rate → Drop-off Rate | KPI label | 1779 | `Leave Game Rate` | `Drop-off Rate` |
| Leave Game Rate → Drop-off Rate | Data Dictionary `<h4>` | 2443 | `Leave Game Rate` | `Drop-off Rate` |
| Leave Game Rate → Drop-off Rate | Case Study table cell | 2658 | `Leave Game Rate KPI` | `Drop-off Rate KPI` |

**Not changed:**
- `game_start` references in formulas, sub-text, tooltips — these are internal GA4 event names, not display labels. Changing them would be misleading.
- `leaderboard_submit` in formula text — same reason.
- `player_death` in formula text — same reason.

**Task list:**
- [ ] `live.html:1725` — KPI label: `Total Sessions` → `Total Plays`
- [ ] `live.html:2323` — Dict title: `Total Sessions` → `Total Plays`
- [ ] `live.html:1740` — KPI label: `Death Rate` → `Deaths`
- [ ] `live.html:2353` — Dict title: `Death Rate` → `Deaths`
- [ ] `live.html:1755` — KPI label: `Leaderboard Rate` → `Leaderboard Entries`
- [ ] `live.html:2383` — Dict title: `Leaderboard Rate` → `Leaderboard Entries`
- [ ] `live.html:1769` — KPI label: `Scorecard View Rate` → `Scorecard Views`
- [ ] `live.html:2423` — Dict title: `Scorecard View Rate` → `Scorecard Views`
- [ ] `live.html:2646` — Case Study cell: `Scorecard View Rate KPI` → `Scorecard Views KPI`
- [ ] `live.html:1779` — KPI label: `Leave Game Rate` → `Drop-off Rate`
- [ ] `live.html:2443` — Dict title: `Leave Game Rate` → `Drop-off Rate`
- [ ] `live.html:2658` — Case Study cell: `Leave Game Rate KPI` → `Drop-off Rate KPI`
- [ ] Verify on staging: all 5 KPI labels updated, Data Dictionary titles match, Case Study table correct

---

### UX-2: White Section + Card Titles ✅ — June 24, 2026

**Commit:** `84e6ccc` | Production: ✅ live (merged to main)

**Problem:** Card titles are dim/low contrast — hard to scan on a dark background. QA feedback: "overwhelming and hard to read."

**Changes:**
- KPI card titles (`.kpi-label`) → `color: #fff`
- Chart card titles (`.card-title`) → `color: #fff`
- Section headers (`.section-label`) → `color: #fff`

**Effort:** XS — CSS only, 3 lines
**Files:** `live.html`

#### Implementation Plan (Haiku Agent Research — June 24, 2026)

**CSS changes — 3 lines total:**

| Selector | Line | Current | Change to |
|----------|------|---------|-----------|
| `.section-label` | 241 | `color: var(--text-dim)` | `color: #fff` |
| `.kpi-label` | 309 | `color: var(--text-dim)` | `color: #fff` |
| `.card-title` | 397 | `color: var(--cyan)` | `color: #fff` |

**No HTML changes needed** — all instances use these 3 classes consistently.

**HTML coverage confirmed:**
- `.section-label`: lines 1719, 1763, 1834, 1878, 1915 (section headers across all tabs)
- `.kpi-label`: lines 1722, 1727, 1732, 1737, 1747 (KPI tile labels)
- `.card-title`: lines 1799, 1805, 1814, 1838, 1881 (chart card headers)

**Already white:** None — all currently use color variables, no conflicts.

**Task list:**
- [ ] `live.html:241` — `.section-label` → `color: #fff`
- [ ] `live.html:309` — `.kpi-label` → `color: #fff`
- [ ] `live.html:397` — `.card-title` → `color: #fff`
- [ ] Verify on staging: section headers, KPI tiles, and chart cards all render white
- [ ] Confirm colored `.dot` spans inside `.card-title` are unaffected (they use their own color class)

---

### UX-3: Clickable KPI Cards → Data Dictionary

**Problem:** The `ⓘ` icon on each card is small and easy to miss. Users don't know cards link anywhere.

**Change:** Entire KPI card becomes clickable → jumps to its Data Dictionary entry (same behavior as the existing `⊞` back-link system).

**Tooltip plan (from screenshot annotations):**
- **Remove** per-card `ⓘ` icons (redundant once card is fully clickable)
- **Move** a single `ⓘ` to each **section header** ("TOP-LINE KPIS", "PLAYER BEHAVIOR") — explains what the section contains at a high level
- Hover tooltip on section `ⓘ` gives a one-liner: e.g. *"Core metrics measuring player volume and engagement."*

**Effort:** M
**Files:** `live.html` — KPI card HTML, JS click handlers, CSS cursor/hover state, section header HTML

---

### UX-4: `⊞` Icon → "View" Label ✅ — June 25, 2026

**Commit:** `ec33b20` | Production: ✅ live (merged to main)

**Problem:** The `⊞` icon in Data Dictionary and Case Study is cryptic — users don't know it navigates to a chart.

**Change:** Replace `⊞` with text label `Chart ↗`

**Effort:** S — 5 line changes
**Files:** `live.html`

#### Implementation Plan (Haiku Agent Research — June 24, 2026)

**How it works:**
- `BACKLINK_ICON` constant at line 6197 drives all 20+ Data Dictionary injections (via JS at line 6280)
- 4 Case Study findings have the `⊞` hardcoded in HTML (lines 2219, 2228, 2233, 2238)
- All icons use class `.dict-link` (CSS lines 1599–1610) — cyan, 0.8rem, cursor pointer

**Changes — 5 lines total:**

| Location | Line | Current | Change to |
|----------|------|---------|-----------|
| JS constant | 6197 | `var BACKLINK_ICON = '⊞';` | `var BACKLINK_ICON = 'Chart ↗';` |
| Case Study HTML | 2219 | `>⊞</span>` | `>Chart ↗</span>` |
| Case Study HTML | 2228 | `>⊞</span>` | `>Chart ↗</span>` |
| Case Study HTML | 2233 | `>⊞</span>` | `>Chart ↗</span>` |
| Case Study HTML | 2238 | `>⊞</span>` | `>Chart ↗</span>` |

Updating the constant at line 6197 automatically updates all Data Dictionary back-links (no further JS edits needed).

**CSS note:** `.dict-link` is already styled as text (font-size, color, cursor) — "Chart ↗" will render correctly with no CSS changes.

**Task list:**
- [ ] `live.html:6197` — `BACKLINK_ICON` constant → `'Chart ↗'`
- [ ] `live.html:2219` — Case Study 1 hardcoded `⊞` → `Chart ↗`
- [ ] `live.html:2228` — Case Study 2 hardcoded `⊞` → `Chart ↗`
- [ ] `live.html:2233` — Case Study 3 hardcoded `⊞` → `Chart ↗`
- [ ] `live.html:2238` — Case Study 4 hardcoded `⊞` → `Chart ↗`
- [ ] Verify on staging: Data Dictionary entries show "Chart ↗", Case Study findings show "Chart ↗"

---

### UX-5: Simplify Data Dictionary

**Problem:** Data Dictionary is too dense for average players. Walls of text with technical terms (BigQuery, SQL-style formulas, endpoint names).

**Proposed approach:**
- Lead each entry with a plain-English one-liner ("What this means for you")
- Move technical details (source endpoint, formula, BigQuery query) into a collapsible "Technical Details" sub-section
- Remove or soften jargon in visible labels

**Effort:** M-L — content rewrite + HTML restructure per entry (~20+ entries)
**Files:** `live.html` — Data Dictionary accordion HTML

---

### UX-6: Discrete Players KPI

**Problem:** No metric shows how many unique individuals have played — only total sessions.

**Proposed:** Add `Distinct Players` KPI to Overview (e.g. "16 players across 145 plays")

**Implementation:** BigQuery — `SELECT COUNT(DISTINCT user_pseudo_id)` on `player_won` or all events
**Effort:** M — new BigQuery handler in `api/index.js` + new KPI tile
**Dependencies:** MT-6 BigQuery work — implement as part of that batch
**Note:** Do this after MT-6 setup is complete; fits naturally into that session

---

### UX-7: Player Performance Page (New Tab)

**Problem:** No player-level view exists. All metrics are aggregated.

**Proposed content:**
- Distinct Players count (from UX-6)
- Score scatter plot (high score vs low score distribution)
- Sessions per player (avg + distribution)
- Win rate histogram by player
- High score leaderboard embed (see UX-8)

**Data requirements to verify:**
- Does GA4 capture `user_pseudo_id` on `player_won` events? *(must confirm before building)*
- Is `final_score` stored per session in BigQuery?

**Effort:** L — new tab, new BigQuery queries, new chart types
**Depends on:** UX-6, data verification

---

### UX-8: Leaderboard Tab

**Problem:** Leaderboard data exists in the API but isn't visible in the dashboard.

**Proposed:** New "Leaderboard" tab — sortable table (rank, player ID/name if available, score, date)

**Data:** Leaderboard endpoint already exists in Lambda
**Effort:** M — new tab HTML + fetch + table render
**Depends on:** Confirm leaderboard API returns per-player rows (not just aggregates)

---

## 🔢 Priority Order

| # | Task | Effort | When |
|---|------|--------|------|
| 1 | UX-2: White titles | XS | Next session |
| 2 | UX-4: `⊞` → "Chart" | S | Next session |
| 3 | UX-1: Rename metrics | S | Next session |
| 4 | UX-3: Clickable cards + section tooltips | M | Next session |
| 5 | UX-5: Simplify Data Dictionary | M-L | Separate session |
| 6 | UX-6: Distinct Players KPI | M | During MT-6 |
| 7 | UX-8: Leaderboard tab | M | After MT-6 |
| 8 | UX-7: Player Performance page | L | After UX-6 + UX-8 |

---

## ❓ Open Questions

1. **Leaderboard API format** — Does it return per-row player data or just summary stats? Check before building UX-8.
2. **`user_pseudo_id` on `player_won`** — Verify in BigQuery before committing to UX-7.
3. **Data Dictionary simplification** — Keep technical details (for portfolio viewers) but hide behind collapse? Or remove entirely?
4. **Section tooltip content** — What one-liner should appear for each section header ⓘ? (Owner to draft)

---

## 📎 Related Docs

- `docs/BigQuery_Future_Metrics.md` — MT-6 metric backlog (UX-6 slots in here)
- `docs/PRIORITIES.md` — task tracking
- `docs/HANDOFF_SUMMARY.md` — session log
