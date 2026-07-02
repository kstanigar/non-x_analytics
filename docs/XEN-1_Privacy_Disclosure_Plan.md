# XEN-1 — Xenon_3 Leaderboard Privacy Disclosure Plan

**Purpose:** Plan for updating Xenon_3 terms/privacy to legally disclose that leaderboard submissions appear on the public NON-X Analytics dashboard, and adding age gate + consent UI at point of submission.

**Created:** July 2, 2026 (Session 22)
**Status:** 🟡 PLAN READY — All decisions confirmed; ready to implement
**Repos:** Xenon_3 + non-x_analytics

---

## Research Findings (Haiku Agent — July 2, 2026)

**Sources:** GDPR Article 13, OWASP Privacy by Design, CCPA Jan 2026, COPPA FTC April 2026, ICO guidance.

### Critical Finding: COPPA

**No age gate = assume all users are under 13.** FTC COPPA April 22, 2026 enforcement policy requires verifiable parental consent before any third-party disclosure for users under 13. Without an age gate, the game cannot legally collect or publicly display PII (instagram handle) for any user. **COPPA April 22, 2026 deadline has passed — this is an active compliance gap.**

### GDPR Article 13

At point of data collection, must disclose:
- Identity of data controller (Standing Tiger)
- Specific purposes — including analytics dashboard display
- Lawful basis — explicit consent required for analytics display
- Recipients — analytics platform, CDN
- Retention period

**Notice-only is non-compliant.** GDPR explicitly rejects pre-ticked boxes or passive acceptance.

### CCPA (Jan 2026) + PIPEDA

Require explicit notice that submitted data will be disclosed publicly and to third-party platforms. Must appear in Privacy Policy.

---

## User Decisions (Confirmed July 2, 2026)

| Decision | Answer |
|----------|--------|
| Age gate UI | ✅ Radio buttons |
| Existing 27 entries | ✅ Grandfather in — apply consent to new submissions only |
| Retention period | ✅ Indefinite (matches existing Xenon_3 privacy.html:166) |
| Erasure contact | ✅ Xenon_3 `/contact.html` form (FormSubmit.co) — copy to non-x_analytics |

---

## Xenon_3 Research Findings (Haiku Agent — July 2, 2026)

### Contact Form (`/contact.html`) — 243 lines

Xenon_3 already has a full dark-themed contact form using **FormSubmit.co AJAX**:
- Endpoint: `https://formsubmit.co/ajax/45e055cecae307ffc412306a96dd1ff3`
- Fields: Name, Email, Reason (dropdown), Message
- Reason dropdown already includes: `Bug Report`, `Privacy Request`, `General`
- On success: hides form, shows confirmation panel
- Already linked from Xenon_3 `terms.html:213` and `privacy.html:204`

**Decision:** Copy this form (same endpoint, same FormSubmit hash) to `non-x_analytics/contact.html` with dashboard dark theme styling. Update non-x_analytics `privacy.html:109` to link to it.

### Existing Disclosures That Need Updating

Two places in Xenon_3 currently say the analytics dashboard "does not identify individual players" — this is no longer accurate since the leaderboard tab was added:

- **`Xenon_3/terms.html:158`** — "does not identify individual players"
- **`Xenon_3/privacy.html:153`** — "does not display individual player records or identify specific users"

Both must be updated to acknowledge that leaderboard data (instagram handle, score, platform, movement group) IS displayed on the dashboard.

### Leaderboard Submit UI Locations

| File | Screen | Lines |
|------|--------|-------|
| `game.html` | Victory screen | 5998–6002 |
| `game.html` | Game over screen | 6295–6299 |
| `game_mobile.html` | Victory screen | 6625–6629 |
| `game_mobile.html` | Game over screen | 6883–6889 |

---

## Full Submission Form Flow (Approved Design)

```
┌─────────────────────────────────────────────────────┐
│  Before you submit your score:                      │
│                                                     │
│  ○ I am 13 years of age or older                   │
│  ○ I am under 13                                    │
│                                                     │
│  ─────────────────────────────────────────────────  │
│  Instagram handle (optional):  [ @           ]      │
│                                                     │
│  ☐ I understand my handle and score will be        │
│    publicly displayed on the NON-X analytics        │
│    dashboard. See Privacy Policy.                   │
│                                                     │
│  [SUBMIT SCORE]  ← disabled until 13+ selected     │
│                    + checkbox checked               │
└─────────────────────────────────────────────────────┘
```

