# XEN-1 — Xenon_3 Leaderboard Privacy Disclosure Plan

**Purpose:** Plan for updating Xenon_3 terms/privacy to legally disclose that leaderboard submissions appear on the public NON-X Analytics dashboard, and adding age gate + consent via the existing cookie consent banner.

**Created:** July 2, 2026 (Session 22)
**Status:** 🟡 PLAN READY — All decisions confirmed; ready to implement
**Repos:** Xenon_3 + non-x_analytics

---

## Research Findings (Haiku Agent — July 2, 2026)

**Sources:** GDPR Article 13, OWASP Privacy by Design, CCPA Jan 2026, COPPA FTC April 2026, ICO guidance.

### Critical Finding: COPPA

**No age gate = assume all users are under 13.** FTC COPPA April 22, 2026 enforcement policy requires verifiable parental consent before any third-party disclosure for users under 13. **COPPA April 22, 2026 deadline has passed — active compliance gap.**

### GDPR Article 13

Explicit opt-in required at point of collection. Notice-only is non-compliant. Consent must cover analytics dashboard display specifically.

### CCPA (Jan 2026) + PIPEDA

Explicit notice required in Privacy Policy that submitted data is disclosed publicly and to third-party platforms.

---

## User Decisions (Confirmed July 2, 2026)

| Decision | Answer |
|----------|--------|
| Consent UI location | ✅ Expand existing cookie consent banner — not leaderboard submit UI |
| Age gate style | ✅ Checkbox in banner ("I confirm I am 13 or older") |
| Existing 27 entries | ✅ Grandfather in — apply consent to new submissions only |
| Retention period | ✅ Indefinite |
| Erasure contact | ✅ Xenon_3 `/contact.html` form — copy to non-x_analytics |

---

## Xenon_3 Research Findings (Haiku Agent — July 2, 2026)

### Cookie Consent Banner

**game.html HTML:** lines 657–663
**game.html JS:** lines 740–766
**game_mobile.html HTML:** lines 613–619
**game_mobile.html JS:** lines 696–722

Current banner text: *"This game uses analytics cookies to track gameplay."*
Current localStorage key: `nonx_consent` — values: `'granted'` | `'denied'`

**Important:** No separate analytics toggle UI exists in the code (Xenon_3 privacy.html references one but it is not implemented in `game.html` or `game_mobile.html`).

### submitToLeaderboard() Function

**game.html:** lines 1408–1466
**game_mobile.html:** lines 1353–1406

`scoreData` object (where `public_consent` field must be added):
- `game.html:` ~lines 1432–1437
- `game_mobile.html:` ~lines 1372–1377

### Contact Form (`/contact.html`) — 243 lines

FormSubmit.co AJAX endpoint: `https://formsubmit.co/ajax/45e055cecae307ffc412306a96dd1ff3`
Already has "Privacy Request" option in reason dropdown.
Already linked from Xenon_3 `terms.html:213` and `privacy.html:204`.

### All localStorage Keys (existing)

| Key | Values | Purpose |
|-----|--------|---------|
| `nonx_consent` | `'granted'` \| `'denied'` | Cookie/analytics consent |
| `nonx_player_id` | UUID | Unique player ID |
| `nonx_ab_music_group` | `'A'` \| `'B'` | Music A/B group |
| `nonex_music` | `'on'` \| `'off'` | Music preference |
| `nonex_movement` | string | Movement preference |
| `nonx_ig_handle` | string | Saved instagram handle |
| `nonx_submitted_score` | numeric string | Last submitted score |
| `nonx_has_visited` | `'true'` | First visit flag |
| `nonx_visit_count` | numeric string | Visit count |

**New keys added by XEN-1:**

| Key | Values | Purpose |
|-----|--------|---------|
| `nonx_lb_consent` | `'granted'` \| `'denied'` | Leaderboard public display consent |
| `nonx_age_consent` | `'granted'` | Age confirmation (13+) |

---

## Implementation Approach

**Strategy:** Extend the existing cookie consent banner to cover age confirmation and leaderboard disclosure in one step. No changes to the leaderboard submit UI (4 locations untouched). Consent is collected once at banner, stored in localStorage, checked in `submitToLeaderboard()`.

