# Back-link Feature Plan — Data Dictionary / Case Study → Dashboard

**Purpose:** Add ⊞ icons to Data Dictionary entries and Case Study findings that navigate back to the originating metric or chart on the dashboard, with a 5-second pulsing border glow on the target card/tile.

**Status:** READY TO IMPLEMENT  
**Created:** June 13, 2026  
**Icon:** `⊞` (U+229E) — defined as a JS constant so it can be changed in one place  
**Glow:** 5s pulsing border glow matching the element's existing color class  
**File:** `live.html` only — no Lambda changes  
**Estimated time:** ~1.5 hours  

---

## Feature Summary

**Forward direction (already live):** Dashboard ⓘ icon → Data Dictionary entry (yellow pulse highlight)  
**New backward direction:** Data Dictionary ⊞ icon → Dashboard KPI tile or chart card (5s border glow)

**Back-link behavior:**
1. User clicks `⊞` on a Data Dictionary entry or Case Study finding
2. `switchTab()` navigates to the correct tab
3. 80ms delay (tab render) → element scrolled into view
4. Element's border glows and pulses for 5s in its natural color, then fades

---

## Implementation Approach

### Why JS-driven icon injection (not 40+ HTML edits)

The Data Dictionary has 40+ entries. Adding `⊞` icons via HTML edits to each is fragile and hard to maintain. Instead:
- **One JS lookup table** maps every `dict-id` → `{ tab, elementId }`
- **JS at page load** iterates the table and injects `⊞` icons into matching `.dict-entry-title` elements automatically
- **One click handler** reads `data-backlink` from injected icons and executes navigation + glow
- **Case Study:** Only 4 findings — these are direct HTML edits (small scope, done once)

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

## Change 1 — CSS: card glow animation (1 edit)

**File:** `live.html`  
**Line:** 1465 (current, after prior edits)

> **June 13, 2026 update:** Changed from `box-shadow` outline glow to `background-color` cyan semi-transparent overlay. `.kpi` already has `position: relative; overflow: hidden` — background-color animates directly on the tile. No pseudo-elements or `--glow-color` needed. Ends at `rgba(0,255,255,0)` (fully transparent) so `forwards` fill-mode leaves the element visually unchanged after animation completes.

**Exact before:**
```css
    @keyframes card-glow {
      0%   { box-shadow: 0 0 0 2px var(--glow-color), 0 0 12px var(--glow-color); }
      25%  { box-shadow: 0 0 0 1px var(--glow-color), 0 0 4px var(--glow-color); }
      50%  { box-shadow: 0 0 0 2px var(--glow-color), 0 0 12px var(--glow-color); }
      75%  { box-shadow: 0 0 0 1px var(--glow-color), 0 0 4px var(--glow-color); }
      100% { box-shadow: none; }
    }
    /* --glow-color is set inline by JS before this class is added,
       allowing per-element color without multiple @keyframes definitions */
    .card-glow { animation: card-glow 5s ease-out forwards; }
```

**Exact after:**
```css
    @keyframes card-glow {
      0%   { background-color: rgba(0,255,255,0.18); }
      25%  { background-color: rgba(0,255,255,0.06); }
      50%  { background-color: rgba(0,255,255,0.18); }
      75%  { background-color: rgba(0,255,255,0.06); }
      100% { background-color: rgba(0,255,255,0); }
    }
    /* Cyan semi-transparent overlay — pulses 2x then fades over 5s.
       HUMAN: Adjust rgba alpha (0.18) to make overlay stronger or subtler. */
    .card-glow { animation: card-glow 5s ease-out forwards; }
```

---

## Change 2 (overlay update) — JS: remove --glow-color from triggerGlow (1 edit)

**File:** `live.html`  
**Line:** ~6153

**Exact before:**
```javascript
        function triggerGlow(el) {
          var target = el.closest('.kpi') || el.closest('.card') || el;
          target.style.setProperty('--glow-color', glowColor(el));
          target.classList.remove('card-glow');
          void target.offsetWidth;
          target.classList.add('card-glow');
        }
```