If "under 13" selected:
```
┌─────────────────────────────────────────────────────┐
│  The leaderboard is for players aged 13 and older.  │
│  Your score has not been submitted.                 │
└─────────────────────────────────────────────────────┘
```

**Rules:**
- Age radio buttons appear first; submit form hidden until 13+ selected
- If under 13 → form hides permanently, block message shown, no retry
- Consent checkbox not pre-checked; submit disabled until checked
- Age response NOT stored in Firestore
- `public_consent: true` stored in Firestore on submit

---

## All Changes — Exact Code

---

### CHANGE 1: `Xenon_3/game.html:5998–6002` — Victory Screen

**Current code:**
```javascript
html += "<div id='leaderboardSubmit' style='margin-bottom: 20px; text-align: center;'>";
html += "<div style='font-size: 16px; margin-bottom: 8px;'>Submit to Global Leaderboard:</div>";
html += "<input type='text' id='igInput' placeholder='Instagram handle (optional)' value='" + escapeAttr(savedHandle) + "' style='padding: 8px; font-size: 14px; width: 200px; border-radius: 4px; border: none; margin-bottom: 8px; display: block; margin-left: auto; margin-right: auto;'><br>";
html += "<button onclick='submitToLeaderboard()' style='padding: 8px 16px; font-size: 14px; border-radius: 4px; border: none; background: #00FFFF; color: #000; cursor: pointer; font-weight: bold;'>Submit Score</button>";
html += "</div>";
```

**Replace with:**
```javascript
html += "<div id='leaderboardSubmit' style='margin-bottom: 20px; text-align: center;'>";
html += "<div style='font-size: 16px; margin-bottom: 12px;'>Submit to Global Leaderboard:</div>";
html += "<div style='margin-bottom: 10px; font-size: 13px; color: rgba(255,255,255,0.7); text-align: left; max-width: 260px; margin-left: auto; margin-right: auto;'>Before submitting:</div>";
html += "<label style='display: block; margin-bottom: 6px; font-size: 13px; cursor: pointer; text-align: left; max-width: 260px; margin-left: auto; margin-right: auto;'><input type='radio' name='ageGate' value='13plus' onchange='document.getElementById(\"lbForm\").style.display=\"block\"; document.getElementById(\"lbUnder13\").style.display=\"none\"'> I am 13 years of age or older</label>";
html += "<label style='display: block; margin-bottom: 12px; font-size: 13px; cursor: pointer; text-align: left; max-width: 260px; margin-left: auto; margin-right: auto;'><input type='radio' name='ageGate' value='under13' onchange='document.getElementById(\"lbForm\").style.display=\"none\"; document.getElementById(\"lbUnder13\").style.display=\"block\"'> I am under 13</label>";
html += "<div id='lbUnder13' style='display: none; font-size: 13px; color: rgba(255,255,255,0.55); max-width: 260px; margin: 0 auto 8px;'>The leaderboard is for players aged 13 and older. Your score has not been submitted.</div>";
html += "<div id='lbForm' style='display: none;'>";
html += "<input type='text' id='igInput' placeholder='Instagram handle (optional)' value='" + escapeAttr(savedHandle) + "' style='padding: 8px; font-size: 14px; width: 200px; border-radius: 4px; border: none; margin-bottom: 8px; display: block; margin-left: auto; margin-right: auto;'><br>";
html += "<div style='font-size: 11px; color: rgba(255,255,255,0.45); max-width: 260px; margin: 0 auto 8px; text-align: left;'>Your handle and score will be publicly displayed on the <a href='https://kstanigar.github.io/non-x_analytics/' target='_blank' style='color:#00FFFF;'>NON-X analytics dashboard</a>. See <a href='/privacy.html' style='color:#00FFFF;'>Privacy Policy</a>.</div>";
html += "<label style='display: block; font-size: 12px; cursor: pointer; max-width: 260px; margin: 0 auto 10px; text-align: left;'><input type='checkbox' id='lbConsent' onchange='document.getElementById(\"lbSubmitBtn\").disabled=!this.checked'> I understand my entry will be publicly displayed</label>";
html += "<button id='lbSubmitBtn' onclick='submitToLeaderboard()' disabled style='padding: 8px 16px; font-size: 14px; border-radius: 4px; border: none; background: #00FFFF; color: #000; cursor: pointer; font-weight: bold;'>Submit Score</button>";
html += "</div>";
html += "</div>";
```

