# NON-X Analytics - Blog Notes

**Purpose:** Curated session highlights and narratives for blog content. Documents interesting technical challenges, learnings, and project milestones worth sharing publicly.

**Last Updated:** June 8, 2026

---

## 📝 BLOG-WORTHY SESSIONS

Sessions marked for potential blog content, organized by date (newest first).

---

## June 8, 2026 - Debugging a Live Analytics Dashboard: 3 Critical Data Issues

**Status:** ⭐ BLOG-READY
**Estimated Reading Time:** 8-10 minutes
**Tags:** #debugging #analytics #ga4 #data-accuracy #dashboard

### Hook:
"My analytics dashboard showed a 0% win rate and 100% death rate. Players were definitely winning the game. What went wrong?"

### Story Arc:

**Act 1: The Problem**
- User reports: "The data is wrong"
- Dashboard shows 0% win rate, 100% death rate
- 35 sessions, but most metrics empty or incorrect
- Win Rate + Death Rate ≠ 100% (major red flag)

**Act 2: The Investigation**
- Launched AI agent (Haiku) to investigate data accuracy
- Discovered 3 critical bugs affecting all KPI calculations
- Each bug compounded the other, creating misleading metrics

**Act 3: The Bugs**

1. **Bug #1: Death Rate Formula**
   - **Issue:** Divided deaths by ALL game starts (including abandoned games)
   - **Impact:** Showed 15.8% instead of true 44.4%
   - **Fix:** Only count completed games (wins + deaths) in denominator
   - **Lesson:** Always validate denominators in percentage calculations

2. **Bug #4: Event Name Mismatch**
   - **Issue:** Dashboard looked for `player_won`, GA4 sent `game_complete`
   - **Impact:** 0% win rate despite players winning
   - **Discovery:** Checked raw API response, found 5 `game_complete` events
   - **Fix:** Updated event mapping to use correct name
   - **Lesson:** Never assume event names - always verify with actual data

3. **Bug #5: Hardcoded Mock Data**
   - **Issue:** Powerup chart showed Quad Shot in Green/Red phases (impossible)
   - **Root Cause:** Chart displayed static sample data, not live GA4 data
   - **Fix:** Corrected mock values to reflect game design (Quad Shot = Purple only)
   - **Lesson:** Mock data must match real-world constraints

**Act 4: The Resolution**
- All 3 bugs fixed in ~2.5 hours
- Dashboard now shows accurate metrics:
  - Win Rate: 55.6% ✅
  - Death Rate: 44.4% ✅
  - Total: 100% ✅
- Data integrity restored

### Technical Details Worth Highlighting:

**Before Fix:**
```javascript
// Bug: Includes abandoned games
const deathRate = gameStarts > 0
  ? ((playerDeath / gameStarts) * 100).toFixed(1) + '%'
  : '0%';

// Result: 15.8% (misleading)
```

**After Fix:**
```javascript
// Fixed: Only completed games
const completedGames = playerWon + playerDeath;
const deathRate = completedGames > 0
  ? ((playerDeath / completedGames) * 100).toFixed(1) + '%'
  : '0%';

// Result: 44.4% (accurate)
```

### Key Takeaways:
1. **Validate data sources:** Don't assume event names match expectations
2. **Check your math:** Percentages should add up to 100%
3. **Mock data is dangerous:** Must reflect real constraints
4. **Debug methodically:** Investigate → Identify → Fix → Validate

### Potential Blog Formats:
- **Tutorial:** "How to Debug Analytics Dashboards: A Real-World Case Study"
- **Technical Deep Dive:** "3 Subtle Bugs That Broke Our Analytics (And How We Fixed Them)"
- **Lessons Learned:** "What I Learned Building a Live GA4 Dashboard"

### Assets for Blog:
- Screenshot: Dashboard showing 0% win rate (before)
- Screenshot: Dashboard showing 55.6% win rate (after)
- Code diff: Death rate formula fix
- API response: JSON showing `game_complete` event
- Chart comparison: Powerup phase data (before/after)

---

## April 26-27, 2026 - The $30,000 Token Mistake: When Regex Goes Wrong

**Status:** 📝 DRAFT
**Estimated Reading Time:** 5-7 minutes
**Tags:** #lessons-learned #regex #error-recovery #coding-mistakes

### Hook:
"I tried to use regex to replace HTML content. It deleted 857 lines of code and cost 30,000 AI tokens to recover. Here's what I learned."