**Exact after:**
```javascript
        function triggerGlow(el) {
          var target = el.closest('.kpi') || el.closest('.card') || el;
          target.classList.remove('card-glow');
          void target.offsetWidth;
          target.classList.add('card-glow');
        }
```

---

## Change 2 — JS: back-link IIFE (1 edit)

**File:** `live.html`  
**Line:** 6080  

**Exact before:**
```javascript
      })();
    </script>
```

**Exact after:**
```javascript
      })();

      // ── Back-links: Data Dict / Case Study → Dashboard card glow ─────────
      // HUMAN: To change the back-link icon, update BACKLINK_ICON below.
      // Current: ⊞ (U+229E squared plus). Other options: ↗ ⤴ → ⊹
      (function() {
        var BACKLINK_ICON = '⊞';

        // Lookup table: dict-entry id → { tab name, dashboard element id }
        // HUMAN: Add new entries here as new Data Dictionary sections are created.
        // Format: 'dict-[id]': { tab: '[switchTab string]', id: '[element id]' }
        var BACKLINK_MAP = {
          'dict-sessions':        { tab: 'overview',  id: 'kpi-sessions' },
          'dict-new-pct':         { tab: 'overview',  id: 'kpi-new-pct' },
          'dict-winrate':         { tab: 'overview',  id: 'kpi-winrate' },
          'dict-deathrate':       { tab: 'overview',  id: 'kpi-deathrate' },
          'dict-replay':          { tab: 'overview',  id: 'kpi-replay' },
          'dict-survival':        { tab: 'overview',  id: 'kpi-survival' },
          'dict-lbrate':          { tab: 'overview',  id: 'kpi-lb-rate' },
          'dict-avglevel':        { tab: 'overview',  id: 'kpi-avg-level' },
          'dict-scorecard-rate':  { tab: 'overview',  id: 'kpi-scorecard-rate' },
          'dict-music-rate':      { tab: 'overview',  id: 'kpi-music-rate' },
          'dict-leave-rate':      { tab: 'overview',  id: 'kpi-leave-rate' },
          'dict-boss-reach':      { tab: 'overview',  id: 'kpi-boss-reach-rate' },
          'dict-survey-rate':     { tab: 'overview',  id: 'kpi-survey-rate' },
          'dict-speedlock':       { tab: 'ai',        id: 'kpi-ai-speed-lock' },
          'dict-avg-start-tier':  { tab: 'ai',        id: 'kpi-ai-avg-start' },
          'dict-avg-final-tier':  { tab: 'ai',        id: 'kpi-ai-avg-final' },
          'dict-avg-adjustments': { tab: 'ai',        id: 'kpi-ai-avg-adjustments' },
          'dict-ai-tier-dist':    { tab: 'ai',        id: 'chart-ai-tier-dist' },
          'dict-tier-flow':       { tab: 'ai',        id: 'chart-ai-tier-flow' },
          'dict-score-mult':      { tab: 'ai',        id: 'chart-ai-score-mult' },
          'dict-death-triggers':  { tab: 'ai',        id: 'chart-ai-death-triggers' },
          'dict-platform-kpis':   { tab: 'platform',  id: 'kpi-desk-win' }
        };

        // Lookup table: case-study finding id → { tab name, dashboard element id }
        // HUMAN: Add new entries here if more Case Study findings are added.
        var CS_BACKLINK_MAP = {
          'cs-ab-findings':      { tab: 'ab',       id: 'chart-ab-split' },
          'cs-ai-findings':      { tab: 'ai',       id: 'kpi-ai-avg-adjustments' },
          'cs-death-findings':   { tab: 'funnel',   id: 'chart-dropdoff' },
          'cs-powerup-findings': { tab: 'overview', id: 'chart-powerup' }
        };

        // Reads color class from a .kpi element to match the glow to the tile's accent color.
        // Falls back to --cyan for plain tiles and all .card chart wrappers (no color class).
        function glowColor(el) {
          if (el.classList.contains('grn')) return 'var(--green)';
          if (el.classList.contains('yel')) return 'var(--yellow)';
          if (el.classList.contains('red')) return 'var(--red)';
          if (el.classList.contains('mag')) return 'var(--magenta)';
          return 'var(--cyan)';
        }

        // Applies the card-glow animation to the element (or its .card parent for canvases).
        // --glow-color is set inline so one @keyframes handles all colors.
        // classList.remove + offsetWidth forces a reflow so re-clicking restarts the animation.
        function triggerGlow(el) {
          var target = el.closest('.card') || el;
          target.style.setProperty('--glow-color', glowColor(el));
          target.classList.remove('card-glow');
          void target.offsetWidth;
          target.classList.add('card-glow');
        }

        // Switches tab, waits 80ms for render, then scrolls and glows the target element.
        // block: 'center' keeps the card visually centered rather than snapping to top edge.
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

        // Inject ⊞ icons into every Data Dictionary entry that has a BACKLINK_MAP entry.
        // Done at page load so HTML stays clean — no 40+ individual HTML edits needed.
        // HUMAN: If a ⊞ icon is missing from a dict entry, add its dict-id to BACKLINK_MAP above.
        Object.keys(BACKLINK_MAP).forEach(function(dictId) {
          var entry = document.getElementById(dictId);
          if (!entry) return;
          var titleRow = entry.querySelector('.dict-entry-title');
          if (!titleRow) return;
          var icon = document.createElement('span');
          icon.className = 'dict-link backlink-icon';
          icon.textContent = BACKLINK_ICON;
          icon.title = 'View on dashboard';
          icon.dataset.backlink = dictId;
          titleRow.appendChild(icon);
        });

        // Single delegated click handler for all back-link icons (Data Dict + Case Study).
        // Uses closest() so clicks on icon children are still captured correctly.
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
    </script>
```

