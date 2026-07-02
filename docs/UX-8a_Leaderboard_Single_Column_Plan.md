# UX-8a: Leaderboard Single-Column Fix

**Created:** July 2, 2026 (Session 24)
**Status:** ⬜ Pending — awaiting implementation approval
**Priority:** P1 (only active unblocked UI task)

---

## Problem

The leaderboard tab renders ranks 1–50 in a **2-column side-by-side grid** — left column ranks 1–25, right column ranks 26–50. User confirmed on staging that a single vertical list (ranks 1–50 top-to-bottom) is the correct layout.

---

## Root Cause

`live.html:2176` uses `display:grid; grid-template-columns:1fr 1fr` wrapping two separate `<table>` elements. The JS at `live.html:5093–5094` splits the 50 entries across two `<tbody>` targets.

---

## Plan

### Files to Modify

- `live.html` — HTML at lines 2176–2207, JS at lines 5057–5094

---

### Change 1 — HTML: Collapse 2-column grid wrapper to single container

**Location:** `live.html:2176`

**Before:**
```html
<div style="display:grid; grid-template-columns:1fr 1fr; gap:0 32px; margin-top:16px">
```

**After:**
```html
<div style="margin-top:16px">
```

---

### Change 2 — HTML: Remove the right table entirely

**Location:** `live.html:2192–2206`

**Remove this block:**
```html
        <table style="width:100%; border-collapse:collapse; font-size:13px">
          <thead>
            <tr style="color:var(--cyan); text-align:left; border-bottom:1px solid rgba(255,255,255,0.1)">
              <th style="padding:8px 12px">#</th>
              <th style="padding:8px 12px">Player</th>
              <th style="padding:8px 12px; text-align:right">Score</th>
              <th style="padding:8px 12px">Platform</th>
              <th style="padding:8px 12px">Movement</th>
              <th style="padding:8px 12px">Date</th>
            </tr>
          </thead>
          <tbody id="leaderboard-tbody-right">
            <tr><td colspan="6" style="padding:24px; text-align:center; opacity:0.5"></td></tr>
          </tbody>
        </table>
```

---

### Change 3 — JS: Remove `tbodyRight` references

**Location:** `live.html:5057–5064`

**Before:**
```javascript
const tbodyLeft = document.getElementById('leaderboard-tbody-left');
const tbodyRight = document.getElementById('leaderboard-tbody-right');
if (!tbodyLeft || !tbodyRight) return;

if (!entries.length) {
  tbodyLeft.innerHTML = '<tr><td colspan="6" style="padding:24px;text-align:center;opacity:0.5">No leaderboard data available.</td></tr>';
  tbodyRight.innerHTML = '';
  return;
}
```

**After:**
```javascript
const tbodyLeft = document.getElementById('leaderboard-tbody-left');
if (!tbodyLeft) return;

if (!entries.length) {
  tbodyLeft.innerHTML = '<tr><td colspan="6" style="padding:24px;text-align:center;opacity:0.5">No leaderboard data available.</td></tr>';
  return;
}
```

---

### Change 4 — JS: Render all 50 entries into single tbody

**Location:** `live.html:5093–5094`

**Before:**
```javascript
tbodyLeft.innerHTML = renderRows(entries.slice(0, 25), 1);
tbodyRight.innerHTML = renderRows(entries.slice(25), 26);
```

**After:**
```javascript
tbodyLeft.innerHTML = renderRows(entries, 1);
```

---

## Summary of All Changes

| # | File | Line(s) | Type | Description |
|---|------|---------|------|-------------|
| 1 | `live.html` | 2176 | HTML | Remove `display:grid; grid-template-columns:1fr 1fr; gap:0 32px` — keep `margin-top:16px` only |
| 2 | `live.html` | 2192–2206 | HTML | Delete entire right `<table>` block (incl. `leaderboard-tbody-right`) |
| 3 | `live.html` | 5058, 5059, 5063 | JS | Remove `tbodyRight` variable, guard, and empty assignment |
| 4 | `live.html` | 5093–5094 | JS | Replace 2-line split render with single `renderRows(entries, 1)` |

**Total changes:** 4 edits across 2 areas of `live.html`

---

## Possible Errors

| Error | Cause | Solution |
|-------|-------|---------|
| `Cannot set properties of null (tbodyRight)` | Stale reference missed in JS | Grep for `leaderboard-tbody-right` — remove all occurrences |
| Table stretches full page width | Wrapper div no longer constrains to half width (this is correct behavior) | Expected — no fix needed |
| Ranks 26–50 missing | `slice(0, 25)` still present | Verify Change 4 removed the slice |

---

## Testing Checklist

- [ ] Open Leaderboard tab — verify single vertical table, ranks 1–50
- [ ] Top 3 entries display in cyan with bold player name
- [ ] KPI tiles (Total Entries, Top Score, Desktop %, Full Direction %) still populate
- [ ] Empty state ("No leaderboard data available.") renders correctly — test by temporarily breaking Firestore read
- [ ] No JS console errors

---

## Git Commands (after user approves + implementation complete)

```bash
# Step 1: Branch + commit
git checkout -b feature/ux-8a-leaderboard-single-col
git add live.html
git commit -m "fix(UX-8a): leaderboard single-column layout — ranks 1-50 vertical"

# Step 2: Push to staging for test
git push origin feature/ux-8a-leaderboard-single-col:staging
```

Reply **"merge to main"** after staging confirmed.
