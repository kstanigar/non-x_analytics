# Back-link Feature Plan — Data Dictionary / Case Study → Dashboard

**Purpose:** Add ⊞ icons to Data Dictionary entries and Case Study findings that navigate back to the originating metric or chart on the dashboard, with a 5-second pulsing border glow on the target card/tile.

**Status:** PLANNING — not yet implemented  
**Created:** June 13, 2026  
**Icon:** `⊞` (U+229E — squared plus / grid)  
**Glow:** 5s pulsing border glow matching the element's existing color class  

---

## Feature Summary

**Forward direction (already live):** Dashboard ⓘ icon → Data Dictionary entry (yellow pulse on dict-entry)  
**New backward direction:** Data Dictionary ⊞ icon → Dashboard KPI tile or chart card (border glow on card/tile)

**Back-link behavior:**
1. User clicks `⊞` on a Data Dictionary entry or Case Study finding
2. `switchTab()` navigates to the correct tab
3. 80ms delay (tab render) → element scrolled into view
4. Element's border glows and pulses for 5s in its natural color, then fades

---

## Implementation Approach

### Why JS-driven (not 40+ HTML edits)

The Data Dictionary has 40+ entries. Adding `⊞` icons via HTML edits to each one is fragile and hard to maintain. Instead:

- **One JS lookup table** maps every `dict-id` → `{ tab, elementId, color }`
- **JS at page load** iterates the table and injects `⊞` icons into matching `.dict-entry-title` elements
- **One click handler** reads `data-backlink` from the injected icon and executes the navigation + glow
- **Case Study:** Only 4 findings — these are HTML edits (small scope)

---

## Tab Name Reference (verified)

| Tab label | `switchTab()` string |
|-----------|---------------------|
| Overview | `'overview'` |
| Game Funnel | `'funnel'` |
| Boss Analysis | `'bosses'` |
| AI Agent | `'ai'` |
| A/B Tests | `'ab'` |
| Platform | `'platform'` |
| Case Study | `'case-study'` |
| Data Dictionary | `'data-dict'` |

---

## Lookup Table (verified by Haiku agent, June 13, 2026)

KPI tiles: target is the `.kpi` div (scroll + glow the div).  
Charts: target is the `.card` div wrapping the canvas (scroll + glow the card).  
Color class drives the glow color — if none, default to `--cyan`.

| dict-id | tab | element-id | color |
|---------|-----|------------|-------|
| `dict-sessions` | `overview` | `kpi-sessions` | cyan (default) |
| `dict-new-pct` | `overview` | `kpi-new-pct` | magenta |
| `dict-winrate` | `overview` | `kpi-winrate` | green |
| `dict-deathrate` | `overview` | `kpi-deathrate` | red |
| `dict-replay` | `overview` | `kpi-replay` | yellow |
| `dict-survival` | `overview` | `kpi-survival` | cyan (default) |
| `dict-lbrate` | `overview` | `kpi-lb-rate` | magenta |
| `dict-avglevel` | `overview` | `kpi-avg-level` | green |
| `dict-scorecard-rate` | `overview` | `kpi-scorecard-rate` | yellow |
| `dict-music-rate` | `overview` | `kpi-music-rate` | cyan (default) |
| `dict-leave-rate` | `overview` | `kpi-leave-rate` | red |
| `dict-boss-reach` | `overview` | `kpi-boss-reach-rate` | green |
| `dict-survey-rate` | `overview` | `kpi-survey-rate` | magenta |
| `dict-speedlock` | `ai` | `kpi-ai-speed-lock` | cyan (default) |
| `dict-avg-start-tier` | `ai` | `kpi-ai-avg-start` | cyan (default) |
| `dict-avg-final-tier` | `ai` | `kpi-ai-avg-final` | cyan (default) |
| `dict-avg-adjustments` | `ai` | `kpi-ai-avg-adjustments` | cyan (default) |
| `dict-ai-tier-dist` | `ai` | `chart-ai-tier-dist` | card (cyan) |
| `dict-tier-flow` | `ai` | `chart-ai-tier-flow` | card (cyan) |
| `dict-score-mult` | `ai` | `chart-ai-score-mult` | card (cyan) |
| `dict-death-triggers` | `ai` | `chart-ai-death-triggers` | card (cyan) |
| `dict-platform-kpis` | `platform` | `kpi-desk-win` | cyan (default) |