---

### CHANGE 2: `Xenon_3/game.html:6295–6299` — Game Over Screen

**Current code:**
```javascript
html += "<div id='leaderboardSubmit' style='margin-top: 18px; margin-bottom: 18px; text-align: center;'>";
html += "<div style='font-size: 14px; color: #aaa; margin-bottom: 4px;'>Submit to Global Leaderboard:</div>";
html += "<input type='text' id='igInput' placeholder='Player name or handle (optional)' value='" + escapeAttr(savedHandle) + "' style='padding: 6px; font-size: 13px; width: 190px; border-radius: 4px; border: none; display: block; margin-left: auto; margin-right: auto; margin-bottom: 12px;'>";
html += "<button onclick='submitToLeaderboard()' style='padding: 8px 18px; font-size: 13px; border-radius: 4px; border: none; background: #00FFFF; color: #000; cursor: pointer; font-weight: bold;'>Submit Score</button>";
html += "</div>";
```

**Replace with:**
```javascript
html += "<div id='leaderboardSubmit' style='margin-top: 18px; margin-bottom: 18px; text-align: center;'>";
html += "<div style='font-size: 14px; color: #aaa; margin-bottom: 10px;'>Submit to Global Leaderboard:</div>";
html += "<label style='display: block; margin-bottom: 6px; font-size: 12px; cursor: pointer; text-align: left; max-width: 240px; margin-left: auto; margin-right: auto;'><input type='radio' name='ageGate' value='13plus' onchange='document.getElementById(\"lbForm\").style.display=\"block\"; document.getElementById(\"lbUnder13\").style.display=\"none\"'> I am 13 years of age or older</label>";
html += "<label style='display: block; margin-bottom: 10px; font-size: 12px; cursor: pointer; text-align: left; max-width: 240px; margin-left: auto; margin-right: auto;'><input type='radio' name='ageGate' value='under13' onchange='document.getElementById(\"lbForm\").style.display=\"none\"; document.getElementById(\"lbUnder13\").style.display=\"block\"'> I am under 13</label>";
html += "<div id='lbUnder13' style='display: none; font-size: 12px; color: rgba(255,255,255,0.55); max-width: 240px; margin: 0 auto 8px;'>The leaderboard is for players aged 13 and older. Your score has not been submitted.</div>";
html += "<div id='lbForm' style='display: none;'>";
html += "<input type='text' id='igInput' placeholder='Player name or handle (optional)' value='" + escapeAttr(savedHandle) + "' style='padding: 6px; font-size: 13px; width: 190px; border-radius: 4px; border: none; display: block; margin-left: auto; margin-right: auto; margin-bottom: 8px;'>";
html += "<div style='font-size: 11px; color: rgba(255,255,255,0.45); max-width: 240px; margin: 0 auto 8px; text-align: left;'>Your handle and score will be publicly displayed on the <a href='https://kstanigar.github.io/non-x_analytics/' target='_blank' style='color:#00FFFF;'>NON-X analytics dashboard</a>. See <a href='/privacy.html' style='color:#00FFFF;'>Privacy Policy</a>.</div>";
html += "<label style='display: block; font-size: 11px; cursor: pointer; max-width: 240px; margin: 0 auto 10px; text-align: left;'><input type='checkbox' id='lbConsent' onchange='document.getElementById(\"lbSubmitBtn\").disabled=!this.checked'> I understand my entry will be publicly displayed</label>";
html += "<button id='lbSubmitBtn' onclick='submitToLeaderboard()' disabled style='padding: 8px 18px; font-size: 13px; border-radius: 4px; border: none; background: #00FFFF; color: #000; cursor: pointer; font-weight: bold;'>Submit Score</button>";
html += "</div>";
html += "</div>";
```

---

### CHANGE 3: `Xenon_3/game_mobile.html:6625–6629` — Victory Screen

