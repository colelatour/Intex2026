# Admin Dashboard → “Mission Control” (Replace Static Data With Live Data)

## Scope (what “dashboard page under the Admin tab” is)

The **Admin → Dashboard** section is rendered by:

- `frontend/src/pages/Admin.tsx` (section id: `dashboard`)
- Widgets (currently **static**):
  - `frontend/src/components/admin/KpiCards.tsx`
  - `frontend/src/components/admin/CaseloadTable.tsx`
  - `frontend/src/components/admin/RecentActivity.tsx`
  - `frontend/src/components/admin/BottomCharts.tsx`
  - `frontend/src/components/admin/QuickActions.tsx` (static actions list; keep static, but wire up navigation/opens)

Goal: convert the **static arrays** (`KPI_DATA`, `RESIDENTS`, `ACTIVITIES`, `EVENTS`, chart placeholders) into **real, current data** from the API so the dashboard works as a “mission control” in both **local dev** and **deployed** environments.

Non-goals (do later unless required):

- Rewriting other Admin tabs (Resident Directory / Donor Dashboard / etc.) unless needed for the dashboard data.
- Large schema migrations (only do if absolutely necessary; prefer derived metrics from existing fields).

---

## Current Static Data (what must be replaced)

Replace these **hard-coded** sources:

- KPI cards: `frontend/src/components/admin/KpiCards.tsx` (`KPI_DATA`)
- Caseload table: `frontend/src/components/admin/CaseloadTable.tsx` (`RESIDENTS`)
- Recent activity: `frontend/src/components/admin/RecentActivity.tsx` (`ACTIVITIES`)
- Upcoming events: `frontend/src/components/admin/BottomCharts.tsx` (`EVENTS`)
- Charts: `frontend/src/components/admin/BottomCharts.tsx` currently uses placeholders (no data)

---

## Data Inventory (tables/models already available in backend)

Backend is ASP.NET Core + EF Core with `LighthouseContext` (`backend/Intex2026API/Data/LighthouseContext.cs`), including:

- Residents: `Models/Resident.cs` (fields used for dashboard: `ResidentId`, `SafehouseId`, `CaseCategory`, `AssignedSocialWorker`, `CaseStatus`, `CurrentRiskLevel`, `DateClosed`, `CreatedAt`, `DateOfAdmission`, `ReintegrationStatus`)
- Safehouses: `Models/Safehouse.cs` (`SafehouseId`, `Name`, `Region`, `Status`, `CurrentOccupancy`, `CapacityGirls`)
- Donations: `Models/Donation.cs` (`DonationDate`, `DonationType`, `Amount`, `EstimatedValue`, `CurrencyCode`, `SupporterId`)
- Intervention Plans (case conferences): `Models/InterventionPlan.cs` (`CaseConferenceDate`, `Status`, `ResidentId`)
- Home Visitations: `Models/HomeVisitation.cs` (`VisitDate`, `VisitType`, `ResidentId`, `LocationVisited`, `SocialWorker`)
- Process Recordings: `Models/ProcessRecording.cs` (`SessionDate`, `ResidentId`, `ConcernsFlagged`, `SocialWorker`)
- Incident Reports (optional for “risk flags”): `Models/IncidentReport.cs` (`IncidentDate`, `Severity`, `Resolved`, `FollowUpRequired`)

Notes:

- Several key date fields are `DateOnly?`. Be careful with EF Core translation when grouping by month.
- Many “booleans” are stored as `string?` (`"True"`/`"False"`). Normalize carefully.

---

## Recommended Architecture (keep it fast + stable)

### One dashboard endpoint (preferred)

Implement **one** endpoint that returns everything needed for initial render, to avoid 4–8 separate API calls:

- `GET /api/admin/dashboard` (Authorize: `Admin,Worker`)

Use query params to control size:

- `?days=7&events=8&activity=10&caseload=10&months=12`

### Response contract (example)

Create a DTO on the backend and a matching TS type on the frontend.

