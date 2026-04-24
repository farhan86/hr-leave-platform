# HR Leave Management & Analytics Platform

A full-stack, cloud-native portfolio project demonstrating end-to-end HCM data engineering — from transactional leave workflows to an analytics data warehouse and Power BI reporting.

**Live Demo**
| Layer | URL |
|---|---|
| Frontend (Vercel) | https://frontend-three-smoky-73.vercel.app |
| REST API / Swagger | https://hrleave-api-fa.azurewebsites.net/swagger |

> **Note on cold starts:** The API runs on Azure App Service F1 (free tier). The first request after idle may take 60–90 seconds to warm up — this is expected.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                        │
│          React 18 + Vite + Tailwind CSS  →  Vercel CDN          │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / JWT
┌────────────────────────────▼────────────────────────────────────┐
│                         API LAYER                                │
│     .NET 10 Web API  ·  EF Core  ·  Repository Pattern          │
│     Azure App Service (Linux, F1)  ·  GitHub Actions CI/CD      │
└────────────────────────────┬────────────────────────────────────┘
                             │ ADO.NET / EF Core
┌────────────────────────────▼────────────────────────────────────┐
│                        DATA LAYER (OLTP)                         │
│     Azure SQL Database (serverless, free offer)                  │
│     6 tables  ·  6 stored procedures  ·  full audit log         │
└────────────────────────────┬────────────────────────────────────┘
                             │ JDBC extract (Databricks)
┌────────────────────────────▼────────────────────────────────────┐
│                     ETL PIPELINE  [Phase 3]                      │
│     Databricks Community Edition  ·  PySpark                    │
│     Bronze (raw append)  →  Silver (validated)  →  Gold (DWH)   │
└────────────────────────────┬────────────────────────────────────┘
                             │ JDBC upsert
┌────────────────────────────▼────────────────────────────────────┐
│                  DATA WAREHOUSE  [Phase 3]                       │
│     Databricks Unity Catalog · Delta tables (workspace.dw.*)     │
│     Star schema: 3 fact tables  ·  4 dimensions (SCD Type 2)    │
└────────────────────────────┬────────────────────────────────────┘
                             │ DirectQuery / Import
┌────────────────────────────▼────────────────────────────────────┐
│                  ANALYTICS LAYER  [Phase 4]                      │
│     Power BI Desktop  →  Power BI Service                        │
│     4 report pages  ·  6 DAX measures                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 18, Vite, Tailwind CSS v4 | Fast builds, utility-first styling, modern component model |
| State | Zustand + localStorage | Lightweight auth persistence without Redux boilerplate |
| API client | Axios with request interceptor | Centralized JWT attachment; clean separation from components |
| Backend | .NET 10 Web API | Industry-standard enterprise API framework |
| ORM | EF Core + Repository Pattern | Testable data layer with clean abstraction |
| Database | Azure SQL (serverless) | Managed PaaS, auto-pause to stay within free tier |
| Business logic | T-SQL Stored Procedures | Atomic transactions; logic lives close to data |
| Auth | Mock JWT (HMAC-SHA256) | Demonstrates JWT middleware config without identity-provider dependency |
| CI/CD | GitHub Actions | Separate pipelines per layer; secrets managed via GitHub |
| Frontend hosting | Vercel | Zero-config CDN deployment from GitHub |
| API hosting | Azure App Service (Linux, F1) | PaaS deployment with zip-deploy |
| ETL | Databricks CE + PySpark | Industry-standard medallion architecture |
| Warehouse | Databricks Unity Catalog (Delta) | Star schema in `workspace.dw`; SCD Type 2 on dim_employee |
| Analytics | Power BI Desktop + Service | Published dashboards with DAX measures |

---

## Features

### Leave Management (Employee)
- Apply for leave with automatic **working-day calculator** (skips weekends)
- Real-time **leave balance display** per leave type (Annual, Sick, Casual, Maternity, Paternity, Unpaid)
- Balance shows: total entitlement, used days, pending days, remaining days
- View full leave history with status filters (All / Pending / Approved / Rejected)
- Cancel pending requests

### Approval Workflow (Manager)
- Dashboard showing all pending requests across the team
- One-click Approve or Reject with mandatory rejection note
- Rejected requests include the manager's reason

### Administration (Admin)
- Full visibility into all team requests (read-only)
- Access to all API endpoints via role-based authorization