**Current code:**
```javascript
html += "<div id='leaderboardSubmit' style='margin-bottom: 20px; text-align: center;'>";
html += "<div style='font-size: 16px; margin-bottom: 8px;'>Submit to Global Leaderboard:</div>";
html += "<input type='text' id='igInput' placeholder='Instagram handle (optional)' value='" + escapeAttr(savedHandle) + "' style='padding: 8px; font-size: 14px; width: 200px; border-radius: 4px; border: none; margin-bottom: 8px; display: block; margin-left: auto; margin-right: auto;'><br>";
html += "<button onclick='submitToLeaderboard()' style='padding: 8px 16px; font-size: 14px; border-radius: 4px; border: none; background: #00FFFF; color: #000; cursor: pointer; font-weight: bold;'>Submit Score</button>";
html += "</div>";
```

**Replace with:** Same as Change 1 code above (identical UI, same line structure).

---

### CHANGE 4: `Xenon_3/game_mobile.html:6883–6889` — Game Over Screen

**Current code:**
```javascript
html += "<div id='leaderboardSubmit' style='margin-top: 16px; margin-bottom: 8px; text-align: center;'>";
html += "<div style='font-size: 14px; color: #aaa; margin-bottom: 4px;'>Submit to Global Leaderboard:</div>";
html += "<div style='display:flex; justify-content:center; align-items:center; gap:8px;'>";
html += "<input type='text' id='igInput' placeholder='Player name or handle (optional)' value='" + escapeAttr(savedHandle) + "' style='padding: 6px; font-size: 13px; width: 190px; border-radius: 4px; border: none;'>";
html += "<button onclick='submitToLeaderboard()' style='padding: 6px 14px; font-size: 13px; border-radius: 4px; border-radius: 4px; border: none; background: #00FFFF; color: #000; cursor: pointer; font-weight: bold; white-space:nowrap;'>Submit Score</button>";
html += "</div>";
html += "</div>";
```

**Replace with:**
```javascript
html += "<div id='leaderboardSubmit' style='margin-top: 16px; margin-bottom: 8px; text-align: center;'>";
html += "<div style='font-size: 14px; color: #aaa; margin-bottom: 10px;'>Submit to Global Leaderboard:</div>";
html += "<label style='display: block; margin-bottom: 6px; font-size: 12px; cursor: pointer; text-align: left; max-width: 240px; margin-left: auto; margin-right: auto;'><input type='radio' name='ageGate' value='13plus' onchange='document.getElementById(\"lbForm\").style.display=\"block\"; document.getElementById(\"lbUnder13\").style.display=\"none\"'> I am 13 years of age or older</label>";
html += "<label style='display: block; margin-bottom: 10px; font-size: 12px; cursor: pointer; text-align: left; max-width: 240px; margin-left: auto; margin-right: auto;'><input type='radio' name='ageGate' value='under13' onchange='document.getElementById(\"lbForm\").style.display=\"none\"; document.getElementById(\"lbUnder13\").style.display=\"block\"'> I am under 13</label>";
html += "<div id='lbUnder13' style='display: none; font-size: 12px; color: rgba(255,255,255,0.55); max-width: 240px; margin: 0 auto 8px;'>The leaderboard is for players aged 13 and older. Your score has not been submitted.</div>";
html += "<div id='lbForm' style='display: none;'>";
html += "<div style='display:flex; justify-content:center; align-items:center; gap:8px; margin-bottom: 8px;'>";
html += "<input type='text' id='igInput' placeholder='Player name or handle (optional)' value='" + escapeAttr(savedHandle) + "' style='padding: 6px; font-size: 13px; width: 190px; border-radius: 4px; border: none;'>";
html += "</div>";
html += "<div style='font-size: 11px; color: rgba(255,255,255,0.45); max-width: 240px; margin: 0 auto 8px; text-align: left;'>Your handle and score will be publicly displayed on the <a href='https://kstanigar.github.io/non-x_analytics/' target='_blank' style='color:#00FFFF;'>NON-X analytics dashboard</a>. See <a href='/privacy.html' style='color:#00FFFF;'>Privacy Policy</a>.</div>";
html += "<label style='display: block; font-size: 11px; cursor: pointer; max-width: 240px; margin: 0 auto 10px; text-align: left;'><input type='checkbox' id='lbConsent' onchange='document.getElementById(\"lbSubmitBtn\").disabled=!this.checked'> I understand my entry will be publicly displayed</label>";
html += "<button id='lbSubmitBtn' onclick='submitToLeaderboard()' disabled style='padding: 6px 14px; font-size: 13px; border-radius: 4px; border: none; background: #00FFFF; color: #000; cursor: pointer; font-weight: bold; white-space:nowrap;'>Submit Score</button>";
html += "</div>";
html += "</div>";
```

