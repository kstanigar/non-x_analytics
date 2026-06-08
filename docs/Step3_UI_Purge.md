# Step 3: The UI Purge
## Understanding the Task
As we enter **Phase 4** of the AWS Lambda & GA4 Analytics Bridge implementation, the goal is to shift from a manual drag-and-drop workflow to an automated, serverless architecture that pulls live data from GA4 through AWS API Gateway. 

Because we are bridging directly to the new API endpoint, the previous CSV uploading mechanism in `live.html` is deprecated. Step 3 involves a "UI Purge," which means taking out the dead interface elements and interactions associated with CSV files so that we have a clean slate to wire up the new JSON `fetch()` payloads.

### Removals Executed:
1. **CSS Blocks:** Removing `#drop-zone`, `.csv-toolbar`, `.csv-tracker`, `.csv-chip`, and `.csv-toast` styling.
2. **HTML Blocks:** Removing the drag-and-drop overlay (`div#drop-zone`), the file input element (`input#csv-file-input`), the visual toolbar, the tracker showing loaded states, and the notification toast.
3. **Javascript Logic:** Stripping out the `dragover` / `drop` event listeners that intercepted local file drops on the browser body, as well as the file input listener. We'll also eventually purge the manual CSV parsing rows, once we introduce the JSON data mapping `fetch()` script.

## UI Purge Task List
- [x] **Remove CSV CSS**: Strip out `#drop-zone`, `.csv-toolbar`, `.csv-tracker`, `.csv-chip`, `.csv-btn`, `.csv-version-badge`, and `.csv-toast` classes from `<style>`.
- [x] **Remove HTML Overlays**: Delete the `#drop-zone` div and `#csv-toast` notification from the `<body>`.
- [x] **Remove HTML Trackers**: Delete the `.csv-toolbar` and `.csv-tracker` components that previously displayed loaded CSV files and manual upload buttons.
- [x] **Remove JS Event Listeners**: Delete the DOMContentLoaded listener block that attaches drag-and-drop interactions to the `body`.
- [x] **Remove Process Parsers**: Demolish all `processCSVFile` and `apply*CSV` parser functions.
- [x] **Stub Fetch Function**: Insert `fetchAnalyticsData(apiUrl)` hook for querying AWS API Gateway URL. 

### Data Mapping (Next Phase)
- [ ] Map the returned JSON payloads from the API Gateway endpoint into the Chart.js metric stores in `live.html` (`DATA.funnel`, `DATA.kpis`, etc).
