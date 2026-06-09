# GA4 Custom Dimensions - Complete Reference

**Purpose:** Comprehensive catalog of all 31 registered GA4 custom dimensions for NON-X game analytics.

**Last Updated:** June 9, 2026
**Source:** GA4 Admin → Custom definitions → Custom dimensions
**Property:** NON-X Game Analytics (GA4 Property ID: [Your Property ID])

---

## Overview

**Total Custom Dimensions:** 31
**Scope:** All Event-scoped
**Registration Period:** Feb 23, 2026 - Apr 3, 2026

**Categories:**
- Game Progression & Difficulty (8 dimensions)
- Boss & Level Tracking (5 dimensions)
- AI Agent & Difficulty System (8 dimensions)
- Player Behavior & Engagement (4 dimensions)
- A/B Testing & Variants (3 dimensions)
- Replay & Session Tracking (3 dimensions)

---

## 🎮 GAME PROGRESSION & DIFFICULTY

### 1. Game Phase
- **Dimension Name:** `Game Phase`
- **Parameter Name:** `phase`
- **Description:** Which phase are players having difficulty in
- **Possible Values:** `"GREEN"`, `"RED"`, `"PURPLE"`
- **Last Changed:** Feb 27, 2026
- **Use Cases:**
  - Identify which phase has highest death rate
  - Compare difficulty across color phases
  - A/B test phase-specific changes
- **Query Example:** `customEvent:phase` dimension with `player_death` event

---

### 2. Level
- **Dimension Name:** `Level`
- **Parameter Name:** `level`
- **Description:** Current level when ai_difficulty_adjusted event fires
- **Possible Values:** Numeric strings (game logic dependent)
- **Last Changed:** Apr 3, 2026
- **Use Cases:**
  - Track AI adjustments by level
  - Identify levels triggering difficulty changes
  - Monitor adaptive difficulty system

---

### 3. Level Number
- **Dimension Name:** `Level Number`
- **Parameter Name:** `level_number`
- **Description:** Which level did the player end on?
- **Possible Values:** `"1"` through `"12"` (string format)
- **Last Changed:** Feb 27, 2026
- **Use Cases:**
  - Final level reached before death/victory
  - Session depth analysis
  - Funnel drop-off by level

---

### 4. Level Reached
- **Dimension Name:** `Level Reached`
- **Parameter Name:** `level_reached`
- **Description:** Which level are players consistently dying on?
- **Possible Values:** `"1"` through `"12"` (string format)
- **Last Changed:** Feb 27, 2026
- **Use Cases:**
  - Death clustering analysis (wave_reached events)
  - Difficulty spike identification
  - Level balance verification
- **Dashboard Usage:** Wave Drop-off chart (live.html:1564)

---

### 5. Powerup Type
- **Dimension Name:** `Powerup Type`
- **Parameter Name:** `powerup_type`
- **Description:** Which powerups are players gathering the most?
- **Possible Values:** `"speed_boost"`, `"quad_shot"`, `"shield"`, etc.
- **Last Changed:** Feb 27, 2026
- **Use Cases:**
  - Powerup popularity tracking
  - Phase-specific powerup usage (combine with `phase`)
  - A/B test powerup availability

---

### 6. Session Duration Seconds
- **Dimension Name:** `Session Duration Seconds`
- **Parameter Name:** `session_duration_seconds`
- **Description:** How long is the player engaged with the game?
- **Possible Values:** Numeric seconds (string format)
- **Last Changed:** Feb 27, 2026
- **Use Cases:**
  - Average session length by outcome (win vs death)
  - Engagement depth analysis
  - Session duration distribution
- **Note:** Future enhancement for Daily Timeseries survival time

---

### 7. Cycles Completed
- **Dimension Name:** `Cycles Completed`
- **Parameter Name:** `cycles_completed`
- **Description:** Track how many full cycles players complete
- **Possible Values:** `"0"`, `"1"`, `"2"`, `"3"`, etc.
- **Last Changed:** Apr 3, 2026
- **Use Cases:**
  - Endgame engagement (players completing multiple cycles)
  - Speed lock rate calculation (1+ cycles)
  - Expert player identification

