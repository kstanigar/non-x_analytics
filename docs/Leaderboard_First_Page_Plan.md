# Implementation Plan: Move Leaderboard to First Visible Page

**Created:** August 14, 2026
**Status:** ✅ COMPLETE — August 14, 2026

---

## Goal

Leaderboard becomes the first page visitors see on load. All other tabs (Funnel, Boss Analysis, AI Agent, A/B Tests, Platform, Case Study, Data Dict) remain in their current relative order, shifted after Leaderboard. Overview moves from position 1 to position 2.

**Standard applied:** W3C WAI-ARIA Authoring Practices Guide (APG), Tabs Pattern — tabpanel DOM order must match tablist order, so keyboard navigation and screen readers encounter panels in the same sequence they're visually/functionally presented. This rules out a shortcut of only re-flagging which tab is "active" while leaving Leaderboard's markup buried later in the file — decided in this session (Aug 14, 2026).

**Leaderboard cap:** Already implemented — `fetchLeaderboard()` (`live.html:5033`) uses Firestore `.limit(50)`. No query/render change needed; this plan is DOM/nav reorder only.

---

## Files to Modify

- `live.html` — 3 physical block moves + `active` class swap (single file, no JS logic changes)

---

## Task Breakdown

1. Move desktop nav tab (1 line) to front of desktop tablist, swap `active` class → Overview (2 min)
2. Move mobile nav tab (1 line) to front of mobile tablist, swap `active` class → Overview (2 min)
3. Move `page-leaderboard` content block (lines 2165–2196, 32 lines incl. comment header) to sit immediately after `page-overview`'s closing tag, swap `active` class → Overview (5 min)
4. Update section-comment banners (`PAGE 5B: LEADERBOARD` / `PAGE 5: PLATFORM` numbering) to reflect new order — cosmetic only, low priority (2 min)
5. Confirm `fetchLeaderboard()` call (line 4989) still fires on load regardless of DOM position — it's independent of tab order already, no change expected (1 min verify)
6. Manual smoke test in browser (5 min)

**Total estimate:** ~15–20 min

---

## Code Changes

### Change 1 — Desktop nav (`live.html:1721–1729`)

**Before:**
```html
<div class="tab active" onclick="switchTab('overview')">Overview</div>
<div class="tab" onclick="switchTab('funnel')">Funnel</div>
<div class="tab" onclick="switchTab('bosses')">Boss Analysis</div>
<div class="tab" onclick="switchTab('ai')">AI Agent</div>
<div class="tab" onclick="switchTab('ab')">A/B Tests</div>
<div class="tab" onclick="switchTab('platform')">Platform</div>
<div class="tab" onclick="switchTab('leaderboard')">Leaderboard</div>
<div class="tab" onclick="switchTab('case-study')">Case Study</div>
<div class="tab" onclick="switchTab('data-dict')">Data Dict</div>
```

**After:**
```html
<div class="tab active" onclick="switchTab('leaderboard')">Leaderboard</div>
<div class="tab" onclick="switchTab('overview')">Overview</div>
<div class="tab" onclick="switchTab('funnel')">Funnel</div>
<div class="tab" onclick="switchTab('bosses')">Boss Analysis</div>
<div class="tab" onclick="switchTab('ai')">AI Agent</div>
<div class="tab" onclick="switchTab('ab')">A/B Tests</div>
<div class="tab" onclick="switchTab('platform')">Platform</div>
<div class="tab" onclick="switchTab('case-study')">Case Study</div>
<div class="tab" onclick="switchTab('data-dict')">Data Dict</div>
```

### Change 2 — Mobile nav (`live.html:1746–1754`)

