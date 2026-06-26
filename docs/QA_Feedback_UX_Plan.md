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

### UX-0: Hamburger Menu Color Styling ✅ — June 25, 2026

**Problem:** The hamburger icon, "DASHBOARDS" label, and "- OVERVIEW" active tab name all render in cyan — they blend into the general UI accent color and don't feel distinct from other interface elements.

**Change:**
- Hamburger icon bars + "DASHBOARDS" label → neon green (`var(--green)`, `#39FF14`)
- "- OVERVIEW" active tab name → yellow (`var(--yellow)`, `#FFD700`)

**Effort:** XS — 3 CSS property changes, no HTML or JS changes
**Files:** `live.html` — CSS only

#### Implementation Plan

| Selector | Line | Property | Current | Change to |
|----------|------|----------|---------|-----------|
| `.hamburger-label` | 1256 | `color` | `var(--cyan)` | `var(--green)` |
| `.active-tab-name` | 1262 | `color` | `var(--mag)` | `var(--yellow)` |
| `.hamburger-btn span` | 1299 | `background` | `var(--cyan)` | `var(--green)` |

**Not changed:**
- `.hamburger-btn` border/color properties — border stays `var(--border)`, keeping button outline neutral
- `.hamburger-btn:hover` — hover state stays cyan to signal interactivity
- `.mobile-menu` border — stays cyan, unrelated to this change

**Task list:**
- [ ] `live.html:1256` — `.hamburger-label` color → `var(--green)`
- [ ] `live.html:1262` — `.active-tab-name` color → `var(--yellow)`
- [ ] `live.html:1299` — `.hamburger-btn span` background → `var(--green)`
- [ ] Verify on staging at ≤900px: hamburger bars + "DASHBOARDS" are neon green, "- OVERVIEW" is yellow

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

### UX-3: Clickable KPI Cards → Data Dictionary ✅ — June 25, 2026

**Problem:** The `ⓘ` icon on each card is small and easy to miss. Users don't know cards link anywhere.

**Change:** Entire KPI card becomes clickable → jumps to its Data Dictionary entry (same behavior as the existing back-link system).

**Tooltip plan (from screenshot annotations):**
- **Remove** per-card `ⓘ` icons (redundant once card is fully clickable)
- **Move** data-dict routing to the `.kpi` wrapper div itself
- **Add** a single `ⓘ` to each **section header** with a hover tooltip one-liner
- Hover tooltip on section `ⓘ` gives a one-liner per section (drafted below)

**Section tooltip one-liners (drafted):**

| Section Header | Tooltip Text |
|---|---|
| TOP-LINE KPIS | "Core metrics — how many people played, won, and came back." |
| PLAYER BEHAVIOR | "What players do during a run — deaths, drop-offs, and feature usage." |
| AI AGENT | "How the difficulty AI is adjusting in response to player performance." |
| A/B TESTS | "Live split test comparing music toggle and player performance and the two movement control schemes used by the player." |
| PLATFORM BREAKDOWN | "Side-by-side comparison of Desktop vs. Mobile player outcomes." |

**Effort:** M
**Files:** `live.html` — KPI card HTML, JS click handlers, CSS cursor/hover state, section header HTML

#### Research Findings (Explore Agent — June 25, 2026)

**KPI cards with ⓘ icons — 16 cards total (17 icon instances):**

| Line | KPI Label | `data-dict` value | `data-case` value |
|------|-----------|-------------------|-------------------|
| 1730 | Returning Players | `new-pct` | — |
| 1735 | Win % | `winrate` | — |
| 1740 | Death % | `deathrate` | — |
| 1745 | Play-Again % | `replay` | — |
| 1755 | Leaderboard Entries | `lbrate` | — |
| 1769 | Scorecard Views | `scorecard-rate` | — |
| 1774 | Music Toggle % | `music-rate` | — |
| 1779 | Drop-off Rate | `leave-rate` | — |
| 1784 | Boss Reach % | `boss-reach` | — |
| 1789 | Survey Response % | `survey-rate` | — |
| 1976 | Avg Start Tier | `avg-start-tier` | — |
| 1981 | Avg Final Tier | `avg-final-tier` | — |
| 1986 | Speed Lock % | `speedlock` | — |
| 1991 | Total Tier Adjustments | `avg-adjustments` | `cs-ai-findings` ← dual icon |
| 2132 | Desktop Win % | `platform-kpis` | — |
| 2137 | Mobile Win % | `platform-kpis` | — |

