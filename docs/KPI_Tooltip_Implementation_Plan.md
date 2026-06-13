# KPI Tooltip Implementation Plan

**Purpose:** Exact implementation plan for the hybrid KPI tooltip system.

**Created:** June 13, 2026  
**Estimate:** 2–2.5 hours  
**Status:** 📋 READY TO IMPLEMENT — awaiting user approval

**Prerequisite:** Data Dictionary Tab 7 complete with all `id="dict-[metric]"` anchors ✅

---

## Overview

Three-tier hybrid approach:

| Tier | Mechanism | Count | When to Use |
|------|-----------|-------|-------------|
| **Tier 1** | CSS `::after` hover tooltip | 21 | Simple formula, plain-English explanation ≤ 120 chars |
| **Tier 2** | ℹ icon → Data Dictionary anchor | 23 | Multi-step formula, non-obvious data source, critical nuance |
| **Tier 3** | ℹ icon → Case Study section | 4 | Narrative insight — A/B results, AI behavior patterns |

---

## Files to Modify

Only `live.html`. No Lambda changes. No new files.

---

## Phase 1 — CSS Block

### Insertion Point
**File:** `live.html`  
**Line:** 1481 (closing `</style>` tag)  
**Action:** Insert before `</style>`

### CSS to Insert

```css
/* KPI Tooltips ─ Tier 1 hover */
.kpi-card { position: relative; }
.kpi-card[data-tooltip]:hover::after,
.kpi-card[data-tooltip].tooltip-visible::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text-dim);
  font-size: 0.68rem;
  font-family: var(--mono);
  padding: 6px 10px;
  border-radius: 3px;
  white-space: normal;
  text-align: center;
  line-height: 1.4;
  max-width: 260px;
  z-index: 200;
  pointer-events: none;
}
/* ℹ dict-link icon */
.dict-link {
  display: inline-block;
  margin-left: 5px;
  color: var(--cyan-dim);
  font-size: 0.68rem;
  cursor: pointer;
  user-select: none;
  vertical-align: middle;
  opacity: 0.55;
  transition: opacity 0.15s;
}
.dict-link:hover { opacity: 1; color: var(--cyan); }
```

---

## Phase 2 — HTML: Tier 1 data-tooltip Attributes

**Action:** Add `data-tooltip="..."` to the `.kpi-card` container div for each KPI below.  
The `.kpi-card` opening tag is 1–2 lines above the label line listed.

### Overview Tab — Top-Line KPIs

| Label | Label Line | Value ID | data-tooltip Text |
|-------|-----------|----------|-------------------|
| Total Sessions | 1593 (on value div) | `kpi-sessions` | `Count of game_start events. One per play session across all platforms.` |
| Avg Survival | 1618 | `kpi-survival` | `Avg session length from game_start to outcome. Minutes per run.` |
| Avg Level Reached | 1628 | `kpi-avg-level` | `Weighted avg level where players died. Scale: 1–12 levels + 3 boss stages.` |
| Desktop Avg Level | ~1628+2 | `kpi-desk-level` | `Weighted avg death level for desktop players only. Deaths used, not wins.` |
| Mobile Avg Level | ~1628+4 | `kpi-mob-level` | `Weighted avg death level for mobile players only. Deaths used, not wins.` |

### Overview Tab — Chart Canvases (add data-tooltip to canvas wrapper div)

| Chart | Canvas ID | Canvas Line | data-tooltip Text |
|-------|-----------|-------------|-------------------|
| Daily Plays & Wins | `chart-daily` | 1671 | `Magenta: daily game_start count. Cyan: daily player_won count.` |
| Plays by Device | `chart-device` | 1677 | `Sessions split: desktop % vs mobile %. Derived from GA4 deviceCategory.` |
| A/B Music Split | `chart-ab-split` | 1686 | `% of sessions assigned to each A/B group — Music ON vs OFF.` |
| Powerup Usage | `chart-powerup` | 1692 | `Powerup collections by type and phase (green / red / purple).` |
| Session Outcome | `chart-session-outcome` | 1895 | `Daily stacked bar: wins (green) + deaths (red) + abandoned (yellow).` |

### Game Funnel Tab — Funnels

| Element | ID | Line | data-tooltip Text |
|---------|----|------|-------------------|
| Main Funnel | `funnel-main` | 1709 | `8-stage session funnel: game_start → boss attempts/defeats → victory.` |
| Music ON Funnel | `funnel-music-on` | 1752 | `Game funnel for Group A — Music ON sessions only.` |
| Music OFF Funnel | `funnel-music-off` | 1756 | `Game funnel for Group B — Music OFF sessions only.` |

### Wave Drop-off / Death Chart

| Chart | Canvas ID | Canvas Line | data-tooltip Text |
|-------|-----------|-------------|-------------------|
| Wave Drop-off | `chart-dropdoff` | 1722 | `Deaths by level (L1–L12 + boss stages), color-coded by phase. Toggle: ALL / DESKTOP / MOBILE.` |

