# IS414 Requirements Audit

Line-by-line check of every graded requirement against what has been implemented.

---

## 1. Confidentiality (Encryption)

### "Use HTTPS for all public connections... valid certificate to enable TLS"
- **Status: DONE**
- `app.UseHttpsRedirection()` in `Program.cs`
- Azure App Service provides a valid TLS certificate automatically
- Azure Static Web Apps also provides HTTPS by default
- **TODO:** Verify "HTTPS Only" is toggled ON in Azure portal (see manual steps doc)

### "Redirect HTTP traffic to HTTPS"
- **Status: DONE**
- `app.UseHttpsRedirection()` handles this on the backend
- Azure Static Web Apps automatically redirects HTTP to HTTPS for the frontend

---

## 2. Authentication

### "Authenticate users using a username/password (likely using ASP.NET Identity)"
- **Status: DONE**
- Full ASP.NET Identity configured with `AddIdentity<ApplicationUser, IdentityRole>`
- `AuthController` provides `/api/auth/login`, `/register`, `/me`, `/logout`
- SQLite identity database (`LighthouseIdentity.sqlite`)

### "Visitors (unauthenticated users) should be able to browse the home page"
- **Status: DONE**
- Public routes: `/` (Home), `/impact`, `/privacy`, `/regions`, `/login`
- `ImpactController` and `PublicImpactSnapshotsController` GET endpoints are `[AllowAnonymous]`
- `AuthController` is `[AllowAnonymous]`

### "Authenticated users should be able to view the page(s) described in the IS413 section"
- **Status: DONE**
- `/donate` requires Donor or Admin role
- `/admin` requires Admin role
- `ProtectedRoute` component enforces this on the frontend
- Backend `[Authorize]` enforces this on APIs

### "Configure ASP.NET Identity to require better passwords than the default PasswordOptions"
- **Status: DONE**
- `RequiredLength = 9` (default is 6)
- `RequireDigit = true` (default is true, but explicitly set)
- `RequireNonAlphanumeric = true` (special character)
- `RequireLowercase = true`
- `RequireUppercase = true`
- `RequiredUniqueChars = 4` (default is 1)
- **NOTE:** The requirement says this is "STRICTLY graded according to how you were taught in class." Verify these values match your class notes exactly. If your instructor specified different values, update `Program.cs` lines 37-43.

### "All APIs should have the appropriate authentication/authorization"
- **Status: DONE**
- `/api/auth/*` endpoints: `[AllowAnonymous]` (must be public to function)
- Impact/public data GET endpoints: `[AllowAnonymous]`
- All data controllers: `[Authorize(Roles = "Admin,Worker")]`
- Donation controllers: `[Authorize(Roles = "Admin,Worker,Donor")]`
- All DELETE endpoints: `[Authorize(Roles = "Admin")]`

---

## 3. Role-Based (RBAC) Authorization

### "Only an authenticated user with an admin role should be able to add, modify, or in rare cases delete data"
- **Status: DONE**
- Class-level `[Authorize(Roles = "Admin,Worker")]` on all data controllers covers Create/Read/Update
- Method-level `[Authorize(Roles = "Admin")]` on every `[HttpDelete]` endpoint
- Worker role is permitted per: "You may choose whether or not to have a staff (or employee) role that differs from the admin user"

### "Only authenticated users who are donors should be able to see their donor history and the impact of those donations"
- **Status: DONE**
- `DonationsController`: `[Authorize(Roles = "Admin,Worker,Donor")]`
- `DonationAllocationsController`: `[Authorize(Roles = "Admin,Worker,Donor")]`
- Frontend `/donate` route protected with `requiredRoles={["Donor", "Admin"]}`

### "Non-authenticated users without a role should be able to see some of the site"
- **Status: DONE**
- Home, Impact, Privacy Policy, Regions, Login pages are all public
- Navbar conditionally shows Donate/Admin links based on role

### Roles implemented
- **Admin** — full CRUD access, only role that can delete
- **Worker** — read + create + update access to data controllers
- **Donor** — auto-assigned on registration, access to donation data + donate page
- **Non-user** — can see Home, Impact, Privacy, Regions, Login

