# Responsive Design Fixes - Part 2 (Mobile Refinements)

**Created:** June 9, 2026
**Status:** Ready for implementation
**Estimated Time:** 25 minutes total
**Context:** Fixes discovered during Part 1 testing at <479px viewport

---

## Issues to Fix

### Issue 3: Overview Tab Charts Overflowing
- **Problem:** Charts extend beyond viewport despite `maintainAspectRatio:false`
- **Root Cause:** Chart parent containers lack width constraints
- **Impact:** Horizontal scroll on Overview tab, unprofessional appearance

### Issue 4: Analytics Version Layout Not Stacking
- **Problem:** "Analytics Version:" label and dropdown remain side-by-side at narrow widths
- **Root Cause:** Flexbox layout not changing to column direction
- **Impact:** Cramped layout, dropdown too narrow

### Issue 5: Hamburger Menu for Tab Navigation
- **Problem:** Current horizontal scroll tabs feel "amateur" (user feedback)
- **Solution:** Implement hamburger menu with slide-out overlay
- **Impact:** Professional mobile UX, better discoverability

---

## Implementation Plan

### Part 1: Fix Chart Overflow (Issue 3)

**Estimated Time:** 5 minutes

**File:** `live.html`
**Location:** CSS `@media (max-width: 479px)` block (after line 863)

**Problem Analysis:**
- Charts have `maintainAspectRatio:false` ✅
- But parent containers (`.card`, `.chart-wrap`) don't constrain width
- Charts render at intrinsic canvas size, ignoring container bounds

**CSS Changes Needed:**

Add to existing `@media (max-width: 479px)` block:

```css
/* Card containers - prevent overflow */
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

**Why this works:**
- `overflow: hidden` on `.card` prevents charts from extending beyond card boundaries
- `max-width: 100%` on `.chart-wrap` ensures charts respect parent width
- Charts with `maintainAspectRatio:false` will scale down to fit container
- Single-column grid prevents side-by-side charts from causing overflow

**Testing:**
- [ ] Navigate to OVERVIEW tab
- [ ] Resize to 375px width
- [ ] Verify "Daily Plays & Wins" chart fits within card
- [ ] Verify "Device Mix" donut chart doesn't overflow
- [ ] Verify "Music A/B Split" chart fits
- [ ] Verify "Powerup Collection" chart fits
- [ ] Scroll down - no horizontal scrollbar should appear

---

### Part 2: Stack Analytics Version Layout (Issue 4)

**Estimated Time:** 3 minutes

**File:** `live.html`
**Location:** CSS `@media (max-width: 479px)` block

**Current Structure (Lines ~940-960):**
```html
<div class="api-status-bar">
  <div class="status-item">
    <span class="status-icon">🔵</span>
    <span>Analytics Version:</span>
  </div>
  <select class="version-dropdown">
    <option value="4.3">Version 4.3 (Current)</option>
    <option value="all">All Versions</option>
  </select>
</div>
```

**Current CSS (Assumed):**
```css
.api-status-bar {
  display: flex;
  gap: 12px;
  align-items: center;
}
```

**CSS Changes Needed:**

Add to existing `@media (max-width: 479px)` block:

```css
/* Analytics Version - stack vertically */
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

**Why this works:**
- `flex-direction: column` stacks label above dropdown
- `align-items: flex-start` left-aligns both elements
- `width: 100%` on dropdown uses full available width
- Cleaner, more mobile-friendly layout

**Testing:**
- [ ] Resize to 375px width
- [ ] Verify "Analytics Version:" label is above dropdown (not beside)
- [ ] Verify dropdown is full-width
- [ ] Verify gap spacing looks balanced

---

### Part 3: Hamburger Menu Implementation (Issue 5)

**Estimated Time:** 17 minutes

**File:** `live.html`
**Locations:**
- HTML: Lines 974-982 (current tabs)
- CSS: Lines 131-162 (tab styles), 863+ (mobile styles)
- JavaScript: Lines 3024-3029 (switchTab function)

---

#### Step 3.1: Update HTML Structure (5 min)

**Location:** Replace lines 974-982

**Before:**
```html
<nav class="nav-tabs">
  <div class="tab active" onclick="switchTab('overview')">Overview</div>
  <div class="tab" onclick="switchTab('funnel')">Funnel</div>
  <div class="tab" onclick="switchTab('bosses')">Boss Analysis</div>
  <div class="tab" onclick="switchTab('ai')">AI Agent</div>
  <div class="tab" onclick="switchTab('ab')">A/B Tests</div>
  <div class="tab" onclick="switchTab('platform')">Platform</div>
  <div class="tab" onclick="switchTab('looker')">Looker Guide</div>
</nav>
```