### API & Data
- 13 REST endpoints under `/api/v1` — fully documented via Swagger UI
- All leave state transitions enforced by **6 Azure SQL stored procedures**
- Business rule violations return HTTP 400 with descriptive messages (not 500)
- Full **audit log** of every status change (stored in AuditLog table)
- Carry-forward and yearly balance initialisation stored procedures included

---

## Database Design

### OLTP Schema (Azure SQL)

```
Department ──< Employee >── LeaveBalance
                  │               │
                  └──< LeaveRequest      LeaveType
                  │
                  └── AuditLog
```

6 tables with referential integrity, indexes on foreign keys and status/date columns. Self-referencing `ManagerId` on Employee for org hierarchy.

**Stored Procedures:**
| Procedure | Purpose |
|---|---|
| `sp_SubmitLeaveRequest` | Validates balance, checks overlaps, deducts pending allocation |
| `sp_ApproveLeaveRequest` | Confirms deduction, updates leave balance |
| `sp_RejectLeaveRequest` | Returns days to balance, stores rejection note |
| `sp_CancelLeaveRequest` | Employee self-cancel for pending requests |
| `sp_CalculateCarryForward` | Year-end carry-forward logic per leave type rules |
| `sp_InitialiseYearlyBalances` | Bootstraps annual entitlements for all active employees |

### Data Warehouse Schema

Star schema stored as **Delta tables in Databricks Unity Catalog** (`workspace.dw.*`):
- **Fact tables:** `fact_leaverequest`, `fact_leavebalance`, `fact_attendance`
- **Dimensions:** `dim_employee` (SCD Type 2), `dim_leavetype`, `dim_department`, `dim_date`
- `dim_employee` tracks historical department changes with `ValidFrom` / `ValidTo` / `IsCurrent`
- SCD Type 2 verified: department change triggers row expiry + new current row insert

---

## API Reference

Base URL: `https://hrleave-api-fa.azurewebsites.net/api/v1`