**Note:** Many chart/table dict entries (`dict-daily-chart`, `dict-funnel`, `dict-boss-cards`, `dict-music-ab`, etc.) exist in the Data Dictionary HTML but were not confirmed as having matching `id="dict-*"` anchors in the current build. These will be skipped by the JS lookup — no error, just no `⊞` icon. Can be added to the table later.

**Case Study back-links (4 items — HTML edits):**

| finding id | tab | element-id | color |
|------------|-----|------------|-------|
| `cs-ab-findings` | `ab` | `chart-ab-split` | card (cyan) |
| `cs-ai-findings` | `ai` | `kpi-ai-avg-adjustments` | cyan (default) |
| `cs-death-findings` | `funnel` | `chart-dropdoff` | card (cyan) |
| `cs-powerup-findings` | `overview` | `chart-powerup` | card (cyan) |

---

## CSS Changes (1 edit)

**File:** `live.html`  
**Insert after:** `.dict-highlight { animation: cs-flash 1.8s ease-out forwards; }` line (~line 1468)

```css
    @keyframes card-glow {
      0%   { box-shadow: 0 0 0 2px var(--glow-color), 0 0 12px var(--glow-color); }
      25%  { box-shadow: 0 0 0 1px var(--glow-color), 0 0 4px var(--glow-color); }
      50%  { box-shadow: 0 0 0 2px var(--glow-color), 0 0 12px var(--glow-color); }
      75%  { box-shadow: 0 0 0 1px var(--glow-color), 0 0 4px var(--glow-color); }
      100% { box-shadow: none; }
    }
    .card-glow { animation: card-glow 5s ease-out forwards; }
```

**Color resolution — JS sets `--glow-color` inline before adding `.card-glow`:**
```javascript
function glowColor(el) {
  if (el.classList.contains('grn')) return 'var(--green)';
  if (el.classList.contains('yel')) return 'var(--yellow)';
  if (el.classList.contains('red')) return 'var(--red)';
  if (el.classList.contains('mag')) return 'var(--magenta)';
  return 'var(--cyan)';
}
```

For chart `.card` elements, the glow will always be `var(--cyan)` since cards have no color class.

---

## JS Changes (1 edit — insert before `</script>`)

**File:** `live.html`  
**Insert:** Before `})();` closing the existing IIFE (after the `data-case` handler)