---

### CHANGE 5: `Xenon_3/game.html` + `game_mobile.html` — `submitToLeaderboard()` function

**⚠️ READ REQUIRED BEFORE IMPLEMENTING:** The `submitToLeaderboard()` function must be located and read in both files before this change can be documented with exact lines.

**What to add:** Pass `public_consent: true` in the Firestore document on submit:
```javascript
// Inside the scoreData object passed to firebaseSubmitScore():
public_consent: true
```

This ensures only consented entries are ever stored. The dashboard `fetchLeaderboard()` already reads all entries — once this is in place, a future filter on `public_consent === true` can be added optionally.

---

### CHANGE 6: `Xenon_3/terms.html:158` — Analytics Dashboard Disclosure

**Current text (line 158):**
```html
<p>Aggregated, anonymized gameplay statistics are displayed on a publicly accessible analytics dashboard at <a href="https://kstanigar.github.io/non-x_analytics/" target="_blank" rel="noopener noreferrer">kstanigar.github.io/non-x_analytics/</a>. This dashboard shows population-level metrics only and does not identify individual players. By playing NON-X with analytics enabled, you consent to your anonymized gameplay data being included in these aggregated statistics.</p>
```

**Replace with:**
```html
<p>Aggregated gameplay statistics are displayed on a publicly accessible analytics dashboard at <a href="https://kstanigar.github.io/non-x_analytics/" target="_blank" rel="noopener noreferrer">kstanigar.github.io/non-x_analytics/</a>. This dashboard shows population-level metrics and also displays the public leaderboard, including the display names and scores of players who have consented to public display at time of leaderboard submission. By playing NON-X with analytics enabled, you consent to your anonymized gameplay data being included in these aggregated statistics.</p>
```

---

### CHANGE 7: `Xenon_3/privacy.html:153` — Analytics Dashboard Disclosure

**Current text (line 153):**
```html
<li><strong>NON-X Analytics Dashboard</strong> — aggregated, anonymized gameplay statistics are displayed on a publicly accessible dashboard at <a href="https://kstanigar.github.io/non-x_analytics/" target="_blank" rel="noopener noreferrer">kstanigar.github.io/non-x_analytics/</a>. The dashboard shows population-level metrics (win rates, death rates, boss defeat rates, difficulty tier distributions, etc.) and does not display individual player records or identify specific users.</li>
```

**Replace with:**
```html
<li><strong>NON-X Analytics Dashboard</strong> — aggregated gameplay statistics are displayed on a publicly accessible dashboard at <a href="https://kstanigar.github.io/non-x_analytics/" target="_blank" rel="noopener noreferrer">kstanigar.github.io/non-x_analytics/</a>. The dashboard shows population-level metrics (win rates, death rates, boss defeat rates, difficulty tier distributions, etc.) and also displays a public leaderboard showing the display names, scores, platform, and movement group of players who have explicitly consented to public display at the time of leaderboard submission.</li>
```

---

### CHANGE 8: `Xenon_3/privacy.html` — Section 4 Expansion (after line 140)

**Current Section 4 (lines 139–140):**
```html
<h2>4. Leaderboard Data is Public</h2>
<p>When you submit a leaderboard score, your <strong>display name and score are publicly visible</strong> to all players of NON-X. Do not use your real name or personally identifying information as your display name.</p>
<p>Leaderboard data is stored in Google Cloud Firestore. Standing Tiger may reset leaderboard entries at any time to remove cheated scores or for maintenance.</p>
```

**Replace with:**
```html
<h2>4. Leaderboard Data is Public</h2>
<p>When you submit a leaderboard score, your <strong>display name and score are publicly visible</strong> to all players of NON-X and on the NON-X Analytics Dashboard (<a href="https://kstanigar.github.io/non-x_analytics/" target="_blank" rel="noopener noreferrer">kstanigar.github.io/non-x_analytics/</a>). Do not use your real name or personally identifying information as your display name.</p>
<p>The analytics dashboard displays your display name, score, platform (desktop/mobile), and movement group to anyone with the URL. Submission to the leaderboard requires your explicit consent to this public display.</p>
<p>Leaderboard data is stored in Google Cloud Firestore and retained indefinitely unless you request deletion or we reset the leaderboard. To request deletion of your leaderboard entry, contact us via the <a href="/contact.html">Contact Form</a> with reason "Privacy Request."</p>
```

