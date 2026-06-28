# H-3: XSS Fix — `innerHTML` with API Data

**Created:** June 28, 2026 (Session 14)
**Status:** 📋 PLAN — Pending implementation approval
**File:** `live.html` (6346 lines)
**Severity:** HIGH (escalates to CRITICAL if API is compromised or MITM'd)

---

## Research Summary

Two Haiku agents audited `live.html` for all innerHTML uses with API-sourced data.

**Findings:**
- 30 total `innerHTML` assignments
- 22 vulnerable (variables injected without escaping)
- 8 safe (clearing via `''` or fully static strings)
- **No sanitization helper exists** — `escHtml()` must be added

**Why escHtml() over DOMPurify:**
DOMPurify is the 2026 standard for arbitrary HTML. However, all injected values here are either integers/numeric strings (counts, rates) or short game-defined strings (boss names, phase names, labels). A hand-rolled `escHtml()` is appropriate — DOMPurify would be overkill and adds a CDN dependency.

---

## Approach

| Group | Pattern | Sites | Fix strategy |
|-------|---------|-------|-------------|
| Group 1 — Sub construction | Template literals building `DATA.kpis.*Sub` / `speedLockSub` / `replaySub` HTML strings | 10 sites, ~20 variable wraps | `escHtml()` on all interpolated variables at **construction time**. The `innerHTML` assignment lines (5033–5066, 5750) are untouched — sanitization happens upstream. |
| Group 2 — HTML builders | `tbody.innerHTML +=`, `div.innerHTML =`, `container.innerHTML +=` with string variables | 9 sites, ~15 variable wraps | `escHtml()` on string variables inline. Numeric outputs (`.toFixed()`, `.toLocaleString()`, `parseInt` results) are left unwrapped — they cannot contain markup. |

---

## Task 1: Add `escHtml()` Utility Function

**Location:** Immediately before `function mapGA4ResponseToDATA` (line 3180) — first function that needs it.

**Insert before line 3180:**
```javascript
function escHtml(str) {
  return String(str).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])
  );
}
```

---

## Task 2: Group 1 — Fix Sub Construction Sites

All interpolated values are integers/counts. `escHtml()` is defense-in-depth here.

### 2a — Inside `mapGA4ResponseToDATA` (lines 3708, 3782, 3978, 3980, 3982)

**Line 3708 — speedLockSub:**
```javascript
// Before:
speedLockSub: `<span style="color:var(--green)">${speedLockCount}&nbsp;locked</span> / <span style="color:#FFD700">${totalAdjustments}&nbsp;adjustments</span>`,

// After:
speedLockSub: `<span style="color:var(--green)">${escHtml(speedLockCount)}&nbsp;locked</span> / <span style="color:#FFD700">${escHtml(totalAdjustments)}&nbsp;adjustments</span>`,
```

**Line 3782 — replaySub:**
```javascript
// Before:
replaySub: `<span style="color:var(--green)">${replayAll}&nbsp;replay starts</span> / <span style="color:#FFD700">${totalAll}&nbsp;total starts</span>`,

// After:
replaySub: `<span style="color:var(--green)">${escHtml(replayAll)}&nbsp;replay starts</span> / <span style="color:#FFD700">${escHtml(totalAll)}&nbsp;total starts</span>`,
```

**Line 3978 — winSub:**
```javascript
// Before:
winSub: `<span style="color:var(--green)">${playerWon}&nbsp;wins</span> / <span style="color:#FFD700">${gameStarts}&nbsp;starts</span>`,

// After:
winSub: `<span style="color:var(--green)">${escHtml(playerWon)}&nbsp;wins</span> / <span style="color:#FFD700">${escHtml(gameStarts)}&nbsp;starts</span>`,
```

**Line 3980 — deathSub:**
```javascript
// Before:
deathSub: `<span style="color:var(--green)">${playerDeath}&nbsp;deaths</span> / <span style="color:#FFD700">${completedGames}&nbsp;completed</span>`,

// After:
deathSub: `<span style="color:var(--green)">${escHtml(playerDeath)}&nbsp;deaths</span> / <span style="color:#FFD700">${escHtml(completedGames)}&nbsp;completed</span>`,
```

**Line 3982 — lbRateSub:**
```javascript
// Before:
lbRateSub: `<span style="color:var(--green)">${leaderboardSubmit}&nbsp;submits</span> / <span style="color:#FFD700">${playerWon}&nbsp;wins</span>`,

// After:
lbRateSub: `<span style="color:var(--green)">${escHtml(leaderboardSubmit)}&nbsp;submits</span> / <span style="color:#FFD700">${escHtml(playerWon)}&nbsp;wins</span>`,
```

### 2b — Inside main fetch handler (lines 4695, 4697, 4780, 4891–4902)

**Line 4695 — deskWinSub:**
```javascript
// Before:
DATA.kpis.deskWinSub = `<span style="color:var(--green)">${pd.desktop.playerWon}&nbsp;wins</span> / <span style="color:#FFD700">${pd.desktop.gameStarts}&nbsp;starts</span>`;

// After:
DATA.kpis.deskWinSub = `<span style="color:var(--green)">${escHtml(pd.desktop.playerWon)}&nbsp;wins</span> / <span style="color:#FFD700">${escHtml(pd.desktop.gameStarts)}&nbsp;starts</span>`;
```

**Line 4697 — mobWinSub:** Same pattern — `pd.mobile.playerWon`, `pd.mobile.gameStarts`

**Line 4780 — newPctSub:**
```javascript
// Before:
DATA.kpis.newPctSub = `<span style="color:#FFD700">${nuData.newCount}&nbsp;new</span> / <span style="color:var(--green)">${nuData.returningCount}&nbsp;returning</span>`;

// After:
DATA.kpis.newPctSub = `<span style="color:#FFD700">${escHtml(nuData.newCount)}&nbsp;new</span> / <span style="color:var(--green)">${escHtml(nuData.returningCount)}&nbsp;returning</span>`;
```

**Lines 4891–4894 — scorecardSub, musicSub, leaveSub, surveySub:**
Each follows same pattern — wrap `counts.*` and `gameStarts` in each of the 4 lines.

Example (line 4891):
```javascript
// Before:
DATA.kpis.scorecardSub  = `<span style="color:var(--green)">${counts.scorecard_viewed}&nbsp;viewed</span> / <span style="color:#FFD700">${gameStarts}&nbsp;starts</span>`;

// After:
DATA.kpis.scorecardSub  = `<span style="color:var(--green)">${escHtml(counts.scorecard_viewed)}&nbsp;viewed</span> / <span style="color:#FFD700">${escHtml(gameStarts)}&nbsp;starts</span>`;
```
Apply same wrap to lines 4892, 4893, 4894.

**Lines 4900–4902 — bossReachSub:**
```javascript
// Before:
? `<span style="color:var(--green)">${bossAttempts}&nbsp;attempts</span> / <span style="color:#FFD700">${gameStarts}&nbsp;starts</span>`

// After:
? `<span style="color:var(--green)">${escHtml(bossAttempts)}&nbsp;attempts</span> / <span style="color:#FFD700">${escHtml(gameStarts)}&nbsp;starts</span>`
```

---

## Task 3: Group 2 — Fix HTML Builder Sites

### 3a — Funnel chart (line 5185): wrap `s.name`
```javascript
// Before:
<span class="funnel-name">${s.name}</span>

// After:
<span class="funnel-name">${escHtml(s.name)}</span>
```
Safe (leave unwrapped): `w` (toFixed number), `color` (hardcoded CSS var), `s.pct` (number), `s.dropPct` (number)

### 3b — Funnel table (line 5229): wrap `r.from`, `r.to`
```javascript
// Before:
<td>${r.from} → ${r.to}</td>

// After:
<td>${escHtml(r.from)} → ${escHtml(r.to)}</td>
```
Safe (leave): `r.overall`, `r.on`, `r.off`, `r.delta` — all computed rate strings ('45%', '+2pp', '—')

### 3c — Boss cards (line 5371): wrap `b.name`, `b.phase`, `b.color`
```javascript
// Before:
<div class="boss-name">${b.name} &nbsp;<span class="pill ${phaseClass}">${b.phase}</span></div>
...stroke="${b.color}"...
...style="filter:drop-shadow(0 0 6px ${b.color})"...
...style="color:${b.color}"...

// After:
<div class="boss-name">${escHtml(b.name)} &nbsp;<span class="pill ${phaseClass}">${escHtml(b.phase)}</span></div>
...stroke="${escHtml(b.color)}"...
...style="filter:drop-shadow(0 0 6px ${escHtml(b.color)})"...
...style="color:${escHtml(b.color)}"...
```
Safe (leave): `r`, `fill`, `circ` (numbers), `phaseClass` (hardcoded ternary), `b.defeat_rate` (number), `b.attempts.toLocaleString()`, `b.threshold`

### 3d — Boss table (line 5511): wrap `b.name`, `b.phase`, `b.color`, `assessments[i]`
```javascript
// Before:
<td style="color:${b.color};font-weight:600">${b.name}</td>
<td><span class="pill ${phaseClass}">${b.phase}</span></td>
...
<td style="font-size:0.7rem;color:rgba(200,232,255,0.6)">${assessments[i]}</td>

// After:
<td style="color:${escHtml(b.color)};font-weight:600">${escHtml(b.name)}</td>
<td><span class="pill ${phaseClass}">${escHtml(b.phase)}</span></td>
...
<td style="font-size:0.7rem;color:rgba(200,232,255,0.6)">${escHtml(assessments[i])}</td>
```
Safe (leave): `b.threshold`, `b.attempts.toLocaleString()`, `b.defeat_rate`, `b.avg_attempts`

### 3e — A/B music cards: rows builder (line 5539–5546) and card (line 5548–5556)

**Rows builder (line 5544): wrap `m.label`, `d[m.k]`**
```javascript
// Before:
<span class="ab-metric-name">${m.label}</span>
<span class="ab-metric-val ${isThisWinner ? 'better' : 'worse'}">${d[m.k]}</span>

// After:
<span class="ab-metric-name">${escHtml(m.label)}</span>
<span class="ab-metric-val ${isThisWinner ? 'better' : 'worse'}">${escHtml(d[m.k])}</span>
```

**Card (line 5551): wrap `d.label`**
```javascript
// Before:
<span class="ab-group-badge ${grp.toLowerCase()}">Group ${grp} — ${d.label}</span>

// After:
<span class="ab-group-badge ${grp.toLowerCase()}">Group ${grp} — ${escHtml(d.label)}</span>
```
Safe (leave): `grp.toLowerCase()` ('a'/'b'), `isWinner ? 'winner' : 'loser'` (hardcoded), `d.sessions.toLocaleString()`, `rows` (already sanitized at construction)

### 3f — Movement A/B cards: rows builder (line 5570–5575) and card (line 5577–5585)

**Rows builder (line 5573): wrap `m.label`, `d[m.k]`** — same pattern as 3e

**Card (line 5580): wrap `d.label`**
```javascript
// Before:
<span class="ab-group-badge ${grp.toLowerCase()}">Movement ${grp} — ${d.label}</span>

// After:
<span class="ab-group-badge ${grp.toLowerCase()}">Movement ${grp} — ${escHtml(d.label)}</span>
```

### 3g — A/B significance table (line 5597)
All values here are either `.toLocaleString()` numerics or `mSig.text`/`mvSig.text` which are built from hardcoded template strings with numeric `n`. **No wrapping needed** — all values are safe by construction.

### 3h — Platform comparison table (line 5734): wrap `m.label`
```javascript
// Before:
<td>${m.label}</td>

// After:
<td>${escHtml(m.label)}</td>
```
Safe (leave): `winnerPill` (hardcoded ternary with CSS class names), `winnerColor` (GRN/YEL constant), `winnerText` ('Desktop leads'/'Mobile leads'/'Even performance'), `deltaDisplay` (numeric string)

### 3i — AI metrics table (line 5913): wrap `m.name`, `m.tier`
These values come from BigQuery. Exact variables to confirm during implementation by reading lines 5905–5930.

---

## Safe — No Changes Needed

| Lines | Why safe |
|-------|----------|
| 5179, 5227, 5341, 5464, 5535, 5566, 5700 | `innerHTML = ''` — clearing only |
| 5909 | Static string, no variables |
| 3030–3139 (mock init) | Static strings with `—` placeholder only |
| `winnerPill`, `winnerColor`, `winnerText` (5723–5731) | Pure hardcoded ternary strings |
| `grp`, `grp.toLowerCase()` | Always 'A'/'B' from iteration |
| `phaseClass` | Hardcoded ternary result |
| All `.toFixed()`, `.toLocaleString()`, `parseInt` outputs | Cannot produce markup |

---

## innerHTML Assignment Lines — No Changes

Lines 5033–5066 and 5750 (`document.getElementById(...).innerHTML = k.*Sub`) are **not changed**. Sanitization happens at construction time (Task 2). Changing these would require restructuring the entire KPI data flow.

---

## Task 4: Verification Checklist

- [ ] All 13 KPI sub-text values render correctly (wins/starts, deaths/completed, etc.)
- [ ] Funnel chart stage names visible (game_start, boss_attempt 1, etc.)
- [ ] Boss cards render with name, phase pill, defeat ring, color
- [ ] Boss table renders with name, phase pill, assessments
- [ ] A/B music cards render group labels and metric rows
- [ ] A/B movement cards render group labels and metric rows
- [ ] Platform comparison table renders with metric labels and winner pill
- [ ] AI metrics table renders tier names and stats
- [ ] No `undefined`, `[object Object]`, or empty values in UI
- [ ] No JS console errors after deploy

---

## Possible Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `escHtml is not defined` | Function placed after a call site | Move escHtml() earlier — confirm it's before line 3180 |
| KPI sub-text shows `&amp;nbsp;` literally | `escHtml()` applied to a string that already contained `&nbsp;` | Don't wrap the literal `&nbsp;` — only wrap the variable |
| Numbers show as `NaN` | `escHtml()` applied before arithmetic | Confirm wrapping is only applied after all numeric operations complete |
| AI metrics table blank | `m.name` or `m.tier` key name wrong | Read lines 5905–5930 before implementing 3i |

---

## Estimated Effort

- Task 1: 5 min (1 insertion)
- Task 2a: 10 min (5 lines in mapGA4ResponseToDATA)
- Task 2b: 15 min (10 lines in fetch handler)
- Task 3: 20 min (9 HTML builder sites)
- Task 4: 10 min (visual verification)

**Total:** ~60 min
**Deploy required:** Yes — GitHub Pages rebuild

---

## Files Changed

- `live.html` only

## Commit Plan

```
git checkout -b feature/h3-xss-fix
git add live.html
git commit -m "fix: H-3 XSS — escHtml() on all API-sourced innerHTML values"
git push origin feature/h3-xss-fix:staging
# test on staging → merge to main
```

---

**User Approval Required Before Implementation**