```javascript
// ── Back-links: Data Dictionary / Case Study → Dashboard ──────────────────
(function() {
  var BACKLINK_MAP = {
    'dict-sessions':       { tab: 'overview',  id: 'kpi-sessions' },
    'dict-new-pct':        { tab: 'overview',  id: 'kpi-new-pct' },
    'dict-winrate':        { tab: 'overview',  id: 'kpi-winrate' },
    'dict-deathrate':      { tab: 'overview',  id: 'kpi-deathrate' },
    'dict-replay':         { tab: 'overview',  id: 'kpi-replay' },
    'dict-survival':       { tab: 'overview',  id: 'kpi-survival' },
    'dict-lbrate':         { tab: 'overview',  id: 'kpi-lb-rate' },
    'dict-avglevel':       { tab: 'overview',  id: 'kpi-avg-level' },
    'dict-scorecard-rate': { tab: 'overview',  id: 'kpi-scorecard-rate' },
    'dict-music-rate':     { tab: 'overview',  id: 'kpi-music-rate' },
    'dict-leave-rate':     { tab: 'overview',  id: 'kpi-leave-rate' },
    'dict-boss-reach':     { tab: 'overview',  id: 'kpi-boss-reach-rate' },
    'dict-survey-rate':    { tab: 'overview',  id: 'kpi-survey-rate' },
    'dict-speedlock':      { tab: 'ai',        id: 'kpi-ai-speed-lock' },
    'dict-avg-start-tier': { tab: 'ai',        id: 'kpi-ai-avg-start' },
    'dict-avg-final-tier': { tab: 'ai',        id: 'kpi-ai-avg-final' },
    'dict-avg-adjustments':{ tab: 'ai',        id: 'kpi-ai-avg-adjustments' },
    'dict-ai-tier-dist':   { tab: 'ai',        id: 'chart-ai-tier-dist' },
    'dict-tier-flow':      { tab: 'ai',        id: 'chart-ai-tier-flow' },
    'dict-score-mult':     { tab: 'ai',        id: 'chart-ai-score-mult' },
    'dict-death-triggers': { tab: 'ai',        id: 'chart-ai-death-triggers' },
    'dict-platform-kpis':  { tab: 'platform',  id: 'kpi-desk-win' }
  };

  var CS_BACKLINK_MAP = {
    'cs-ab-findings':      { tab: 'ab',       id: 'chart-ab-split' },
    'cs-ai-findings':      { tab: 'ai',       id: 'kpi-ai-avg-adjustments' },
    'cs-death-findings':   { tab: 'funnel',   id: 'chart-dropdoff' },
    'cs-powerup-findings': { tab: 'overview', id: 'chart-powerup' }
  };

  function glowColor(el) {
    if (el.classList.contains('grn')) return 'var(--green)';
    if (el.classList.contains('yel')) return 'var(--yellow)';
    if (el.classList.contains('red')) return 'var(--red)';
    if (el.classList.contains('mag')) return 'var(--magenta)';
    return 'var(--cyan)';
  }

  function triggerGlow(el) {
    var target = el.closest('.card') || el;
    target.style.setProperty('--glow-color', glowColor(el));
    target.classList.remove('card-glow');
    void target.offsetWidth;
    target.classList.add('card-glow');
  }

  function navigateAndGlow(tab, elementId) {
    switchTab(tab);
    setTimeout(function() {
      var el = document.getElementById(elementId);
      if (!el) return;
      var scrollTarget = el.closest('.card') || el;
      scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
      triggerGlow(el);
    }, 80);
  }

  // Inject ⊞ icons into Data Dictionary entries
  Object.keys(BACKLINK_MAP).forEach(function(dictId) {
    var entry = document.getElementById(dictId);
    if (!entry) return;
    var titleRow = entry.querySelector('.dict-entry-title');
    if (!titleRow) return;
    var icon = document.createElement('span');
    icon.className = 'dict-link backlink-icon';
    icon.textContent = '⊞';
    icon.title = 'View on dashboard';
    icon.dataset.backlink = dictId;
    titleRow.appendChild(icon);
  });

  // Click handler for ⊞ icons (Data Dictionary)
  document.addEventListener('click', function(e) {
    var bl = e.target.closest('[data-backlink]');
    if (bl) {
      e.stopPropagation();
      var entry = BACKLINK_MAP[bl.dataset.backlink];
      if (entry) navigateAndGlow(entry.tab, entry.id);
    }
    var csBl = e.target.closest('[data-cs-backlink]');
    if (csBl) {
      e.stopPropagation();
      var csEntry = CS_BACKLINK_MAP[csBl.dataset.csBacklink];
      if (csEntry) navigateAndGlow(csEntry.tab, csEntry.id);
    }
  });
})();
```

---

## HTML Changes — Case Study back-links (4 edits)

Add `⊞` icon to each `case-study-finding` that has a `cs-*` id. The icon goes after the `.case-study-label` span.