---

## Change 3 — HTML: Case Study back-link icons (4 edits)

**File:** `live.html`  
The `⊞` icon is added as the last child inside each `case-study-finding` div, after the label span.  

### 3a — Line 2122 (`cs-ab-findings`)

**Exact before:**
```html
            <div class="case-study-finding" id="cs-ab-findings">
              <span class="case-study-stat">+21pp</span>
              <span class="case-study-label">Music OFF group wins more often (44% vs 23% win rate). Music OFF players also reach Boss 1 at a higher rate (64% vs 37%). Counterintuitive — under investigation.</span>
            </div>
```
**Exact after:**
```html
            <div class="case-study-finding" id="cs-ab-findings">
              <span class="case-study-stat">+21pp</span>
              <span class="case-study-label">Music OFF group wins more often (44% vs 23% win rate). Music OFF players also reach Boss 1 at a higher rate (64% vs 37%). Counterintuitive — under investigation.</span>
              <span class="dict-link backlink-icon" data-cs-backlink="cs-ab-findings" title="View on dashboard">⊞</span>
            </div>
```

### 3b — Line 2130 (`cs-ai-findings`)

**Exact before:**
```html
            <div class="case-study-finding" id="cs-ai-findings">
              <span class="case-study-stat">25 vs 3</span>
              <span class="case-study-label">AI difficulty adjustments: 25 increases vs 3 decreases. The system is actively pushing players harder — it's working.</span>
            </div>
```
**Exact after:**
```html
            <div class="case-study-finding" id="cs-ai-findings">
              <span class="case-study-stat">25 vs 3</span>
              <span class="case-study-label">AI difficulty adjustments: 25 increases vs 3 decreases. The system is actively pushing players harder — it's working.</span>
              <span class="dict-link backlink-icon" data-cs-backlink="cs-ai-findings" title="View on dashboard">⊞</span>
            </div>
```

### 3c — Line 2134 (`cs-death-findings`)

**Exact before:**
```html
            <div class="case-study-finding" id="cs-death-findings">
              <span class="case-study-stat">L1–L4</span>
              <span class="case-study-label">Most deaths occur in the early Green phase, not at boss fights. The opening levels are where the game loses players.</span>
            </div>
```
**Exact after:**
```html
            <div class="case-study-finding" id="cs-death-findings">
              <span class="case-study-stat">L1–L4</span>
              <span class="case-study-label">Most deaths occur in the early Green phase, not at boss fights. The opening levels are where the game loses players.</span>
              <span class="dict-link backlink-icon" data-cs-backlink="cs-death-findings" title="View on dashboard">⊞</span>
            </div>
```