**Backend DTO shape (C# records)**

- `serverTimeUtc`: string (ISO)
- `kpis`:
  - `activeResidents`: number
  - `donationsThisMonth`: number
  - `donationsLastMonth`: number (for %+ change)
  - `upcomingConferences`: number
  - `atRiskResidents`: number
- `caseload`: array of rows (top N + enough fields to “View”)
- `activity`: array of events (recent updates across modules)
- `charts`:
  - `donationsMonthly`: array of `{ year: number, month: number, total: number }` (last N months)
  - `residentOutcomes`: array of `{ label: string, count: number }`
- `upcomingEvents`: array of events (home visits + conferences; next N)

**Frontend TS type**

Add `frontend/src/types/AdminDashboard.ts`:

- export interfaces matching the DTO
- keep numbers as numbers (format currency in UI)

---

## Metric Definitions (make these explicit to avoid “random” counts)

### KPI: Active Residents

Definition (recommendation):

- “Active” = residents with `DateClosed == null` (preferred) OR `CaseStatus != "Closed"` if `DateClosed` is unreliable.

### KPI: Donations (This Month)

Definition:

- Sum donations where `DonationDate` is within the current month (UTC-based, since `RecordDonation()` uses `DateTime.UtcNow` → `DateOnly`).
- Use `Amount` if present; fallback to `EstimatedValue`.
- Filter to `DonationType == "Monetary"` if mixing types causes misleading totals (decide once, document it).

Also return last-month total so UI can show `+/- %`:

- last-month range: `[monthStart.AddMonths(-1), monthStart)`

### KPI: Upcoming Conferences (Next 7 days)

Definition:

- Count intervention plans where `CaseConferenceDate` is in `[today, today + days]`
- Optionally only count `Status == "Scheduled"` (if status is used consistently).

### KPI: At-Risk Flags

Definition (recommendation, choose one and stick to it):

- “At-risk resident” if `CurrentRiskLevel` is `High` (or `Severe`) OR `SubCatAtRisk` truthy (`"True"`, `"Yes"`, `"1"`).

Optional extension:

- Add incident-based flags: unresolved incidents within last 14 days OR `FollowUpRequired == "True"`.

### Caseload Overview table

Return rows with:

- `residentId`
- `safehouseId` + `safehouseName`
- `caseType` (use `CaseCategory`)
- `worker` (use `AssignedSocialWorker`)
- `status` (derive from fields; see “Status mapping” below)

Pagination:

- For dashboard, top N is fine; still design the endpoint to support `page`/`pageSize` if you want the “Next →” footer to be real.

### Recent Activity feed

Unify events from multiple tables into a single “activity” list.

Recommended event types:

- `ProcessRecordingAdded` (from `ProcessRecordings`)
- `DonationRecorded` (from `Donations`)
- `HomeVisitScheduled` (from `HomeVisitations`)
- `ResidentCreated` (from `Residents.CreatedAt`)

Timestamp rule:

- Prefer a true `CreatedAt` column. If a table only has `DateOnly`, convert it to a pseudo-timestamp (e.g., midnight UTC) and label it as date-based in UI.

### Upcoming Events list

Combine:

- `HomeVisitations.VisitDate` (title: “Home Visitation”)
- `InterventionPlans.CaseConferenceDate` (title: “Case Conference”)

Include `safehouseName`:

- Either join through the `Resident.SafehouseId`, or show `LocationVisited` if safehouse isn’t known.

### Charts

Donation trends (last N months):

- Build series per month for totals.

Resident outcomes donut:

- Group residents into: `Progressing`, `Monitoring`, `At Risk`, `Reintegrated`

Status mapping recommendation:

- If `DateClosed != null` OR `ReintegrationStatus` contains `"Reintegrat"` → `Reintegrated`
- Else if “at-risk” rules match → `At Risk`
- Else if `CaseStatus` contains `"Monitor"` → `Monitoring`
- Else → `Progressing`

Document the mapping in code (shared function in backend).

---

## Backend Implementation Plan (ASP.NET Core)

### 1) Add a dashboard controller

Create `backend/Intex2026API/Controllers/AdminDashboardController.cs`:

- `[ApiController]`
- `[Route("api/admin/dashboard")]`
- `[Authorize(Roles = "Admin,Worker")]`
- inject `LighthouseContext`

Add:

- `GET /api/admin/dashboard`

Implementation notes:

- Use `AsNoTracking()` on all read-only queries.
- Avoid `.ToListAsync()` then heavy grouping across whole tables unless you’re scoping by a recent window.
- For any grouping by month, keep the query limited to last `months` months first.

### 2) Keep EF queries database-friendly

Be cautious with `DateOnly` grouping. Safe approach:

- Select rows in the required date range into memory (bounded range like 12 months), then group in C#.
- This is acceptable for “dashboard” if bounded and indexed; still keep ranges tight.

### 3) Make joins explicit where needed

For caseload rows:

- Join `Residents` to `Safehouses` on `SafehouseId` to get safehouse name.

### 4) Add minimal DTOs (avoid leaking PII)

Dashboard widgets should not need:

- Resident restricted notes (`NotesRestricted`)
- Full donation notes
- Full narrative blobs

Return only the fields needed for the UI.

---

## Frontend Implementation Plan (React/Vite)

### 1) Centralize dashboard fetch

Add:

- `frontend/src/hooks/useAdminDashboard.ts` (or similar)
- `frontend/src/types/AdminDashboard.ts`

Use existing fetch wrapper:

- `frontend/src/lib/api.ts` (`get()` / `api()`)

Do not hardcode base URLs inside components.

### 2) Replace static arrays with real data

Update these components:

- `frontend/src/components/admin/KpiCards.tsx`
  - accept `kpis` props OR read from `useAdminDashboard()`
  - format currency client-side (e.g., `Intl.NumberFormat`)
- `frontend/src/components/admin/CaseloadTable.tsx`
  - accept `caseload` props
  - implement search client-side for now (or pass search to endpoint later)
  - wire “View” to open the Resident Directory slide-over if that’s the intended UX
- `frontend/src/components/admin/RecentActivity.tsx`
  - accept `activity` props
  - render real timestamps (`timeago` style or simple date string)
- `frontend/src/components/admin/BottomCharts.tsx`
  - replace placeholder charts with real charts (if Recharts/Victory already installed) OR keep placeholders but display computed numbers
  - replace `EVENTS` with `upcomingEvents`

### 3) Loading / error / refresh

Mission-control UX needs:

- Skeleton/loading state
- A clear error message (no silent failure)
- A manual “Refresh” button (optional but recommended)

### 4) Environment + cookies

Frontend uses:

- `VITE_API_URL` (see `frontend/src/lib/api.ts`)

Backend auth uses secure cookies (`CookieSecurePolicy.Always` in `backend/Intex2026API/Program.cs`), so local dev should use:

- API: `https://localhost:5001`
- Frontend: ideally HTTPS too (or same-origin proxy) to ensure cookies actually stick

If local cookie auth is currently working in your environment, don’t change the policy—just keep URLs consistent for the dashboard fetches.

---

## Acceptance Criteria (definition of “it works”)

### Functional

- Admin → Dashboard shows live counts/rows/events (no hard-coded arrays).
- Refreshing the page shows updated data (no stale compile-time constants).
- Works for both `Admin` and `Worker` roles (unless a widget is intentionally Admin-only).

### Local

- With `VITE_API_URL=https://localhost:5001`, the dashboard loads successfully after login.
- No mixed-content issues (HTTPS API + HTTP frontend) that break cookies.

### Deployed

- Dashboard calls the deployed API URL (configured via environment).
- CORS `AllowedOrigins` includes deployed frontend origin.

### Performance

- Dashboard endpoint returns within reasonable time (target < 500ms on typical datasets).
- Query ranges are bounded (activity/events limited; donation trends limited to N months).

---

## Quick Checklist for the Implementing Agent

- [ ] Add `GET /api/admin/dashboard` endpoint with DTOs
- [ ] Add resident “status mapping” function and reuse it for outcomes + caseload
- [ ] Implement KPI computations with explicit date windows
- [ ] Implement caseload rows (join safehouse name)
- [ ] Implement unified activity feed (bounded recent window)
- [ ] Implement upcoming events list (next N days)
- [ ] Add donation trends series for chart
- [ ] Update frontend widgets to consume live data
- [ ] Use `frontend/src/lib/api.ts` for requests (no hardcoded base URLs)
- [ ] Verify local auth + CORS + cookies
- [ ] Smoke test deployed environment config (`AllowedOrigins`, `VITE_API_URL`)

---

## Optional Enhancements (if time remains)

- Add `ETag`/`Cache-Control: no-store` vs short caching depending on “mission control” needs.
- Add server-side search/filter params for caseload and activity.
- Add “at-risk” drill-down links (open Resident Directory filtered view).
- Add “next steps” quick actions that deep-link into other Admin sections (Resident create modal, Home visit scheduling modal, etc.).

