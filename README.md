# NON-X Analytics

Analytics infrastructure and dashboards for the NON-X space shooter game.

## Files

- `nonx-analytics-dashboard.html` - Interactive 6-tab analytics dashboard with CSV drag-and-drop loader
- `NON-X_Analytics_Export_Guide.docx` - Full GA4 + Looker Studio setup guide
- `NON-X_PAIM_Memory.md` - Project AI Model reference document (analytics + game dev)
- `memory.md` - Project memory for continuity between AI sessions

## Analytics Infrastructure

- **GA4 Property:** NON-X (ID: G-9ECFZ9JBE5)
- **Current Version:** analytics_version 3.0
- **Events Tracked:** 26 per game file (game.html + game_mobile.html)
- **Dashboard Features:** Funnel analysis, boss analytics, A/B tests, platform comparison

## Usage

1. Export CSV from GA4
2. Open `nonx-analytics-dashboard.html` in browser
3. Drag-and-drop CSV files into dashboard
4. Ctrl+S to save current week's data for delta calculations

## Key Metrics

- Completion funnel (10 steps)
- Boss kill rates
- Platform comparison
- Music A/B test results
- Replay incentive performance

For full details, see `NON-X_PAIM_Memory.md`.
