# Security Controls Implementation Plan

This document outlines the plan for implementing all required security controls for the SafeHaven INTEX project. Each section maps directly to a graded requirement.

---

## Current State Summary

| Requirement | Status |
|---|---|
| HTTPS + redirect | DONE — `app.UseHttpsRedirection()` in place; Azure handles TLS cert |
| Authentication (ASP.NET Identity) | DONE — full Identity with roles, login/register/logout/me endpoints |
| Password policy | DONE — min 9 chars, digit, special char, upper, lower, 4 unique |
| API authorization decorators | DONE — all controllers have `[Authorize]` with role requirements |
| Role-based access (RBAC) | DONE — Admin, Worker, Donor roles seeded; Donor auto-assigned on register |
| Frontend route protection | DONE — `ProtectedRoute` component guards `/admin` and `/donate` |
| Delete confirmation | DONE — `del()` helper in api.ts requires `window.confirm()` before any delete |
| Credentials handling | PARTIAL — `.gitignore` covers secrets; connection strings still in `appsettings.json` (see TODO below) |
| Privacy policy page | DONE — GDPR-compliant page at `/privacy`, linked from footer |
| Cookie consent banner | DONE — functional banner with Accept All / Reject / Manage Preferences |
| CSP header | DONE — middleware in Program.cs sets strict CSP header |
| Deployment / availability | DONE — Azure deployment for frontend + backend |

---

## 1. Password Policy

**File:** `backend/Intex2026API/Program.cs`

Replace `AddIdentityApiEndpoints<ApplicationUser>()` with a full `AddIdentity` call that configures `PasswordOptions`:

```csharp
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequiredLength = 9;
    options.Password.RequireDigit = true;
    options.Password.RequireNonAlphanumeric = true;  // special character
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequiredUniqueChars = 4;
})
.AddEntityFrameworkStores<AuthIdentityDbContext>()
.AddDefaultTokenProviders();
```

> This change also requires updating `AuthIdentityDbContext` to inherit from `IdentityDbContext<ApplicationUser>` with role support and running a migration if the schema changes.

---

## 2. Roles Setup

**Roles to create:** `Admin`, `Worker`, `Donor`

### 2a. Seed roles on startup

**File:** `backend/Intex2026API/Program.cs`

After `var app = builder.Build();`, add a scope that seeds the three roles into the `AspNetRoles` table if they don't exist, and creates a default admin account from environment variables.

### 2b. Auto-assign Donor role on registration

**File:** `backend/Intex2026API/Controllers/AuthController.cs`

In the `Register` endpoint, after `CreateAsync` succeeds, call:
```csharp
await userManager.AddToRoleAsync(user, "Donor");
```

### 2c. Return roles from login and /me

Already partially done — `/me` reads role claims. After switching to full Identity with roles, claims will populate automatically. Update the `Login` response to also return roles:
```csharp
var roles = await userManager.GetRolesAsync(user);
```

---

## 3. API Authorization Decorators

Apply `[Authorize]` and `[AllowAnonymous]` across all 20 controllers. The general rule: **maximize restriction unless it breaks functionality.**

### Public (no auth required)
| Controller | Reason |
|---|---|
| `AuthController` — `/login`, `/register`, `/me`, `/logout` | Auth endpoints must be accessible |
| `PublicImpactSnapshotsController` — `GET` only | Homepage/impact data for visitors |
| `ImpactController` — `GET` only | Public-facing impact stats |

### Authenticated (any logged-in user)
| Controller | Access |
|---|---|
| `DonationsController` — `GET` own records | Donors can view their own donation history |
| `DonationAllocationsController` — `GET` own records | Donors can see where their money went |

### Admin or Worker only (full CRUD)
All remaining controllers get `[Authorize(Roles = "Admin,Worker")]` at the class level. DELETE endpoints get `[Authorize(Roles = "Admin")]` only.

