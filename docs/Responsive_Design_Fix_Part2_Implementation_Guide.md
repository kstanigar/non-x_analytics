# Responsive Design Fix Part 2 - Implementation Guide

**Created:** June 9, 2026
**Status:** Part 1 Ready, Parts 2-3 Pending
**Verified By:** Haiku Agent (agentId: add6416)

---

## Purpose

This document provides exact line-by-line insertion points for Responsive Design Fix Part 2, verified against the actual codebase. Created as a paper trail for implementation.

---

## Exact Insertion Points (Verified)

### Location 1: CSS Mobile Styles (@media max-width: 479px)

**File:** `live.html`
**Existing Block:** Lines 863-916
**Insert Before:** Line 916 (closing brace)

**Current Structure:**
```css
Line 910:   /* API status bar */
Line 911:   .api-status-bar {
Line 912:     flex-wrap: wrap;
Line 913:     gap: 12px;
Line 914:     font-size: 0.68rem;
Line 915:   }
Line 916: }  ← Mobile @media closes here
Line 917: </style>
```

**Insertion:** Add new CSS rules BEFORE line 916

---

### Location 2: CSS Desktop Styles (@media min-width: 480px)

**File:** `live.html`
**Status:** Block does NOT exist
**Insert Between:** Lines 916-917

**Current Structure:**
```css
Line 915:   }
Line 916: }  ← Mobile @media closes
Line 917: </style>  ← Style tag closes
```

**Insertion:** Create new media query block BETWEEN lines 916-917

---

### Location 3: HTML Navigation Tabs

**File:** `live.html`
**Existing Block:** Lines 974-982

**Current Structure:**
```html
Line 974: <nav class="nav-tabs">
Line 975:   <div class="tab active" onclick="switchTab('overview')">Overview</div>
Line 976:   <div class="tab" onclick="switchTab('funnel')">Funnel</div>
Line 977:   <div class="tab" onclick="switchTab('bosses')">Boss Analysis</div>
Line 978:   <div class="tab" onclick="switchTab('ai')">AI Agent</div>
Line 979:   <div class="tab" onclick="switchTab('ab')">A/B Tests</div>
Line 980:   <div class="tab" onclick="switchTab('platform')">Platform</div>
Line 981:   <div class="tab" onclick="switchTab('looker')">Looker Guide</div>
Line 982: </nav>
```

**Actions:**
1. Modify line 974: Add `desktop-nav` class
2. Insert mobile nav wrapper AFTER line 982

---

### Location 4: JavaScript Functions

**File:** `live.html`
**Existing Function:** Lines 3024-3029
**Insert After:** Line 3029

**Current Structure:**
```javascript
Line 3024: function switchTab(name) {
Line 3025:   document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
Line 3026:   document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
Line 3027:   event.target.classList.add('active');
Line 3028:   document.getElementById('page-'+name).classList.add('active');
Line 3029: }
Line 3030: [blank]
Line 3031: // ─── CSV DRAG-AND-DROP ───
```

**Insertion:** Add new functions AFTER line 3029 (replace blank line 3030)

---

## Part 1: Chart Overflow Fix (5 min)

**Status:** Ready for implementation
**Lines to Add:** 10 lines CSS

### Code to Insert

**Location:** Before line 916 (inside @media max-width: 479px block)

```css
  /* ─── PART 1: Chart Overflow Fix ─── */
  .card {
    overflow: hidden;  /* Clip overflowing chart content */
    max-width: 100vw;  /* Never exceed viewport width */
  }

  .chart-wrap {
    max-width: 100%;   /* Constrain to parent card width */
    overflow: hidden;  /* Clip canvas overflow */
    position: relative;
  }

  /* Chart grid - ensure single column at mobile */
  .chart-grid {
    grid-template-columns: 1fr !important;  /* Force single column */
    gap: 20px;
  }
```

### Testing Protocol