---

### 8. Speed Locked
- **Dimension Name:** `Speed Locked`
- **Parameter Name:** `speed_locked`
- **Description:** Speed ratchet active after first cycle (prevents dropping below Easy difficulty)
- **Possible Values:** `"true"`, `"false"`
- **Last Changed:** Apr 3, 2026
- **Use Cases:**
  - Speed lock adoption rate
  - Difficulty progression protection tracking
  - Expert player retention

---

## ⚔️ BOSS & LEVEL TRACKING

### 9. Boss ID ⭐ CRITICAL FOR TASK 7
- **Dimension Name:** `Boss ID`
- **Parameter Name:** `boss_id`
- **Description:** Which boss did the player reach?
- **Possible Values:** `"1"`, `"2"`, `"3"`
- **Last Changed:** Feb 27, 2026
- **Use Cases:**
  - Boss difficulty analysis (attempts vs defeats)
  - Platform-specific boss difficulty (combine with `deviceCategory`)
  - Boss progression funnel
- **Dashboard Usage:** Boss Analysis page (live.html:1625-1664)
- **Events:** `boss_attempt`, `boss_defeated`
- **Phase 6A Task 7:** Primary dimension for boss analysis endpoint ✅

---

### 10. Death Phase
- **Dimension Name:** `Death Phase`
- **Parameter Name:** `death_phase`
- **Description:** Phase player was in when they died
- **Possible Values:** `"GREEN"`, `"RED"`, `"PURPLE"`
- **Last Changed:** Mar 2, 2026
- **Use Cases:**
  - Death distribution by phase
  - Identify hardest phase
  - Cross-reference with AI tier adjustments

---

### 11. Bonus HP
- **Dimension Name:** `Bonus HP`
- **Parameter Name:** `bonus_hp`
- **Description:** HP bonus granted on replay (replay incentive system)
- **Possible Values:** `"15"`, `"25"`, `"50"` (HP points)
- **Last Changed:** Mar 2, 2026
- **Use Cases:**
  - Replay incentive effectiveness
  - Bonus HP tier distribution
  - Correlation with win rate on replays

---

### 12. Replay Tier
- **Dimension Name:** `Replay Tier`
- **Parameter Name:** `replay_tier`
- **Description:** Replay incentive tier applied (1-4 scale)
- **Possible Values:** `"1"`, `"2"`, `"3"`, `"4"`
- **Last Changed:** Mar 2, 2026
- **Use Cases:**
  - Replay incentive tier distribution
  - Bonus HP mapping to tier
  - Replay conversion by tier

---

### 13. Continue
- **Dimension Name:** `Continue`
- **Parameter Name:** `continue`
- **Description:** Did player resume from checkpoint or start fresh?
- **Possible Values:** `"true"` (Resume Level X), `"false"` (Play Again)
- **Last Changed:** Mar 2, 2026
- **Use Cases:**
  - Checkpoint usage rate
  - Resume vs restart player preference
  - Progression retention

---

## 🤖 AI AGENT & DIFFICULTY SYSTEM

### 14. Tier
- **Dimension Name:** `Tier`
- **Parameter Name:** `tier`
- **Description:** Current difficulty tier (-3 to +3) at time of event
- **Possible Values:** `"-3"`, `"-2"`, `"-1"`, `"0"`, `"1"`, `"2"`, `"3"`
- **Last Changed:** Apr 3, 2026
- **Use Cases:**
  - Player distribution by difficulty tier
  - Final tier reached (session_end events)
  - Tier progression flow
- **Dashboard Usage:** AI Agent page (live.html:1708-1714)

---

