# NON-X Analytics

Analytics infrastructure and live dashboard for the NON-X space shooter game.

## Files

- `live.html` - Live analytics dashboard (GA4 API integration, 7 tabs, ~88% live data)
- `api/index.js` - AWS Lambda handler (15 GA4 + BigQuery endpoints)
- `NON-X_Analytics_Export_Guide.docx` - GA4 setup and export reference guide

## Analytics Infrastructure

- **GA4 Property:** NON-X (ID: 525680332)
- **Current Version:** analytics_version 4.3
- **Events Tracked:** 18 event types, 31 custom dimensions
- **Lambda API:** AWS (us-east-2) — `6waopo3jh1.execute-api.us-east-2.amazonaws.com/prod`
- **Hosting:** GitHub Pages — staging + production branches via GitHub Actions CI/CD
- **BigQuery:** GA4 export linked (`non-x-analytics-server`, daily export)

## Dashboard Tabs

1. Overview — Top-line KPIs + daily timeseries
2. Player Behavior — Engagement KPIs (scorecard, music, leave, boss reach, survey, returning)
3. Boss Analysis — Attempts/defeats by boss and platform
4. A/B Tests — Music and movement group comparisons + funnel table
5. AI Agent — Tier distribution, flow chart, score multiplier, death triggers
6. Case Study — Key findings and technical writeup
7. Data Dictionary — Full metric definitions, formulas, and source mapping

## Key Metrics (~88% live)

- Session outcomes (win/death/abandoned)
- Boss defeat rates by platform
- Music and movement A/B test results
- AI difficulty adjustment tracking
- Avg start/final tier (BigQuery)
- Returning vs new player rate

## Docs

See `docs/` for planning docs, issue tracker, and session history.
For full metric definitions see `docs/Data_Dictionary.md`.