**Note on dual-icon card (Total Tier Adjustments, line 1991):**
- Has TWO ⓘ icons: one links to Dict (`avg-adjustments`), one links to Case Study (`cs-ai-findings`)
- Dict and Case Study are on separate tabs — both cannot highlight simultaneously
- **Decision (Option A):** Click navigates to Dict entry only. `data-case` link removed with the ⓘ icon.

**Section header locations (`.section-label` class):**

| Line | Section Text | ⓘ tooltip? |
|------|-------------|------------|
| 1722 | Top-Line KPIs | ✅ add ⓘ |
| 1766 | Player Behavior | ✅ add ⓘ |
| 1964 | AI Agent v1.0 — Adaptive Difficulty System | ✅ add ⓘ |
| 2087 | A/B Test 1 — Music Default (ON vs OFF) | ✅ add ⓘ (covers both A/B tests) |
| 2090 | A/B Test 2 — Movement Scheme | — (covered by ⓘ on 2087) |
| 2129 | Desktop vs Mobile Comparison | ✅ add ⓘ |
| 2168 | Full Platform Breakdown | — (secondary, no tooltip) |

**Key functions:**
- `navigateAndGlow(tab, elementId)` — lines 6262–6271 — handles tab switch + scroll + glow
- Delegated click handler — lines 6289–6305 — listens for `[data-backlink]` / `[data-cs-backlink]`
- `switchTab()` — line 5904
- `#kpi-tooltip` — lines 1580–1597 — existing floating tooltip element (already used for `.kpi` hover)
- `BACKLINK_MAP` — lines 6204–6228 — Dict routing table
- `CS_BACKLINK_MAP` — lines 6232–6237 — Case Study routing table

**Existing tooltip mechanism:** `.kpi` cards already have `data-tooltip` attributes powering the `#kpi-tooltip` on hover — section ⓘ tooltips will reuse this same `#kpi-tooltip` element.

#### Implementation Plan

**Part 1 — CSS (2 changes):**

| Selector | Change |
|----------|--------|
| `.kpi[data-dict]` | Add `cursor: pointer` + subtle hover border glow |
| `.section-info` (new class) | Style section header ⓘ icon — same cyan, small, positioned inline |

**Part 2 — HTML (per-card edits + section header edits):**

For each of the 16 KPI cards:
- Remove `<span class="dict-link" data-dict="...">ⓘ</span>` from inside `.kpi-label`
- Move `data-dict="..."` attribute to the parent `.kpi` div

Section headers (5 additions):
- `live.html:1722` — Top-Line KPIs → append `<span class="section-info" data-tooltip="Core metrics — how many people played, won, and came back.">ⓘ</span>`
- `live.html:1766` — Player Behavior → append `<span class="section-info" data-tooltip="What players do during a run — deaths, drop-offs, and feature usage.">ⓘ</span>`
- `live.html:1964` — AI Agent → append `<span class="section-info" data-tooltip="How the difficulty AI is adjusting in response to player performance.">ⓘ</span>`
- `live.html:2087` — A/B Tests → append `<span class="section-info" data-tooltip="Live split test comparing music toggle and player performance and the two movement control schemes used by the player.">ⓘ</span>`
- `live.html:2129` — Platform → append `<span class="section-info" data-tooltip="Side-by-side comparison of Desktop vs. Mobile player outcomes.">ⓘ</span>`

**Part 3 — JS (1 addition to existing click delegation block ~line 6289):**