---

## 4. Integrity

### "Data should only be able to be changed or deleted by an authorized, authenticated user"
- **Status: DONE**
- All POST/PUT/DELETE endpoints require authentication + appropriate role
- Backend enforces this regardless of frontend

### "There must be confirmation required to delete data"
- **Status: DONE**
- `del()` function in `frontend/src/lib/api.ts` uses `window.confirm()` before sending DELETE request
- Any future delete UI that uses this helper will automatically prompt for confirmation
- **NOTE:** The admin panel currently has no delete buttons in the UI — but when they are added, using `del()` from `api.ts` will enforce confirmation

---

## 5. Credentials

### "Handle credentials safely... .env file that is not uploaded to a code repository"
- **Status: PARTIAL**
- `.gitignore` already excludes `.env`, `.env.*`, `secrets.json`, `.pem`, `.key`
- Default admin credentials are read from `builder.Configuration["AdminEmail"]` and `["AdminPassword"]` with fallbacks
- **REMAINING:** Connection strings are still in `appsettings.json`. Need to move to environment variables for production. See manual steps doc.

---

## 6. Privacy

### "Create and populate the content of a GDPR-compliant privacy policy linked from the footer"
- **Status: DONE**
- Full privacy policy page at `/privacy` (`frontend/src/pages/PrivacyPolicy.tsx`)
- Covers: data collected, legal basis, cookies, data sharing, retention, security, GDPR rights, international transfers, contact info
- Footer "Privacy Policy" link updated from `#` to `/privacy`

### "Enable a GDPR-compliant cookie consent notification. Be specific about whether cosmetic or fully functional"
- **Status: DONE (Functional)**
- `CookieConsent` component with three options: Accept All, Reject Non-Essential, Manage Preferences
- Three categories: Essential (always on), Functional, Analytics
- Preferences stored in `localStorage`
- Non-essential cookies are cleared when rejected
- Footer "Cookie Settings" button reopens the consent banner
- **For video:** State that this is a FULLY FUNCTIONAL implementation that blocks non-essential cookies until consent is given

---

## 7. Attack Mitigations

### "Enable the Content-Security-Policy (CSP) HTTP HEADER"
- **Status: DONE (two layers)**
- **Backend:** CSP middleware in `Program.cs` adds header to all API responses
- **Frontend:** `staticwebapp.config.json` adds CSP header to all HTML/static file responses from Azure Static Web Apps
- Also added: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`
- Directives: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; frame-ancestors 'none';`
- **NOTE:** `connect-src` in the frontend config includes `https:` to allow API calls to the Azure backend. You may want to narrow this to your specific backend URL for stricter security.
- **IMPORTANT:** Graders check developer tools > Network > Response Headers on the HTML page. The `staticwebapp.config.json` handles this. If something loads but is blocked by CSP, check the browser console and widen the specific directive.

---

## 8. Availability

### "Your site should be publicly accessible"
- **Status: DONE**
- Frontend: Azure Static Web Apps (CI/CD via GitHub Actions)
- Backend: Azure (deployed separately)

---

## Summary

| # | Requirement | Status | Notes |
|---|---|---|---|
| 1 | HTTPS + redirect | DONE | Verify Azure "HTTPS Only" toggle |
| 2a | Username/password auth | DONE | ASP.NET Identity |
| 2b | Visitors browse homepage | DONE | Public routes configured |
| 2c | Auth users see protected pages | DONE | ProtectedRoute component |
| 2d | Better password policy | DONE | Verify matches class notes |
| 2e | API auth on all endpoints | DONE | 20 controllers configured |
| 3 | RBAC | DONE | Admin, Worker, Donor, Non-user |
| 4 | Integrity + delete confirmation | DONE | API enforced + window.confirm |
| 5 | Credentials handling | PARTIAL | Need to move conn strings to env vars |
| 6a | Privacy policy | DONE | /privacy page linked from footer |
| 6b | Cookie consent (functional) | DONE | Blocks non-essential until consent |
| 7 | CSP header | DONE | Backend middleware + staticwebapp.config.json |
| 8 | Publicly accessible | DONE | Azure deployment |