### Boss Analysis Tab — Charts

| Chart | Canvas ID | Canvas Line | data-tooltip Text |
|-------|-----------|-------------|-------------------|
| Boss Kill Rate | `chart-boss-ratio` | 1793 | `Grouped bar: attempts (grey) vs defeats (cyan) per boss.` |
| Boss by Platform | `chart-boss-platform` | 1799 | `Boss defeat rate (%) by platform — desktop vs mobile per boss.` |

### AI Agent Tab — Charts

| Chart | Canvas ID | Canvas Line | data-tooltip Text |
|-------|-----------|-------------|-------------------|
| Tier Distribution | `chart-ai-tier-dist` | 1869 | `Player count per difficulty tier — Tutorial (−3) to Master (+3).` |
| Tier Flow | `chart-ai-tier-flow` | 1876 | `Count of AI tier increases vs decreases across all sessions.` |
| Score Multiplier | `chart-ai-score-mult` | 1888 | `player_won events by score multiplier bucket (0.50× to 1.50×+).` |
| Death Triggers | `chart-ai-death-triggers` | 1906 | `Deaths by game phase (green/red/purple) that triggered a tier decrease.` |

### Platform Tab — Charts

| Chart | Canvas ID | Canvas Line | data-tooltip Text |
|-------|-----------|-------------|-------------------|
| Platform Funnel | `chart-platform-funnel` | 2017 | `% session completion at each funnel stage — desktop vs mobile.` |
| Survival Distribution | `chart-survival-dist` | 2023 | `Duration buckets (0–0.5m to 8+m): % of sessions per bucket by platform.` |

---

## Phase 3 — HTML: Tier 2 ℹ Icon Additions

**Action:** Add `<span class="dict-link" data-dict="[anchor]">ℹ</span>` inline inside the `.kpi-label` div for each KPI below.

**Format:**
```html
<!-- BEFORE -->
<div class="kpi-label">Win Rate</div>

<!-- AFTER -->
<div class="kpi-label">Win Rate <span class="dict-link" data-dict="winrate">ℹ</span></div>
```

### Overview Tab — Top-Line KPIs

| KPI Label | Label Line | Dict Anchor | Critical Note |
|-----------|-----------|-------------|---------------|
| New vs Returning | 1597 | `new-pct` | — |
| Win Rate | 1602 | `winrate` | — |
| Death Rate | 1607 | `deathrate` | ⚠ Denominator is `wins + deaths`, NOT `game_starts` |
| Play-Again Rate | 1612 | `replay` | — |
| Leaderboard Rate | 1622 | `lbrate` | Denominator: wins only, not sessions |

### Overview Tab — Player Behavior KPIs

| KPI Label | Label Line | Dict Anchor |
|-----------|-----------|-------------|
| Scorecard View Rate | 1636 | `scorecard-rate` |
| Music Toggle Rate | 1641 | `music-rate` |
| Leave Game Rate | 1646 | `leave-rate` |
| Boss Reach Rate | 1651 | `boss-reach` |
| Survey Response Rate | 1656 | `survey-rate` |

### AI Agent Tab — KPIs

| KPI Label | Label Line | Dict Anchor | Critical Note |
|-----------|-----------|-------------|---------------|
| Avg Start Tier | 1843 | `avg-start-tier` | BigQuery only — window function |
| Avg Final Tier | 1848 | `avg-final-tier` | BigQuery only — window function |
| Speed Lock Rate | 1853 | `speedlock` | "Speed locked" = tier where bullet speed stops scaling |
| Avg Tier Adjustments | 1858 | `death-triggers` | Currently shows total count, not per-session avg |

### Platform Tab — KPIs

| KPI Label | Label Line | Dict Anchor |
|-----------|-----------|-------------|
| Desktop Win Rate | 1992 | `platform-kpis` |
| Mobile Win Rate | 1997 | `platform-kpis` |

---

## Phase 4 — HTML: Tier 3 ℹ Icon Additions (Case Study links)

**Action:** Same ℹ icon pattern, but `data-case="[section-id]"` instead of `data-dict`.  
Add to the chart card title or the container heading for each item.

| Element | Location | data-case value | Case Study Section |
|---------|----------|-----------------|-------------------|
| Music A/B Test result summary | A/B tab, section heading | `cs-ab-findings` | Music OFF counterintuitively wins (44% vs 23%) |
| AI Tier behavior summary | AI tab, adjustments section | `cs-ai-findings` | 25 increases vs 3 decreases — system pushing players harder |
| Wave Drop-off pattern | Game Funnel tab, chart note | `cs-death-findings` | L1–L4 deaths are the retention bottleneck, not boss fights |
| Powerup collection gap | Overview chart note | `cs-powerup-findings` | Mobile 5× more powerups than desktop |

**Note:** Case Study section IDs (`cs-ab-findings`, `cs-ai-findings`, etc.) need to be added as anchor `id` attributes to the relevant sections in the Case Study tab HTML. Verify these exist or add them during implementation.

---

## Phase 5 — JavaScript