Add handler: when `.kpi[data-dict]` is clicked → read `data-dict` value → look up in `BACKLINK_MAP` → call `navigateAndGlow(tab, elementId)`

Also: `.section-info` hover → show/hide `#kpi-tooltip` (reuse existing tooltip show/hide logic)

#### Task List

- [x] CSS: Add `cursor: pointer` + hover glow to `.kpi[data-dict]`
- [x] CSS: Add `.section-info` icon styles
- [x] HTML: Remove ⓘ span from `live.html:1730` (Returning Players) + move `data-dict` to `.kpi`
- [x] HTML: Remove ⓘ span from `live.html:1735` (Win %) + move `data-dict` to `.kpi`
- [x] HTML: Remove ⓘ span from `live.html:1740` (Death %) + move `data-dict` to `.kpi`
- [x] HTML: Remove ⓘ span from `live.html:1745` (Play-Again %) + move `data-dict` to `.kpi`
- [x] HTML: Remove ⓘ span from `live.html:1755` (Leaderboard Entries) + move `data-dict` to `.kpi`
- [x] HTML: Remove ⓘ span from `live.html:1769` (Scorecard Views) + move `data-dict` to `.kpi`
- [x] HTML: Remove ⓘ span from `live.html:1774` (Music Toggle %) + move `data-dict` to `.kpi`
- [x] HTML: Remove ⓘ span from `live.html:1779` (Drop-off Rate) + move `data-dict` to `.kpi`
- [x] HTML: Remove ⓘ span from `live.html:1784` (Boss Reach %) + move `data-dict` to `.kpi`
- [x] HTML: Remove ⓘ span from `live.html:1789` (Survey Response %) + move `data-dict` to `.kpi`
- [x] HTML: Remove ⓘ span from `live.html:1976` (Avg Start Tier) + move `data-dict` to `.kpi`
- [x] HTML: Remove ⓘ span from `live.html:1981` (Avg Final Tier) + move `data-dict` to `.kpi`
- [x] HTML: Remove ⓘ span from `live.html:1986` (Speed Lock %) + move `data-dict` to `.kpi`
- [x] HTML: Remove BOTH ⓘ spans from `live.html:1991` (Total Tier Adjustments) + move `data-dict="avg-adjustments"` only to `.kpi` (drop `data-case`)
- [x] HTML: Remove ⓘ span from `live.html:2132` (Desktop Win %) + move `data-dict` to `.kpi`
- [x] HTML: Remove ⓘ span from `live.html:2137` (Mobile Win %) + move `data-dict` to `.kpi`
- [x] HTML: Add section ⓘ to `live.html:1722` (Top-Line KPIs)
- [x] HTML: Add section ⓘ to `live.html:1766` (Player Behavior)
- [x] HTML: Add section ⓘ to `live.html:1964` (AI Agent)
- [x] HTML: Add section ⓘ to `live.html:2087` (A/B Tests — covers both Music + Movement)
- [x] HTML: Add section ⓘ to `live.html:2129` (Platform Breakdown)
- [x] JS: No changes needed — existing `[data-dict]` handler + `querySelectorAll('[data-tooltip]')` covered both behaviors
- [x] Verify on staging: all KPI cards clickable, cursor changes, glow animates on Dict entry
- [x] Verify on staging: section ⓘ icons show correct one-liner tooltip on hover
- [x] Verify on staging: Total Tier Adjustments navigates to Dict entry only

**Commit:** `eac7416` | Production: ✅ live (merged to main)

**Follow-up UX-3b** ✅ — `2187025`, live: Removed `data-tooltip` from Total Plays, Avg Survival, and Avg Level Reached — hover tooltips were redundant once cards became clickable.

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

### UX-5: Simplify Data Dictionary ✅ — June 26, 2026

**Commit:** `dc40d80` | Production: ✅ live (pending merge to main)

**Problem:** Data Dictionary is too dense for average players. Walls of text with technical terms (BigQuery, SQL-style formulas, endpoint names).

