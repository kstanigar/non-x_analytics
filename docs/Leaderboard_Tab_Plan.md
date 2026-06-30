# Leaderboard Tab Plan — UX-8

**Purpose:** Implementation plan for adding a Leaderboard tab to the NON-X Analytics dashboard, displaying the live top-25 all-time scores from the game's Firebase Firestore leaderboard.

**Created:** June 30, 2026 (Session 21)
**Status:** 🔨 IN PROGRESS — CSP updated (edit 1 of 9 complete)
**Updated:** June 30, 2026 — limit raised to 50; 2-column full-screen layout (no card/overflow wrapper)
**Priority:** P2 (backlog)

---

## Research Findings (Haiku Agent — June 30, 2026)

### Data Source

The leaderboard is **not** part of the Lambda / GA4 / BigQuery pipeline. It is a standalone **Firebase Firestore** collection.

| Field | Firebase Detail |
|-------|----------------|
| Project ID | `nonx---game` |
| Collection | `leaderboard` |
| SDK Version | 10.8.0 |
| Auth | API key (public; same key used in game.html) |
| App Check | reCAPTCHA v3 (`6LdsiR4tAAAAACW1fmCReUAQPTyiuuJX4O8ZicWh`) |

### Firestore Document Schema (per leaderboard entry)

| Field | Type | Description |
|-------|------|-------------|
| `score` | number | Final score submitted |
| `instagram` | string | Player handle or `'Anonymous'` |
| `platform` | string | `'desktop'` or `'mobile'` |
| `movement_group` | string | `'A'` (horizontal) or `'B'` (full direction) |
| `player_id` | string | UUID per device (localStorage) |
| `date` | Firestore Timestamp | Server timestamp — accurate sort key |

### How Scores Are Submitted

