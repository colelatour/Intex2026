# Sheltered Light — Intex 2026

Full-stack web application for Sheltered Light PH, a nonprofit safehouse for at-risk youth in the Philippines. Built with React + Vite (frontend), ASP.NET Core (backend), and Python ML pipelines.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Recharts |
| Backend | ASP.NET Core 10, Entity Framework Core, Azure SQL |
| Auth | ASP.NET Core Identity + Google OAuth |
| ML Pipelines | Python, scikit-learn, XGBoost, SQLAlchemy |
| Hosting | Azure Static Web Apps (frontend + SWA proxy) |
| AI | Google Gemini 2.0 Flash (social media post generation) |

---

## Required Environment Variables

### Backend (ASP.NET Core)

| Variable | Where | Description |
|---|---|---|
| `ConnectionStrings:LighthouseConnection` | appsettings / Azure App Settings | Azure SQL connection string for main DB |
| `ConnectionStrings:LighthouseIdentityConnection` | appsettings / Azure App Settings | Azure SQL connection string for Identity DB |
| `Gemini:ApiKey` | User Secrets (local) / Azure App Settings (prod) | Google Gemini API key — get from [aistudio.google.com](https://aistudio.google.com) |

#### Local development — .NET User Secrets

Do **not** put secrets in `appsettings.Development.json` (it is gitignored). Use .NET User Secrets instead:

```bash
cd backend/Intex2026API
dotnet user-secrets set "Gemini:ApiKey" "<your-key>"
dotnet user-secrets set "ConnectionStrings:LighthouseConnection" "<your-connection-string>"
dotnet user-secrets set "ConnectionStrings:LighthouseIdentityConnection" "<your-connection-string>"
```

Secrets are stored at `~/.microsoft/usersecrets/<UserSecretsId>/secrets.json` — never in the repo.

#### Production — Azure App Service Application Settings

In the Azure Portal, navigate to your App Service → **Settings → Environment variables** and add:

| Name | Value |
|---|---|
| `Gemini__ApiKey` | your Gemini API key (note double underscore — Azure uses `__` as the `:` separator) |
| `ConnectionStrings__LighthouseConnection` | your Azure SQL connection string |
| `ConnectionStrings__LighthouseIdentityConnection` | your Identity Azure SQL connection string |

Or via Azure CLI (after `az login`):

```bash
az webapp config appsettings set \
  --resource-group <your-rg> \
  --name <your-app-service-name> \
  --settings "Gemini__ApiKey=<your-key>"
```

---

### ML Pipelines (Python)

Create `ml-pipelines/.env` (gitignored):

```
AZURE_SQL_SERVER=your-server.database.windows.net,1433
AZURE_SQL_DATABASE=your-database
AZURE_SQL_USERNAME=your-username
AZURE_SQL_PASSWORD=your-password
```

---

## Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
```

### Backend

```bash
cd backend/Intex2026API
dotnet restore
dotnet run        # https://localhost:5001
```

### ML Pipelines

```bash
cd ml-pipelines
pip install -r api/requirements.txt
uvicorn api.main:app --reload   # http://localhost:8000
```

---

## Project Structure

```
├── frontend/          React + Vite app
├── backend/           ASP.NET Core API
├── ml-pipelines/      Python ML pipelines + FastAPI inference server
│   ├── jobs/          Nightly inference scripts (churn, readiness, social)
│   ├── api/           FastAPI wrapper for manual re-runs
│   └── test_connection.py  DB connectivity + view creation utility
└── .github/workflows/ CI/CD (Azure Static Web Apps)
```

---

## ML Pipelines

Three nightly jobs run on Render (see `ml-pipelines/render.yaml`):

| Job | Schedule | Output table |
|---|---|---|
| Donor churn scoring | 2:00 AM UTC | `donor_churn_scores` |
| Reintegration readiness | 2:10 AM UTC | `resident_readiness_scores` |
| Social media analysis | 2:20 AM UTC | `social_media_recommendations` |

The `social_media_highlights` SQL view (created via `ml-pipelines/test_connection.py`) aggregates live program data for the Social Media Strategy page.
