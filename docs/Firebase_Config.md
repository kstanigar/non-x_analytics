# Firebase Configuration Reference

**Purpose:** Source of truth for all Firebase/Firestore configuration. Updated whenever Firebase Console or Google Cloud Console settings change. Prevents needing to re-look up settings each session.

**Last Updated:** July 3, 2026 (Session 25 — ISSUE-010 investigation)

---

## Project Info

| Field | Value |
|-------|-------|
| GCP Project Name | `nonx---game` |
| Firebase Project | Same as GCP (`nonx---game`) |
| Firebase API Key | `AIzaSyDumeBRk__-lcKFJA2WLD7Wi-0y6OuFZlo` |
| Key location in repo | `live.html:3088` (non-x_analytics), `game.html` + `game_mobile.html` (Xenon_3) |
| Key exposure status | Public by design — Firebase web keys are not secrets |

---

## API Key Restrictions (Google Cloud Console)

**Path:** Google Cloud Console → APIs & Services → Credentials

### Two Keys Exist (confirmed July 3, 2026 screenshot)

| Key | Created | HTTP Referrers | API Restrictions |
|-----|---------|---------------|-----------------|
| Browser key (auto created by Firebase) | Mar 4, 2026 | ✅ Set (localhost, nonx.standingtiger.com, dev.nonx.standingtiger.com) | 25 APIs |
| Browser key (auto created by Firebase) | Jun 2, 2026 | ❌ **NONE** | 25 APIs |

**Confirmed July 3, 2026:** `AIzaSyDumeBRk__-lcKFJA2WLD7Wi-0y6OuFZlo` = **Mar 4, 2026 key**. This is the key used in `live.html:3088` and Xenon_3 game files.

The Jun 2, 2026 key is a separate auto-created key — purpose unknown, no referrer restrictions.

### HTTP Referrer Restrictions — Mar 4 Key (✅ fully configured July 3, 2026)

| Domain | Status |
|--------|--------|
| `http://localhost/*` | ✅ Added (June 13, 2026) |
| `https://nonx.standingtiger.com/*` | ✅ Added (June 13, 2026) |
| `https://dev.nonx.standingtiger.com/*` | ✅ Added (June 13, 2026) |
| `https://kstanigar.github.io/*` | ✅ Added (July 3, 2026 — Session 25) |

### API Restrictions (both keys should have)

| API | Status |
|-----|--------|
| Cloud Firestore API | ✅ |
| Firebase Installations API | ✅ |
| Identity Toolkit API | ✅ |

---

## Firestore Security Rules

**Status:** ✅ DEPLOYED — July 3, 2026 (confirmed by user; originally deployed June 23, 2026 via Xenon_3 security session)