**Approach (finalized June 26, 2026):**
- Add a plain-English one-liner summary to each entry (always visible, directly below title)
- Remove `Source`, `Format`, `Note`, `Why BQ`, and `Status logic` rows from every `<dl>`
- Wrap remaining `<dl>` content in a `<details class="dict-technical">` collapse ("Technical details")
- A/B comparison tables stay visible outside the collapse
- "Chart ↗" back-links unaffected — JS-injected into `dict-entry-title`, not the `<dl>`
- Create missing `dict-platform-kpis` entry (Desktop/Mobile Win % cards link to it but no entry exists)

**Effort:** M-L
**Files:** `live.html` — CSS + Data Dictionary HTML (26 entries + 1 new)

---

#### Implementation Plan (June 26, 2026)

**Part 1 — CSS (insert after line 1564):**
```css
.dict-summary { margin: 4px 0 10px; color: var(--text); font-size: 0.82rem; line-height: 1.5; }
details.dict-technical { margin-top: 6px; }
details.dict-technical > summary { color: var(--text-dim); font-size: 0.70rem; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; user-select: none; }
details.dict-technical > summary:hover { color: var(--cyan); }
```

**Part 2 — Rows to remove (47 total):**
- Source: 21 rows — lines 2346, 2356, 2366, 2376, 2386, 2396, 2406, 2416, 2426, 2446, 2456, 2466, 2476, 2486, 2506, 2517, 2526, 2538, 2547, 2557, 2567
- Format: 17 rows — lines 2347, 2357, 2367, 2377, 2387, 2397, 2407, 2417, 2427, 2447, 2457, 2467, 2477, 2487, 2507, 2518, 2527
- Note: 9 rows — lines 2348, 2378, 2408, 2418, 2428, 2509, 2528, 2558, 2568
- Why BQ: 1 row — line 2508
- Status logic: 1 row — line 2873

**Part 3 — Summary text + `<details>` wrap per entry (26 entries):**

*Section 1 — Top-Line KPIs:*
| ID | Summary |
|----|---------|
| `dict-sessions` | How many times someone hit Play — each run counts as one, even if abandoned early. |
| `dict-new-pct` | How many players came back for another session. High % means the game is worth replaying. |
| `dict-winrate` | Out of all finished runs, how many ended in a win. A direct read on difficulty balance. |
| `dict-deathrate` | Out of all finished runs, how many ended in death. The flip side of Win %. |
| `dict-replay` | How often a player immediately started another run after finishing one. High % = the game hooks people on the spot. |

*Section 2 — Player Behavior:*
| ID | Summary |
|----|---------|
| `dict-survival` | How long a typical run lasts. Mobile players currently survive about twice as long as Desktop players. |
| `dict-lbrate` | Of players who won, how many submitted their score. High % = players care about competing. |
| `dict-avglevel` | The level where most players die. Lower numbers mean players are dropping off earlier in the game. |
| `dict-speedlock` | How often the AI difficulty system hits its hardest bullet-speed setting. High % = players are pushing the upper limit. |
| `dict-scorecard-rate` | How many players stopped to look at their end-of-run stats. High % = players are curious about their performance. |
| `dict-music-rate` | How often players changed the music setting during a session. |
| `dict-leave-rate` | Sessions that ended without a win or death — the player just quit. High % = early frustration signal. |
| `dict-boss-reach` | How many players lasted long enough to face the first boss. Low % = many players don't make it through the early game. |
| `dict-survey-rate` | How many players filled out the in-game feedback survey. |

