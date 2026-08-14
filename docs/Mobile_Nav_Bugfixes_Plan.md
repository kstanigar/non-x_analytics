# Implementation Plan: Mobile Bottom Nav — 3 Post-Launch Bugs

**Created:** August 14, 2026
**Status:** ✅ COMPLETE — August 14, 2026 — user visually confirmed fixed
**Reported by:** User, via 3 screenshots on real mobile device, after the sticky-position fix shipped this session

---

## Bug Reports (verbatim, condensed)

1. Text label on each pill button isn't clickable — only the icon appears to register taps
2. When the center accordion (tab sheet) or filter sheet opens, the bottom rows of its list are hidden behind the pill nav bar — needs bottom padding
3. When a sheet is open and another pill button is tapped, the sheet doesn't retract — the newly-loaded page renders behind the still-open sheet

---

## Root Cause Investigation (confirmed via live browser testing, Aug 14, 2026)

### Bug 1 — text not clickable

**Not a nav-button bug.** `.csv-toast` (`live.html:1662`, CSS `live.html:1073–1090`) is `position: fixed; bottom: 24px; right: 24px; z-index: 2000;` with **no `pointer-events: none`** in its default (non-`.show`) state. The div is unconditionally present in the DOM from page load (`<div class="csv-toast" id="csv-toast"></div>`), so even fully invisible (`opacity: 0`, no `.show` class), it still occupies its fixed box and intercepts pointer events there. That box overlaps the right-hand portion of the bottom nav — Filter/Story/Defs buttons.

**Confirmed via direct test:** `elementFromPoint()` at each button label's coordinates resolved to `#csv-toast` (not the button) for Filter/Story/Defs. Removing `#csv-toast` from the DOM and re-testing — all 4 labels immediately resolved correctly. Grepped for any click handlers on `.csv-toast` — none exist (`live.html:6210–6212` only ever sets `.textContent`/`.className`, never reads clicks), confirming it's safe to make non-interactive.

**This is a permanent, real bug** — present on every page load regardless of network conditions, not an artifact of this session's local test environment (where fetches additionally fail against production-locked APIs, which was a red herring at first).

### Bugs 2 & 3 — sheet hidden behind pill / doesn't close on nav tap

**Single shared root cause.** From the prior fix this session (`position: fixed` → `sticky` to solve the mobile-toolbar click-through bug), `.mobile-bottom-nav` was relocated to be a direct `<body>` child (`live.html:6478`, after `<footer>`), with `z-index: 1500`. However `.sheet-backdrop` and both `.bottom-sheet` elements (`#mobile-tab-sheet`, `#mobile-filter-sheet`) were left inside `.wrapper` (`live.html:106`), which has its own `position: relative; z-index: 2`.

**Why this breaks stacking:** `.wrapper`'s `position + z-index` combination establishes a new CSS stacking context. Once established, **all of `.wrapper`'s descendants are composited together and compared against `.wrapper`'s siblings using `.wrapper`'s own z-index (2)** — a descendant's higher local z-index (the sheets' `z-index: 2000`) only wins comparisons against *other elements inside `.wrapper`*, never against a sibling of `.wrapper` itself. Since `.mobile-bottom-nav` now sits *outside* `.wrapper` with `z-index: 1500` (≫ `.wrapper`'s 2), it always paints on top of the entire `.wrapper` — including the sheets nested inside it — regardless of the sheets' own higher local z-index.

**Confirmed via `getComputedStyle` + ancestor-chain check:** `.mobile-bottom-nav.closest('.wrapper')` → `null` (outside); `.bottom-sheet.closest('.wrapper')` → matches (inside). Matches exactly what the user's screenshots show: pill nav rendering on top of open sheet content, and — since the sheet is visually buried under the (fully clickable, because it's on top) nav — tapping a nav button navigates correctly underneath, but the sheet itself was never told to close, so it's still `.open` and still (invisibly, relative to stacking) covering the newly active page.

Bug 3's "doesn't retract" complaint is a second, compounding issue on top of the stacking bug: `switchTab()` (`live.html`, JS) never calls `closeAllSheets()`, so even once stacking is fixed, direct nav-button taps (Board/Story/Defs) or sheet-list-item taps don't auto-close an open sheet — it stays open until manually dismissed via the ✕ button or backdrop tap.

---

## Research Findings (Haiku Agent — Aug 14, 2026, MDN-cited)

