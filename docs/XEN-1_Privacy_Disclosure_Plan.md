# XEN-1 — Xenon_3 Leaderboard Privacy Disclosure Plan

**Purpose:** Plan for updating Xenon_3 terms/privacy to legally disclose that leaderboard submissions appear on the public NON-X Analytics dashboard.

**Created:** July 2, 2026 (Session 22)
**Status:** 🟡 PLAN READY — Age gate UI confirmed (radio buttons); 3 open questions remaining before implementation
**Repo:** Xenon_3 (separate repo from non-x_analytics)

---

## Background

The NON-X Analytics dashboard (`kstanigar.github.io/non-x_analytics`) now publicly displays leaderboard data collected by the Xenon_3 game:
- Instagram handle
- Score
- Platform (desktop/mobile)
- Movement group (A/B)

Players who submitted to the leaderboard were **not told** this data would appear on a public analytics site. This is a legal gap under GDPR, CCPA, and COPPA.

---

## Research Findings (Haiku Agent — July 2, 2026)

**Sources:** GDPR Article 13, OWASP Privacy by Design, CCPA Jan 2026, COPPA FTC April 2026, ICO guidance.

### Critical Finding: COPPA

**No age gate = assume all users are under 13.** FTC COPPA April 22, 2026 enforcement policy requires verifiable parental consent before any third-party disclosure for users under 13. Without an age gate, the game cannot legally collect or publicly display PII (instagram handle) for any user.

**COPPA April 22, 2026 deadline has passed.** This is an active compliance gap.

### GDPR Article 13

At point of data collection, must disclose:
- Identity of data controller (Standing Tiger)
- Specific purposes — including analytics dashboard display
- Lawful basis — legitimate interest for leaderboard; **explicit consent required** for analytics display
- Recipients — analytics platform, CDN
- Retention period

**Notice-only is non-compliant.** GDPR explicitly rejects pre-ticked boxes or passive acceptance: "Silence, pre-ticked boxes or inactivity should not constitute consent."

### CCPA (Jan 2026) + PIPEDA

Require explicit notice that submitted data will be disclosed publicly and to third-party platforms. Must appear in Privacy Policy.

---

## Required Changes

### Priority Order (legal risk, highest first)

| # | Change | Where | Severity |
|---|--------|--------|----------|
| 1 | Add age gate to leaderboard submission | Xenon_3 game UI | 🔴 CRITICAL (COPPA) |
| 2 | Add opt-in checkbox at leaderboard submit | Xenon_3 game UI | 🔴 REQUIRED (GDPR) |
| 3 | Add disclosure text at leaderboard submit | Xenon_3 game UI | 🔴 REQUIRED (GDPR Art. 13) |
| 4 | Update Xenon_3 Privacy Policy | Xenon_3 privacy page | 🔴 REQUIRED (CCPA/GDPR) |
| 5 | Update NON-X Analytics Privacy Policy | `privacy.html` in this repo | 🟡 REQUIRED |

---

## Implementation Details

### Change 1 — Age Gate

**UI decision (July 2, 2026):** Radio buttons — selected over birth year dropdown and single checkbox.

**Rationale:** FTC COPPA requires neutral UI with no retry loop. Radio buttons force an explicit choice; under-13 path ends the flow immediately with no way back.

**Full submission form flow:**

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

**If "under 13" selected — show block message, hide form entirely:**

```
┌─────────────────────────────────────────────────────┐
│  The leaderboard is for players aged 13 and older.  │
│                                                     │
│  Your score has not been submitted.                 │
└─────────────────────────────────────────────────────┘
```

**Rules:**
- Radio buttons appear first — submit button disabled until a selection is made
- If under 13 → entire form hides, block message shown, no retry
- If 13+ → instagram field + consent checkbox appear; submit stays disabled until checkbox checked
- Age response is NOT stored in Firestore
- Only `public_consent: true` is stored on submit

### Change 2 + 3 — Disclosure Text + Opt-In Checkbox

Integrated into the submission form above (appears only after 13+ is selected).

**Consent checkbox wording:**
```
☐ I understand my handle and score will be publicly displayed
  on the NON-X analytics dashboard. See Privacy Policy.
```

- Not pre-checked
- Submit button disabled until checked
- Store consent flag: `public_consent: true` in Firestore leaderboard entry

### Change 4 — Xenon_3 Privacy Policy

Add explicit section:

```
Leaderboard Data

When you submit a leaderboard entry, your Instagram handle, score,
platform type, and movement group are stored and displayed publicly
on the NON-X Analytics dashboard (kstanigar.github.io/non-x_analytics).
This data is accessible to anyone with the URL and is not restricted
by age or geography. You may request deletion of your leaderboard entry
by contacting contact@standingtiger.com.

We do not verify age at submission. The leaderboard is intended for
players aged 13 and older.
```

### Change 5 — NON-X Analytics Privacy Policy (`privacy.html`)

Add section covering:
- What leaderboard data is displayed
- That it comes from voluntary Xenon_3 submissions
- Right to request removal (contact email)
- Link to Xenon_3 Privacy Policy

---

## Minimum Viable Disclosure (if age gate is deferred)

If age gate cannot be implemented immediately, the minimum to reduce legal exposure:

1. Opt-in checkbox + disclosure text at submission (Changes 2 + 3)
2. Privacy Policy updates (Changes 4 + 5)
3. Document that age gate is in the backlog with target date

**This does not fully satisfy COPPA** but reduces GDPR/CCPA exposure while age gate is built.

---

## Files to Modify (Xenon_3 repo)

| File | Change |
|------|--------|
| `game.html` or leaderboard submit UI | Age gate + disclosure text + opt-in checkbox |
| `game_mobile.html` (if separate) | Same changes |
| Xenon_3 privacy policy page | Leaderboard data disclosure section |

## Files to Modify (this repo)

| File | Change |
|------|--------|
| `privacy.html` | Add leaderboard data display section |

---

## Open Questions for User

1. **Age gate UI:** ✅ CONFIRMED — Radio buttons (July 2, 2026)
2. **Existing entries:** ~27 current leaderboard entries were submitted without consent. Options: (a) leave them (pre-consent, grandfather in), (b) purge and ask re-submission. Most pragmatic: leave existing, apply consent to all new submissions going forward.
3. **Retention period:** How long does leaderboard data stay public? (Required for GDPR Article 13 disclosure wording.)
4. **Right to erasure contact:** Is `contact@standingtiger.com` the correct email for deletion requests?

---

## Risk if Unchanged

- GDPR: Up to €20M fine or 4% global annual turnover
- COPPA: FTC enforcement action (civil penalties up to $51,744 per violation per day)
- CCPA: CA AG enforcement, $7,500 per intentional violation
- Reputational risk at marketing launch

---

## Decision Needed Before Implementation

- [x] Age gate UI — radio buttons confirmed (July 2, 2026)
- [ ] Existing leaderboard entries — leave (grandfather) or purge?
- [ ] Retention period — how long does leaderboard data stay public?
- [ ] Erasure contact — confirm `contact@standingtiger.com`