### 15. Old Tier
- **Dimension Name:** `Old Tier`
- **Parameter Name:** `old_tier`
- **Description:** Previous tier before AI adjustment
- **Possible Values:** `"-3"` through `"3"`
- **Last Changed:** Apr 3, 2026
- **Use Cases:**
  - Tier change tracking (combine with `new_tier`)
  - Progression vs regression rates
  - AI adjustment triggers

---

### 16. New Tier
- **Dimension Name:** `New Tier`
- **Parameter Name:** `new_tier`
- **Description:** New tier after AI adjustment
- **Possible Values:** `"-3"` through `"3"`
- **Last Changed:** Apr 3, 2026
- **Use Cases:**
  - Tier progression tracking
  - AI difficulty adjustments analysis
  - Player improvement over time

---

### 17. Direction
- **Dimension Name:** `Direction`
- **Parameter Name:** `direction`
- **Description:** Tier adjustment direction (increase or decrease)
- **Possible Values:** `"increase"`, `"decrease"`
- **Last Changed:** Apr 3, 2026
- **Use Cases:**
  - Difficulty increase vs decrease ratio
  - Player struggle indicators (frequent decreases)
  - AI balancing verification
- **Event:** `ai_difficulty_adjusted`

---

### 18. Tier Multiplier
- **Dimension Name:** `Tier Multiplier`
- **Parameter Name:** `tier_multiplier`
- **Description:** Score multiplier based on tier (0.50 to 1.75)
- **Possible Values:** Decimal strings (`"0.50"`, `"0.75"`, `"1.00"`, `"1.25"`, `"1.50"`, `"1.75"`)
- **Last Changed:** Apr 3, 2026
- **Use Cases:**
  - Tier-based scoring impact
  - Leaderboard score normalization
  - Anti-exploitation verification (prevent easy-mode farming)

---

### 19. Movement Multiplier
- **Dimension Name:** `Movement Multiplier`
- **Parameter Name:** `movement_multiplier`
- **Description:** Score multiplier based on movement scheme
- **Possible Values:** Decimal strings (scheme-dependent)
- **Last Changed:** Apr 3, 2026
- **Use Cases:**
  - Movement scheme impact on scores
  - Keyboard vs mouse advantage analysis
  - Leaderboard fairness verification

---

### 20. Effective Multiplier
- **Dimension Name:** `Effective Multiplier`
- **Parameter Name:** `effective_multiplier`
- **Description:** Combined tier × movement multiplier
- **Possible Values:** Decimal strings (range: `"0.50"` to `"2.19"`)
- **Last Changed:** Apr 3, 2026
- **Use Cases:**
  - Final score multiplier distribution
  - Leaderboard score spread analysis
  - Multiplier balance verification
- **Dashboard Usage:** Score Multiplier Distribution chart (live.html:1728-1733)

---

### 21. Movement Group
- **Dimension Name:** `Movement Group`
- **Parameter Name:** `movement_group`
- **Description:** Which control parameter did the player choose?
- **Possible Values:** `"keyboard"`, `"mouse"`, etc.
- **Last Changed:** Mar 4, 2026
- **Use Cases:**
  - Control scheme popularity
  - Win rate by control type
  - Movement preference trends

---

## 👥 PLAYER BEHAVIOR & ENGAGEMENT

### 22. Is Replay
- **Dimension Name:** `Is Replay`
- **Parameter Name:** `is_replay`
- **Description:** Did the player play again after game over?
- **Possible Values:** `"true"`, `"false"`
- **Last Changed:** Feb 27, 2026
- **Use Cases:**
  - Replay rate calculation
  - Engagement retention
  - Replay incentive effectiveness

---

### 23. Games Played
- **Dimension Name:** `Games Played`
- **Parameter Name:** `games_played`
- **Description:** How many games has the player played?
- **Possible Values:** Numeric strings (`"1"`, `"2"`, `"3"`, etc.)
- **Last Changed:** Feb 27, 2026
- **Use Cases:**
  - Player lifetime value (sessions per player)
  - Returning player identification
  - Session depth cohort analysis

---