### Story Summary:
- Attempted to use Python regex to replace Looker tab content
- Regex pattern too broad: matched wrong section, deleted Overview page
- Required `git checkout` recovery, lost all session progress
- Had to re-implement 4 completed tasks
- Token cost: ~30,000 wasted
- Time cost: ~45 minutes debugging

### Lesson:
**NEVER use bulk regex replacement for multi-section HTML files. Always use targeted edit commands with verification.**

### Key Moment:
```python
# This regex was TOO BROAD
pattern = r'(    <div class="section-label">).*?(  </div><!-- /looker page -->)'

# Matched FIRST occurrence (Overview page), not Looker page
# Result: 857 lines deleted
```

### Takeaways:
1. Read file sections BEFORE editing
2. Use small, targeted edits with verification
3. Never regex without unique identifiers
4. Git checkpoint after each completed task
5. Ask for approval before risky operations

---

## March 10, 2026 - Building a Serverless Analytics Pipeline with GA4 + AWS Lambda

**Status:** ⭐ BLOG-READY
**Estimated Reading Time:** 12-15 minutes
**Tags:** #serverless #aws #ga4 #lambda #api-gateway

### Hook:
"How we built a real-time analytics dashboard using Google Analytics 4 data, AWS Lambda, and zero servers."

### Architecture Overview:
```
Game → GA4 Events → Lambda Function → API Gateway → Dashboard
```

### Technical Stack:
- **Data Source:** Google Analytics 4 (GA4)
- **Backend:** AWS Lambda (Node.js)
- **API:** Amazon API Gateway (REST)
- **Frontend:** Vanilla JavaScript + Chart.js
- **Auth:** GA4 Service Account (OAuth2)

### Challenges Solved:
1. **CORS Configuration:** Cross-origin requests from localhost/GitHub Pages
2. **Rate Limiting:** 10 req/sec, 1000 req/day to prevent abuse
3. **Lambda Optimization:** Reduced memory from 512 MB → 256 MB (~200ms response)
4. **Error Handling:** Graceful fallback to sample data when API fails

### Cost Analysis:
- **Lambda:** ~$0.03/month (1M requests free tier)
- **API Gateway:** ~$0.00 (1M requests free tier)
- **GA4:** Free (standard tier)
- **Total:** Essentially free for small-scale usage

### Blog Sections:
1. Why Serverless?
2. Setting Up GA4 Service Account
3. Building the Lambda Function
4. Configuring API Gateway (TLS 1.3, CORS, Rate Limiting)
5. Connecting the Dashboard
6. Performance Optimization
7. Cost Breakdown
8. Lessons Learned

### Code Snippets to Include:
- GA4 service account setup
- Lambda function structure
- API Gateway CORS configuration
- Dashboard fetch() implementation

---

## 📌 FUTURE BLOG IDEAS

**Potential Topics:**

- **"From Localhost to CloudFront: Deploying a Static Dashboard to AWS"**
  - Phase 6 AWS S3 + CloudFront deployment
  - CI/CD with GitHub Actions
  - Custom domain setup

- **"The Case for Mock Data in Development (And When It Fails)"**
  - Why we use sample data
  - When mock data misleads (Quad Shot example)
  - Transition strategy to live data

- **"Building a Game Analytics System from Scratch"**
  - Complete series covering Phases 1-6
  - Event tracking design
  - Dashboard development
  - Deployment and monitoring

- **"AI Agents for Code Investigation: Using Claude to Debug Complex Issues"**
  - How Haiku agent investigated powerup data
  - Multi-agent coordination
  - When to use AI vs manual debugging

---

## 📝 BLOG WRITING GUIDELINES

**Tone:**
- Technical but accessible
- Show real mistakes and learnings
- Include code examples and diagrams
- Focus on practical takeaways

**Structure:**
- Hook (interesting problem or question)
- Context (what we were building)
- Challenge (what went wrong or got tricky)
- Solution (how we fixed it)
- Takeaways (lessons learned)

**Assets Needed:**
- Code snippets (before/after)
- Screenshots (dashboard, errors, results)
- Diagrams (architecture, data flow)
- Performance metrics (response times, costs)

---

## 🔗 RESOURCES

**Documentation to Reference:**
- `HANDOFF_SUMMARY.md` - Session details
- `Session_Summary_June8_2026.md` - Detailed reports
- `Issues_And_Bugs.md` - Bug tracking
- Phase handoff summaries - Comprehensive context

**Blog Platform:**
- TBD (Medium, Dev.to, personal blog?)

---

**Last Updated:** June 8, 2026
**Next Review:** After completing Phase 5 Task #5 (Case Study page)