**Path:** Firebase Console → Firestore Database → Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /leaderboard/{docId} {
      allow read: if true;

      allow create: if
        request.app.token.valid == true &&
        request.resource.data.keys().hasAll(['score', 'instagram', 'platform', 'movement_group', 'player_id', 'date']) &&
        request.resource.data.score is int &&
        request.resource.data.score >= 1 &&
        request.resource.data.score <= 999999 &&
        request.resource.data.instagram is string &&
        request.resource.data.instagram.size() <= 50 &&
        request.resource.data.platform in ['desktop', 'mobile'] &&
        request.resource.data.movement_group in ['A', 'B'] &&
        request.resource.data.player_id is string &&
        request.resource.data.player_id.size() <= 50 &&
        request.resource.data.date == request.time;

      allow update: if
        request.app.token.valid == true &&
        request.resource.data.score is int &&
        request.resource.data.score > resource.data.score &&
        request.resource.data.score <= 999999 &&
        request.resource.data.platform in ['desktop', 'mobile'] &&
        request.resource.data.movement_group in ['A', 'B'] &&
        request.resource.data.instagram is string &&
        request.resource.data.instagram.size() <= 50 &&
        request.resource.data.date == request.time;

      allow delete: if false;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**What these rules enforce:**
- `allow read: if true` — public leaderboard reads (dashboard needs no auth)
- `allow create` — requires valid App Check token + all 6 fields + type/range validation + server timestamp
- `allow update` — requires valid App Check token + new score must be strictly higher + field validation
- `allow delete: if false` — no deletions allowed (ever)
- Catch-all `/{document=**}` — blocks all reads/writes on any other collection

**Future addition (XEN-1):** Add `consent_log` collection rules when implementing:
```
match /consent_log/{doc} {
  allow read: if false;
  allow write: if request.app.token.valid == true;
}
```

---

## Firebase App Check

**Path:** Firebase Console → App Check

### Registration Status

| Domain | Registered | Provider | Status |
|--------|------------|----------|--------|
| `nonx.standingtiger.com` | ✅ Yes | reCAPTCHA v3 | Live (June 14, 2026) |
| `dev.nonx.standingtiger.com` | ✅ Yes | reCAPTCHA v3 | Live (June 14, 2026) |
| `kstanigar.github.io` | ✅ Yes | reCAPTCHA v3 | Live (Sept 2, 2026) — see note below |

**Note on `kstanigar.github.io` (added Sept 2, 2026):** The July 3, 2026 decision not to register this domain was correct at the time — `allow read: if true` means these reads never needed App Check for *access control*. What changed: `live.html`'s direct Firestore read (leaderboard tab) was an unregistered client generating "unverified: outdated client" traffic mixed into the same App Check metrics used to judge the real game client (`nonx.standingtiger.com`) — see the 48%-outdated Jul 3 reading below, which likely included some of this dashboard's own traffic alongside the GitHub-link players it was attributed to. Registering it isn't a security fix; it's a signal-quality fix so the metrics below actually reflect game-client health. See `docs/HANDOFF_SUMMARY.md` Session 31 and `Xenon_3/docs/PROJECT_LOG.md` (Sept 2, 2026 post-indexing security audit) for the full trigger and implementation.

### Enforcement Status

| Service | Enforcement | Notes |
|---------|-------------|-------|
| Cloud Firestore | ❌ NOT enforced | Rules enforce `request.app.token.valid` independently |
| Cloud Storage | N/A | Not used |

**Do NOT enforce App Check** until verified % reaches ~90% and outdated % reaches ~0%.
Enforcement blocks ALL Firestore operations (including reads) — at current metrics this would lock out real users.

### App Check Request Metrics (Jul 3, 2026 — Jun 26–Jul 4 window)

| Category | % | Count |
|----------|---|-------|
| Verified requests | 50% | 123/244 |
| Unverified — outdated client | 48% | 118/244 |
| Unverified — unknown origin | 0% | 0/244 |
| Unverified — invalid | 1% | 3/244 |

**Root cause of 48% outdated:** Players accessing game via GitHub link (`github.com/...`) instead of production link (`nonx.standingtiger.com`). These players load stale/cached HTML without the latest App Check SDK version. This is not malicious traffic — it is real users on the wrong URL.

**Fix:** Direct players to `nonx.standingtiger.com` (not GitHub link). Outdated % should decrease as players switch to production URL.

**Re-check enforcement readiness:** ~July 6–7, 2026. Prior metrics (June 23): 33% verified / 7% outdated. **Never re-checked — overdue.** See Sept 2, 2026 note below; a real re-check (full 7-day window) should happen now that the dashboard no longer contributes to "outdated" traffic.

### App Check Request Metrics — Sept 2, 2026 update (short-window, not a full re-check)

After registering `kstanigar.github.io` and fixing a CSP misconfiguration that initially blocked its App Check token exchange (see `docs/HANDOFF_SUMMARY.md` Session 31), a 60-minute window on `staging` showed verified requests up from a 36% baseline to 57%, with "outdated" down from 64% to 14%. **This is a small, mixed-traffic (real + our own testing) window, not comparable to the 7-day table above** — treat as a directional signal only. A proper 7-day re-check against the Jul 3 table is still the real "enforcement readiness" check and hasn't been done.

### reCAPTCHA v3 Site Key

Located in `Xenon_3/game.html:553` and `game_mobile.html:529`:
```javascript
new ReCaptchaV3Provider('6LdsiR4tAAAAACW1fmCReUAQPTyiuuJX4O8ZicWh')
```

---

## Firestore Collections

| Collection | Purpose | Public Read | Write Auth |
|------------|---------|-------------|------------|
| `leaderboard` | Game high scores | ✅ Yes | App Check required |
| `consent_log` | GDPR consent records (XEN-1) | ❌ No | App Check required |

---

## Write Method (Xenon_3 Game)

The game writes to Firestore using **unauthenticated `addDoc()` / `updateDoc()`** — no Firebase Auth. Protection is via:
1. **reCAPTCHA v3 App Check** (client-side token validation)
2. **Firestore security rules** (`request.app.token.valid == true` on create/update)

**game.html:618** and **game_mobile.html:582:**
```javascript
const docRef = await addDoc(collection(db, "leaderboard"), {
  score: scoreData.score,
  instagram: scoreData.instagram,
  platform: scoreData.platform,
  movement_group: scoreData.movement_group,
  player_id: scoreData.player_id,
  date: serverTimestamp()
});
```

Player deduplication: queries by `player_id` first — updates score if new score is higher, inserts if new player.

---

## GitHub Secret Scanning Alerts

The `AIzaSyDumeBRk__-lcKFJA2WLD7Wi-0y6OuFZlo` key is flagged by GitHub as a `google_api_key` across both repos (tagged "Public leak" + "Multi-repository"). This is expected — Firebase web API keys are intentionally public and embedded in client-side code.

| Repo | Alert | Status | Reason |
|------|-------|--------|--------|
| Xenon_3 | #1 — `game_mobile.html:405`, `game.html:399`, `index.html:315` (+ 7 more locations) | ✅ Dismissed Mar 4, 2026 | "Used in tests" ⚠️ retroactively incorrect — should have been "False positive" |
| non-x_analytics | Related alert — `live.html` commit `5f624ef` | ✅ Dismissed July 3, 2026 | "False positive" — Firebase web API keys are intentionally public; security enforced via Firestore App Check rules + HTTP referrer restrictions |

**Correct dismiss reason: "False positive"** — not "Used in tests". The key IS in production code. GitHub's "Used in tests" means the secret is not in production code, which is false here. "False positive" is correct because Firebase web API keys are designed to be public by Firebase/Google's own specification — they identify the project, not grant privileged access.

---

## Change Log

| Date | Change | Session |
|------|--------|---------|
| June 13, 2026 | API key HTTP referrer restrictions added: localhost, nonx.standingtiger.com, dev.nonx.standingtiger.com | Xenon_3 Security Audit |
| June 14, 2026 | App Check registered: nonx.standingtiger.com + dev.nonx.standingtiger.com (reCAPTCHA v3) | Xenon_3 Security Audit |
| June 23, 2026 | Firestore security rules deployed — App Check token validation + full field validation | Xenon_3 Security Audit |
| July 3, 2026 | Firebase_Config.md created — all config documented; kstanigar.github.io missing from API key referrers identified | Session 25 |
| July 3, 2026 | `https://kstanigar.github.io/*` added to API key HTTP referrer restrictions — all 4 domains now configured | Session 25 |
| July 3, 2026 | GitHub Secret Scanning alert dismissed as "False positive" on non-x_analytics repo — ISSUE-010 fully resolved | Session 25 |
| Sept 2, 2026 | App Check (reCAPTCHA v3) registered on `kstanigar.github.io`; `live.html` CSP + code updated to activate it — reverses the July 3 "not needed" call for signal-quality reasons, not security | Session 31 |

---

## Pending Actions

- ✅ `kstanigar.github.io/*` added to API key HTTP referrer restrictions (July 3, 2026)
- ✅ GitHub Secret Scanning alert dismissed as "False positive" (July 3, 2026)
- ✅ App Check registered on `kstanigar.github.io` (Sept 2, 2026) — see Sept 2 note above
- [ ] Re-check App Check enforcement readiness — original ~July 6–7, 2026 target missed; now blocked on a real 7-day metrics window post-Sept 2 (dashboard registration), not just the 60-min directional check already done
- [ ] Add `consent_log` Firestore rules when implementing XEN-1