### 24. Visit Count
- **Dimension Name:** `Visit Count`
- **Parameter Name:** `visit_count`
- **Description:** How many times has a player visited the site
- **Possible Values:** Numeric strings (`"1"`, `"2"`, `"3"`, etc.)
- **Last Changed:** Feb 27, 2026
- **Use Cases:**
  - Returning visitor rate
  - Player retention tracking
  - Visit frequency distribution

---

### 25. Source
- **Dimension Name:** `Source`
- **Parameter Name:** `source`
- **Description:** Where the action originated (e.g., 'game_over' screen, 'pause_menu')
- **Possible Values:** Context strings (game UI states)
- **Last Changed:** Feb 27, 2026
- **Use Cases:**
  - User flow tracking
  - Event origin verification
  - UI interaction analysis

---

## 🎵 A/B TESTING & VARIANTS

### 26. AB Music Group ⭐ ACTIVE A/B TEST
- **Dimension Name:** `AB Music Group`
- **Parameter Name:** `ab_music_group`
- **Description:** A/B test group for music default setting
- **Possible Values:** `"control"` (music off by default), `"variant"` (music on by default)
- **Last Changed:** Feb 23, 2026
- **Use Cases:**
  - Music default setting A/B test
  - Win rate comparison by music group
  - Session length impact
- **Dashboard Usage:** A/B Testing page (live.html:983-1048)

---

### 27. Music Variant
- **Dimension Name:** `Music Variant`
- **Parameter Name:** `music_variant`
- **Description:** Actual music state when the event fired
- **Possible Values:** `"on"`, `"off"`
- **Last Changed:** Feb 27, 2026
- **Use Cases:**
  - Music on/off engagement comparison
  - Conversion rate by music state
  - Funnel analysis by music variant
- **Dashboard Usage:** Funnel by Music Variant (live.html:1590-1600)

---

### 28. Analytics Version ⭐ ALREADY IN USE
- **Dimension Name:** `Analytics Version`
- **Parameter Name:** `analytics_version`
- **Description:** Analytics Version 4.3 - AI Agent tracking enabled
- **Possible Values:** `"4.2"`, `"4.3"`, etc.
- **Last Changed:** Apr 3, 2026
- **Use Cases:**
  - Version filtering (isolate v4.3 data with AI agent)
  - Cross-version comparison
  - Feature rollout tracking
- **Dashboard Usage:** Combined version + date range selector (live.html:1388-1403)
- **Lambda Usage:** Already implemented in dimension filter (api/index.js:32-40)

---

## 🏆 LEADERBOARD & SCORING

### 29. Rank
- **Dimension Name:** `Rank`
- **Parameter Name:** `rank`
- **Description:** Global leaderboard position (1-25) when event fires
- **Possible Values:** `"1"` through `"25"` (top 25 only)
- **Last Changed:** Apr 3, 2026
- **Use Cases:**
  - Top player behavior analysis
  - Leaderboard submission patterns
  - High score achievement tracking

---

### 30. Instagram Provided
- **Dimension Name:** `Instagram Provided`
- **Parameter Name:** `instagram_provided`
- **Description:** Did the player provide and submit their Instagram handle?
- **Possible Values:** `"true"`, `"false"`
- **Last Changed:** Feb 23, 2026
- **Use Cases:**
  - Instagram opt-in rate
  - Social integration effectiveness
  - Leaderboard submission funnel

---

## 🌐 PLATFORM & ENVIRONMENT

### 31. Platform
- **Dimension Name:** `Platform`
- **Parameter Name:** `platform`
- **Description:** Which version of the game the player is using
- **Possible Values:** `"WEB"`, `"APP"`, etc.
- **Last Changed:** Feb 27, 2026
- **Use Cases:**
  - Web vs app performance comparison
  - Platform-specific metrics
  - Deployment environment tracking
- **Note:** Different from GA4's built-in `deviceCategory` (desktop/mobile/tablet)

---

## 📊 PHASE 6A IMPLEMENTATION STATUS