| Controller |
|---|
| `SafehousesController` |
| `ResidentsController` |
| `PartnersController` |
| `SupportersController` |
| `EducationRecordsController` |
| `HealthWellbeingRecordsController` |
| `HomeVisitationsController` |
| `IncidentReportsController` |
| `InterventionPlansController` |
| `InKindDonationItemsController` |
| `PartnerAssignmentsController` |
| `ProcessRecordingsController` |
| `SafehouseMonthlyMetricsController` |
| `SocialMediaPostsController` |

### Implementation pattern per controller:
```csharp
[ApiController]
[Route("[controller]")]
[Authorize(Roles = "Admin,Worker")]
public class SafehousesController : ControllerBase
{
    [HttpGet]
    public async Task<...> GetAll() { ... }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]  // only admin can delete
    public async Task<...> Delete(int id) { ... }
}
```

---

## 4. Frontend Route Protection

**New file:** `frontend/src/components/ProtectedRoute.tsx`

Create a wrapper component that:
1. Calls `/api/auth/me` to check session
2. Accepts a `requiredRoles` prop (e.g., `["Admin"]`)
3. Redirects to `/login` if unauthenticated
4. Shows a 403/redirect if authenticated but wrong role

**File:** `frontend/src/App.tsx`

Update routes:
```tsx
<Route path="/"       element={<Home />} />              {/* public */}
<Route path="/login"  element={<Login />} />              {/* public */}
<Route path="/impact" element={<ImpactDashboard />} />    {/* public */}
<Route path="/privacy" element={<PrivacyPolicy />} />     {/* public */}
<Route path="/donate" element={
  <ProtectedRoute requiredRoles={["Donor","Admin"]}>
    <Donate />
  </ProtectedRoute>
} />
<Route path="/admin" element={
  <ProtectedRoute requiredRoles={["Admin"]}>
    <Admin />
  </ProtectedRoute>
} />
```

**File:** `frontend/src/components/layout/Navbar.tsx`

Conditionally show nav links based on session roles:
- Always show: Home, Impact, Login/Logout
- Show if authenticated: Donate
- Show if Admin role: Admin

---

## 5. Delete Confirmation (Integrity)

All delete operations must require user confirmation before executing.

### Backend
No change needed — the API just processes the request. Confirmation is a UI concern.

### Frontend
Every delete button in the Admin panel must trigger a confirmation modal/dialog before calling the DELETE endpoint. Use `window.confirm()` as a minimum, or a proper modal component.

---

## 6. Credentials Handling

**Goal:** Remove secrets from source code; use `.env` file approach.

### Backend
1. Create a `.env` file (already in `.gitignore`) with:
   - `ConnectionStrings__LighthouseConnection`
   - `ConnectionStrings__LighthouseIdentityConnection`
   - `AdminEmail` / `AdminPassword` (for seed)
   - Any future API keys
2. In `Program.cs`, add `builder.Configuration.AddEnvironmentVariables();` (already default, but be explicit).
3. Strip connection strings from `appsettings.json` — keep only non-secret config there.
4. On Azure, set these as App Service **Configuration > Application Settings**.

### Frontend
If any API keys are needed, use Vite's `VITE_` prefixed env vars in a `.env` file.

---

## 7. Privacy Policy Page

**New file:** `frontend/src/pages/PrivacyPolicy.tsx`

Create a full GDPR-compliant privacy policy page tailored to SafeHaven. Content should cover:
- What data is collected (name, email, donation history, cookies)
- Why it is collected (account management, donation processing, analytics)
- How it is stored and protected
- User rights (access, rectification, erasure, portability, objection)
- Cookie usage details
- Contact information for data requests
- Data retention periods

Use an LLM-generated template customized for SafeHaven's nonprofit/donation context.

**File:** `frontend/src/components/layout/Footer.tsx`

Update the Privacy Policy link from `#` to `/privacy`.

**File:** `frontend/src/App.tsx`

Add route: `<Route path="/privacy" element={<PrivacyPolicy />} />`

---

## 8. Cookie Consent Banner (Functional)