### Insertion Point
**File:** `live.html`  
**Line:** 5965 (closing `</script>` tag — insert before this line)  

**Related functions already in file:**
- `switchTab()` — line 5747
- `toggleDict()` — line 5958
- `document.addEventListener('click', ...)` — line 5813 (existing click handler — do NOT modify; add new block separately)

### JS to Insert

```javascript
// Tier 2/3 tooltip nav: dict-link and case-link click handlers
(function() {
  document.addEventListener('click', function(e) {
    // Tier 2: ℹ → Data Dictionary anchor
    const dictLink = e.target.closest('[data-dict]');
    if (dictLink) {
      e.stopPropagation();
      const sectionId = dictLink.dataset.dict;
      switchTab('data-dict');
      setTimeout(function() {
        if (!document.getElementById('dict-hdr-' + sectionId)?.classList.contains('open')) {
          toggleDict(sectionId);
        }
        const anchor = document.getElementById('dict-' + sectionId);
        if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
    // Tier 3: ℹ → Case Study section
    const caseLink = e.target.closest('[data-case]');
    if (caseLink) {
      e.stopPropagation();
      switchTab('case-study');
      setTimeout(function() {
        const el = document.getElementById(caseLink.dataset.case);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
    // Mobile Tier 1: tap to toggle hover tooltip
    const tooltipCard = e.target.closest('.kpi-card[data-tooltip]');
    if (tooltipCard && !e.target.closest('[data-dict]') && !e.target.closest('[data-case]')) {
      tooltipCard.classList.toggle('tooltip-visible');
    }
  });
})();
```

---

## Possible Errors & Solutions

| Error | Likely Cause | Solution |
|-------|-------------|---------|
| Tooltip clips off top of viewport | `bottom: calc(100% + 8px)` pushes above fold | Change to `top: calc(100% + 8px)` for cards near top of page |
| ℹ icon not clickable on mobile | Touch target too small | Increase padding: `.dict-link { padding: 2px 4px; }` |
| Accordion doesn't auto-expand | `sectionId` doesn't match `toggleDict` param | Verify `data-dict` value matches suffix in `dict-hdr-[id]` and `dict-body-[id]` |
| Tooltip text truncated | `max-width: 260px` too narrow for long text | Increase to `300px` or reduce tooltip text |
| Tier 3 scroll not working | Case Study section IDs don't exist | Add `id="cs-ab-findings"` etc. to Case Study tab HTML during implementation |
| dict-link click triggers card tooltip too | Event propagation | The JS checks `!e.target.closest('[data-dict]')` before toggling — ensure this guard is present |

---

## Testing Checklist

### Tier 1 — CSS Hover
- [ ] Hover over Total Sessions KPI → tooltip appears above card
- [ ] Hover over Daily Plays chart → tooltip appears
- [ ] Mobile: tap KPI card → tooltip appears; tap again → dismisses
- [ ] Tooltip does not overflow viewport horizontally

### Tier 2 — ℹ → Data Dictionary
- [ ] Click ℹ on Win Rate → Data Dictionary tab opens
- [ ] Dictionary accordion for Win Rate auto-expands
- [ ] Page scrolls to the `dict-winrate` anchor
- [ ] Click ℹ on Death Rate → Death Rate accordion opens (verify denominator note visible)
- [ ] Click ℹ on Avg Start Tier → accordion opens (verify BigQuery note visible)

### Tier 3 — ℹ → Case Study
- [ ] Click ℹ on A/B result → Case Study tab opens
- [ ] Page scrolls to the relevant Case Study section

### Regression
- [ ] All existing KPI tiles still populate with live data after attribute additions
- [ ] switchTab() and toggleDict() still work normally from other call sites
- [ ] Mobile hamburger menu unaffected

---

## Implementation Sequence

1. **Phase 1** — CSS block (1 edit, line 1481) — ~5 min
2. **Phase 5** — JS block (1 edit, line 5965) — ~5 min  
   *(do JS early so you can test interactivity as you add HTML)*
3. **Phase 2** — Tier 1 `data-tooltip` attributes (~21 HTML edits) — ~45 min
4. **Phase 3** — Tier 2 ℹ icon spans (~16 HTML edits) — ~40 min
5. **Phase 4** — Tier 3 ℹ icons + add Case Study anchor IDs (~4 edits) — ~20 min
6. **Testing** — ~20 min

**Total: ~2.5 hours**

---

## Notes

- **Death Rate** is the most important Tier 2 item — the denominator nuance (`wins + deaths`, not `game_starts`) is frequently misunderstood. The ℹ icon there is highest-value.
- **Avg Tier Adjustments** dict anchor currently points to `death-triggers` section — this is intentional since that section explains both KPIs together. Revisit if a dedicated entry is added.
- **Case Study anchors** (Phase 4) may not exist yet in the Case Study tab HTML. Check during implementation and add `id` attributes as needed.
- **No Lambda changes** — this is purely a frontend styling + UX feature.

---

**User Approval Required Before Implementation**