All endpoints require `Authorization: Bearer <token>`. Demo tokens are pre-generated in the Swagger UI description.

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/employees/me` | All | Current employee profile |
| GET | `/leave-types` | All | All active leave types |
| GET | `/departments` | All | All departments |
| GET | `/leave-balances` | All | My balances for current year |
| GET | `/leave-requests` | All | My requests (filterable by year, status) |
| POST | `/leave-requests` | All | Submit a new leave request |
| PUT | `/leave-requests/{id}/cancel` | All | Cancel a pending request |
| GET | `/leave-requests/team` | Manager, Admin | All pending team requests |
| PUT | `/leave-requests/{id}/approve` | Manager | Approve a request |
| PUT | `/leave-requests/{id}/reject` | Manager | Reject with note |
| GET | `/leave-requests/all` | Admin | All requests across org |
| GET | `/leave-requests/{id}` | All | Single request detail |
| GET | `/leave-balances/team` | Manager, Admin | Team balances summary |

---

## ETL Pipeline

Three PySpark notebooks following the **medallion architecture**, built on Databricks Community Edition. Notebooks are exported as `.ipynb` and viewable in [`databricks/`](databricks/) with full cell outputs.

| Notebook | Layer | Description |
|---|---|---|
| [`00_connection_test.ipynb`](databricks/00_connection_test.ipynb) | Setup | JDBC connectivity test to Azure SQL from Databricks CE |
| [`01_bronze.ipynb`](databricks/01_bronze.ipynb) | Bronze | JDBC extract of 6 OLTP tables + synthetic Attendance data; append-only Parquet to Unity Catalog Volumes |
| [`02_silver.ipynb`](databricks/02_silver.ipynb) | Silver | Type casting, deduplication on natural key, snake_case rename, `_is_valid` / `_validation_error` flags |
| [`03_gold.ipynb`](databricks/03_gold.ipynb) | Gold | Star schema construction, SCD Type 2 on dim_Employee, JDBC upsert to Azure SQL `dw` schema |

**Storage:** Unity Catalog Volumes at `/Volumes/workspace/default/{bronze,silver,gold}/`  
**DWH target:** Azure SQL `dw` schema — 4 dimension tables + 3 fact tables, queryable via SSMS or Power BI

---

## CI/CD

Two independent GitHub Actions workflows trigger on push to `master`:

| Workflow | Trigger path | Steps |
|---|---|---|
| Deploy API | `backend/**` | `dotnet publish` → zip artifact → `azure/webapps-deploy@v3` |
| Deploy Frontend | `frontend/**` | `npm ci` → `npx vercel --prod` |

Secrets stored in GitHub Actions: `AZURE_WEBAPP_PUBLISH_PROFILE`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

---

## Local Setup

### Prerequisites
- Node.js 20+
- .NET 10 SDK
- Azure SQL Database (or localdb for dev)

### Backend

```bash
cd backend
dotnet restore
# Copy appsettings.Example.json → appsettings.json and fill in your values
dotnet run --project HRLeave.Api
# API available at http://localhost:5280
# Swagger at http://localhost:5280/swagger
```

### Frontend

```bash
cd frontend
npm install
# Copy .env.example → .env.local and set VITE_API_BASE_URL
npm run dev
# App available at http://localhost:5173
```

### Database

```bash
# Apply in order against your Azure SQL database
sqlcmd -S <server>.database.windows.net -d hrleave -U <user> -P <pass> -i database/oltp/01_schema.sql
sqlcmd -S <server>.database.windows.net -d hrleave -U <user> -P <pass> -i database/oltp/02_stored_procedures.sql
sqlcmd -S <server>.database.windows.net -d hrleave -U <user> -P <pass> -i database/oltp/03_seed_data.sql
```

---

## Project Structure

```
hr-leave-platform/
├── .github/workflows/
│   ├── deploy-api.yml          # Azure App Service CI/CD
│   └── deploy-frontend.yml     # Vercel CI/CD
├── backend/
│   └── HRLeave.Api/
│       ├── Controllers/        # HTTP endpoints (thin, no business logic)
│       ├── Services/           # SP calls, audit log writes
│       ├── Repositories/       # EF Core data access
│       ├── Models/             # EF entity classes
│       ├── DTOs/               # Request/response shapes
│       └── Data/               # DbContext
├── database/
│   └── oltp/
│       ├── 01_schema.sql       # 6 tables with indexes
│       ├── 02_stored_procedures.sql  # 6 SPs (all business logic)
│       └── 03_seed_data.sql    # 3 depts, 10 employees, 60 balances
├── frontend/
│   └── src/
│       ├── components/         # LeaveForm, ApprovalDashboard, BalanceCard, Navbar
│       ├── pages/              # Dashboard, MyLeaves, TeamLeaves, Login
│       ├── services/           # Axios API layer (never called direct from components)
│       ├── store/              # Zustand auth store
│       └── utils/              # Working-day calculator
└── databricks/
    ├── 00_connection_test.ipynb  # Azure SQL JDBC connectivity test
    ├── 01_bronze.ipynb           # Raw extract → Unity Catalog Volumes
    ├── 02_silver.ipynb           # Clean, cast, dedup, validate
    └── 03_gold.ipynb             # Star schema + SCD Type 2 → Azure SQL dw
```

---

## Testing

44 test cases covering API endpoints, RBAC, business rules, frontend smoke tests, CI/CD pipelines, ETL pipeline verification, and Power BI DAX validation — all passing.

See the full test report: [TEST_REPORT.md](TEST_REPORT.md)

| Category | Cases | Result |
|---|---|---|
| API (reference data, balances, CRUD, approval) | 14 | ✅ All pass |
| Role-Based Access Control | 6 | ✅ All pass |
| Business Rules (balance, overlaps, audit log) | 5 | ✅ All pass |
| Frontend Smoke Tests | 7 | ✅ All pass |
| CI/CD Pipeline | 2 | ✅ All pass |
| ETL Pipeline (Bronze/Silver/Gold, SCD Type 2) | 4 | ✅ All pass |
| Power BI DAX Validation (AC-09) | 6 | ✅ All pass |

---

## Roadmap

- [x] Phase 1 — Azure SQL OLTP schema, stored procedures, .NET 10 Web API
- [x] Phase 2 — React frontend, leave workflow, manager approval dashboard
- [x] Phase 2.5 — GitHub Actions CI/CD, secrets management, clean public repo
- [x] Phase 3 — Databricks PySpark ETL (Bronze/Silver/Gold), Unity Catalog Delta DWH, SCD Type 2 verified
- [ ] Phase 4 — Power BI dashboard (4 pages, 6 DAX measures, published to Power BI Service)
- [ ] Phase 5 — Architecture diagram, final polish

---

## Author

**Farhan Ahmed** — Tech Lead | Data & Cloud Engineering  
[GitHub](https://github.com/farhan86) · [LinkedIn](https://www.linkedin.com/in/farhan867/)