**Re-consent trigger:** Existing users have `nonx_consent` set but `nonx_lb_consent` not set. Banner must re-appear for them. Logic: show banner if `nonx_lb_consent` is missing, regardless of `nonx_consent` state.

---

## All Changes — Exact Code

---

### CHANGE 1: `Xenon_3/game.html:657–663` — Update Banner HTML

**Current code:**
```html
<div id="consentBanner" style="position:fixed;bottom:0;left:0;right:0;background:#1a1a2e;color:#ccc;padding:14px 20px;z-index:99999;font-size:13px;display:flex;align-items:center;justify-content:space-between;gap:16px;font-family:monospace;border-top:1px solid #00FFFF;">
  <span>This game uses analytics cookies to track gameplay. <a href="/privacy.html" style="color:#00FFFF;">Privacy Policy</a></span>
  <div style="display:flex;gap:8px;flex-shrink:0;">
    <button id="declineConsent" style="padding:6px 16px;background:transparent;color:#888;border:1px solid #444;border-radius:4px;cursor:pointer;font-family:monospace;">Decline</button>
    <button id="acceptConsent" style="padding:6px 16px;background:#00FFFF;color:#000;border:none;border-radius:4px;cursor:pointer;font-weight:bold;font-family:monospace;">Accept</button>
  </div>
</div>
```

**Replace with:**
```html
<div id="consentBanner" style="position:fixed;bottom:0;left:0;right:0;background:#1a1a2e;color:#ccc;padding:16px 20px;z-index:99999;font-size:13px;font-family:monospace;border-top:1px solid #00FFFF;">
  <div style="max-width:700px;margin:0 auto;">
    <div style="margin-bottom:10px;">This game uses analytics to improve gameplay. Leaderboard entries (display name, score, platform) are shown publicly on the <a href="https://kstanigar.github.io/non-x_analytics/" target="_blank" style="color:#00FFFF;">NON-X Analytics Dashboard</a>. <a href="/privacy.html" style="color:#00FFFF;">Privacy Policy</a></div>
    <label style="display:block;margin-bottom:12px;cursor:pointer;">
      <input type="checkbox" id="ageConfirm" style="margin-right:6px;">
      I confirm I am 13 years of age or older
    </label>
    <div style="display:flex;gap:8px;">
      <button id="declineConsent" style="padding:6px 16px;background:transparent;color:#888;border:1px solid #444;border-radius:4px;cursor:pointer;font-family:monospace;">Decline</button>
      <button id="acceptConsent" disabled style="padding:6px 16px;background:#00FFFF;color:#000;border:none;border-radius:4px;cursor:pointer;font-weight:bold;font-family:monospace;opacity:0.4;">Accept</button>
    </div>
  </div>
</div>
```

---

### CHANGE 2: `Xenon_3/game.html:740–766` — Update Banner JS

**Current code:**
```javascript
(function() {
  var banner = document.getElementById('consentBanner');
  if (!banner) return;
  if (localStorage.getItem('nonx_consent') === 'granted') {
    banner.style.display = 'none';
    gtag('consent', 'update', { 'analytics_storage': 'granted' });
    return;
  }
  if (localStorage.getItem('nonx_consent') === 'denied') {
    banner.style.display = 'none';
    return;
  }
  document.getElementById('acceptConsent').addEventListener('click', function() {
    localStorage.setItem('nonx_consent', 'granted');
    gtag('consent', 'update', {
      'analytics_storage': 'granted',
      'ad_storage': 'granted',
      'ad_user_data': 'granted',
      'ad_personalization': 'granted'
    });
    banner.style.display = 'none';
  });
  document.getElementById('declineConsent').addEventListener('click', function() {
    localStorage.setItem('nonx_consent', 'denied');
    banner.style.display = 'none';
  });
})();
```

