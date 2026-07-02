# Player Data — Leaderboard Linking & Privacy Plan

**Purpose:** Evaluate feasibility, privacy obligations, and security requirements for linking leaderboard entries to individual player gameplay data on the NON-X Analytics dashboard.

**Created:** June 30, 2026 (Session 21 cont.)
**Status:** 💡 IDEA — Requires privacy/legal review before any implementation
**Priority:** P2 — Do not implement until privacy framework is confirmed

---

## The Idea

Each leaderboard entry contains a `player_id` (UUID). If that same UUID can be linked to GA4 gameplay events, the dashboard could show per-player stats when clicking a leaderboard entry:

```
Rank  Player       Score    Platform   Movement   Date
  1   @handle      42,500   Desktop    Full Dir   Jun 28   [▶ View Stats]
                                                           ↓
                                        Win Rate | Avg Tier | Sessions | Boss Reached | Movement Group
```

---

## Technical Feasibility

### Current Identifiers

| Source | Identifier | Currently Sent To |
|--------|-----------|-----------------|
| Firestore leaderboard | `player_id` (UUID, localStorage) | Firestore only |
| GA4 events | `user_pseudo_id` (GA4 auto) | GA4 / BigQuery only |
| Game | `instagram` (user-submitted string) | Firestore only |

**The problem:** `player_id` (Firestore) and `user_pseudo_id` (GA4) are different identifiers with no shared link. Currently impossible to join gameplay data to a leaderboard entry.

### What Would Be Required (Xenon_3 change)

Send `player_id` to GA4 as a custom dimension on every event:
```javascript
gtag('event', 'game_start', {
  player_id: localStorage.getItem('nonx_player_id'),
  // ... other params
});
```

Once `player_id` is registered as a GA4 custom dimension and flowing into BigQuery, a join becomes possible:

```sql
SELECT
  l.instagram,
  l.score,
  COUNT(DISTINCT g.ga_session_id) AS total_sessions,
  COUNTIF(g.event_name = 'player_won') AS wins,
  AVG(CAST(g.tier AS INT64)) AS avg_tier
FROM leaderboard_data l
JOIN `analytics_525680032.events_*` g
  ON g.customEvent_player_id = l.player_id
GROUP BY l.instagram, l.score
```

### Lift Estimate

| Step | Effort | Notes |
|------|--------|-------|
| Add `player_id` to all GA4 events in Xenon_3 | Medium | ~10 events to update; register new custom dimension |
| BigQuery handler for per-player stats | Medium | New Lambda subtype; join query |
| Dashboard UI — click to expand player row | Medium | New component; modal or inline expand |
| Privacy layer (consent, opt-in, policy) | High | Required before any public display |
| **Total** | **High** | Minimum 2 sessions + legal review |

---

## Privacy Laws & Obligations

### What Data Is Involved

| Field | Classification | Notes |
|-------|---------------|-------|
| `instagram` | **PII** — user-submitted public username | Voluntarily shared for leaderboard display |
| `player_id` | **Pseudonymous identifier** | UUID in localStorage; not directly PII but enables profiling |
| Gameplay stats (win rate, tier, sessions) | **Behavioral data** | Combined with `instagram`, becomes a profile |
| `platform` | Non-PII | Desktop/mobile |

**Key risk:** Displaying `instagram` handle + full gameplay history publicly creates a **personal profile** without explicit consent for that use case. The user consented to leaderboard display, not to a public analytics page about their behavior.

---

### Applicable Laws

#### GDPR (EU — General Data Protection Regulation)
- **Applies if:** Any EU players use the game (highly likely)
- **Instagram handle = personal data** under GDPR (Article 4) — it identifies a natural person
- **Obligations:**
  - Lawful basis for processing (consent or legitimate interest)
  - Players must be informed HOW their data will be used at point of collection
  - **Right to erasure** ("right to be forgotten") — players can request their profile be deleted
  - Data minimization — only collect/display what's necessary
  - Privacy notice must cover this use case explicitly
- **Current gap:** Leaderboard submit UI in Xenon_3 does not mention that gameplay stats will be shown publicly on an analytics dashboard

#### CCPA (California Consumer Privacy Act)
- **Applies if:** Any California users (likely)
- **Obligations:**
  - Right to know what data is collected and how it's used
  - Right to delete personal information
  - Right to opt out of sale (not applicable here, but disclosure needed)
- **Current gap:** No privacy notice at point of leaderboard submission

#### COPPA (Children's Online Privacy Protection Act — US)
- **Applies if:** Any users under 13
- **Risk:** Game does not currently verify age
- **Obligation:** Cannot collect or display PII for users under 13 without parental consent
- **Recommendation:** Add age gate or ensure no PII is collected for under-13 users

#### PIPEDA (Canada)
- Similar to GDPR in principle — consent required, right to withdraw

---

## Security Considerations

**Security is the first gate. Do not proceed without addressing these.**

### Public Dashboard Risk
The analytics dashboard (`kstanigar.github.io/non-x_analytics`) is publicly accessible. Displaying per-player gameplay profiles means:
- Anyone can look up any leaderboard player's full gameplay history by instagram handle
- No authentication protects this data
- Scrapers can harvest all player profiles in bulk

### Mitigations Required Before Implementation

| Risk | Mitigation |
|------|-----------|
| Public profile scraping | Rate limit the Lambda endpoint; WAF rule (H-4) |
| `player_id` as tracking vector | Treat as pseudonymous PII; do not expose in API responses |
| Instagram handle + stats = public profile | Require explicit opt-in at leaderboard submission ("Show my stats publicly") |
| Firestore rules open | Must be locked before any expansion of data access (ISSUE-010) |
| No consent at point of collection | Update Xenon_3 leaderboard submit UI with disclosure |

---

## Recommended Approach (If Moving Forward)

### Phase 1 — Privacy Foundation (Required First)
1. ✅ Fix Firestore security rules (ISSUE-010 — already next priority)
2. Update Xenon_3 leaderboard submit UI — add disclosure: "Your handle and score will appear publicly. Your gameplay stats may be shown on the analytics dashboard."
3. Add opt-in checkbox: "Show my gameplay stats publicly" → store as `public_stats: true/false` in Firestore
4. Update Privacy Policy to cover analytics dashboard display
5. Implement right-to-erasure: allow players to delete their leaderboard entry (removes from dashboard too)

### Phase 2 — Technical Implementation (Only After Phase 1)
1. Add `player_id` to GA4 events in Xenon_3 + register custom dimension
2. New BigQuery Lambda handler: per-player stats query
3. Dashboard: click to expand leaderboard row → show gameplay stats inline
4. Only show stats for entries where `public_stats === true`

### Phase 3 — Security Hardening
1. AWS WAF rate limiting on player stats endpoint (H-4)
2. Consider dashboard authentication if data sensitivity increases

---

## Open Questions for User

1. **Who is the audience for player stats?** The dashboard is public — is that intentional for player profiles, or should it require a login?
2. **Opt-in vs opt-out?** GDPR requires opt-in (default: don't show stats). Is that acceptable UX?
3. **Right to erasure:** Are you prepared to handle deletion requests from players?
4. **Age gate:** Does Xenon_3 have any age verification? If not, COPPA is a risk.

---

## Decision Needed

**Do not implement until user has reviewed the privacy obligations above and confirmed:**
- [ ] Privacy policy will be updated to cover this use case
- [ ] Opt-in will be added to Xenon_3 leaderboard submit UI
- [ ] Right to erasure process is defined
- [ ] ISSUE-010 (Firestore rules) is resolved first