**New file:** `frontend/src/components/CookieConsent.tsx`

Build a functional (not cosmetic) cookie consent banner:

1. On first visit, show a banner with options: **Accept All**, **Reject Non-Essential**, **Manage Preferences**
2. Store the user's choice in `localStorage` (key: `cookie-consent`)
3. Until the user consents, **block all non-essential cookies** — this means:
   - Authentication cookies (essential) always allowed
   - Analytics/tracking cookies only set after consent
   - Any third-party scripts (if added later) gated on consent
4. Provide a way to change preferences later (the "Cookie Settings" link in the footer)
5. Categories: **Essential** (always on), **Functional**, **Analytics**

**File:** `frontend/src/App.tsx`

Render `<CookieConsent />` at the app root level.

**File:** `frontend/src/components/layout/Footer.tsx`

Update "Cookie Settings" link to trigger the consent banner reopening.

---

## 9. Content-Security-Policy (CSP) Header

**File:** `backend/Intex2026API/Program.cs`

Add CSP as middleware **before** `app.MapControllers()`:

```csharp
app.Use(async (context, next) =>
{
    context.Response.Headers.Append(
        "Content-Security-Policy",
        "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline'; " +     // may need unsafe-inline for CSS-in-JS
        "img-src 'self' data: https:; " +            // data: for inline images, https: for external
        "font-src 'self'; " +
        "connect-src 'self'; " +
        "frame-ancestors 'none';"
    );
    await next();
});
```

> The exact directives will need tuning based on what the frontend actually loads (Google Fonts, external images, Recharts SVGs, etc.). Start strict and loosen only as needed by checking the browser console for CSP violations.

**Note:** This must appear as an HTTP **header**, not a `<meta>` tag. Graders will check developer tools > Network > Response Headers.

---

## 10. HTTPS & Availability

### Already handled
- `app.UseHttpsRedirection()` in `Program.cs` redirects HTTP to HTTPS
- Azure App Service provides a valid TLS certificate automatically
- Azure Static Web Apps (frontend) also provides HTTPS by default

### To verify
- Confirm that the Azure App Service has **HTTPS Only** toggled ON in portal settings
- Confirm the frontend's API proxy/calls use the `https://` backend URL in production
- Test that navigating to `http://` redirects to `https://`

---

## Implementation Order

This is the recommended order to implement, prioritizing what gives the most points and unblocks other work:

| Step | Task | Estimated Effort |
|---|---|---|
| 1 | Password policy config in `Program.cs` | Small |
| 2 | Role seeding + Donor auto-assign in `AuthController` | Small |
| 3 | `[Authorize]` decorators on all API controllers | Medium |
| 4 | `ProtectedRoute` component + route updates + Navbar conditional links | Medium |
| 5 | Delete confirmation modals in Admin panel | Small |
| 6 | Move secrets to `.env` / Azure env vars | Small |
| 7 | CSP header middleware | Small (but tuning takes time) |
| 8 | Privacy policy page + footer link | Medium (content writing) |
| 9 | Functional cookie consent banner | Medium |
| 10 | Verify HTTPS + deployment | Small |

---

## Files That Will Be Modified

### Backend
- `Program.cs` — password policy, role seeding, CSP header middleware
- `Controllers/AuthController.cs` — role assignment on register, return roles on login
- `Controllers/*Controller.cs` (all 18 data controllers) — add `[Authorize]` attributes
- `appsettings.json` — remove connection strings
- `Data/AuthIdentityDbContext.cs` — ensure role support
- New: `.env` file (not committed)

### Frontend
- `App.tsx` — new routes, ProtectedRoute wrappers
- `components/layout/Navbar.tsx` — conditional nav links by role
- `components/layout/Footer.tsx` — update Privacy Policy and Cookie Settings links
- New: `components/ProtectedRoute.tsx`
- New: `components/CookieConsent.tsx`
- New: `pages/PrivacyPolicy.tsx`
- Admin components — add delete confirmation dialogs