**Pattern for each (example — `cs-ab-findings`):**
```html
<!-- Before -->
<div class="case-study-finding" id="cs-ab-findings">
  <span class="case-study-stat">+21pp</span>
  <span class="case-study-label">Music OFF group wins more often...</span>
</div>

<!-- After -->
<div class="case-study-finding" id="cs-ab-findings">
  <span class="case-study-stat">+21pp</span>
  <span class="case-study-label">Music OFF group wins more often...</span>
  <span class="dict-link backlink-icon" data-cs-backlink="cs-ab-findings" title="View on dashboard">⊞</span>
</div>
```

**4 lines to edit:**

| id | Line (approx — verify before implementing) | data-cs-backlink value |
|----|---------------------------------------------|------------------------|
| `cs-ab-findings` | ~2114 | `cs-ab-findings` |
| `cs-ai-findings` | ~2122 | `cs-ai-findings` |
| `cs-death-findings` | ~2126 | `cs-death-findings` |
| `cs-powerup-findings` | ~2130 | `cs-powerup-findings` |

---

## Chart Canvas → Card Parent

For chart targets, `el = document.getElementById('chart-ai-tier-dist')` returns a `<canvas>` element. The glow needs to be on the `.card` wrapper div (the canvas has no border to glow). The `triggerGlow()` function handles this:

```javascript
var scrollTarget = el.closest('.card') || el;  // canvas → .card parent
```

KPI tiles: `el = document.getElementById('kpi-winrate')` returns the `.kpi` div directly — glow is applied to the `.kpi` div itself.

---

## Possible Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `⊞` icon not appearing in dict entry | `id="dict-*"` missing from that entry | Add `id` to the dict-entry div |
| Glow on canvas instead of card | `el.closest('.card')` returns null | Verify canvas is inside a `.card` div |
| Wrong tab name | Tab string mismatch | Check actual `switchTab()` string in nav |
| Glow color always cyan | Element ID points to canvas, not `.kpi` | `triggerGlow()` reads color from the raw `el`, not `scrollTarget` — correct by design |
| Animation doesn't restart on re-click | classList.remove + offsetWidth missing | Both are in `triggerGlow()` — present |

---

## Task List

- [ ] **Verify exact line numbers** for 4 Case Study HTML edits (Haiku agent before implementing)
- [ ] **CSS**: Add `@keyframes card-glow` + `.card-glow` after `.dict-highlight` rule (~line 1468)
- [ ] **JS**: Add full IIFE block before closing `})();` of existing IIFE
- [ ] **HTML**: Add `⊞` span to 4 Case Study findings (cs-ab, cs-ai, cs-death, cs-powerup)
- [ ] **Test**: All KPI back-links (verify tab switch + glow)
- [ ] **Test**: All chart back-links (verify card glow, not canvas)
- [ ] **Test**: Case Study back-links
- [ ] **Test**: Re-click restarts glow cleanly

---

## Testing Checklist

- [ ] Click ⊞ on "Win Rate" dict entry → Overview tab → Win Rate KPI glows green 5s
- [ ] Click ⊞ on "Death Rate" dict entry → Overview tab → Death Rate KPI glows red 5s
- [ ] Click ⊞ on "Avg Tier Adjustments" dict entry → AI tab → KPI tile glows cyan 5s
- [ ] Click ⊞ on "Player Distribution by Tier" dict entry → AI tab → chart card glows cyan 5s
- [ ] Click ⊞ on cs-ab-findings (Case Study) → A/B tab → Music A/B Split card glows cyan 5s
- [ ] Click ⊞ twice on same entry → glow restarts cleanly
- [ ] Existing Tier 2 ⓘ dict-links unaffected (no regression)
- [ ] Existing Tier 3 ⓘ case-links unaffected (no regression)

---

**Estimated time:** ~1.5 hours  
**Files changed:** `live.html` only (CSS + JS + 4 HTML edits)  
**Lambda changes:** None
