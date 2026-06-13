# Case Study Page — Implementation Plan

**Purpose:** Tab 6 on the live dashboard. Replaces the Looker tab. Tells the story of the NON-X analytics build for two audiences simultaneously: casual readers (left column) and technical readers (right column).

**Created:** June 13, 2026
**Status:** ✅ COMPLETE — June 13, 2026 | Commit: `daf9a12`
**File:** `live.html` — Tab 6, replaces Looker Guide

---

## ⚠️ Live Update Requirements

The right-column **Scale** and **Key Findings** sections contain static numbers that must be updated when new work ships:

| Trigger | Section to update | What to change |
|---------|------------------|----------------|
| New BigQuery metric added (MT-6) | Scale → API endpoints | `15` → new count |
| New BigQuery metric added (MT-6) | Key Findings | Add new stat row if finding is significant |
| Dashboard hits 100% live data | Scale → Live data coverage | `~88%` → `~100%` |
| `final_score` ships + chart added | What's Next | Remove `final_score` sentence |
| Tier Delta / Win-by-tier added | Key Findings | Add tier delta stat |
| Sessions per User added | Key Findings | Add retention stat |
| Line count grows significantly | Scale → Dashboard code | Update `5,407 lines` |

**How to update:** Edit `live.html` lines ~2077–2123 (right column of case-study-grid). All content is static HTML — no fetch calls, no JS needed.

---

## Purpose of the Case Study

The Case Study answers: *"Why does this dashboard exist and what did it reveal?"*

It is a public-facing page visible to anyone who opens the dashboard. It serves two audiences:

- **Left column (casual):** Game stakeholders, players, press. Explains what was measured, what was surprising, and what decisions were made because of the data. No code, no jargon.
- **Right column (technical):** Developers, data engineers, potential collaborators. Explains the stack, architecture choices, query patterns, and statistical caveats.