**Replace with:**
```javascript
(function() {
  var banner = document.getElementById('consentBanner');
  if (!banner) return;

  // Hide banner only if BOTH analytics consent AND leaderboard consent already recorded
  if (localStorage.getItem('nonx_lb_consent')) {
    banner.style.display = 'none';
    if (localStorage.getItem('nonx_consent') === 'granted') {
      gtag('consent', 'update', { 'analytics_storage': 'granted' });
    }
    return;
  }

  // Age checkbox enables/disables Accept button
  var ageBox = document.getElementById('ageConfirm');
  var acceptBtn = document.getElementById('acceptConsent');
  ageBox.addEventListener('change', function() {
    acceptBtn.disabled = !ageBox.checked;
    acceptBtn.style.opacity = ageBox.checked ? '1' : '0.4';
  });

  acceptBtn.addEventListener('click', function() {
    localStorage.setItem('nonx_consent', 'granted');
    localStorage.setItem('nonx_lb_consent', 'granted');
    localStorage.setItem('nonx_age_consent', 'granted');
    gtag('consent', 'update', {
      'analytics_storage': 'granted',
      'ad_storage': 'granted',
      'ad_user_data': 'granted',
      'ad_personalization': 'granted'
    });
    banner.style.display = 'none';
  });

  document.getElementById('declineConsent').addEventListener('click', function() {
    localStorage.setItem('nonx_consent', 'denied');
    localStorage.setItem('nonx_lb_consent', 'denied');
    banner.style.display = 'none';
  });
})();
```

---

### CHANGE 3: `Xenon_3/game_mobile.html:613–619` — Update Banner HTML

**Same replacement as Change 1.** Identical HTML, different line numbers.

---

### CHANGE 4: `Xenon_3/game_mobile.html:696–722` — Update Banner JS

**Same replacement as Change 2.** Identical JS, different line numbers.

---

### CHANGE 5: `Xenon_3/game.html:1408–1409` — Add consent check to `submitToLeaderboard()`

**Current lines 1408–1409:**
```javascript
    function submitToLeaderboard() {
      // Read and sanitize player name/handle from input field
```

**Replace with:**
```javascript
    function submitToLeaderboard() {
      // Block submission if leaderboard consent not granted via banner
      if (localStorage.getItem('nonx_lb_consent') !== 'granted') {
        var submitArea = document.getElementById('leaderboardSubmit');
        if (submitArea) {
          submitArea.innerHTML = "<div style='font-size:13px;color:#aaa;text-align:center;padding:8px;'>Please accept the consent notice to submit scores.</div>";
        }
        return;
      }
      // Read and sanitize player name/handle from input field
```

---

### CHANGE 6: `Xenon_3/game.html:1426–1432` — Add `public_consent` to `scoreData`

**Current lines 1426–1432:**
```javascript
      var scoreData = {
        score: score,
        instagram: sanitized || 'Anonymous', // Empty input becomes Anonymous
        platform: 'desktop',
        movement_group: movementABGroup,     // A/B test group for analytics
        player_id: PLAYER_ID                 // Unique ID to prevent name collision
      };
```

**Replace with:**
```javascript
      var scoreData = {
        score: score,
        instagram: sanitized || 'Anonymous', // Empty input becomes Anonymous
        platform: 'desktop',
        movement_group: movementABGroup,     // A/B test group for analytics
        player_id: PLAYER_ID,                // Unique ID to prevent name collision
        public_consent: true
      };
```

---

### CHANGE 7a: `Xenon_3/game_mobile.html:1353–1354` — Add consent check

**Current lines 1353–1354:**
```javascript
    function submitToLeaderboard() {
      var igHandle = document.getElementById('igInput').value.trim();
```

**Replace with:**
```javascript
    function submitToLeaderboard() {
      // Block submission if leaderboard consent not granted via banner
      if (localStorage.getItem('nonx_lb_consent') !== 'granted') {
        var submitArea = document.getElementById('leaderboardSubmit');
        if (submitArea) {
          submitArea.innerHTML = "<div style='font-size:13px;color:#aaa;text-align:center;padding:8px;'>Please accept the consent notice to submit scores.</div>";
        }
        return;
      }
      var igHandle = document.getElementById('igInput').value.trim();
```

### CHANGE 7b: `Xenon_3/game_mobile.html:1369–1375` — Add `public_consent` to `scoreData`

