# Implementation Plan: Fix Bottom Nav Click-Through Bug (position:fixed → sticky)

**Created:** August 14, 2026
**Status:** ✅ COMPLETE — August 14, 2026 — merged to main via commit `fad4766` (PR #7)

---

## Bug Report

User (real mobile device, live.html): bottom pill nav bar is only clickable when the page is scrolled all the way to the footer. At any other scroll position, taps don't register.

---

## Root Cause (confirmed via 2 Haiku research passes, Aug 14, 2026)

**Not a CSS containing-block bug.** Traced the full ancestor chain (`body` → `.wrapper` → `.mobile-bottom-nav`) — no `transform`, `filter`, `perspective`, `contain`, `will-change`, or `backdrop-filter` on any ancestor. Ruled out.

**Confirmed real cause:** a documented mobile-browser quirk (WebKit Bug 297779, WebKit Bug 141832, MDN "Viewport concepts"). Mobile browsers' dynamic address-bar toolbar shrinks/grows as you scroll, which desyncs the **layout viewport** (what `position: fixed` calculates its position against) from the **visual viewport** (what's actually on screen). The bar renders visually correct but its clickable hit-area is offset — until scrolling to the bottom collapses the toolbar to its minimum state, re-syncing the two viewports and "fixing" clickability. Exactly matches the reported symptom.

Also confirmed: `env(safe-area-inset-bottom)` (already in our CSS, added in the prior session) does **nothing** for this bug — that property is for notches/home-indicators only, unrelated to toolbar show/hide.

## Fix Decision (confirmed with user, Aug 14, 2026)

Of the 3 ranked options researched (`interactive-widget=resizes-content` meta tag / `position: sticky` restructure / `visualViewport` JS listener), user chose **`position: sticky`** — the only option with full cross-browser coverage including Safari (the meta tag has an open, unimplemented WebKit bug; `visualViewport` requires more JS surface for the same result).

**How `position: sticky` fixes this:** sticky positioning is computed by the browser against the actual current scroll position at paint time — it doesn't have the layout-viewport/visual-viewport split that `fixed` does, so there's no desync to trigger the bug in the first place.

---

## What Changes, Structurally

`position: sticky` only "sticks" relative to its own **containing block** (nearest block-level ancestor) while that containing block is scrolling through view — and it stays in **normal document flow** when not stuck, unlike `fixed` which is removed from flow entirely. This means:

1. **DOM position now matters.** Currently `.mobile-bottom-nav` sits near the *top* of `.wrapper` (right after the desktop nav, before all 9 `.page` divs — confirmed via ancestor trace). Under `fixed`, that didn't matter. Under `sticky`, it must move to the **end** of `.wrapper`'s content (after the footer) so it doesn't render inline near the top of the page in its normal (non-stuck) flow position.
2. **`.wrapper` needs to be reliably taller than one viewport** for the nav to have room to "stick" through the whole scroll — true on every tab given the content volume, so no extra sizing work needed.
3. **Found while investigating:** `.wrapper` (`live.html:1668`) is opened but **never explicitly closed** — the browser silently auto-closes it at `</body>` (confirmed via source inspection, `live.html:1668–6498`). This already happens to place the footer inside `.wrapper` today, which is what we're relying on, but it's fragile malformed HTML. This plan adds the missing explicit `</div>` as part of the fix, both to make the containing-block boundary unambiguous and to fix a pre-existing (harmless but sloppy) markup bug.

**Scope note:** `.bottom-sheet` overlays (`#mobile-tab-sheet`, `#mobile-filter-sheet`) and `.sheet-backdrop` remain `position: fixed`. They're full-viewport overlays only visible transiently when tapped open, not thin edge-of-screen strips — same theoretical bug could apply, but the large hit-area makes practical impact far less likely. Flagged as an accepted residual risk, not fixed in this pass (see Possible Errors).

---

## Files to Modify

- `live.html` — CSS (`.mobile-bottom-nav` rule, `live.html:1268–1282`), HTML (move nav block, `live.html:1740–1758`, add explicit `.wrapper` close)

---

## Task Breakdown