**After insertion:**
1. Open `live.html` in browser
2. Open DevTools (F12)
3. Toggle device toolbar (Cmd+Shift+M / Ctrl+Shift+M)
4. Resize to 375px width
5. Navigate to OVERVIEW tab
6. Verify charts fit within viewport:
   - Daily Plays & Wins chart
   - Device Mix donut chart
   - Music A/B Split chart
   - Powerup Collection chart
7. Verify no horizontal scrollbar appears

**Success Criteria:**
- ✅ All charts fit within viewport
- ✅ No horizontal overflow
- ✅ Charts readable at 375px
- ✅ Single-column layout active

---

## Part 2: Analytics Version Stack (3 min)

**Status:** Pending Part 1 completion
**Lines to Add:** 10 lines CSS

### Code to Insert

**Location:** Before line 916 (same @media block as Part 1)

```css
  /* ─── PART 2: Analytics Version Stack ─── */
  .api-status-bar {
    flex-direction: column;  /* Stack label above dropdown */
    align-items: flex-start; /* Left-align instead of center */
    gap: 8px;                /* Reduce gap for stacked layout */
    margin-bottom: 16px;
  }

  /* Version dropdown - full width on mobile */
  select, .version-dropdown {
    width: 100%;             /* Full-width dropdown */
    max-width: none;         /* Remove desktop max-width constraint */
    font-size: 0.72rem;      /* Slightly smaller on mobile */
  }
```

### Testing Protocol

**After insertion:**
1. Resize to 375px width
2. Verify "Analytics Version:" label is ABOVE dropdown (not beside)
3. Verify dropdown is full-width
4. Verify spacing looks balanced

**Success Criteria:**
- ✅ Label stacked above dropdown
- ✅ Dropdown full-width
- ✅ Clean vertical spacing

---

## Part 3: Hamburger Menu (17 min)

**Status:** Pending Parts 1-2 completion
**Lines to Add:** ~175 lines total

### 3.1: HTML Structure (5 min)

**Location:** Line 974 (modify) + After line 982 (insert)

**Modify line 974 FROM:**
```html
<nav class="nav-tabs">
```

**TO:**
```html
<nav class="nav-tabs desktop-nav">
```

**Insert AFTER line 982:**
```html
<!-- Mobile hamburger menu (visible only on mobile) -->
<div class="mobile-nav-wrapper">
  <button class="hamburger-btn" id="hamburger-toggle" onclick="toggleMobileMenu()" aria-label="Menu">
    <span></span>
    <span></span>
    <span></span>
  </button>

  <nav class="mobile-menu" id="mobile-menu">
    <div class="mobile-menu-header">
      <span class="mobile-menu-title">Navigation</span>
      <button class="close-btn" onclick="closeMobileMenu()" aria-label="Close menu">✕</button>
    </div>
    <div class="tab active" onclick="switchTab('overview'); closeMobileMenu()">📊 Overview</div>
    <div class="tab" onclick="switchTab('funnel'); closeMobileMenu()">📈 Funnel</div>
    <div class="tab" onclick="switchTab('bosses'); closeMobileMenu()">⚔️ Boss Analysis</div>
    <div class="tab" onclick="switchTab('ai'); closeMobileMenu()">🤖 AI Agent</div>
    <div class="tab" onclick="switchTab('ab'); closeMobileMenu()">🧪 A/B Tests</div>
    <div class="tab" onclick="switchTab('platform'); closeMobileMenu()">📱 Platform</div>
    <div class="tab" onclick="switchTab('looker'); closeMobileMenu()">📋 Looker Guide</div>
  </nav>
</div>
```

---

### 3.2: CSS Mobile Styles (8 min)

**Location:** Before line 916 (same @media block)

