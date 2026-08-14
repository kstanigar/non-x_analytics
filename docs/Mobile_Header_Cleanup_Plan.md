# Implementation Plan: Mobile Header Cleanup

**Created:** August 14, 2026
**Status:** ✅ COMPLETE — August 14, 2026 — tested on staging, merged to main via `feature/leaderboard-colors` (fast-forward, `bf279da`)
**Reference:** User-supplied screenshot — `live.html` header on mobile (kstanigar.github.io/non-x_analytics), Live Data / Overview view

---

## User Asks (verbatim, documented before planning)

1. Remove the inline date filter dropdown (`.version-filter`, "Last 7 Days - Version 4.3 (Current)") from mobile — it's redundant because the bottom-nav **Filter** button (the "pill") already opens the same 8 date-range options via `#mobile-filter-sheet`.
2. `Measurement ID`, `Events tracked`, `Platforms`, and `Active A/B tests` (`.header-meta` block) should align on the right on mobile — they currently render left-aligned/ragged instead of right-aligned against the screen edge.
3. `GA4` and `Lambda API` should move to their own line, separate from `Analytics Command Center` — currently the text wraps unpredictably mid-phrase ("...CENTER · GA4" / "LAMBDA API" split awkwardly).
4. `Analytics Command Center` should sit alone on its own line.

---

## Root Cause

- **Ask 1:** `.version-filter` (`live.html:1705–1720`) has no mobile-hide rule — it duplicates `#mobile-filter-sheet` (`live.html:1765–1779`, opened by the bottom-nav Filter button, `live.html:6477`).
- **Ask 2:** `.header-meta` already has `text-align: right` (`live.html:197–203`), but the mobile `header` rule (`live.html:1137–1141`) sets `flex-direction: column; align-items: flex-start;` — `flex-start` shrinks `.header-meta` to its content width and pins that box to the left edge, so `text-align: right` only rights-aligns text *inside* an already-left-pinned box.
- **Asks 3 & 4:** `<p>Analytics Command Center &nbsp;·&nbsp; GA4 · Lambda API</p>` (`live.html:1686`) is one text run with normal breakable spaces — the browser wraps it wherever it runs out of width, not at a chosen point.

---

## Files to Modify

- `live.html` only — CSS-only + one small markup split, all scoped to the existing `max-width: 900px` mobile breakpoint. No JS changes.

---

## Task Breakdown

1. Hide `.version-filter` on mobile (5 min)
2. Fix `.header-meta` right alignment on mobile (5 min)
3. Split `Analytics Command Center` / `GA4 · Lambda API` onto separate lines, mobile only (10 min)
4. Manual check on mobile viewport: filter pill still works, header-meta right-aligned, two-line title, desktop unaffected (10 min)

**Total estimate:** ~30 min

---

## Code Changes

### Change 1 — Hide date filter dropdown on mobile

**File:** `live.html`, inside existing `@media (max-width: 900px)` block (~line 1240, where `.version-filter` mobile rules already live)

**Add:**
```css
.version-filter {
  display: none;   /* redundant with bottom-nav Filter pill (#mobile-filter-sheet) */
}
```
(This sits alongside the existing `.version-filter { width: 100%; margin-bottom: 16px; }` rule at `live.html:1240–1243` — the new `display: none` supersedes it for mobile; desktop rule at `live.html:924` is untouched.)

### Change 2 — Right-align header-meta on mobile

**File:** `live.html:1137–1141`

**Before:**
```css
header {
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;
}
```

**After:**
```css
header {
  flex-direction: column;
  gap: 16px;
  align-items: stretch;   /* let .header-meta span full width so text-align:right pushes to the edge */
}
```

### Change 3 — Split title onto two lines, mobile only

**File:** `live.html:1686`

**Before:**
```html
<p>Analytics Command Center &nbsp;·&nbsp; GA4 · Lambda API</p>
```

**After:**
```html
<p>Analytics Command Center<span class="header-sep"> &nbsp;·&nbsp; </span><span class="header-api">GA4 · Lambda API</span></p>
```

**Add to mobile media query (~line 1177, next to existing `.header-meta` mobile rule):**
```css
.header-sep {
  display: none;   /* separator dot not needed once GA4/Lambda API drop to their own line */
}

.header-api {
  display: block;
  margin-top: 2px;
}
```

Desktop is unaffected — `.header-sep`/`.header-api` stay inline (default `<span>` behavior), rendering identically to today.

---

## Possible Errors

- `align-items: stretch` could theoretically stretch `.logo-block` full-width too — no visual effect expected since `h1`/`p` inside are left-aligned by default, but worth a visual check.
- Forgetting the `display: none` on `.header-sep` would leave a leading "· " dangling at the start of the "GA4 · Lambda API" line.

---

## Testing

- [ ] Mobile viewport (≤900px): date filter dropdown gone, Filter pill in bottom nav still opens the same options
- [ ] Mobile viewport: Measurement ID / Events tracked / Platforms / Active A/B tests block right-aligned against screen edge
- [ ] Mobile viewport: "Analytics Command Center" on its own line, "GA4 · Lambda API" on the line below, no dangling separator
- [ ] Desktop viewport (>900px): header unchanged from current production