Same reorder, mobile labels/emoji preserved:
```html
<div class="tab active" onclick="switchTab('leaderboard'); closeMobileMenu()">🏆 Leaderboard</div>
<div class="tab" onclick="switchTab('overview'); closeMobileMenu()">📊 Overview</div>
<div class="tab" onclick="switchTab('funnel'); closeMobileMenu()">📈 Funnel</div>
<div class="tab" onclick="switchTab('bosses'); closeMobileMenu()">⚔️ Boss Analysis</div>
<div class="tab" onclick="switchTab('ai'); closeMobileMenu()">🤖 AI Agent</div>
<div class="tab" onclick="switchTab('ab'); closeMobileMenu()">🧪 A/B Tests</div>
<div class="tab" onclick="switchTab('platform'); closeMobileMenu()">📱 Platform</div>
<div class="tab" onclick="switchTab('case-study'); closeMobileMenu()">📋 Case Study</div>
<div class="tab" onclick="switchTab('data-dict'); closeMobileMenu()">📖 Data Dict</div>
```

### Change 3 — Page content block move

**Current order (content divs):**
```
page-overview (1761–1871, active)
page-funnel (1876–…)
page-bosses
page-ai
page-ab
page-leaderboard (2168–2196)
page-platform (2201–…)
page-case-study
page-data-dict
```

**Target order:**
```
page-leaderboard (moved here, active)
page-overview (active removed)
page-funnel
page-bosses
page-ai
page-ab
page-platform
page-case-study
page-data-dict
```

**Mechanics:** Cut the block at `live.html:2165–2196` (comment header `PAGE 5B: LEADERBOARD` + `<div class="page" id="page-leaderboard">…</div>`) and paste it immediately before the current `page-overview` opening tag (line 1761). Add `active` to `page-leaderboard`'s class list; remove `active` from `page-overview`'s.

Comment banner renumbering (cosmetic, Task 4):
- `PAGE 5B: LEADERBOARD` → `PAGE 1: LEADERBOARD`
- `PAGE 1: OVERVIEW` (if a banner exists above it — verify) → `PAGE 2: OVERVIEW`
- Remaining banners shift down by one position in the comment text only (no functional effect)

---

## Possible Errors

| Error | Cause | Solution |
|---|---|---|
| Leaderboard tab shows but content area blank on load | `active` class not added to `page-leaderboard`, or left on `page-overview` too (two panels visible) | Verify exactly one `.page` and one `.tab` (per nav) carry `active` after edit |
| Mobile hamburger label shows wrong initial tab name | `tabNames` map in `switchTab()` (`live.html:6071–6081`) is keyed by tab name, not position — unaffected by reorder, but confirm initial label text (outside `switchTab()`, likely hardcoded near hamburger markup) matches Leaderboard | Grep for hardcoded initial `active-tab-name` text and update if present |
| Back-link `⊞` deep-links (from Data Dictionary / Case Study) jump to wrong visual position | These call `switchTab(tab)` by name (`live.html:6299`, `6328`, `6409`), not by index — unaffected by DOM reorder | No action expected; verify one back-link click during smoke test |
| Leaderboard data flashes "Loading..." before Overview used to — now visible immediately on first paint | Expected/intended by this change — `fetchLeaderboard()` is async and already independent of the Lambda wave (line 4989) | Not an error; confirm it resolves within normal load time during test |

---

## Testing

- [ ] Page loads with Leaderboard tab active and visible by default (desktop)
- [ ] Page loads with Leaderboard tab active and visible by default (mobile / hamburger menu)
- [ ] Overview, Funnel, Bosses, AI, A/B, Platform, Case Study, Data Dict all still reachable and in original relative order
- [ ] Leaderboard table populates with top 50 entries (no more, no fewer)
- [ ] Clicking each tab in both desktop and mobile nav activates the correct corresponding tab in the other nav (existing `switchTab` cross-sync logic, `live.html:6057–6066`)
- [ ] Back-link `⊞` deep-links from Data Dictionary and Case Study still land on the correct tab
- [ ] No console errors on load
- [ ] Keyboard navigation (Tab key) through nav reaches Leaderboard first, matching visual/DOM order (accessibility check per APG standard cited above)

---

**User Approval Required Before Implementation**