```css
  /* ─── PART 3: Hamburger Menu Mobile Styles ─── */

  /* Hide desktop tabs, show hamburger */
  .nav-tabs.desktop-nav {
    display: none;
  }

  .mobile-nav-wrapper {
    margin-bottom: 28px;
  }

  /* Hamburger button styling */
  .hamburger-btn {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--cyan);
    width: 44px;
    height: 44px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 5px;
    padding: 0;
    transition: all 0.2s;
    position: relative;
    z-index: 1001;
  }

  .hamburger-btn:hover {
    border-color: var(--cyan);
    background: var(--cyan-dim);
  }

  .hamburger-btn:active {
    transform: scale(0.95);
  }

  /* Hamburger bars (animated) */
  .hamburger-btn span {
    width: 22px;
    height: 2px;
    background: var(--cyan);
    transition: all 0.3s ease;
    display: block;
  }

  /* Hamburger animation when open */
  .hamburger-btn.open span:nth-child(1) {
    transform: translateY(7px) rotate(45deg);
  }

  .hamburger-btn.open span:nth-child(2) {
    opacity: 0;
  }

  .hamburger-btn.open span:nth-child(3) {
    transform: translateY(-7px) rotate(-45deg);
  }

  /* Mobile menu overlay */
  .mobile-menu {
    position: fixed;
    top: 0;
    left: -100%;
    width: 100%;
    max-width: 280px;
    height: 100vh;
    background: var(--bg);
    border-right: 2px solid var(--cyan);
    box-shadow: 2px 0 20px rgba(0, 255, 255, 0.3);
    z-index: 2000;
    transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    display: flex;
    flex-direction: column;
  }

  .mobile-menu.open {
    left: 0;
  }

  /* Mobile menu header */
  .mobile-menu-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    background: var(--bg2);
  }

  .mobile-menu-title {
    font-family: var(--mono);
    font-size: 0.75rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--cyan);
  }

  .close-btn {
    background: transparent;
    border: none;
    color: var(--cyan);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;
  }

  .close-btn:hover {
    transform: rotate(90deg);
  }

  /* Mobile menu tabs */
  .mobile-menu .tab {
    padding: 16px 20px;
    border: none;
    border-bottom: 1px solid rgba(0, 255, 255, 0.1);
    width: 100%;
    text-align: left;
    background: transparent;
    position: static;
    font-size: 0.75rem;
    transition: all 0.2s;
  }

  .mobile-menu .tab:hover {
    background: var(--cyan-dim);
    padding-left: 24px;
  }

  .mobile-menu .tab.active {
    background: rgba(0, 255, 255, 0.1);
    border-left: 3px solid var(--cyan);
    padding-left: 17px;
    color: var(--cyan);
    text-shadow: 0 0 10px var(--cyan-glow);
  }

  /* Backdrop overlay (darkens page when menu open) */
  .mobile-menu::before {
    content: '';
    position: fixed;
    top: 0;
    left: 100%;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    transition: opacity 0.3s;
    opacity: 0;
    pointer-events: none;
  }

  .mobile-menu.open::before {
    opacity: 1;
    pointer-events: auto;
  }
```

---

### 3.3: CSS Desktop Styles (2 min)

**Location:** BETWEEN lines 916-917 (new media query block)

```css

/* Desktop styles - ensure mobile elements hidden */
@media (min-width: 480px) {
  .mobile-nav-wrapper {
    display: none;
  }

  .nav-tabs.desktop-nav {
    display: flex;
  }
}
```

---

### 3.4: JavaScript Functions (4 min)

**Location:** AFTER line 3029