### Currently Used Dimensions (Phase 5-6A)

✅ **analytics_version** - Task 5B: Combined selector
✅ **boss_id** - Task 7: Boss Analysis (ready to implement)
⚠️ **phase** - Future enhancement
⚠️ **level** - Future enhancement
⚠️ **powerup_type** - Future enhancement

### High-Value Dimensions for Future Phases

**Phase 6B Candidates:**
- `customEvent:phase` - Phase-specific funnel analysis
- `customEvent:level_reached` - Enhanced wave drop-off chart
- `customEvent:powerup_type` - Powerup effectiveness tracking
- `customEvent:session_duration_seconds` - Daily timeseries survival time fix

**Phase 6C Candidates (AI Agent Deep Dive):**
- `customEvent:tier` - Tier distribution analysis
- `customEvent:old_tier` + `customEvent:new_tier` - Tier flow diagram
- `customEvent:direction` - AI adjustment triggers
- `customEvent:effective_multiplier` - Score multiplier impact

**Phase 6D Candidates (Advanced Analytics):**
- `customEvent:movement_group` - Control scheme analysis
- `customEvent:games_played` - Player lifetime value
- `customEvent:visit_count` - Retention cohort analysis

---

## 🔍 MULTI-DIMENSIONAL QUERY OPPORTUNITIES

### Boss Difficulty by Platform & Phase
```javascript
dimensions: [
  { name: 'deviceCategory' },
  { name: 'customEvent:boss_id' },
  { name: 'customEvent:phase' }
]
```
**Insight:** Which boss × phase × platform combination is hardest?

---

### AI Tier Progression by Movement Scheme
```javascript
dimensions: [
  { name: 'customEvent:movement_group' },
  { name: 'customEvent:old_tier' },
  { name: 'customEvent:new_tier' }
]
```
**Insight:** Do keyboard players improve faster than mouse players?

---

### Powerup Effectiveness by Tier
```javascript
dimensions: [
  { name: 'customEvent:powerup_type' },
  { name: 'customEvent:tier' },
  { name: 'eventName' }
]
```
**Insight:** Which powerups help low-tier players most?

---

### Session Duration by Music & AB Group
```javascript
dimensions: [
  { name: 'customEvent:ab_music_group' },
  { name: 'customEvent:music_variant' },
  { name: 'customEvent:session_duration_seconds' }
]
```
**Insight:** Does music default setting affect engagement duration?

---

## 📝 USAGE NOTES

### Querying Custom Dimensions in Lambda

**Syntax:** `customEvent:parameter_name`

**Example:**
```javascript
dimensions: [
  { name: 'customEvent:boss_id' },
  { name: 'eventName' }
]
```

**Dimension Filter Example:**
```javascript
dimensionFilter: {
  filter: {
    fieldName: 'customEvent:analytics_version',
    stringFilter: {
      matchType: 'EXACT',
      value: '4.3'
    }
  }
}
```

---

### Data Availability

- **Registration Date:** When dimension was created in GA4 Admin
- **Data Availability:** Only events **after** registration date have dimension values
- **Backfill:** GA4 does not backfill custom dimensions - historical data before registration has no values

**Example:**
- `boss_id` registered Feb 27, 2026
- Data available from Feb 27, 2026 onwards
- Events before Feb 27 will have empty `boss_id` values

---

### Query Quota Considerations

**GA4 API Limits:**
- **Real-time API:** 10 concurrent requests
- **Standard API:** 200,000 tokens per day per property
- **Multi-dimensional queries cost more tokens**

**Best Practices:**
- Batch related dimensions in single query (platform + boss_id + eventName)
- Use date ranges to limit data volume
- Cache responses client-side (1 hour refresh)
- Monitor quota usage in GA4 Admin

---

## 🚀 NEXT STEPS

### Phase 6A Task 7 (Immediate)
- Use `customEvent:boss_id` for Boss Analysis endpoint ✅
- Combine with `deviceCategory` for platform split
- Events: `boss_attempt`, `boss_defeated`