*Section 3 — AI Agent:*
| ID | Summary |
|----|---------|
| `dict-avg-start-tier` | The difficulty tier players typically begin a session on. Tier 0 = Normal. Updates daily from BigQuery. |
| `dict-avg-final-tier` | The difficulty tier players end on. Higher than Start Tier = the AI is making the game harder over time. Updates daily. |
| `dict-avg-adjustments` | How many times the AI has changed the difficulty across all sessions ever played. |
| `dict-ai-tier-dist` | How often sessions end at each difficulty tier, from Tutorial (easiest) to Master (hardest). |
| `dict-tier-flow` | Whether the AI is more often increasing or decreasing difficulty. Currently: 25 increases vs 3 decreases — players are being challenged more, not less. |
| `dict-score-mult` | The range of score multipliers earned by winning players. Higher multipliers mean harder difficulty settings at time of win. |
| `dict-death-triggers` | Which phase of the game — Green, Red, or Purple — is killing the most players. |

*Section 4 — A/B Tests (dl only in collapse; tables + key finding notes stay visible):*
| Entry | Summary |
|-------|---------|
| Music A/B Test | Music OFF players are currently winning more often (44% vs 23%), but the sample is too small to be conclusive. |
| Movement A/B Test | Comparing horizontal-only movement (with a score bonus) vs full directional movement. |
| Statistical Significance | A check on whether we have enough players in each group to trust the results. Currently: no — both tests need ~385 players per group. |

*Section 5 — Version & Date:*
| Entry | Summary |
|-------|---------|
| What Version 4.3 Means | All metrics show v4.3 data only (active since March 2026). Earlier versions used different mechanics — mixing them would distort every number. |
| Date Range Options | Controls how far back the data goes. All-time is the default. Note: Avg Start/Final Tier always use the full dataset regardless of this setting. |

**Part 4 — New entry (insert before line 2583):**
```html
<div class="dict-entry" id="dict-platform-kpis">
  <div class="dict-entry-title"><h4>Platform KPIs</h4><span class="dict-badge live">Live</span></div>
  <p class="dict-summary">Side-by-side win rates for Desktop vs Mobile players. Useful for spotting control-scheme difficulty differences.</p>
  <details class="dict-technical">
    <summary>Technical details</summary>
    <dl class="dict-meta">
      <dt>Desktop Win %</dt><dd class="formula">desktop player_won / desktop game_start × 100</dd>
      <dt>Mobile Win %</dt><dd class="formula">mobile player_won / mobile game_start × 100</dd>
    </dl>
  </details>
</div>
```

**Part 5 — Movement A/B note update (line 2864):**
- Remove: "Win Rate shows — because `player_won` events are not tagged with `movement_group` in the game code. Game-side fix required to unlock this metric."
- Replace with: "Win Rate data pending — can be unlocked via BigQuery join on `ga_session_id` (see MT-6 backlog)."

#### Task List

- [x] CSS: Add 4 new `.dict-summary` + `details.dict-technical` rules after line 1564
- [x] HTML: Remove 47 Source/Format/Note/Why BQ/Status logic rows
- [x] HTML: Insert summary + wrap dl in `<details>` — Section 1 (5 entries: dict-sessions → dict-replay)
- [x] HTML: Insert summary + wrap dl in `<details>` — Section 2 (9 entries: dict-survival → dict-survey-rate)
- [x] HTML: Insert summary + wrap dl in `<details>` — Section 3 (7 entries: dict-avg-start-tier → dict-death-triggers)
- [x] HTML: Insert summary + wrap dl in `<details>` — Section 4 A/B (3 entries: Music, Movement, Statistical Significance)
- [x] HTML: Insert summary + wrap dl in `<details>` — Section 5 Version (2 entries)
- [x] HTML: Create new `dict-platform-kpis` entry before line 2583
- [x] HTML: Update Movement A/B note at line 2864
- [x] HTML: Remove Lambda API Endpoints Reference section (internal, not user-facing)
- [x] HTML: Remove Future Metrics BigQuery Backlog section (internal dev planning)
- [x] Verify: All 21 KPI card click-throughs scroll + glow to correct dict entry
- [x] Verify: `dict-platform-kpis` entry exists — Desktop/Mobile Win % cards navigate to it
- [x] Verify: "Chart ↗" back-links still appear in dict entries
- [x] Verify: A/B comparison tables still visible outside collapse
- [x] Verify: Dict accordion section toggles unaffected

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