**Current lines 1369–1375:**
```javascript
      var scoreData = {
        score: score,
        instagram: sanitized || 'Anonymous',
        platform: 'mobile',
        movement_group: movementABGroup,
        player_id: PLAYER_ID  // Unique ID to prevent name collision
      };
```

**Replace with:**
```javascript
      var scoreData = {
        score: score,
        instagram: sanitized || 'Anonymous',
        platform: 'mobile',
        movement_group: movementABGroup,
        player_id: PLAYER_ID, // Unique ID to prevent name collision
        public_consent: true
      };
```

---

### CHANGE 8: `Xenon_3/terms.html:158` — Fix Inaccurate Dashboard Description

**Current (line 158):**
```html
<p>Aggregated, anonymized gameplay statistics are displayed on a publicly accessible analytics dashboard at <a href="https://kstanigar.github.io/non-x_analytics/" target="_blank" rel="noopener noreferrer">kstanigar.github.io/non-x_analytics/</a>. This dashboard shows population-level metrics only and does not identify individual players. By playing NON-X with analytics enabled, you consent to your anonymized gameplay data being included in these aggregated statistics.</p>
```

**Replace with:**
```html
<p>Aggregated gameplay statistics are displayed on a publicly accessible analytics dashboard at <a href="https://kstanigar.github.io/non-x_analytics/" target="_blank" rel="noopener noreferrer">kstanigar.github.io/non-x_analytics/</a>. This dashboard shows population-level metrics and also displays the public leaderboard, including the display names and scores of players who have consented to public display at time of leaderboard submission. By playing NON-X with analytics enabled, you consent to your anonymized gameplay data being included in these aggregated statistics.</p>
```

---

### CHANGE 9: `Xenon_3/privacy.html:153` — Fix Inaccurate Dashboard Description

**Current (line 153):**
```html
<li><strong>NON-X Analytics Dashboard</strong> — aggregated, anonymized gameplay statistics are displayed on a publicly accessible dashboard at <a href="https://kstanigar.github.io/non-x_analytics/" target="_blank" rel="noopener noreferrer">kstanigar.github.io/non-x_analytics/</a>. The dashboard shows population-level metrics (win rates, death rates, boss defeat rates, difficulty tier distributions, etc.) and does not display individual player records or identify specific users.</li>
```

**Replace with:**
```html
<li><strong>NON-X Analytics Dashboard</strong> — aggregated gameplay statistics are displayed on a publicly accessible dashboard at <a href="https://kstanigar.github.io/non-x_analytics/" target="_blank" rel="noopener noreferrer">kstanigar.github.io/non-x_analytics/</a>. The dashboard shows population-level metrics (win rates, death rates, boss defeat rates, difficulty tier distributions, etc.) and also displays a public leaderboard showing the display names, scores, platform, and movement group of players who have explicitly consented to public display at time of leaderboard submission.</li>
```

---

### CHANGE 10: `Xenon_3/privacy.html:139–140` — Expand Section 4

**Current Section 4:**
```html
<h2>4. Leaderboard Data is Public</h2>
<p>When you submit a leaderboard score, your <strong>display name and score are publicly visible</strong> to all players of NON-X. Do not use your real name or personally identifying information as your display name.</p>
<p>Leaderboard data is stored in Google Cloud Firestore. Standing Tiger may reset leaderboard entries at any time to remove cheated scores or for maintenance.</p>
```

**Replace with:**
```html
<h2>4. Leaderboard Data is Public</h2>
<p>When you submit a leaderboard score, your <strong>display name and score are publicly visible</strong> to all players of NON-X and on the <a href="https://kstanigar.github.io/non-x_analytics/" target="_blank" rel="noopener noreferrer">NON-X Analytics Dashboard</a>. Do not use your real name or personally identifying information as your display name.</p>
<p>The analytics dashboard displays your display name, score, platform (desktop/mobile), and movement group to anyone with the URL. Leaderboard submission requires your explicit consent (collected via the in-game consent banner).</p>
<p>Leaderboard data is stored in Google Cloud Firestore and retained indefinitely unless you request deletion or we reset the leaderboard. To request deletion, use our <a href="/contact.html">Contact Form</a> with reason "Privacy Request."</p>
<p>Standing Tiger may reset leaderboard entries at any time to remove cheated scores or for maintenance.</p>
```