### 3d — Line 2138 (`cs-powerup-findings`)

**Exact before:**
```html
            <div class="case-study-finding" id="cs-powerup-findings">
              <span class="case-study-stat">5×</span>
              <span class="case-study-label">Mobile players collect roughly 5× more powerups than desktop players — likely a touch-control advantage.</span>
            </div>
```
**Exact after:**
```html
            <div class="case-study-finding" id="cs-powerup-findings">
              <span class="case-study-stat">5×</span>
              <span class="case-study-label">Mobile players collect roughly 5× more powerups than desktop players — likely a touch-control advantage.</span>
              <span class="dict-link backlink-icon" data-cs-backlink="cs-powerup-findings" title="View on dashboard">⊞</span>
            </div>
```

---

## Task List

- [ ] **Change 1** — `live.html:1464` — Add `@keyframes card-glow` + `.card-glow` after `.dict-highlight` rule
- [ ] **Change 2** — `live.html:6080` — Insert back-link IIFE before closing `})();`
- [ ] **Change 3a** — `live.html:2122` — Add `⊞` span to `cs-ab-findings`
- [ ] **Change 3b** — `live.html:2130` — Add `⊞` span to `cs-ai-findings`
- [ ] **Change 3c** — `live.html:2134` — Add `⊞` span to `cs-death-findings`
- [ ] **Change 3d** — `live.html:2138` — Add `⊞` span to `cs-powerup-findings`

---

## Human-Needed Notes

| Location | Note |
|----------|------|
| `BACKLINK_ICON` constant (JS) | Change this one variable to swap the icon sitewide |
| `BACKLINK_MAP` (JS) | Add a new row when a new Data Dictionary entry is added to the HTML |
| `CS_BACKLINK_MAP` (JS) | Add a new row when a new Case Study finding with an `id` is added |
| `dict-entry` missing `id=` | If a ⊞ icon is missing, the dict-entry div needs an `id="dict-[name]"` attribute |
| Chart targets | Chart canvases must be inside a `.card` div — the glow fires on `.card`, not `<canvas>` |

---

## Possible Errors

| Error | Cause | Fix |
|-------|-------|-----|
| ⊞ icon missing from dict entry | `id="dict-*"` absent from that div | Add `id` to the `.dict-entry` div in HTML |
| Glow fires on canvas (invisible) | `el.closest('.card')` returns null | Verify canvas is wrapped in a `.card` div |
| Wrong tab opens | Tab string mismatch in BACKLINK_MAP | Check exact string used in nav `switchTab()` calls |
| Animation doesn't restart on re-click | `void offsetWidth` missing | Present in `triggerGlow()` — verify not removed |
| Glow fires on inner value box, not outer tile | KPI ids point to `.kpi-value` div, not `.kpi` container. `.closest('.card')` returns null so target falls back to the inner div. | **Fixed June 13, 2026** — changed `el.closest('.card') \|\| el` to `el.closest('.kpi') \|\| el.closest('.card') \|\| el` in both `triggerGlow()` and `navigateAndGlow()`. |

---

## Testing Checklist

- [ ] ⊞ icons appear in Data Dictionary next to: Win Rate, Death Rate, Avg Tier Adjustments, Player Distribution by Tier, Speed Lock Rate
- [ ] Click ⊞ on Win Rate → Overview tab → Win Rate KPI glows **green** 5s
- [ ] Click ⊞ on Death Rate → Overview tab → Death Rate KPI glows **red** 5s
- [ ] Click ⊞ on Avg Tier Adjustments → AI tab → KPI tile glows **cyan** 5s
- [ ] Click ⊞ on Player Distribution by Tier → AI tab → chart **card** glows cyan 5s (not canvas)
- [ ] Click ⊞ on cs-ab-findings (Case Study) → A/B tab → Music A/B Split card glows cyan 5s
- [ ] Click ⊞ on cs-powerup-findings (Case Study) → Overview tab → Powerup card glows cyan 5s
- [ ] Re-click same ⊞ → glow restarts cleanly (no stuck state)
- [ ] Existing ⓘ dict-links unaffected (Tier 2 still works)
- [ ] Existing ⓘ case-links unaffected (Tier 3 still works)
