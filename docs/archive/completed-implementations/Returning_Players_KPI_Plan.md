# Implementation Plan: Flip New vs Returning KPI to Returning %

**Date:** June 13, 2026
**Status:** 📋 PLAN COMPLETE — awaiting user approval

---

## Summary

The "New vs Returning" KPI currently shows the new user % (26% = 30/115). User requested it show the returning user % (74% = 85/115) — the higher, more meaningful number since most players are returning.

---

## Files to Modify

- `live.html` only — 3 targeted changes

---

## Change 1 — Flip pct formula to use returningCount (line 3641)

**Before:**
```javascript
const pct = totalCount > 0 ? Math.round((newCount / totalCount) * 100) + '%' : '—';
```

**After:**
```javascript
const pct = totalCount > 0 ? Math.round((returningCount / totalCount) * 100) + '%' : '—';
```

Note: `returningCount` is already calculated on line 3640 — no new variables needed.

---

## Change 2 — Update HTML label + sub placeholder (lines 1651, 1653)

**Before:**
```html
<div class="kpi-label">New vs Returning <span class="dict-link" data-dict="new-pct">ⓘ</span></div>
<div class="kpi-sub" id="kpi-new-pct-sub">% first-time players</div>
```

**After:**
```html
<div class="kpi-label">Returning Players <span class="dict-link" data-dict="new-pct">ⓘ</span></div>
<div class="kpi-sub" id="kpi-new-pct-sub">% returning sessions</div>
```

---

## Change 3 — Swap sub-text colors (line 4707)

Returning is now the featured metric → gets green. New gets yellow.

**Before:**
```javascript
DATA.kpis.newPctSub = `<span style="color:var(--green)">${nuData.newCount}&nbsp;new</span> / <span style="color:#FFD700">${nuData.returningCount}&nbsp;returning</span>`;
```

**After:**
```javascript
DATA.kpis.newPctSub = `<span style="color:#FFD700">${nuData.newCount}&nbsp;new</span> / <span style="color:var(--green)">${nuData.returningCount}&nbsp;returning</span>`;
```

---

## Task List

- [ ] 1. Change `newCount` → `returningCount` in pct formula (`live.html:3641`)
- [ ] 2. Update HTML label: "New vs Returning" → "Returning Players" (`live.html:1651`)
- [ ] 3. Update HTML sub placeholder: "% first-time players" → "% returning sessions" (`live.html:1653`)
- [ ] 4. Swap sub-text colors so returning = green (`live.html:4707`)

---

## Possible Errors

| Error | Solution |
|-------|----------|
| `returningCount` undefined | It's declared on line 3640 — confirm that line runs before 3641 |
| Label truncates on mobile | "Returning Players" is same length as "New vs Returning" — should fit |

---

## Testing

- [ ] KPI shows ~74% (85 returning / 115 total)
- [ ] Sub-text: "30 new / 85 returning" — returning in green, new in yellow
- [ ] Label reads "Returning Players"
- [ ] Mobile: label fits within KPI tile

---

**User Approval Required Before Implementation**