**After:**
```html
<!-- Desktop tabs (hidden on mobile) -->
<nav class="nav-tabs desktop-nav">
  <div class="tab active" onclick="switchTab('overview')">Overview</div>
  <div class="tab" onclick="switchTab('funnel')">Funnel</div>
  <div class="tab" onclick="switchTab('bosses')">Boss Analysis</div>
  <div class="tab" onclick="switchTab('ai')">AI Agent</div>
  <div class="tab" onclick="switchTab('ab')">A/B Tests</div>
  <div class="tab" onclick="switchTab('platform')">Platform</div>
  <div class="tab" onclick="switchTab('looker')">Looker Guide</div>
</nav>

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

**Notes:**
- Added `.desktop-nav` class to existing tabs (hidden on mobile)
- Added `.mobile-nav-wrapper` container
- Hamburger button has 3 `<span>` elements for animated bars
- Mobile menu includes header with title and close button
- Each mobile tab calls `closeMobileMenu()` after `switchTab()`
- Added emoji icons to mobile tabs for better visual hierarchy

---

#### Step 3.2: Add CSS Styles (8 min)

**Location:** Add after existing `@media (max-width: 479px)` styles

**Mobile-specific CSS:**

```css
@media (max-width: 479px) {
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
}

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

#### Step 3.3: Add JavaScript Functions (4 min)

**Location:** Add after line 3029 (after existing `switchTab()` function)

**JavaScript additions:**

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

**Function Explanations:**

1. **`toggleMobileMenu()`**
   - Opens/closes menu
   - Animates hamburger icon (bars → X)
   - Prevents page scroll when menu open

2. **`closeMobileMenu()`**
   - Closes menu
   - Restores hamburger icon
   - Re-enables page scroll

3. **Click-away handler**
   - Detects clicks outside menu
   - Closes menu when clicking backdrop

4. **Escape key handler**
   - Accessibility: close menu with Esc key

5. **Updated `switchTab()`**
   - Syncs active state between desktop and mobile tabs
   - Ensures active tab highlighted in both navs

---

## Implementation Checklist

### Pre-Implementation
- [ ] Backup current `live.html` (or commit current state)
- [ ] Open `live.html` in editor
- [ ] Have DevTools open at 375px width for testing

### Part 1: Chart Overflow Fix
- [ ] Locate `@media (max-width: 479px)` block (line ~863)
- [ ] Add `.card { overflow: hidden; max-width: 100vw; }`
- [ ] Add `.chart-wrap { max-width: 100%; overflow: hidden; }`
- [ ] Add `.chart-grid { grid-template-columns: 1fr !important; }`
- [ ] Save file
- [ ] Test: Resize to 375px, navigate to OVERVIEW, verify no chart overflow

### Part 2: Analytics Version Stack
- [ ] In same `@media (max-width: 479px)` block
- [ ] Add `.api-status-bar { flex-direction: column; align-items: flex-start; gap: 8px; }`
- [ ] Add `select { width: 100%; font-size: 0.72rem; }`
- [ ] Save file
- [ ] Test: Verify label above dropdown, dropdown full-width

### Part 3: Hamburger Menu
- [ ] **HTML:** Locate lines 974-982 (current tabs)
- [ ] Add class `desktop-nav` to existing `<nav class="nav-tabs">`
- [ ] Add mobile nav wrapper HTML after desktop tabs
- [ ] **CSS:** Add all hamburger menu styles to `@media (max-width: 479px)` block
- [ ] Add desktop styles `@media (min-width: 480px)` to hide mobile nav
- [ ] **JavaScript:** Add 5 functions after line 3029
- [ ] Save file
- [ ] Test: Hamburger button visible at <479px, desktop tabs hidden
- [ ] Test: Click hamburger, menu slides in from left
- [ ] Test: Click tab, switches page and closes menu
- [ ] Test: Click backdrop (outside menu), closes menu
- [ ] Test: Press Escape key, closes menu
- [ ] Test: Hamburger animates to X when open

---

## Testing Protocol

### Viewport Sizes to Test
- [ ] **375px** (iPhone SE) - Primary mobile target
- [ ] **414px** (iPhone Pro Max)
- [ ] **768px** (iPad portrait) - Should show desktop tabs
- [ ] **1024px** (Desktop) - Desktop tabs visible

### Test Cases

**Test 1: Chart Overflow (OVERVIEW tab)**
- [ ] Charts fit within cards at 375px
- [ ] No horizontal scrollbar on page
- [ ] Charts scale down appropriately
- [ ] Chart legends remain readable

