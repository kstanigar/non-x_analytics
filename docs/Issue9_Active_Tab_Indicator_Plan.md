# Issue 9: Active Tab Indicator - Implementation Plan

**Session:** June 9, 2026
**Phase:** Phase 6A - Task 5 (Subtask 10 completion)
**Estimated Time:** 15 minutes

---

## Overview

Add visual indicator to show which tab is currently active when using mobile hamburger menu.

---

## Problem Statement

**User Experience Issue:**
- On mobile (<479px), navigation uses hamburger menu instead of desktop tabs
- When menu is closed, there's no visual indication of which tab is active
- User question: "Where am I in the dashboard?"

**Current State:**
- Hamburger label shows only "DASHBOARDS"
- Active tab is not communicated to user
- Creates confusing navigation experience

**Screenshot Evidence:** `/Users/keithstanigar/Desktop/tab name solution.png`

---

## Proposed Solution

Display current tab name next to "DASHBOARDS" label with distinctive color:
- Format: `DASHBOARDS - OVERVIEW`
- Tab name in purple/magenta (`var(--mag)`)
- Updates dynamically when user switches tabs

**Visual Design:**
```
DASHBOARDS - OVERVIEW
           └─ Purple/magenta color (var(--mag))
```

---

## Implementation Plan

### **Step 1: Update HTML Structure (5 min)**

**File:** `live.html`
**Location:** Line ~1218 (hamburger menu wrapper)

**Before:**
```html
<div class="mobile-nav-wrapper">
  <button class="hamburger-btn" id="hamburger-toggle" onclick="toggleMobileMenu()" aria-label="Menu">
    <span></span>
    <span></span>
    <span></span>
  </button>
  <span class="hamburger-label">DASHBOARDS</span>
</div>
```

**After:**
```html
<div class="mobile-nav-wrapper">
  <button class="hamburger-btn" id="hamburger-toggle" onclick="toggleMobileMenu()" aria-label="Menu">
    <span></span>
    <span></span>
    <span></span>
  </button>
  <span class="hamburger-label">DASHBOARDS <span class="active-tab-name">- OVERVIEW</span></span>
</div>
```

**Changes:**
- Added `<span class="active-tab-name">- OVERVIEW</span>` inside hamburger label
- Default to "OVERVIEW" tab (first tab users see)

---

### **Step 2: Add CSS Styling (3 min)**

**File:** `live.html`
**Location:** Mobile CSS section (~line 948, after `.hamburger-label` rule)

**Insert After Line 956:**

```css
/* Active tab name indicator (shows which tab is currently selected) */
.active-tab-name {
  color: var(--mag);        /* Purple/magenta for visual distinction */
  font-weight: 600;         /* Bold to emphasize current location */
  letter-spacing: 0.1em;    /* Match hamburger-label letter-spacing */
}
```

**Reasoning:**
- Purple/magenta matches design system (`var(--mag)`)
- Bold weight emphasizes current location
- Inherits font-family and other properties from parent `.hamburger-label`

---

### **Step 3: Update `switchTab()` Function (7 min)**

**File:** `live.html`
**Location:** Line 3261 (`switchTab()` function)

**Before (lines 3261-3280):**
```javascript
function switchTab(name) {
  // Remove active from all tabs (both desktop and mobile)
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  // Add active to clicked tab and corresponding page
  event.target.classList.add('active');

  // Find and activate corresponding tab in other nav (desktop <-> mobile)
  const allTabs = Array.from(document.querySelectorAll('.tab'));
  const correspondingTab = allTabs.find(tab =>
    tab !== event.target &&
    tab.onclick &&
    tab.onclick.toString().includes(`switchTab('${name}')`)
  );
  if (correspondingTab) {
    correspondingTab.classList.add('active');
  }

  document.getElementById('page-'+name).classList.add('active');
}
```

**After:**
```javascript
function switchTab(name) {
  // Remove active from all tabs (both desktop and mobile)
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  // Add active to clicked tab and corresponding page
  event.target.classList.add('active');

  // Find and activate corresponding tab in other nav (desktop <-> mobile)
  const allTabs = Array.from(document.querySelectorAll('.tab'));
  const correspondingTab = allTabs.find(tab =>
    tab !== event.target &&
    tab.onclick &&
    tab.onclick.toString().includes(`switchTab('${name}')`)
  );
  if (correspondingTab) {
    correspondingTab.classList.add('active');
  }

  document.getElementById('page-'+name).classList.add('active');

  // ISSUE 9: Update mobile hamburger label with active tab name
  const tabNames = {
    'overview': 'OVERVIEW',
    'funnel': 'FUNNEL',
    'bosses': 'BOSS ANALYSIS',
    'ai': 'AI AGENT',
    'ab': 'A/B TESTS',
    'platform': 'PLATFORM',
    'looker': 'LOOKER GUIDE'
  };

  const activeTabLabel = document.querySelector('.active-tab-name');
  if (activeTabLabel && tabNames[name]) {
    activeTabLabel.textContent = `- ${tabNames[name]}`;
  }
}
```