It is NOT:
- An API documentation page (that's the Data Dictionary)
- A live data page (all content is static, written once)
- A sensitive page (no API keys, Lambda URLs, or AWS infrastructure details)

---

## Research Findings (from Haiku agent, June 13, 2026)

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JavaScript — no framework |
| Charts | Chart.js v4.4.1 (CDN, SRI-hashed) |
| Fonts | Share Tech Mono + Exo 2 (Google Fonts) |
| Hosting | GitHub Pages (`kstanigar.github.io`) |
| Backend | AWS Lambda (Node.js) |
| API | AWS API Gateway (REST, CORS-locked to GitHub Pages) |
| Logging | AWS CloudWatch |
| Primary data | GA4 Data API (`@google-analytics/data`) |
| Session data | Google BigQuery (`@google-cloud/bigquery`) |
| Auth | GCP Service Account (JSON key in Lambda env var) |
| CI/CD | GitHub Actions (auto-deploy on push to `staging`/`main`) |

### Scale
| Metric | Value |
|--------|-------|
| Dashboard lines of code | 5,407 (live.html) |
| Lambda lines of code | 438 (api/index.js) |
| JS functions | 62 |
| Lambda endpoints | 15 (14 GA4 + 1 BigQuery) |
| GA4 custom dimensions | 31 registered |
| Git commits | 78 (March–June 2026) |
| Live data coverage | ~88% |
| Build time | ~12 weeks |

### Architecture Notes
- Single Lambda function routes all 15 endpoint types via `subType` query param
- Whitelist-based input validation — unknown params return 400 before any GA4 query fires
- BigQuery lazy-loaded — client only initialised when `avg-tier` handler is called
- 24h in-memory cache on BigQuery results (matches daily export cadence)
- 500MB `maxBytesBilled` safety cap on all BigQuery queries
- CORS locked to `https://kstanigar.github.io` — API rejects all other origins
- Error sanitisation — `error.message` never sent to client; only "Internal server error"
- GitHub Actions deploys staging + production from two branches automatically

### Key Data Findings (for left column)
- Mobile players survive ~2× longer than desktop (6:35 vs 3:34 avg)
- Music OFF group wins more often (44% vs 23% win rate) — surprising
- Music OFF players reach Boss 1 at 64% vs Music ON at 37% (−27.1pp)
- 75% of players are returning users
- AI mostly increases difficulty: 25 increases vs 3 decreases across all sessions
- Most deaths occur in early Green phase (L1–L4) and at Boss 2 (L8)
- Mobile players collect ~5× more powerups than desktop

---

## Layout Spec

### Tab Button
- Label: `CASE STUDY`
- Position: After the existing A/B tab button, before Data Dictionary (Tab 7)
- Same styling as other tab buttons

### Page Structure

```
[TAB HEADER]
NON-X ANALYTICS — CASE STUDY

[TWO-COLUMN GRID]
Left column (60%)        |  Right column (40%)
─────────────────────────|────────────────────────────
ABOUT THE PROJECT        |  TECHNICAL STACK
THE FINDINGS             |  ARCHITECTURE
DESIGN DECISIONS         |  QUERY DESIGN
WHAT'S NEXT              |  STATISTICAL NOTES
```

---

## Content Outline

### LEFT COLUMN — Casual / Narrative

**Section 1: About the Project**
- NON-X is a browser-based action game with an adaptive AI difficulty system
- Built a custom analytics dashboard to understand how players experience the game
- Goal: replace gut-feel design decisions with data

**Section 2: What We Measured**
- 31 custom GA4 events + dimensions tracking every meaningful player action
- Two A/B tests (music default, movement scheme)
- AI difficulty tier system (7 tiers, −3 to +3)
- Survival time, boss defeat rates, powerup usage, wave progression

**Section 3: Key Findings**
- Mobile vs desktop behaviour split (survival time, powerup usage)
- Music A/B result (Music OFF players win more — counterintuitive)
- AI difficulty trend (almost always increases — players getting better or AI too easy at low tiers?)
- Early-level deaths dominate — L1–L4 green phase is the drop-off zone

**Section 4: Design Decisions Made From Data**
- Investigating why Music OFF wins more (is music distracting?)
- Early-level difficulty tuning flagged as priority
- Movement A/B shows heavy imbalance (19 vs 93 sessions) — assignment logic under review
- AI system confirmed working: 25 increases vs 3 decreases shows calibration is active

**Section 5: What's Next**
- Session-level BigQuery metrics (tier delta, win rate by starting tier)
- Cohort retention analysis
- Final score tracking once game update ships

---

### RIGHT COLUMN — Technical

**Section 1: Stack**
- Vanilla JS + Chart.js v4.4.1 (no framework — keeps bundle zero)
- AWS Lambda (Node.js) as GA4 proxy — hides service account credentials server-side
- GitHub Pages hosting — free, zero AWS credentials in repo, custom domain ready

**Section 2: Architecture**
- Single Lambda handler, 15 endpoints routed by `?subType=` param
- GA4 Data API for 14/15 endpoints (aggregated, fast, cheap)
- BigQuery for session-level joins (first/last event per session) — GA4 API cannot do this
- GitHub Actions: push to `staging` → auto-deploy to staging URL; push to `main` → production

**Section 3: Query Design**
- Multi-dimensional GA4 queries (up to 7 dimensions per request)
- Date range + version filtering on every query (`analytics_version = 4.3`)
- FIRST_VALUE / LAST_VALUE window functions in BigQuery for session-level aggregation
- 500MB cost cap on BigQuery; 24h in-memory cache (matches daily export lag)

**Section 4: Security**
- CORS locked to GitHub Pages origin only
- Input validation whitelist — unknown params return 400 before GA4 is touched
- Error sanitisation — server errors log to CloudWatch, client gets generic message
- No credentials in source code; service account JSON in Lambda env var

**Section 5: Statistical Notes**
- A/B test sample sizes are small (Music: 73/39 sessions; Movement: 19/93)
- `⚠ Insufficient` shown on dashboard when n < threshold — results directional, not conclusive
- BigQuery export has 24–48h lag — KPIs reflect yesterday's sessions, not today
- Version filtering (`v4.3`) isolates current game build from older data

---

## HTML Implementation Plan

### Step 1 — Tab Button

Find the last existing tab button (A/B tab) and add Case Study after it.

**Search for:** `data-tab="ab"` button
**Add after it:**
```html
<button class="tab-btn" data-tab="case-study">CASE STUDY</button>
```

### Step 2 — Tab Page div

Find the A/B tab page div and add Case Study page after it.

**Search for:** `id="page-ab"` closing tag
**Add after it:**
```html
<div id="page-case-study" class="page" style="display:none">
  <!-- full case study content -->
</div>
```

### Step 3 — Two-column layout CSS

Add to existing `<style>` block:
```css
.case-study-grid {
  display: grid;
  grid-template-columns: 60fr 40fr;
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 0;
}
.case-study-section {
  margin-bottom: 32px;
}
.case-study-section h3 {
  color: var(--cyan);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(0,255,255,0.2);
  padding-bottom: 8px;
}
.case-study-section p {
  color: var(--text);
  font-size: 0.85rem;
  line-height: 1.7;
  margin-bottom: 10px;
}
.case-study-finding {
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
  align-items: flex-start;
}
.case-study-stat {
  color: var(--cyan);
  font-family: var(--font-mono);
  font-size: 1.1rem;
  min-width: 80px;
  flex-shrink: 0;
}
.case-study-label {
  color: var(--text);
  font-size: 0.82rem;
  line-height: 1.5;
}
.cs-tech-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  font-size: 0.8rem;
}
.cs-tech-key { color: var(--text-dim); }
.cs-tech-val { color: var(--text); font-family: var(--font-mono); }
@media (max-width: 768px) {
  .case-study-grid { grid-template-columns: 1fr; }
}
```

### Step 4 — Full page HTML

Insert inside `#page-case-study`:

```html
<div class="page-header">
  <h2>CASE STUDY</h2>
  <p class="page-subtitle">NON-X Analytics — How player data shaped game design</p>
</div>
<div class="case-study-grid">

  <!-- LEFT COLUMN -->
  <div class="case-study-left">

    <div class="case-study-section">
      <h3>About the Project</h3>
      <p>NON-X is a browser-based action game featuring an adaptive AI difficulty system that adjusts between 7 tiers in real time based on player performance. This dashboard was built to answer one question: <em>is the game actually working as designed?</em></p>
      <p>Rather than relying on gut feel, every meaningful player action — from powerup collection to boss attempts to AI tier changes — is tracked through 31 custom GA4 dimensions and aggregated via a serverless analytics pipeline.</p>
    </div>

    <div class="case-study-section">
      <h3>Key Findings</h3>
      <div class="case-study-finding">
        <span class="case-study-stat">2×</span>
        <span class="case-study-label">Mobile players survive twice as long on average (6:35 vs 3:34). Desktop players die quickly; mobile players play carefully.</span>
      </div>
      <div class="case-study-finding">
        <span class="case-study-stat">+21pp</span>
        <span class="case-study-label">Music OFF group wins more often (44% vs 23% win rate). Music OFF players also reach Boss 1 at a higher rate (64% vs 37%). Counterintuitive — under investigation.</span>
      </div>
      <div class="case-study-finding">
        <span class="case-study-stat">75%</span>
        <span class="case-study-label">Of all players are returning users, suggesting strong early retention despite small sample size.</span>
      </div>
      <div class="case-study-finding">
        <span class="case-study-stat">25 vs 3</span>
        <span class="case-study-label">AI difficulty adjustments: 25 increases vs 3 decreases. The system is actively pushing players harder — it's working.</span>
      </div>
      <div class="case-study-finding">
        <span class="case-study-stat">L1–L4</span>
        <span class="case-study-label">Most deaths occur in the early Green phase, not at boss fights. The opening levels are where the game loses players.</span>
      </div>
      <div class="case-study-finding">
        <span class="case-study-stat">5×</span>
        <span class="case-study-label">Mobile players collect roughly 5× more powerups than desktop players — likely a touch-control advantage.</span>
      </div>
    </div>

    <div class="case-study-section">
      <h3>Design Decisions Made From Data</h3>
      <p><strong>Early-level difficulty:</strong> Green phase death concentration (L1–L4) flagged as a tuning priority. Players are dropping out before the game's core mechanics are introduced.</p>
      <p><strong>Music experiment:</strong> The Music OFF win rate advantage is directional (small n) but consistent enough to warrant investigation into whether background music affects concentration.</p>
      <p><strong>Movement A/B:</strong> Group assignment shows a 19 vs 93 session split — heavily imbalanced. Assignment logic under review before reading results as significant.</p>
      <p><strong>AI calibration confirmed:</strong> Data confirms the tier system is actively adjusting. The near-absence of downward adjustments suggests players consistently improve or the system weights increases more aggressively.</p>
    </div>

    <div class="case-study-section">
      <h3>What's Next</h3>
      <p>Session-level BigQuery analysis will add tier delta (how much the AI moves per session), win rate by starting tier, and cohort retention curves. A final score tracking update in the game will unlock the Tier vs Final Score correlation chart.</p>
    </div>

  </div>

  <!-- RIGHT COLUMN -->
  <div class="case-study-right">

    <div class="case-study-section">
      <h3>Stack</h3>
      <div class="cs-tech-row"><span class="cs-tech-key">Frontend</span><span class="cs-tech-val">Vanilla JS · Chart.js 4.4.1</span></div>
      <div class="cs-tech-row"><span class="cs-tech-key">Hosting</span><span class="cs-tech-val">GitHub Pages</span></div>
      <div class="cs-tech-row"><span class="cs-tech-key">CI/CD</span><span class="cs-tech-val">GitHub Actions</span></div>
      <div class="cs-tech-row"><span class="cs-tech-key">Backend</span><span class="cs-tech-val">AWS Lambda (Node.js)</span></div>
      <div class="cs-tech-row"><span class="cs-tech-key">API</span><span class="cs-tech-val">AWS API Gateway (REST)</span></div>
      <div class="cs-tech-row"><span class="cs-tech-key">Primary data</span><span class="cs-tech-val">Google Analytics 4 API</span></div>
      <div class="cs-tech-row"><span class="cs-tech-key">Session data</span><span class="cs-tech-val">Google BigQuery</span></div>
      <div class="cs-tech-row"><span class="cs-tech-key">Auth</span><span class="cs-tech-val">GCP Service Account</span></div>
    </div>

    <div class="case-study-section">
      <h3>Scale</h3>
      <div class="cs-tech-row"><span class="cs-tech-key">Dashboard code</span><span class="cs-tech-val">5,407 lines</span></div>
      <div class="cs-tech-row"><span class="cs-tech-key">Lambda code</span><span class="cs-tech-val">438 lines</span></div>
      <div class="cs-tech-row"><span class="cs-tech-key">API endpoints</span><span class="cs-tech-val">15 (14 GA4 + 1 BigQuery)</span></div>
      <div class="cs-tech-row"><span class="cs-tech-key">Custom dimensions</span><span class="cs-tech-val">31 registered in GA4</span></div>
      <div class="cs-tech-row"><span class="cs-tech-key">Git commits</span><span class="cs-tech-val">78 (Mar–Jun 2026)</span></div>
      <div class="cs-tech-row"><span class="cs-tech-key">Live data coverage</span><span class="cs-tech-val">~88%</span></div>
    </div>

    <div class="case-study-section">
      <h3>Architecture</h3>
      <p>A single Lambda function handles all 15 endpoints, routing by <code>?subType=</code> query parameter. GA4's Data API handles 14 endpoints — fast, cheap, pre-aggregated. BigQuery handles session-level joins that the GA4 API cannot perform (e.g. first and last difficulty tier within a single session).</p>
      <p>GitHub Actions runs two pipelines: pushes to <code>staging</code> auto-deploy to the staging URL; pushes to <code>main</code> deploy to production. No manual upload step.</p>
    </div>

    <div class="case-study-section">
      <h3>Query Design</h3>
      <p>GA4 queries use up to 7 dimensions per request, version-filtered to <code>analytics_version = 4.3</code> on every call. BigQuery uses <code>FIRST_VALUE</code> / <code>LAST_VALUE</code> window functions partitioned by <code>ga_session_id</code> for session-scoped aggregations.</p>
      <p>A 500MB <code>maxBytesBilled</code> cap prevents runaway BigQuery costs. A 24-hour in-memory cache on BigQuery results matches the daily export cadence — no benefit in querying more frequently.</p>
    </div>

    <div class="case-study-section">
      <h3>Security</h3>
      <p>CORS locked to the GitHub Pages origin. Input validation whitelist rejects unknown params with HTTP 400 before any GA4 query fires. Server errors log to CloudWatch only — clients receive "Internal server error" with no internal detail. No credentials in source code.</p>
    </div>

    <div class="case-study-section">
      <h3>Statistical Notes</h3>
      <p>A/B sample sizes are small: Music (73 vs 39 sessions), Movement (19 vs 93 sessions). Results marked <em>⚠ Insufficient</em> on the A/B tab — directional signals, not statistically conclusive. BigQuery KPIs lag 24–48 hours behind real time due to daily export cadence.</p>
    </div>

  </div>
</div>
```

---

## Possible Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Tab not switching | `data-tab="case-study"` doesn't match `id="page-case-study"` | Verify both values match exactly |
| Grid collapses on mobile | CSS grid not in `<style>` block | Confirm CSS inserted before closing `</style>` |
| Styles bleed into other tabs | CSS selectors too broad | Scope all rules to `.case-study-*` prefix |
| Content outside scroll area | Missing wrapper div | Wrap content in existing `.page-content` div if other tabs use one |

---

## Testing Checklist

- [ ] Tab button appears in nav bar, clicks correctly
- [ ] Page shows/hides with other tabs (no flash)
- [ ] Two-column layout visible on desktop
- [ ] Single column on mobile (< 768px)
- [ ] All stat numbers match current dashboard data
- [ ] No sensitive info present (no Lambda URL, no API keys, no dataset IDs)
- [ ] Styling consistent with rest of dashboard (dark bg, cyan headings)

---

## Dependencies

- None — all content is static, no fetch calls, no live data
- Data Dictionary (Tab 7) can be added after without modifying this page

---

**User Approval Required Before Implementation**