**Test 2: Analytics Version Stacking**
- [ ] Label above dropdown (not beside) at <479px
- [ ] Dropdown full-width
- [ ] Adequate spacing between elements

**Test 3: Hamburger Menu - Basic Interaction**
- [ ] Hamburger button visible at <479px
- [ ] Desktop tabs hidden at <479px
- [ ] Desktop tabs visible at ≥480px
- [ ] Click hamburger → menu slides in smoothly
- [ ] Menu animates from left edge
- [ ] Backdrop darkens page

**Test 4: Hamburger Menu - Navigation**
- [ ] Click "Overview" → switches to Overview page
- [ ] Click "Funnel" → switches to Funnel page
- [ ] Menu closes automatically after tab selection
- [ ] Active tab highlighted in menu (cyan border, glow)
- [ ] Active state syncs between desktop/mobile navs

**Test 5: Hamburger Menu - Close Behaviors**
- [ ] Click X button → menu closes
- [ ] Click backdrop → menu closes
- [ ] Press Escape key → menu closes
- [ ] Hamburger icon animates back to bars

**Test 6: Hamburger Menu - Visual Polish**
- [ ] Hamburger bars animate to X smoothly
- [ ] Menu slides in/out without jank
- [ ] Backdrop fade-in/out smooth
- [ ] Active tab has visual feedback (border, glow)
- [ ] Hover states work on mobile tabs

**Test 7: Cross-Device**
- [ ] Resize from desktop (>480px) to mobile (<479px) → hamburger appears
- [ ] Resize from mobile to desktop → desktop tabs reappear
- [ ] Active tab state persists across resize

---

## Success Criteria

### Part 1: Chart Overflow
- ✅ All OVERVIEW tab charts fit within viewport at 375px
- ✅ No horizontal scrollbar appears
- ✅ Charts scale down while maintaining readability
- ✅ Single-column layout on mobile

### Part 2: Analytics Version
- ✅ Label stacked above dropdown at <479px
- ✅ Dropdown uses full available width
- ✅ Clean vertical spacing

### Part 3: Hamburger Menu
- ✅ Desktop tabs visible ≥480px
- ✅ Hamburger button visible <479px
- ✅ Menu slides in from left smoothly
- ✅ Menu closes on tab selection
- ✅ Menu closes on backdrop click
- ✅ Menu closes on Escape key
- ✅ Hamburger icon animates (bars ↔ X)
- ✅ Active tab highlighted correctly
- ✅ No page scroll when menu open
- ✅ Professional mobile UX

---

## Rollback Plan

If issues occur:

**Chart Overflow Fix:**
```css
/* Remove these lines from @media (max-width: 479px): */
.card { overflow: hidden; max-width: 100vw; }
.chart-wrap { max-width: 100%; overflow: hidden; }
.chart-grid { grid-template-columns: 1fr !important; }
```

**Analytics Version Stack:**
```css
/* Remove these lines: */
.api-status-bar { flex-direction: column; ... }
select { width: 100%; ... }
```

**Hamburger Menu:**
1. Remove `.desktop-nav` class from tabs
2. Delete mobile nav wrapper HTML
3. Delete all hamburger CSS (lines added to `@media (max-width: 479px)`)
4. Delete all hamburger JavaScript functions
5. Revert `switchTab()` function to original

**Git Rollback:**
```bash
git checkout live.html  # Discard all changes
```

---

## Time Breakdown

| Part | Task | Estimate |
|------|------|----------|
| 1 | Chart overflow CSS | 5 min |
| 2 | Analytics Version stack CSS | 3 min |
| 3.1 | Hamburger HTML update | 5 min |
| 3.2 | Hamburger CSS styles | 8 min |
| 3.3 | Hamburger JavaScript | 4 min |
| **Total** | **Implementation** | **25 min** |
| | Testing (all parts) | 10 min |
| **Grand Total** | | **35 min** |

---

## Files Modified

**Primary:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/live.html`

**Sections:**
- HTML tabs: Lines 974-982 (update + add mobile nav)
- CSS mobile: Lines 863+ (add ~100 lines)
- CSS desktop: Add new `@media (min-width: 480px)` block
- JavaScript: Add after line 3029 (~50 lines)

**Total additions:** ~150 lines

---

## Related Documentation

- **Part 1 Fixes:** `/Users/keithstanigar/Documents/Projects/non-x_analytics/docs/Responsive_Design_Fix_Plan.md`
- **Haiku Research:** Conversation June 9, 2026 (hamburger menu analysis)
- **HANDOFF_SUMMARY.md:** Phase 6A Task 5 responsive testing section

---

**Status:** Ready for implementation
**Approval:** Pending user confirmation
**Next:** Execute Parts 1-3 sequentially, test at each step