**Bug 1 fix — confirmed current best practice:** `pointer-events: none` (toggle to `auto` only while `.show`). No newer CSS mechanism replaces this; `opacity: 0` alone does not block clicks. Source: [MDN `pointer-events`](https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events).

**Bug 2/3 fix — current best practice supersedes the manual-DOM-move plan originally sketched above:** the **HTML Popover API** (`popover` attribute, `showPopover()`/`hidePopover()`) places elements in the browser's native **top layer** — a rendering layer that sits above all other content regardless of z-index or DOM nesting, eliminating this entire bug class at the platform level rather than working around it with manual stacking-context management. **Baseline 2025** (broadly supported in current browsers). Source: [MDN Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API), [MDN Top Layer](https://developer.mozilla.org/en-US/docs/Glossary/Top_layer).

Popover's built-in **light-dismiss** behavior (any click outside the popover, including on another nav button, closes it) and its auto-close-other-open-popovers behavior also resolve bug 3 (sheets not retracting) natively, without needing manual `closeAllSheets()` calls wired into every nav action.

Decision confirmed with user (Aug 14, 2026): implement the Popover API approach over the simpler manual-DOM-move fix, per current standard.

---

## Finalized Fix

1. **`.csv-toast`** — add `pointer-events: none` by default, `pointer-events: auto` on `.show` (matches existing show/hide class pattern already in place)
2. **Convert both bottom sheets to native popovers:**
   - Add `popover="auto"` attribute to `#mobile-tab-sheet` and `#mobile-filter-sheet`
   - Remove `.sheet-backdrop` div entirely — popovers get a native `::backdrop` pseudo-element automatically; style `[popover]::backdrop` instead of the manual div
   - Replace `.open` class toggling in JS with native `.showPopover()` / `.hidePopover()` calls
   - Reset UA default popover styles (`margin: 0; border: none; background: none;` etc. — browsers apply centered-dialog-like defaults to `[popover]` that must be overridden) before applying the existing `.bottom-sheet` visual styles on top
   - Preserve the slide-up animation using the modern `@starting-style` + `transition-behavior: allow-discrete` pattern (the standard 2026 mechanism for animating a `display: none` ↔ visible transition, which popovers use internally)
3. **Bottom padding** inside `.bottom-sheet` list content, unchanged from original plan
4. **No manual `closeAllSheets()` wiring needed** in `switchTab()` — native light-dismiss handles it. Sheet-internal item clicks (selecting a tab or filter option) still call `.hidePopover()` explicitly after acting, same as today's `closeTabSheet()`/`closeFilterSheet()` pattern, just via the native method.

---

**User Approval Required Before Implementation** — confirmed, ready to implement.

---

## Implementation Issue Found + Resolved (Aug 14, 2026)

While implementing, the `transition` + `@starting-style` approach for animating the popover's `transform` produced a stuck computed value (`translateY(100%)`, the closed position) that would not update even under `!important` overrides in diagnostic testing.

**Researched (Haiku agent, MDN/CSS Cascade spec cited):** CSS Transitions occupy a distinct, very high-priority cascade origin — above author `!important` — while a transition is active (MDN CSS Cascade documentation, "Transitions" origin). This confirmed the mechanism but didn't fully explain why the transition itself wasn't animating to the open value in the first place.

**Fix adopted (per MDN's own Popover API guide, cited by the same research pass):** replace the `transition`/`@starting-style` pattern with plain **CSS keyframe animations** — `@keyframes` + `animation` on `:popover-open`. This avoids the `@starting-style`/transition cascade fragility entirely, requires no JS-side workarounds, and is explicitly named by MDN as the simpler, more robust pattern for popover entrance/exit effects.

---

## Follow-up Bug Found + Fixed (Aug 14, 2026)

After the animation fix, user reported filter-sheet list text appearing unreadable/near-invisible (screenshot showed only the `.active` "All Time" row legible, all other rows dim-on-dark and effectively unreadable).

**Root cause:** same category of issue as the `inset`/`width`/`height`/`margin`/`border` UA-default reset already applied to `.bottom-sheet` — the browser's `[popover]` UA stylesheet also resets `color`, which is an explicit (non-inherited) declaration and therefore overrides normal inheritance from `body`'s `color: var(--text)`. Only `.tab.active`/`.filter-option.active` had an explicit `color` override, so every non-active row fell back to the UA-reset color instead of inheriting the readable theme color.

**Fix:** added `color: var(--text)` to the `.bottom-sheet` base rule (`live.html`), completing the UA-default reset list. User visually confirmed fixed.
