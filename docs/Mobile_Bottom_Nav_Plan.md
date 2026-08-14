# Implementation Plan: Mobile Bottom Nav Bar (Replace Hamburger Menu)

**Created:** August 14, 2026
**Status:** ✅ COMPLETE — August 14, 2026 — merged to main via commit `fad4766` (PR #7) (superseded in part by `Mobile_Nav_Sticky_Fix_Plan.md` and `Mobile_Nav_Bugfixes_Plan.md` — position changed fixed→sticky, sheets converted to native popovers)
**Reference:** User-supplied screenshot — floating pill bottom bar, 4 flat icon+label buttons + 1 raised circular center button, mobile only

---

## Goal

Replace the current mobile hamburger menu (`live.html:1732–1756`, ☰ icon → slide-in left panel) with a fixed 5-button bottom nav bar, mobile only (≤900px breakpoint, matching existing `.mobile-nav-wrapper` breakpoint).

**Button mapping (confirmed with user):**
1. **Leaderboard** — direct tap → `switchTab('leaderboard')`
2. **Filter** — opens a bottom sheet listing the 4 data-range options (Last 7/30/90 Days, All Time), synced to the existing `#data-range-select`
3. **Center (raised circle)** — opens a bottom sheet listing the 6 remaining tabs: Overview, Funnel, Boss Analysis, AI Agent, A/B Tests, Platform
4. **Case Study** — direct tap → `switchTab('case-study')`
5. **Data Dict** — direct tap → `switchTab('data-dict')`

**Decisions confirmed this session:**
- Center accordion = slide-up bottom sheet (reuses the existing `.mobile-menu` slide/backdrop pattern, retargeted to a smaller 6-item list)
- Filter button = custom bottom sheet with the same 4 options, not a native `<select>` picker trigger (avoids Safari iOS `showPicker()` unreliability)
- Old hamburger implementation (button, label, 9-item slide-in panel) is fully removed, not hidden — no dead code

---

## Files to Modify

- `live.html` — CSS (mobile hamburger block `1252–1436`), HTML (`1732–1756`), JS (`toggleMobileMenu`/`closeMobileMenu` and outside-click/Escape handlers, `6092–6139`), plus `switchTab()` active-state sync (`6049–6090`)

---

## Task Breakdown

1. Replace hamburger CSS block with bottom-bar CSS: fixed pill container, 4 flat buttons, 1 raised circular center button, safe-area padding for iOS notch (15 min)
2. Add CSS for two bottom sheets: `#mobile-tab-sheet` (6 tabs) and `#mobile-filter-sheet` (4 range options) — reuse existing `.mobile-menu`/backdrop transition pattern, just retarget IDs and content (10 min)
3. Replace `.mobile-nav-wrapper` HTML block with new bottom-bar markup + two sheet `<nav>` blocks (10 min)
4. Add `padding-bottom` to mobile page container so fixed bar doesn't overlap footer/last content (5 min)
5. Rewrite JS: rename `toggleMobileMenu()`/`closeMobileMenu()` → `toggleTabSheet()`/`closeTabSheet()`; add `toggleFilterSheet()`/`closeFilterSheet()`; update outside-click and Escape handlers to check both sheets (15 min)
6. Update `switchTab()` (`live.html:6049–6090`) to set `active` class on the correct bottom-bar button (Leaderboard/Case Study/Data Dict direct buttons, or the center button when the active tab is one of the 6 sheet items) instead of the old `.active-tab-name` hamburger label logic (10 min)
7. Wire filter sheet rows to set `#data-range-select`'s value and call existing `applyDataRangeFilter()` (5 min)
8. Manual smoke test — mobile viewport, all 5 buttons, both sheets, active-state highlighting, footer not obscured (10 min)

**Total estimate:** ~80 min

---

## Code Changes

### Change 1 — CSS: Replace hamburger block (`live.html:1252–1436`)

**Remove entirely:** `.hamburger-label`, `.hamburger-btn` + `span` + `.open` states, `.mobile-menu` + `.mobile-menu-header/-title`, `.close-btn`, `.mobile-menu .tab` + `.active`, `.mobile-menu::before` backdrop.

**Add:**
```css
.mobile-bottom-nav {
  position: fixed;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: flex-end;
  gap: 4px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 32px;
  padding: 8px 12px calc(8px + env(safe-area-inset-bottom, 0px));
  z-index: 1500;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
}

.bottom-nav-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: transparent;
  border: none;
  color: var(--text-dim);
  font-family: var(--mono);
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 6px 10px;
  cursor: pointer;
  transition: color 0.2s;
}

.bottom-nav-btn.active { color: var(--cyan); text-shadow: 0 0 8px var(--cyan-glow); }
.bottom-nav-btn .icon { font-size: 1.2rem; }

.bottom-nav-btn.center {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--bg);
  border: 2px solid var(--cyan);
  transform: translateY(-14px);
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0,255,255,0.3);
}
.bottom-nav-btn.center .icon { font-size: 1.5rem; }
.bottom-nav-btn.center.active { background: var(--cyan-dim); }

/* Bottom sheets — shared pattern for tab sheet + filter sheet */
.bottom-sheet {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  max-height: 60vh;
  background: var(--bg);
  border-top: 2px solid var(--cyan);
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 20px rgba(0,255,255,0.2);
  z-index: 2000;
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.bottom-sheet.open { transform: translateY(0); }

.bottom-sheet-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; border-bottom: 1px solid var(--border); background: var(--bg2);
}
.bottom-sheet-title { font-family: var(--mono); font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--cyan); }

.bottom-sheet .tab, .bottom-sheet .filter-option {
  padding: 16px 20px; border-bottom: 1px solid rgba(0,255,255,0.1);
  width: 100%; text-align: left; background: transparent; font-size: 0.8rem; transition: all 0.2s;
}
.bottom-sheet .tab.active, .bottom-sheet .filter-option.active {
  background: rgba(0,255,255,0.1); border-left: 3px solid var(--cyan); padding-left: 17px;
  color: var(--cyan); text-shadow: 0 0 10px var(--cyan-glow);
}

.sheet-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  z-index: 1900; opacity: 0; pointer-events: none; transition: opacity 0.3s;
}
.sheet-backdrop.open { opacity: 1; pointer-events: auto; }
```

*(Icons/labels are placeholders — swap emoji or adjust wording during implementation review.)*

---

### Change 2 — HTML: Replace `.mobile-nav-wrapper` block (`live.html:1732–1756`)

**Replace with:**
```html
<!-- Mobile bottom nav bar (visible only on mobile) -->
<div class="sheet-backdrop" id="sheet-backdrop" onclick="closeAllSheets()"></div>

<nav class="mobile-bottom-nav">
  <button class="bottom-nav-btn" id="btn-leaderboard" onclick="switchTab('leaderboard')" aria-label="Leaderboard">
    <span class="icon">🏆</span><span>Board</span>
  </button>
  <button class="bottom-nav-btn" id="btn-filter" onclick="toggleFilterSheet()" aria-label="Data Filter">
    <span class="icon">🔍</span><span>Filter</span>
  </button>
  <button class="bottom-nav-btn center" id="btn-menu" onclick="toggleTabSheet()" aria-label="More Dashboards">
    <span class="icon">☰</span>
  </button>
  <button class="bottom-nav-btn" id="btn-case-study" onclick="switchTab('case-study')" aria-label="Case Study">
    <span class="icon">📋</span><span>Story</span>
  </button>
  <button class="bottom-nav-btn" id="btn-data-dict" onclick="switchTab('data-dict')" aria-label="Data Dictionary">
    <span class="icon">📖</span><span>Defs</span>
  </button>
</nav>

<nav class="bottom-sheet" id="mobile-tab-sheet">
  <div class="bottom-sheet-header">
    <span class="bottom-sheet-title">More Dashboards</span>
    <button class="close-btn" onclick="closeTabSheet()" aria-label="Close">✕</button>
  </div>
  <div class="tab" onclick="switchTab('overview'); closeTabSheet()">📊 Overview</div>
  <div class="tab" onclick="switchTab('funnel'); closeTabSheet()">📈 Funnel</div>
  <div class="tab" onclick="switchTab('bosses'); closeTabSheet()">⚔️ Boss Analysis</div>
  <div class="tab" onclick="switchTab('ai'); closeTabSheet()">🤖 AI Agent</div>
  <div class="tab" onclick="switchTab('ab'); closeTabSheet()">🧪 A/B Tests</div>
  <div class="tab" onclick="switchTab('platform'); closeTabSheet()">📱 Platform</div>
</nav>

<nav class="bottom-sheet" id="mobile-filter-sheet">
  <div class="bottom-sheet-header">
    <span class="bottom-sheet-title">Data Range</span>
    <button class="close-btn" onclick="closeFilterSheet()" aria-label="Close">✕</button>
  </div>
  <div class="filter-option" data-value="7day-43" onclick="selectFilterOption(this)">Last 7 Days — v4.3</div>
  <div class="filter-option" data-value="30day-43" onclick="selectFilterOption(this)">Last 30 Days — v4.3</div>
  <div class="filter-option" data-value="90day-43" onclick="selectFilterOption(this)">Last 90 Days — v4.3</div>
  <div class="filter-option active" data-value="alltime-43" onclick="selectFilterOption(this)">All Time — v4.3 (Current)</div>
</nav>
```

*(Values in `data-value` must match the existing `#data-range-select` option values exactly — verify against `live.html:1690–1694` before implementing, in case options change.)*

---

### Change 3 — Footer bottom clearance (confirmed structure)

**Confirmed via grep (Aug 14, 2026):** `.page` (`live.html:247`) uses `display:none` / `.page.active { display:block }` toggling — 9 separate divs, one active at a time. `.site-footer` (`live.html:6457`) is a single shared element declared *after* all `.page` divs, so it's always the last thing in normal document flow regardless of which tab is active — it appears at the bottom of every page.

**This means the fix belongs on `.site-footer`, not on `.page`:** one rule, scoped to mobile, applies uniformly across all 9 tabs with no risk of missing one.

**Add inside the existing `@media (max-width: 900px)` block** (the one already wrapping the hamburger/bottom-nav styles, `live.html:1252`):
```css
.site-footer {
  margin-bottom: 84px; /* clears the fixed pill bar (bar height ~56px + 12px offset + breathing room) so footer settles fully above it when scrolled to bottom */
}
```

`margin-bottom` (not `padding-bottom`) is correct here since `.site-footer` is the last element in flow — margin pushes the page's total scrollable height down, giving the same visual result (footer rests above the bar at max scroll) without needing a wrapping container. Value `84px` should be verified against the actual rendered bar height + its `bottom: 12px` offset during implementation smoke test — adjust if the pill bar's real height differs from the ~56px estimated in Change 1's CSS.

---

### Change 4 — JS: Replace mobile menu functions (`live.html:6092–6139`)

**Remove:** `toggleMobileMenu()`, `closeMobileMenu()`, their outside-click handler, their Escape handler.

**Add:**
```javascript
// ─── MOBILE BOTTOM NAV: SHEET FUNCTIONS ────────────────────────────

function closeAllSheets() {
  document.getElementById('mobile-tab-sheet')?.classList.remove('open');
  document.getElementById('mobile-filter-sheet')?.classList.remove('open');
  document.getElementById('sheet-backdrop')?.classList.remove('open');
  document.body.style.overflow = '';
}

function toggleTabSheet() {
  const sheet = document.getElementById('mobile-tab-sheet');
  const isOpen = sheet.classList.contains('open');
  closeAllSheets();
  if (!isOpen) {
    sheet.classList.add('open');
    document.getElementById('sheet-backdrop').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}
function closeTabSheet() { closeAllSheets(); }

function toggleFilterSheet() {
  const sheet = document.getElementById('mobile-filter-sheet');
  const isOpen = sheet.classList.contains('open');
  closeAllSheets();
  if (!isOpen) {
    sheet.classList.add('open');
    document.getElementById('sheet-backdrop').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}
function closeFilterSheet() { closeAllSheets(); }

function selectFilterOption(el) {
  document.querySelectorAll('.filter-option').forEach(o => o.classList.remove('active'));
  el.classList.add('active');
  const select = document.getElementById('data-range-select');
  if (select) {
    select.value = el.dataset.value;
    applyDataRangeFilter();
  }
  closeFilterSheet();
}

// Close sheets on Escape key
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeAllSheets();
});
```

Backdrop click-to-close is handled inline via `onclick="closeAllSheets()"` on `#sheet-backdrop` (Change 2), replacing the old document-level outside-click listener — simpler since there's now a dedicated backdrop element instead of detecting clicks outside an off-canvas panel.

---

### Change 5 — `switchTab()` bottom-bar active-state sync (`live.html:6049–6090`)

**Remove:** the `activeTabLabel`/`tabNames` block (`6070–6089`) — no longer applicable, replaced by direct button highlighting.

**Add**, inside `switchTab(name)`, after the existing `.page` active-swap line:
```javascript
// Sync bottom-nav-bar active state
document.querySelectorAll('.bottom-nav-btn').forEach(b => b.classList.remove('active'));
const directMap = { leaderboard: 'btn-leaderboard', 'case-study': 'btn-case-study', 'data-dict': 'btn-data-dict' };
if (directMap[name]) {
  document.getElementById(directMap[name])?.classList.add('active');
} else {
  document.getElementById('btn-menu')?.classList.add('active'); // Overview/Funnel/Bosses/AI/A-B/Platform → center button
}

// Sync sheet-item active state (for the 6 tabs living in the tab sheet)
document.querySelectorAll('#mobile-tab-sheet .tab').forEach(t => t.classList.remove('active'));
const sheetTab = Array.from(document.querySelectorAll('#mobile-tab-sheet .tab'))
  .find(t => t.onclick.toString().includes(`switchTab('${name}')`));
sheetTab?.classList.add('active');
```

---

## Possible Errors

| Error | Cause | Solution |
|---|---|---|
| Footer sits too close to (or still slightly under) the pill bar | Estimated `84px` margin-bottom doesn't match the bar's actual rendered height | Measure real bar height in browser devtools during smoke test; adjust `.site-footer` margin-bottom to match exactly |
| Filter sheet's `data-value` options drift from real `<select>` values | Hardcoded duplicate list instead of reading options dynamically | Verify `live.html:1690–1694` values match exactly at implementation time; consider generating filter-option rows from the `<select>`'s options via JS instead of hardcoding, if any mismatch found |
| Two sheets can be open simultaneously if toggle logic has a bug | `toggleTabSheet()`/`toggleFilterSheet()` don't call `closeAllSheets()` first | Both functions already close all sheets before opening their target — verify during smoke test by tapping Filter then Menu rapidly |
| Center button never shows `active` state when landing on Leaderboard/Case Study/Data Dict (expected) but also never highlights on initial page load if `switchTab()` isn't called on load | Initial active state is set via HTML classes (`active` on `page-leaderboard`/`btn-leaderboard`), not via `switchTab()` call | Set `active` class directly on `#btn-leaderboard` in the HTML (Change 2) as the default, matching the leaderboard-first change already shipped this session |
| iOS Safari safe-area padding insufficient on notched devices, bar sits too close to home indicator | `env(safe-area-inset-bottom)` needs `viewport-fit=cover` in the `<meta viewport>` tag to take effect | Check existing `<meta name="viewport">` tag; add `viewport-fit=cover` if missing |

---

## Testing

- [ ] Bottom bar renders on mobile viewport (≤900px), hidden on desktop (≥901px)
- [ ] Tapping Leaderboard/Case Study/Data Dict navigates directly and highlights correct button
- [ ] Tapping center button opens tab sheet with 6 items; selecting one navigates + closes sheet + highlights center button
- [ ] Tapping Filter button opens filter sheet with 4 range options; selecting one calls `applyDataRangeFilter()` + closes sheet
- [ ] Backdrop tap and Escape key close whichever sheet is open
- [ ] Only one sheet open at a time
- [ ] Footer and last-card content not obscured by fixed bar on every tab, especially longest pages (Data Dict, Case Study)
- [ ] No console errors
- [ ] Old hamburger button/label/panel fully removed from DOM (no leftover dead markup)
- [ ] Safe-area padding confirmed via `viewport-fit=cover` meta tag on a notched-device simulation (if available) or documented as unverified

---

**User Approval Required Before Implementation**