---

### CHANGE 9: Create `non-x_analytics/contact.html` — New File

Copy Xenon_3's contact form, adapted to the analytics dashboard dark theme (`--bg: #0a0a0f`, `--cyan: #00ffff`). Uses the **same FormSubmit.co endpoint** (`https://formsubmit.co/ajax/45e055cecae307ffc412306a96dd1ff3`) — same Standing Tiger email destination.

**Reason dropdown options to include:**
- `Privacy Request` — for leaderboard data erasure requests
- `Bug Report`
- `General`

**Back link:** `← Back to Dashboard` → `index.html`

Full file to be written at implementation time based on Xenon_3's `contact.html` (243 lines) adapted to match `privacy.html` and `terms.html` styling in this repo.

---

### CHANGE 10: `non-x_analytics/privacy.html:89` — Remove Inaccurate "No PII" Statement

**Current line 89:**
```html
<p>No names, email addresses, or personally identifiable information are collected or displayed.</p>
```

**Replace with:**
```html
<p>No names or email addresses are collected from dashboard visitors. However, the dashboard displays a public leaderboard showing the display names, scores, platform, and movement group of NON-X players who have consented to public display at the time of leaderboard submission in the game.</p>
```

---

### CHANGE 11: `non-x_analytics/privacy.html` — Add Leaderboard Section (after line 89)

**Add new section after line 89:**
```html
<h2>1b. Leaderboard Data Displayed</h2>
<p>The NON-X Analytics Dashboard displays a public leaderboard sourced from the NON-X game (Firestore). This leaderboard shows:</p>
<ul>
  <li>Player display name (instagram handle or anonymous)</li>
  <li>Score</li>
  <li>Platform (desktop or mobile)</li>
  <li>Movement group (A/B test assignment)</li>
  <li>Submission date</li>
</ul>
<p>Only players who have explicitly consented to public display at point of submission are included. Existing entries submitted before July 2026 are grandfathered in under the game's existing public leaderboard terms.</p>
<p>To request removal of your leaderboard entry from this dashboard, use our <a href="contact.html">Contact Form</a> with reason "Privacy Request." We will process deletion requests within 30 days.</p>
```

---

### CHANGE 12: `non-x_analytics/privacy.html:109` — Update Contact Reference

**Current line 109:**
```html
<p>Privacy questions can be directed to <a href="mailto:contact@standingtiger.com">contact@standingtiger.com</a>.</p>
```

**Replace with:**
```html
<p>Privacy questions and data deletion requests can be submitted via our <a href="contact.html">Contact Form</a>. Select reason "Privacy Request." We will respond within 30 days.</p>
```

---

## Files Summary

| File | Repo | Change # | Status |
|------|------|----------|--------|
| `game.html:5998–6002` | Xenon_3 | 1 | ⬜ Pending |
| `game.html:6295–6299` | Xenon_3 | 2 | ⬜ Pending |
| `game_mobile.html:6625–6629` | Xenon_3 | 3 | ⬜ Pending |
| `game_mobile.html:6883–6889` | Xenon_3 | 4 | ⬜ Pending |
| `submitToLeaderboard()` in both | Xenon_3 | 5 | ⚠️ Read function first |
| `terms.html:158` | Xenon_3 | 6 | ⬜ Pending |
| `privacy.html:153` | Xenon_3 | 7 | ⬜ Pending |
| `privacy.html:139–140` | Xenon_3 | 8 | ⬜ Pending |
| `contact.html` (new file) | non-x_analytics | 9 | ⬜ Pending |
| `privacy.html:89` | non-x_analytics | 10 | ⬜ Pending |
| `privacy.html` (new section) | non-x_analytics | 11 | ⬜ Pending |
| `privacy.html:109` | non-x_analytics | 12 | ⬜ Pending |

---

## Pre-Implementation Step Required

Before implementing Change 5 (`submitToLeaderboard()` update), the function must be read in both `game.html` and `game_mobile.html` to get exact line numbers and current payload structure. Launch Haiku agent at implementation time.

---

## Risk if Unchanged

- GDPR: Up to €20M fine or 4% global annual turnover
- COPPA: FTC civil penalties up to $51,744 per violation per day
- CCPA: CA AG enforcement, $7,500 per intentional violation