- Submit button on game-over / victory screen fires `firebaseSubmitScore(scoreData)`
- Logic: if `player_id` exists and new score > old score → `updateDoc()`; else → `addDoc()`; lower scores ignored
- One entry per `player_id` (each player's personal best only)
- GA4 event `leaderboard_submit` fires on click (regardless of Firebase result)

### How Scores Are Retrieved In-Game

```javascript
window.firebaseGetTopScores(limitCount)
// Query: orderBy("score", "desc"), limit(10 or 25)
// Returns: array of leaderboard objects
```

- Top 10: shown in main menu dropdown + game screens
- Top 25: shown in "Full Leaderboard" modal

---

## Architecture Decision

### Option A: Direct Firestore from Dashboard Client (Recommended)

Add Firebase SDK to `live.html` and query Firestore directly — same pattern used by the game itself.

**Pros:**
- No new Lambda handler needed
- Firebase SDK handles auth; same API key already public in game.html
- Real-time capable (optional)
- Simple implementation (~50 lines of JS)

**Cons:**
- Adds Firebase SDK (~50KB, 3 `<script>` tags) to `live.html`
- App Check may block requests from `kstanigar.github.io` domain (see Risks below)

### Option B: Lambda Proxy (Not Recommended)

New Lambda handler that uses Firebase Admin SDK to read Firestore, returning JSON to the dashboard.

**Pros:** Consistent with existing all-data-via-Lambda pattern

**Cons:**
- Requires `firebase-admin` package in Lambda (~15MB)
- New handler + deploy cycle
- No advantage over Option A for a public read-only collection

**Decision: Option A (direct Firestore)**

---

## Risks & Unknowns

| Risk | Severity | Mitigation |
|------|----------|-----------|
| **App Check blocking `github.io` domain** | HIGH | Check Firestore security rules — if collection is publicly readable (no auth required), App Check may not apply to reads. If blocked, register `kstanigar.github.io` with Firebase App Check or switch to Option B. |
| **Firestore security rules unknown** | MEDIUM | Need to check Firebase console → Firestore → Rules tab before implementing. If rules require auth, Option B required. |
| **`player_id` not useful to dashboard** | LOW | Display `instagram` + `platform` + `movement_group` + `date` only; omit `player_id` |
| **`instagram` field may contain user-entered strings** | MEDIUM | Must sanitize via `escHtml()` before `innerHTML` insertion (consistent with H-3 XSS fix) |

---

## Display Design

### Tab: "LEADERBOARD"

Positioned after "A/B TESTS" in the nav: `OVERVIEW · FUNNEL · BOSS ANALYSIS · AI AGENT · A/B TESTS · **LEADERBOARD** · PLATFORM · CASE STUDY · DATA DICT`

### Layout

```
LEADERBOARD — ALL-TIME TOP 50 — PERSONAL BESTS
[KPI row: Total Entries | Top Score | Desktop Players | Full Direction %]

LEFT COLUMN (Ranks 1–25)         RIGHT COLUMN (Ranks 26–50)
#  PLAYER    SCORE  PLAT  MOVE  DATE    #  PLAYER    SCORE  PLAT  MOVE  DATE
─────────────────────────────────────   ─────────────────────────────────────
1  Handle    42,500 Desk  Full  Jun 28  26 Handle    18,400 Mob   Horiz Jun 20
2  Anon      38,200 Mob   Horiz Jun 25  27 ...
...
```

**Layout:** Full-width 2-column CSS grid (`1fr 1fr`), no card wrapper, no overflow-x scroll. Left table: ranks 1–25. Right table: ranks 26–50.

**Fields to display:** Rank (derived from array index), Player (instagram), Score (formatted with commas), Platform, Movement Group (Full Direction / Horizontal), Date (formatted)

**Omit:** `player_id` (internal UUID, no value to analytics viewer)

### KPI Summary Row (above table)

- **Total Entries:** count of leaderboard docs
- **Top Score:** entries[0].score
- **Platform Split:** desktop vs mobile % of top 50
- **Movement Split:** Group A vs Group B % of top 50

---

## Implementation Steps (Exact Line Numbers)

All changes are in `live.html` only. `api/index.js` unchanged.

---

### Edit 1 — CSP update ✅ COMPLETE (`live.html:19,23`)

**script-src:** added `https://www.gstatic.com` (Firebase SDK origin)
**connect-src:** added `https://firestore.googleapis.com` (Firestore API endpoint)

---

### Edit 2 — Firebase compat SDK script tags (`live.html:33`, after Chart.js)

**Add after Chart.js `<script>` tag:**
```html
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>
```

Using compat (v8-style) SDK — loads `firebase` as a global, works with existing inline JS, no ES module complexity.

---

### Edit 3 — Firebase init in main JS (after `let isRefreshing` at `live.html:3032`)

**Add:**
```javascript
// Firebase — leaderboard (Firestore direct read, separate from Lambda pipeline)
const _fbApp = firebase.initializeApp({
  apiKey: "AIzaSyDumeBRk__-lcKFJA2WLD7Wi-0y6OuFZlo",
  authDomain: "nonx---game.firebaseapp.com",
  projectId: "nonx---game",
  storageBucket: "nonx---game.firebasestorage.app",
  messagingSenderId: "404220834268",
  appId: "1:404220834268:web:6cb71367bf62569ad5df19"
});
const _db = firebase.firestore();
```

---

### Edit 4 — Desktop nav tab (`live.html:1725`, between Platform and Case Study)

**Move Leaderboard tab (currently line 1724, before Platform) to after Platform (line 1725).**

**Target order:**
```html
<div class="tab" onclick="switchTab('platform')">Platform</div>
<div class="tab" onclick="switchTab('leaderboard')">Leaderboard</div>
<div class="tab" onclick="switchTab('case-study')">Case Study</div>
```

---

### Edit 5 — Mobile nav tab (`live.html:1750`, same position)

**Move Leaderboard tab (currently line 1749, before Platform) to after Platform (line 1750).**

**Target order:**
```html
<div class="tab" onclick="switchTab('platform'); closeMobileMenu()">📱 Platform</div>
<div class="tab" onclick="switchTab('leaderboard'); closeMobileMenu()">🏆 Leaderboard</div>
<div class="tab" onclick="switchTab('case-study'); closeMobileMenu()">📋 Case Study</div>
```

---

### Edit 6 — DATA object (`live.html:3035`)

**Add `leaderboard: []` field to DATA object:**
```javascript
const DATA = {
  leaderboard: [],   // ← ADD THIS
  kpis: { ...
```

---

### Edit 7 — Page section HTML (`live.html:2157`, between page-ab and page-platform)

**Add new page section between `</div>` (end of page-ab at line 2157) and the PLATFORM comment (line 2159):**

```html
<!-- ════════════════════════════════════════
   PAGE 5B: LEADERBOARD
═══════════════════════════════════════════ -->
<div class="page" id="page-leaderboard">

  <div class="section-label">All-Time Top 50 — Personal Bests</div>
  <div class="kpi-grid" id="leaderboard-kpis">
    <div class="kpi"><div class="kpi-label">Total Entries</div><div class="kpi-value" id="lb-total">—</div></div>
    <div class="kpi"><div class="kpi-label">Top Score</div><div class="kpi-value" id="lb-top">—</div></div>
    <div class="kpi"><div class="kpi-label">Desktop Players</div><div class="kpi-value" id="lb-desktop">—</div></div>
    <div class="kpi"><div class="kpi-label">Full Direction %</div><div class="kpi-value" id="lb-movement">—</div></div>
  </div>

  <div style="display:grid; grid-template-columns:1fr 1fr; gap:0 32px; margin-top:16px">
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
      <tbody id="leaderboard-tbody-left">
        <tr><td colspan="6" style="padding:24px; text-align:center; opacity:0.5">Loading leaderboard...</td></tr>
      </tbody>
    </table>
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
  </div>

</div>
```

---

### Edit 8 — `fetchLeaderboard()` + `buildLeaderboardTable()` functions (add to JS section near other fetch functions)

```javascript
// ── LEADERBOARD (Firebase Firestore) ──────────────────────────────────────
async function fetchLeaderboard() {
  try {
    const snap = await _db.collection('leaderboard').orderBy('score', 'desc').limit(50).get();
    DATA.leaderboard = snap.docs.map(d => d.data());
  } catch (e) {
    console.warn('Leaderboard fetch failed:', e);
    DATA.leaderboard = [];
  }
  buildLeaderboardTable();
}

function buildLeaderboardTable() {
  const entries = DATA.leaderboard;
  const tbodyLeft = document.getElementById('leaderboard-tbody-left');
  const tbodyRight = document.getElementById('leaderboard-tbody-right');
  if (!tbodyLeft || !tbodyRight) return;

  if (!entries.length) {
    tbodyLeft.innerHTML = '<tr><td colspan="6" style="padding:24px;text-align:center;opacity:0.5">No leaderboard data available.</td></tr>';
    tbodyRight.innerHTML = '';
    return;
  }

  // KPI summary
  const total = entries.length;
  document.getElementById('lb-total').textContent = total;
  document.getElementById('lb-top').textContent = entries[0].score.toLocaleString();
  document.getElementById('lb-desktop').textContent = Math.round(entries.filter(e => e.platform === 'desktop').length / total * 100) + '%';
  document.getElementById('lb-movement').textContent = Math.round(entries.filter(e => e.movement_group === 'B').length / total * 100) + '%';

  function renderRows(slice, startRank) {
    return slice.map((e, i) => {
      const rank = startRank + i;
      const player = escHtml(e.instagram || 'Anonymous');
      const score = (e.score || 0).toLocaleString();
      const platform = e.platform === 'desktop' ? 'Desktop' : 'Mobile';
      const movement = e.movement_group === 'B' ? 'Full Dir' : 'Horizontal';
      const date = e.date ? e.date.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
      const rowStyle = rank <= 3 ? 'color:var(--cyan)' : '';
      return `<tr style="border-bottom:1px solid rgba(255,255,255,0.05); ${rowStyle}">
        <td style="padding:7px 12px; opacity:0.6">${rank}</td>
        <td style="padding:7px 12px; font-weight:${rank <= 3 ? 'bold' : 'normal'}">${player}</td>
        <td style="padding:7px 12px; text-align:right">${score}</td>
        <td style="padding:7px 12px; opacity:0.7">${platform}</td>
        <td style="padding:7px 12px; opacity:0.7">${movement}</td>
        <td style="padding:7px 12px; opacity:0.5">${date}</td>
      </tr>`;
    }).join('');
  }

  tbodyLeft.innerHTML = renderRows(entries.slice(0, 25), 1);
  tbodyRight.innerHTML = renderRows(entries.slice(25), 26);
}
```

---

### Edit 9 — Call `fetchLeaderboard()` in `loadAllData()` (`live.html:4938`, before `reinitAllCharts()`)

**Add one line (no await — fires independently of Lambda waves):**
```javascript
fetchLeaderboard(); // Firebase Firestore — independent of Lambda concurrency limit
// Re-render all charts
reinitAllCharts();
```

---

### Edit 10 — `switchTab` tabNames map (`live.html:5967`)

**Add `'leaderboard'` entry:**
```javascript
const tabNames = {
  'overview': 'OVERVIEW',
  'funnel': 'FUNNEL',
  'bosses': 'BOSS ANALYSIS',
  'ai': 'AI AGENT',
  'ab': 'A/B TESTS',
  'leaderboard': 'LEADERBOARD',   // ← ADD THIS
  'platform': 'PLATFORM',
  'case-study': 'CASE STUDY',
  'data-dict': 'DATA DICTIONARY'
};
```

---

## Files to Modify

| File | Change |
|------|--------|
| `live.html` | Add Firebase SDK imports, tab button, tab section HTML, `fetchLeaderboard()` + `buildLeaderboardTable()` functions, CSP update |
| `api/index.js` | No changes needed (Option A) |
| `docs/PRIORITIES.md` | Mark UX-8 in progress / complete |
| `docs/AWS_Config.md` | No changes (Firebase, not AWS) |

---

## Pre-Implementation Checklist

- [ ] Verify Firestore security rules allow public reads from any domain
- [ ] Confirm App Check does not block `kstanigar.github.io` (test in browser console)
- [ ] Confirm `escHtml()` function location in live.html for reuse
- [ ] User approves design (tab position, fields displayed, KPI summary row)

---

## Dependencies

- **H-3 (XSS):** ✅ `escHtml()` already implemented — required for sanitizing `instagram` field
- **H-2 (CSP):** Must update `connect-src` to add Firebase endpoints — minor extension of existing CSP
- **UX-6 (Distinct Players):** Independent — can implement before or after
- **UX-7 (Player Performance):** Independent

---

## Open Questions for User

1. Should the Leaderboard tab be visible to all users or only accessible via a direct URL/flag? (It's a public analytics dashboard, so probably visible to all)
2. Should we show Top 10 or Top 25? (Game shows Top 25 in full modal — recommend matching that)
3. Tab position: after A/B Tests, before Platform — does that order make sense?