**Changes:**
- Added `tabNames` mapping object (tab ID → display name)
- Query `.active-tab-name` element
- Update text content with formatted tab name
- Includes safety check (`if (activeTabLabel && tabNames[name])`)

---

## Tab Name Mappings

| Tab ID | Display Name | Notes |
|--------|--------------|-------|
| `overview` | OVERVIEW | Default active tab |
| `funnel` | FUNNEL | Completion funnel page |
| `bosses` | BOSS ANALYSIS | Full uppercase for consistency |
| `ai` | AI AGENT | Matches desktop tab text |
| `ab` | A/B TESTS | Includes "TESTS" for clarity |
| `platform` | PLATFORM | Desktop vs Mobile comparison |
| `looker` | LOOKER GUIDE | Help/documentation page |

---

## Testing Checklist

### Desktop (≥480px):
- [ ] Mobile nav elements hidden (no hamburger visible)
- [ ] Desktop tabs function normally
- [ ] Active tab highlighting works

### Mobile (<479px):
- [ ] Hamburger menu visible with "DASHBOARDS - OVERVIEW" label
- [ ] Tab name displays in purple/magenta
- [ ] Switch to Funnel tab → Label updates to "DASHBOARDS - FUNNEL"
- [ ] Switch to Boss Analysis → Label updates to "DASHBOARDS - BOSS ANALYSIS"
- [ ] Test all 7 tabs for label updates
- [ ] Menu closes after tab selection
- [ ] Active tab name persists after menu closes

### Cross-Browser:
- [ ] Chrome/Edge: Label updates correctly
- [ ] Safari: Purple color displays correctly
- [ ] Firefox: Text formatting correct

---

## Possible Errors

### Error 1: Label Not Updating
**Symptom:** Tab switches but label stays "- OVERVIEW"

**Cause:** `.active-tab-name` element not found (query selector fails)

**Solution:** Verify HTML structure has `<span class="active-tab-name">` inside `.hamburger-label`

---

### Error 2: Tab Name Shows as "undefined"
**Symptom:** Label shows "DASHBOARDS - undefined"

**Cause:** Tab ID not in `tabNames` mapping

**Solution:** Add missing tab ID to `tabNames` object

---

### Error 3: Color Not Purple
**Symptom:** Tab name shows in cyan instead of purple/magenta

**Cause:** CSS variable `var(--mag)` not defined or overridden

**Solution:** Verify CSS variables defined at document root:
```css
:root {
  --mag: #da40da;  /* Purple/magenta */
}
```

---

## Code Changes Summary

| File | Lines | Change Type | Description |
|------|-------|-------------|-------------|
| `live.html` | ~1218 | HTML | Add `<span class="active-tab-name">` to hamburger label |
| `live.html` | ~956 | CSS | Add `.active-tab-name` styling (purple, bold) |
| `live.html` | 3261-3280 | JavaScript | Update `switchTab()` to change label text |

**Total Lines Changed:** ~25 lines (10 HTML, 5 CSS, 10 JavaScript)

---

## User Experience Improvement

**Before:**
- User on mobile sees only hamburger icon + "DASHBOARDS"
- No indication of current location
- Must open menu to see active tab (highlighted in menu)

**After:**
- User sees "DASHBOARDS - PLATFORM" (or current tab)
- Purple/magenta color draws attention
- Immediate visual feedback of location
- Reduces cognitive load ("Where am I?")

---

## Time Breakdown

| Task | Time |
|------|------|
| Step 1: HTML update | 5 min |
| Step 2: CSS styling | 3 min |
| Step 3: JavaScript update | 7 min |
| **Implementation Total** | **15 min** |
| Testing (all tabs) | 5 min |
| **Grand Total** | **20 min** |

---

## Documentation Updates After Implementation

**Files to Update:**
1. `docs/HANDOFF_SUMMARY.md` - Mark Issue 9 complete
2. `docs/PRIORITIES.md` - Update Phase 6A Task 5 progress

**Git Commit Message:**
```
feat: add active tab indicator to mobile hamburger menu

- Display current tab name next to "DASHBOARDS" label
- Tab name in purple/magenta (var(--mag)) for visual distinction
- Updates dynamically when user switches tabs
- Improves mobile UX by showing current location

Resolves Issue 9
```

---

## Next Steps After Completion

**Resume Phase 6A Task 5:**
- Subtask 11: Integration & Performance Testing (15 min)
- Subtask 12: Documentation updates (15 min)

**Total Remaining:** ~30 minutes to complete Phase 6A Task 5

---

**Plan Verified:** June 9, 2026
**Ready for Implementation:** ✅