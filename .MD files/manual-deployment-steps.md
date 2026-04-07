# Manual Deployment Steps

Status of each step after our conversation.

---

## Step 1: Move Connection Strings Out of Code — DONE

### What was done:
- Added `DotNetEnv` NuGet package and `Env.Load()` in `Program.cs`
- Created `backend/Intex2026API/.env` for local dev (gitignored)
- Cleared connection strings in `appsettings.json` (empty strings as fallback)
- Set in Azure App Service > Configuration:
  - **Connection strings:** `ConnectionStrings__LighthouseConnection`, `ConnectionStrings__LighthouseIdentityConnection` (type: Custom)
  - **Application settings:** `AdminEmail`, `AdminPassword`

---

## Step 2: Frontend API URL + CORS — DONE

### What was done:
- Created `frontend/.env` → `VITE_API_URL=http://localhost:5000` (for local dev, gitignored)
- Created `frontend/.env.production` → `VITE_API_URL=https://intex2026api-amcjb0aabhethbc4.canadacentral-01.azurewebsites.net` (committed, used by Azure build)
- Added `.gitignore` exception for `frontend/.env.production`
- Updated `appsettings.json` CORS to include `https://proud-pond-0cbcde31e.1.azurestaticapps.net`

---

## Step 3: HTTPS Only — DONE

### What was done:
- Toggled **HTTPS Only: On** in Azure App Service > Settings > Configuration > General settings
- Azure Static Web Apps enforces HTTPS by default (no action needed)

---

## Step 4: Tune CSP Headers — DO AFTER DEPLOY

After deploying, open your site in a browser and check **Developer Tools > Console** for CSP violations. They look like:

```
Refused to load the script 'https://...' because it violates the following Content Security Policy directive: "script-src 'self'"
```

If you see violations, edit `frontend/staticwebapp.config.json` and add the blocked domain to the appropriate directive. Common additions:
- Google Fonts: add `https://fonts.googleapis.com` to `style-src` and `https://fonts.gstatic.com` to `font-src`
- External images/CDN: add the domain to `img-src`

---

## Step 5: Lock Down CSP `connect-src` — DONE

### What was done:
- `frontend/staticwebapp.config.json` `connect-src` set to `'self' https://intex2026api-amcjb0aabhethbc4.canadacentral-01.azurewebsites.net` (your specific backend, not broad `https:`)

---

## Step 6: Post-Deploy Verification Checklist

Run through this after deploying:

### Public Access (no login)
- [ ] Homepage loads at `https://` URL
- [ ] Impact page loads and shows data
- [ ] Privacy Policy page loads from footer link
- [ ] Cookie consent banner appears on first visit
- [ ] Clicking "Reject Non-Essential" dismisses the banner
- [ ] "Cookie Settings" in footer reopens the banner
- [ ] Navigating to `/admin` redirects to `/login`
- [ ] Navigating to `/donate` redirects to `/login`

### Authentication
- [ ] Can register a new account (password must meet policy: 9+ chars, digit, special, upper, lower)
- [ ] Weak passwords are rejected with clear error messages
- [ ] After registration, user has Donor role
- [ ] After login, Donate link appears in navbar
- [ ] Admin link does NOT appear for Donor users

### Admin Access
- [ ] Log in with the seeded admin account
- [ ] Admin link appears in navbar
- [ ] `/admin` page loads with data
- [ ] Donate link also appears (Admin has all access)

### Security Headers (Developer Tools > Network > select the HTML page > Headers)
- [ ] `Content-Security-Policy` header is present
- [ ] `X-Content-Type-Options: nosniff` is present
- [ ] `X-Frame-Options: DENY` is present
- [ ] No CSP violations in the Console tab

### API Authorization (Developer Tools > Network or use curl)
- [ ] `GET /api/impact/...` works without auth (200)
- [ ] `GET /Residents` returns 401 without auth
- [ ] `DELETE /Residents/{id}` returns 401/403 for non-Admin users

### HTTPS
- [ ] Navigating to `http://` version redirects to `https://`
- [ ] No mixed content warnings in Console

---

## Quick Reference: Files Changed

| File | What was changed |
|---|---|
| `backend/Program.cs` | Password policy, Identity with roles, role seeding, CSP middleware, DotNetEnv |
| `backend/appsettings.json` | Cleared connection strings, added production frontend to CORS |
| `backend/.env` | NEW — local dev connection strings + admin creds (gitignored) |
| `backend/Controllers/AuthController.cs` | AllowAnonymous, Donor role on register, roles in responses |
| `backend/Controllers/*Controller.cs` (18 files) | Authorize decorators + Admin-only deletes |
| `frontend/.env` | NEW — local dev API URL (gitignored) |
| `frontend/.env.production` | NEW — production API URL (committed) |
| `frontend/staticwebapp.config.json` | NEW — CSP + security headers for Azure Static Web Apps |
| `frontend/src/App.tsx` | ProtectedRoute wrappers, new routes |
| `frontend/src/components/ProtectedRoute.tsx` | NEW — auth + role guard component |
| `frontend/src/components/CookieConsent.tsx` | NEW — functional cookie consent banner |
| `frontend/src/components/layout/Navbar.tsx` | Conditional links by role |
| `frontend/src/components/layout/Footer.tsx` | Privacy + cookie settings links |
| `frontend/src/pages/PrivacyPolicy.tsx` | NEW — GDPR privacy policy page |
| `frontend/src/lib/api.ts` | Added `del()` with confirm dialog |
| `frontend/src/styles/PrivacyPolicy.css` | NEW |
| `frontend/src/styles/CookieConsent.css` | NEW |
| `frontend/src/styles/Footer.css` | Added cookie settings button style |
| `.gitignore` | Added exception for `frontend/.env.production` |