### Future Phase Considerations
1. **Phase 6B:** Add `phase`, `level_reached`, `powerup_type` queries
2. **Phase 6C:** AI Agent deep dive with tier dimensions
3. **Phase 6D:** Player behavior with `games_played`, `visit_count`
4. **Phase 7:** Custom dimension cleanup (archive unused dimensions)

---

**Document Version:** 1.0
**Created:** June 9, 2026
**Author:** Claude (Phase 6A Session)
**Source:** GA4 Admin screenshots + game code analysis

---

## APPENDIX: Dimension Summary Table

| # | Dimension Name | Parameter | Category | Phase 6A Status | Last Changed |
|---|---|---|---|---|---|
| 1 | AB Music Group | ab_music_group | A/B Testing | Available | Feb 23, 2026 |
| 2 | Analytics Version | analytics_version | Platform | ✅ IN USE (Task 5B) | Apr 3, 2026 |
| 3 | Bonus HP | bonus_hp | Boss & Level | Available | Mar 2, 2026 |
| 4 | Boss ID | boss_id | Boss & Level | ⭐ TASK 7 TARGET | Feb 27, 2026 |
| 5 | Continue | continue | Replay & Session | Available | Mar 2, 2026 |
| 6 | Cycles Completed | cycles_completed | Game Progression | Available | Apr 3, 2026 |
| 7 | Death Phase | death_phase | Boss & Level | Available | Mar 2, 2026 |
| 8 | Direction | direction | AI Agent | Available | Apr 3, 2026 |
| 9 | Effective Multiplier | effective_multiplier | AI Agent | Available | Apr 3, 2026 |
| 10 | Game Phase | phase | Game Progression | Future | Feb 27, 2026 |
| 11 | Games Played | games_played | Player Behavior | Available | Feb 27, 2026 |
| 12 | Instagram Provided | instagram_provided | Leaderboard | Available | Feb 23, 2026 |
| 13 | Is Replay | is_replay | Player Behavior | Available | Feb 27, 2026 |
| 14 | Level | level | Game Progression | Available | Apr 3, 2026 |
| 15 | Level Number | level_number | Game Progression | Available | Feb 27, 2026 |
| 16 | Level Reached | level_reached | Game Progression | Available | Feb 27, 2026 |
| 17 | Movement Group | movement_group | AI Agent | Available | Mar 4, 2026 |
| 18 | Movement Multiplier | movement_multiplier | AI Agent | Available | Apr 3, 2026 |
| 19 | Music Variant | music_variant | A/B Testing | Available | Feb 27, 2026 |
| 20 | New Tier | new_tier | AI Agent | Available | Apr 3, 2026 |
| 21 | Old Tier | old_tier | AI Agent | Available | Apr 3, 2026 |
| 22 | Platform | platform | Platform | Available | Feb 27, 2026 |
| 23 | Powerup Type | powerup_type | Game Progression | Future | Feb 27, 2026 |
| 24 | Rank | rank | Leaderboard | Available | Apr 3, 2026 |
| 25 | Replay Tier | replay_tier | Boss & Level | Available | Mar 2, 2026 |
| 26 | Session Duration Seconds | session_duration_seconds | Game Progression | Future (survival time) | Feb 27, 2026 |
| 27 | Source | source | Player Behavior | Available | Feb 27, 2026 |
| 28 | Speed Locked | speed_locked | Game Progression | Available | Apr 3, 2026 |
| 29 | Tier | tier | AI Agent | Available | Apr 3, 2026 |
| 30 | Tier Multiplier | tier_multiplier | AI Agent | Available | Apr 3, 2026 |
| 31 | Visit Count | visit_count | Player Behavior | Available | Feb 27, 2026 |

**Total:** 31 custom dimensions
**In Use:** 1 (analytics_version)
**Next Target:** boss_id (Task 7)
**Future High-Value:** phase, level_reached, powerup_type, session_duration_seconds, tier dimensions