1. Change `.mobile-bottom-nav` CSS: `position: fixed` → `position: sticky`; remove `left: 50%; transform: translateX(-50%)` (viewport-centering trick, not needed/correct for sticky); add flow-based centering instead (5 min)
2. Move the `<nav class="mobile-bottom-nav">` HTML block from its current position (`live.html:1742–1758`, near the top of `.wrapper`) to immediately after `</footer>`, still inside `.wrapper` (5 min)
3. Add the missing explicit `</div>` to close `.wrapper`, placed right after the relocated nav block (2 min)
4. Leave `.sheet-backdrop` and both `.bottom-sheet` elements' HTML position and `position: fixed` CSS untouched (0 min — no change)
5. Verify `.site-footer { margin-bottom: 84px }` (added in the prior session's fix) is still needed/correct — it clears a *fixed* bar; with the nav now `sticky` and positioned after the footer in DOM, re-check whether this margin is still the right mechanism or should move to spacing between footer and nav instead (5 min)
6. Manual smoke test — mobile viewport, scroll through a long tab (Data Dict) checking the bar stays visually pinned and clickable at multiple scroll depths, not just at the very bottom (10 min)

**Total estimate:** ~30 min

---

## Code Changes

### Change 1 — CSS (`live.html:1268–1282`)

**Before:**
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
```

**After:**
```css
.mobile-bottom-nav {
  position: sticky;
  bottom: 12px;
  width: fit-content;
  margin: 0 auto; /* flow-based centering, replaces left:50%/transform trick used for fixed/absolute */
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
```

### Change 2 — HTML: relocate nav block

**Remove from `live.html:1742–1758`** (its current position, right after the `.sheet-backdrop` div, before all `.page` divs):
```html
<nav class="mobile-bottom-nav">
  ... (5 buttons, unchanged content) ...
</nav>
```

**Leave in place at the original location:** `.sheet-backdrop` div and both `.bottom-sheet` `<nav>` blocks — only `.mobile-bottom-nav` itself moves.

**Insert immediately after `</footer>` (`live.html:6497` in current file, adjust if line numbers shift after Change 2's removal):**
```html
    </footer>

    <nav class="mobile-bottom-nav">
      <button class="bottom-nav-btn active" id="btn-leaderboard" onclick="switchTab('leaderboard')" aria-label="Leaderboard">
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

  </div> <!-- close .wrapper — previously missing; .wrapper relied on implicit browser auto-close at </body> -->
```

### Change 3 — Re-check footer spacing (`live.html`, inside mobile media query, added last session)

**Current:**
```css
.site-footer {
  margin-bottom: 84px; /* clears the fixed pill bar so footer settles above it when scrolled to bottom */
}
```

**To verify during implementation:** with the nav now living *after* the footer in DOM and using `sticky` instead of `fixed`, this margin may no longer be the correct mechanism — the nav no longer floats independently on top of the footer; it now sits directly below it in flow. Likely correct replacement is removing this rule entirely (sticky nav naturally follows the footer with only its own padding), but confirm visually during smoke test rather than assuming — don't want to leave 84px of dead white/blank space between footer and nav if it's no longer needed.

---

## Possible Errors

| Error | Cause | Solution |
|---|---|---|
| Nav renders inline mid-page instead of pinned to bottom | `.mobile-bottom-nav` still positioned near top of `.wrapper` (Change 2 not applied, or applied to wrong location) | Verify nav's HTML sits after `</footer>` and before the new `.wrapper` close; verify via `document.querySelectorAll('.wrapper > *')` order in devtools |
| Adding the explicit `</div>` breaks unrelated later markup (script tags, other trailing elements) | `.wrapper` close inserted in the wrong spot relative to `<script>` blocks that may run after `</footer>` in source | Read the full region from `</footer>` to `</body>` carefully before inserting; confirm no other top-level content depends on being inside vs. outside `.wrapper` |
| Sticky nav "unsticks" and scrolls away before reaching true page bottom | `.wrapper`'s total height on a short-content tab is less than one viewport, leaving no room to stick | Verify on the shortest tab (likely AI Agent or A/B Tests) in addition to the longest (Data Dict) during smoke test |
| Double-clearance: leftover `margin-bottom: 84px` on `.site-footer` leaves a large dead gap above the now-sticky nav | Change 3 not resolved before considering this complete | Visually confirm spacing during smoke test; remove or reduce the margin if it creates unwanted whitespace |
| `.bottom-sheet` overlays retain the same theoretical toolbar-desync bug (still `position: fixed`, out of scope for this pass) | Accepted residual risk per scope decision above | Not fixed here; revisit only if a similar click-through report comes in for the sheets specifically |

---

## Testing

- [ ] Nav bar visually pinned near the bottom of the viewport at multiple scroll depths (top, middle, bottom) on the longest tab (Data Dict)
- [ ] Nav bar clickable (all 5 buttons) at multiple scroll depths, not just when scrolled to the footer — this is the actual bug being fixed, test explicitly on a real device if possible, not just devtools responsive mode (devtools mode doesn't simulate the dynamic toolbar)
- [ ] Nav bar remains pinned/clickable on a short-content tab too (no premature "unstick")
- [ ] Footer/nav spacing looks correct — no unwanted gap, no overlap
- [ ] Center accordion sheet, filter sheet, and all existing functionality (confirmed working last session) still work unchanged
- [ ] No console errors
- [ ] Desktop view unaffected (`.mobile-bottom-nav` still hidden via existing `@media (min-width: 901px)` rule — unchanged by this plan)

---

**User Approval Required Before Implementation**