---

### CHANGE 11: Create `non-x_analytics/contact.html` — New File

Copy Xenon_3's `contact.html` (243 lines), adapt to dashboard dark theme (`--bg: #0a0a0f`, CSS vars matching `privacy.html`). Same FormSubmit.co endpoint. Same reason options: Privacy Request, Bug Report, General. Back link: `← Back to Dashboard` → `index.html`.

---

### CHANGE 12: `non-x_analytics/privacy.html:89` — Remove Inaccurate "No PII" Statement

**Current:**
```html
<p>No names, email addresses, or personally identifiable information are collected or displayed.</p>
```

**Replace with:**
```html
<p>No names or email addresses are collected from dashboard visitors. However, the dashboard displays a public leaderboard showing the display names, scores, platform, and movement group of NON-X players who consented to public display at leaderboard submission.</p>
```

---

### CHANGE 13: `non-x_analytics/privacy.html` — Add Leaderboard Section (after line 89)

**Add after line 89:**
```html
<h2>1b. Leaderboard Data Displayed</h2>
<p>The NON-X Analytics Dashboard displays a public leaderboard sourced from the NON-X game. This leaderboard shows:</p>
<ul>
  <li>Player display name (instagram handle or "Anonymous")</li>
  <li>Score</li>
  <li>Platform (desktop or mobile)</li>
  <li>Movement group (A/B test assignment)</li>
  <li>Submission date</li>
</ul>
<p>Only players who explicitly consented at the in-game consent banner are included. Entries submitted before July 2026 are grandfathered under the game's existing public leaderboard terms.</p>
<p>To request removal of your leaderboard entry, use our <a href="contact.html">Contact Form</a> with reason "Privacy Request." We will process requests within 30 days.</p>
```

---

### CHANGE 14: `non-x_analytics/privacy.html:109` — Update Contact Reference

**Current:**
```html
<p>Privacy questions can be directed to <a href="mailto:contact@standingtiger.com">contact@standingtiger.com</a>.</p>
```

**Replace with:**
```html
<p>Privacy questions and data deletion requests can be submitted via our <a href="contact.html">Contact Form</a>. Select reason "Privacy Request." We will respond within 30 days.</p>
```

---

## Files Summary

| # | File | Repo | Status |
|---|------|------|--------|
| 1 | `game.html:657–663` — banner HTML | Xenon_3 | ⬜ Pending |
| 2 | `game.html:740–766` — banner JS | Xenon_3 | ⬜ Pending |
| 3 | `game_mobile.html:613–619` — banner HTML | Xenon_3 | ⬜ Pending |
| 4 | `game_mobile.html:696–722` — banner JS | Xenon_3 | ⬜ Pending |
| 5 | `game.html:1408` — consent check in submitToLeaderboard() | Xenon_3 | ⬜ Pending |
| 6 | `game.html:~1432` — add `public_consent: true` to scoreData | Xenon_3 | ⬜ Pending |
| 7 | `game_mobile.html:1353` + `~1372` — mirror Changes 5+6 | Xenon_3 | ⬜ Pending |
| 8 | `terms.html:158` — fix dashboard description | Xenon_3 | ⬜ Pending |
| 9 | `privacy.html:153` — fix dashboard description | Xenon_3 | ⬜ Pending |
| 10 | `privacy.html:139–140` — expand Section 4 | Xenon_3 | ⬜ Pending |
| 11 | `contact.html` — new file | non-x_analytics | ⬜ Pending |
| 12 | `privacy.html:89` — fix no-PII statement | non-x_analytics | ⬜ Pending |
| 13 | `privacy.html` — add leaderboard section | non-x_analytics | ⬜ Pending |
| 14 | `privacy.html:109` — update contact reference | non-x_analytics | ⬜ Pending |

---

## Risk if Unchanged

- GDPR: Up to €20M fine or 4% global annual turnover
- COPPA: FTC civil penalties up to $51,744 per violation per day
- CCPA: CA AG enforcement, $7,500 per intentional violation