```javascript

// ─── MOBILE MENU FUNCTIONS ────────────────────────────────────────

function toggleMobileMenu() {
  const mobileMenu = document.getElementById('mobile-menu');
  const hamburgerBtn = document.getElementById('hamburger-toggle');

  const isOpen = mobileMenu.classList.contains('open');

  if (isOpen) {
    closeMobileMenu();
  } else {
    mobileMenu.classList.add('open');
    hamburgerBtn.classList.add('open');
    document.body.style.overflow = 'hidden'; // Prevent page scroll when menu open
  }
}

function closeMobileMenu() {
  const mobileMenu = document.getElementById('mobile-menu');
  const hamburgerBtn = document.getElementById('hamburger-toggle');

  mobileMenu.classList.remove('open');
  hamburgerBtn.classList.remove('open');
  document.body.style.overflow = ''; // Restore page scroll
}

// Close mobile menu when clicking backdrop
document.addEventListener('click', function(e) {
  const mobileMenu = document.getElementById('mobile-menu');
  const hamburgerBtn = document.getElementById('hamburger-toggle');

  if (!mobileMenu || !hamburgerBtn) return; // Elements don't exist yet

  const isMenuOpen = mobileMenu.classList.contains('open');
  const clickedInsideMenu = mobileMenu.contains(e.target);
  const clickedHamburger = hamburgerBtn.contains(e.target);

  if (isMenuOpen && !clickedInsideMenu && !clickedHamburger) {
    closeMobileMenu();
  }
});

// Close mobile menu on Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeMobileMenu();
  }
});

// Sync active tab state between desktop and mobile nav
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

### Testing Protocol

**After full implementation:**
1. **Basic Interaction:**
   - Resize to 375px → hamburger visible, desktop tabs hidden
   - Click hamburger → menu slides in from left
   - Click tab → switches page, menu closes
   - Click backdrop → menu closes
   - Press Escape → menu closes

2. **Visual Polish:**
   - Hamburger bars animate to X smoothly
   - Menu slides without jank
   - Active tab highlighted (cyan border, glow)
   - Backdrop fades in/out

3. **Cross-Device:**
   - Resize desktop → mobile → hamburger appears
   - Resize mobile → desktop → tabs reappear
   - Active tab syncs across resize

**Success Criteria:**
- ✅ Desktop tabs visible ≥480px
- ✅ Hamburger button visible <479px
- ✅ Menu slides smoothly
- ✅ Menu closes on tab selection
- ✅ Hamburger animates (bars ↔ X)
- ✅ Active tab highlighted
- ✅ No page scroll when menu open

---

## Implementation Timeline

**Estimated Total Time:** 35 minutes

| Part | Task | Time | Status |
|------|------|------|--------|
| 1 | Chart overflow CSS | 5 min | ✅ Complete |
| 2 | Analytics Version stack CSS | 3 min | ✅ Complete |
| 3.1 | Hamburger HTML | 5 min | ✅ Complete |
| 3.2 | Hamburger CSS mobile | 8 min | ✅ Complete |
| 3.3 | Hamburger CSS desktop | 2 min | ✅ Complete |
| 3.4 | Hamburger JavaScript | 4 min | ✅ Complete |
| **Testing** | All parts | 10 min | ⚠️ Issue Found |
| **Total** | | **35 min** | **✅ Complete** |

---

## ⚠️ NEW ISSUE DISCOVERED: Chart Legend Scaling

**Status:** Needs Investigation
**Found During:** Part 3 testing (June 9, 2026)

**Problem:**
- Bar charts scale down at mobile widths (<479px)
- Legend/key labels scale UP (become larger)
- Creates visual imbalance - legend dominates chart space

**Example Chart:**
- "Powerup Collection by Phase" (Overview tab)
- Bars: Very small, barely visible
- Legend: Large, takes up more space than chart itself
- Colors: Green Phase, Red Phase, Purple Phase

**Root Cause (Hypothesis):**
- Chart.js may be using responsive font sizing that increases legend text
- Legend position may need adjustment for mobile
- May need explicit legend font size constraints at <479px

**Investigation Needed:**
1. Find all Chart.js legend configurations in codebase
2. Research Chart.js responsive legend options
3. Identify which charts have this issue (all bar charts? specific ones?)
4. Determine fix approach (CSS override, Chart.js config, or both)

**Status:** ✅ RESOLVED (June 9, 2026)

**Solution Implemented:**
- Added `getLegendFontSize()` helper function (lines 2575-2578)
- Returns 8px for mobile (≤479px), 11px for desktop (≥480px)
- Updated 10 chart legend configs with `font:{ size: getLegendFontSize() }`

**Charts Fixed:**
1. Daily Plays (line 2621) ✅
2. Device Mix (line 2634) ✅
3. A/B Split (line 2647) ✅
4. Powerup Collection by Phase (line 2665) ✅
5. Boss Ratio (line 2859) ✅
6. Boss Platform (line 2877) ✅
7. Platform Funnel (line 3047) ✅
8. Survival Distribution (line 3066) ✅
9. AI Tier Flow (line 3177) ✅
10. AI Tier Score (line 3225) ✅

**Result:** Legends now scale proportionally with charts at all viewport sizes.

---

## 📋 New Issues for Next Session

### Issue 6: Remove "WINNING" Labels from A/B Test Cards
- **Location:** A/B TESTS tab → "A/B TEST 1 - MUSIC DEFAULT (ON VS OFF)"
- **Problem:** "GROUP A - MUSIC ON" card displays green "WINNING" label
- **Impact:** Mobile clutter, redundant with green highlight
- **Screenshot:** `/Users/keithstanigar/Desktop/Screen Shot 2026-06-09 at 10.14.53 AM.png`
- **Action:** Hide "WINNING" label at mobile widths or remove entirely

### Issue 7: Hide X-Axis Labels on Mobile Bar Charts
- **Location:** BOSS ANALYSIS tab → "ATTEMPT-TO-DEFEAT RATIO BY BOSS"
- **Problem:** X-axis labels ("Boss 1 (Green)", "Boss 2 (Red)", etc.) take up space at mobile widths
- **Impact:** Bar colors already identify bosses - labels redundant and consume chart space
- **Screenshot:** `/Users/keithstanigar/Desktop/Screen Shot 2026-06-09 at 10.15.46 AM.png`
- **Action:** Hide x-axis labels at mobile widths (<479px)
  - Bar colors identify bosses: Green = Boss 1, Red = Boss 2, Purple = Boss 3
  - Gives chart more vertical room for bars
  - Users can see boss colors in legend if needed
- **Implementation:** Add CSS or Chart.js config to hide x-axis labels at mobile
- **Affected Charts:** All bar charts with categorical x-axis labels

**Estimated Time:** 30 minutes total (15 min each)

---

**Session Status:** ALL RESPONSIVE FIXES COMPLETE ✅
**Next Session:** Mobile UI cleanup (Issues 6-7)

---

## Verification Checklist

Before implementation:
- [x] Haiku agent verified all line numbers
- [x] Current code structure matches plan assumptions
- [x] Insertion points documented
- [x] Testing protocols defined

During implementation:
- [x] Part 1: CSS inserted before line 916 ✅
- [x] Part 1: Tested at 375px ✅
- [ ] Part 2: CSS inserted before line 916
- [ ] Part 2: Tested at 375px
- [ ] Part 3.1: HTML modified line 974, inserted after 982
- [ ] Part 3.2: CSS mobile inserted before line 916
- [ ] Part 3.3: CSS desktop inserted between 916-917
- [ ] Part 3.4: JavaScript inserted after line 3029
- [ ] Part 3: Full hamburger menu tested

After implementation:
- [ ] All tests pass
- [ ] No console errors
- [ ] Visual polish confirmed
- [ ] Cross-device functionality verified
- [ ] Documentation updated (HANDOFF_SUMMARY.md, PRIORITIES.md)

---

## Rollback Plan

**If issues occur:**

1. **Part 1 rollback:**
   - Remove CSS lines for chart overflow fix

2. **Part 2 rollback:**
   - Remove CSS lines for Analytics Version stack

3. **Part 3 rollback:**
   - Remove `desktop-nav` class from line 974
   - Delete mobile nav HTML wrapper
   - Delete hamburger CSS (mobile + desktop blocks)
   - Delete hamburger JavaScript functions
   - Revert `switchTab()` to original

4. **Full rollback:**
   ```bash
   git checkout live.html  # Discard all changes
   ```

---

## Related Documentation

- **Part 2 Plan:** `docs/Responsive_Design_Fix_Part2_Plan.md`
- **Part 1 Plan:** `docs/Responsive_Design_Fix_Plan.md`
- **Haiku Verification:** Agent ID add6416 (June 9, 2026)
- **Session Notes:** `docs/HANDOFF_SUMMARY.md`
- **Task Tracking:** `docs/PRIORITIES.md`

---

**Document Status:** Complete ✅
**Verified By:** Haiku Agent + Human Review
**Ready for Implementation:** Yes
**Next Step:** Execute Part 1 (chart overflow fix)