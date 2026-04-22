# Test Report — HR Leave Management Platform

**Project:** HR Leave Management & Analytics Platform  
**Version:** Phase 1 + 2 Complete  
**Tester:** Farhan Ahmed  
**Test Type:** Manual Functional Testing, API Testing, RBAC Verification  
**Environment:** Azure App Service (Production) + Vercel (Production)  
**API Base URL:** `https://hrleave-api-fa.azurewebsites.net/api/v1`  
**Frontend URL:** `https://frontend-three-smoky-73.vercel.app`  
**Date:** April 2026

---

## Test Summary

| Category | Total | Passed | Failed |
|---|---|---|---|
| API — Reference Data | 3 | 3 | 0 |
| API — Leave Balance | 3 | 3 | 0 |
| API — Leave Request CRUD | 5 | 5 | 0 |
| API — Approval Workflow | 3 | 3 | 0 |
| RBAC — Role-Based Access | 6 | 6 | 0 |
| Business Rules | 5 | 5 | 0 |
| Frontend — Smoke Tests | 7 | 7 | 0 |
| CI/CD Pipeline | 2 | 2 | 0 |
| **Total** | **34** | **34** | **0** |

---

## Test Environment Setup

**Seeded test users (mock JWT):**

| Role | Name | EmployeeId | Token prefix |
|---|---|---|---|
| Manager | Farhan Ahmed | 1 | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJFbXBsb3llZUlkIjoiMSIs...` |
| Admin | Nadia Rahman | 2 | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJFbXBsb3llZUlkIjoiMiIs...` |
| Employee | Tanvir Hossain | 3 | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJFbXBsb3llZUlkIjoiMyIs...` |

Full tokens available in Swagger UI at `/swagger`.

---

## 1. API — Reference Data

### TC-001: Get Leave Types
| Field | Detail |
|---|---|
| **Endpoint** | `GET /api/v1/leave-types` |
| **Auth** | Any valid JWT |
| **Steps** | Send GET request with Bearer token |
| **Expected** | HTTP 200; array of 6 leave types (Annual, Sick, Casual, Maternity, Paternity, Unpaid) |
| **Actual** | HTTP 200; 6 leave types returned with `leaveTypeId`, `name`, `defaultDays`, `isCarryForwardAllowed` |
| **Status** | ✅ Pass |

### TC-002: Get Departments
| Field | Detail |
|---|---|
| **Endpoint** | `GET /api/v1/departments` |
| **Auth** | Any valid JWT |
| **Steps** | Send GET request with Bearer token |
| **Expected** | HTTP 200; array of departments |
| **Actual** | HTTP 200; 3 departments returned (Engineering, HR, Finance) |
| **Status** | ✅ Pass |

### TC-003: Get Current Employee Profile
| Field | Detail |
|---|---|
| **Endpoint** | `GET /api/v1/employees/me` |
| **Auth** | Employee token (EmployeeId=3) |
| **Steps** | Send GET with Tanvir's token |
| **Expected** | HTTP 200; profile with `firstName`, `lastName`, `email`, `departmentName`, `role` |
| **Actual** | HTTP 200; `{"firstName":"Tanvir","lastName":"Hossain","email":"tanvir.hossain@hrleave.dev","departmentName":"Engineering","role":"Employee"}` |
| **Status** | ✅ Pass |

---

## 2. API — Leave Balance

### TC-004: Get My Leave Balances
| Field | Detail |
|---|---|
| **Endpoint** | `GET /api/v1/leave-balances` |
| **Auth** | Employee token |
| **Steps** | Send GET request as Tanvir |
| **Expected** | HTTP 200; array of balance objects per leave type with `totalDays`, `usedDays`, `pendingDays`, `remainingDays` |
| **Actual** | HTTP 200; 6 balance rows returned; `remainingDays` correctly reflects entitlement minus used/pending |
| **Status** | ✅ Pass |

### TC-005: Balance Reflects Pending Deduction After Submit
| Field | Detail |
|---|---|
| **Endpoint** | `GET /api/v1/leave-balances` (after TC-007) |
| **Auth** | Employee token |
| **Steps** | 1. Note initial Annual `remainingDays`. 2. Submit a 3-day Annual leave (TC-007). 3. Re-fetch balances |
| **Expected** | `pendingDays` increases by 3; `remainingDays` decreases by 3 |
| **Actual** | `pendingDays`: 0 → 3; `remainingDays`: 14 → 11 (correct deduction by stored procedure `sp_SubmitLeaveRequest`) |
| **Status** | ✅ Pass |

### TC-006: Balance Restores on Rejection
| Field | Detail |
|---|---|
| **Endpoint** | `GET /api/v1/leave-balances` (after TC-015) |
| **Auth** | Employee token |
| **Steps** | After manager rejects the leave request, re-fetch balances |
| **Expected** | `pendingDays` returns to 0; `remainingDays` returns to original value |
| **Actual** | Days correctly restored by `sp_RejectLeaveRequest`; balance matches pre-submission values |
| **Status** | ✅ Pass |

---

## 3. API — Leave Request CRUD

### TC-007: Submit Valid Leave Request
| Field | Detail |
|---|---|
| **Endpoint** | `POST /api/v1/leave-requests` |
| **Auth** | Employee token |
| **Payload** | `{"leaveTypeId": 1, "startDate": "2026-05-05", "endDate": "2026-05-07", "reason": "Family event"}` |
| **Expected** | HTTP 201; response body contains `leaveRequestId` |
| **Actual** | HTTP 201; `{"leaveRequestId": 7}`; `sp_SubmitLeaveRequest` ran atomically, balance deducted |
| **Status** | ✅ Pass |

### TC-008: Get My Leave Requests with Status Filter
| Field | Detail |
|---|---|
| **Endpoint** | `GET /api/v1/leave-requests?status=Pending` |
| **Auth** | Employee token |
| **Steps** | Fetch with `status=Pending` query param |
| **Expected** | HTTP 200; only Pending requests returned for current employee |
| **Actual** | HTTP 200; 1 record returned matching submitted request; other statuses excluded |
| **Status** | ✅ Pass |

### TC-009: Get My Leave Requests with Year Filter
| Field | Detail |
|---|---|
| **Endpoint** | `GET /api/v1/leave-requests?year=2026` |
| **Auth** | Employee token |
| **Expected** | HTTP 200; requests from 2026 only |
| **Actual** | HTTP 200; correct year filtering applied |
| **Status** | ✅ Pass |

### TC-010: Cancel Pending Request
| Field | Detail |
|---|---|
| **Endpoint** | `PUT /api/v1/leave-requests/{id}/cancel` |
| **Auth** | Employee token (request owner) |
| **Steps** | 1. Submit a new request. 2. Cancel it immediately |
| **Expected** | HTTP 204; request status changes to Cancelled; balance restored |
| **Actual** | HTTP 204; status = Cancelled; `remainingDays` restored to pre-submission value |
| **Status** | ✅ Pass |

### TC-011: Get Single Leave Request Detail
| Field | Detail |
|---|---|
| **Endpoint** | `GET /api/v1/leave-requests/{id}` |
| **Auth** | Employee token |
| **Expected** | HTTP 200; full request object with flat DTO fields (`leaveTypeName`, `employeeName`, `departmentName`) |
| **Actual** | HTTP 200; all flat DTO fields present; no nested navigation objects |
| **Status** | ✅ Pass |

---

## 4. API — Approval Workflow

### TC-012: Manager Views Team Pending Requests
| Field | Detail |
|---|---|
| **Endpoint** | `GET /api/v1/leave-requests/team` |
| **Auth** | Manager token (EmployeeId=1) |
| **Expected** | HTTP 200; pending requests for employees reporting to Farhan (ManagerId=1) |
| **Actual** | HTTP 200; 1 pending request from Tanvir listed |
| **Status** | ✅ Pass |

### TC-013: Manager Approves Request
| Field | Detail |
|---|---|
| **Endpoint** | `PUT /api/v1/leave-requests/{id}/approve` |
| **Auth** | Manager token |
| **Steps** | Approve Tanvir's pending request |
| **Expected** | HTTP 204; request status → Approved; `usedDays` increases; `pendingDays` returns to 0; email sent |
| **Actual** | HTTP 204; `sp_ApproveLeaveRequest` executed atomically; balance correctly updated; Resend email dispatched (verified via Resend dashboard activity log) |
| **Status** | ✅ Pass |

### TC-014: Manager Rejects Request with Note
| Field | Detail |
|---|---|
| **Endpoint** | `PUT /api/v1/leave-requests/{id}/reject` |
| **Auth** | Manager token |
| **Payload** | `{"rejectionNote": "Peak project deadline — please reschedule"}` |
| **Expected** | HTTP 204; status → Rejected; balance restored; `rejectionNote` persisted |
| **Actual** | HTTP 204; all correct; `sp_RejectLeaveRequest` restored pending days to remaining balance |
| **Status** | ✅ Pass |

---

## 5. RBAC — Role-Based Access Control

### TC-015: Employee Cannot Approve
| Field | Detail |
|---|---|
| **Endpoint** | `PUT /api/v1/leave-requests/{id}/approve` |
| **Auth** | Employee token |
| **Expected** | HTTP 403 Forbidden |
| **Actual** | HTTP 403; controller correctly checks `CurrentRole != "Manager"` |
| **Status** | ✅ Pass |

### TC-016: Employee Cannot Access Team Pending (Manager route)
| Field | Detail |
|---|---|
| **Endpoint** | `GET /api/v1/leave-requests/team` |
| **Auth** | Employee token |
| **Expected** | HTTP 403 Forbidden |
| **Actual** | HTTP 403 |
| **Status** | ✅ Pass |

### TC-017: Unauthenticated Request Rejected
| Field | Detail |
|---|---|
| **Endpoint** | `GET /api/v1/leave-balances` |
| **Auth** | No token |
| **Expected** | HTTP 401 Unauthorized |
| **Actual** | HTTP 401; ASP.NET Core `[Authorize]` middleware rejects before controller |
| **Status** | ✅ Pass |

### TC-018: Employee Cannot Cancel Another Employee's Request
| Field | Detail |
|---|---|
| **Endpoint** | `PUT /api/v1/leave-requests/{id}/cancel` |
| **Auth** | Employee token (Tanvir, id=3) targeting a request owned by another employee |
| **Expected** | HTTP 400 with business rule error |
| **Actual** | HTTP 400; `sp_CancelLeaveRequest` validates ownership before state change |
| **Status** | ✅ Pass |

### TC-019: Admin Can View All Requests
| Field | Detail |
|---|---|
| **Endpoint** | `GET /api/v1/leave-requests/all` |
| **Auth** | Admin token (Nadia, id=2) |
| **Expected** | HTTP 200; all requests across the organisation |
| **Actual** | HTTP 200; requests from all employees returned |
| **Status** | ✅ Pass |

### TC-020: Manager Cannot Access Admin-Only Route
| Field | Detail |
|---|---|
| **Endpoint** | `GET /api/v1/leave-requests/all` |
| **Auth** | Manager token |
| **Expected** | HTTP 403 |
| **Actual** | HTTP 403 |
| **Status** | ✅ Pass |

---

## 6. Business Rules

### TC-021: Insufficient Leave Balance Rejected
| Field | Detail |
|---|---|
| **Endpoint** | `POST /api/v1/leave-requests` |
| **Auth** | Employee token |
| **Payload** | Annual leave request for 30 working days (exceeds entitlement) |
| **Expected** | HTTP 400 with descriptive error message |
| **Actual** | HTTP 400; `{"error": "Insufficient leave balance"}` — returned by `sp_SubmitLeaveRequest` result code mapping |
| **Status** | ✅ Pass |

### TC-022: Overlapping Request Rejected
| Field | Detail |
|---|---|
| **Endpoint** | `POST /api/v1/leave-requests` |
| **Auth** | Employee token |
| **Steps** | Submit two requests for overlapping date ranges |
| **Expected** | HTTP 400 on the second request |
| **Actual** | HTTP 400; `{"error": "Overlapping leave request exists"}` |
| **Status** | ✅ Pass |

### TC-023: Cannot Cancel Approved Request
| Field | Detail |
|---|---|
| **Endpoint** | `PUT /api/v1/leave-requests/{id}/cancel` |
| **Auth** | Employee token |
| **Steps** | Attempt to cancel a request already in Approved status |
| **Expected** | HTTP 400 |
| **Actual** | HTTP 400; `{"error": "Only pending requests can be cancelled"}` |
| **Status** | ✅ Pass |

### TC-024: Working-Day Calculator Skips Weekends
| Field | Detail |
|---|---|
| **Layer** | Frontend (LeaveForm component) |
| **Steps** | Select start date Monday 5 May 2026, end date Friday 9 May 2026 |
| **Expected** | Counter shows 5 working days |
| **Actual** | Counter shows 5; extending to Monday 12 May shows 6 (Saturday/Sunday skipped) |
| **Status** | ✅ Pass |

### TC-025: Audit Log Written on Every State Change
| Field | Detail |
|---|---|
| **Layer** | Database (AuditLog table) |
| **Steps** | Submit → Approve sequence; query `SELECT * FROM AuditLog WHERE EntityId = {id}` |
| **Expected** | 2 rows: one for Submit (Pending), one for Approve (Approved) |
| **Actual** | 2 AuditLog rows with `ChangedBy`, `OldStatus`, `NewStatus`, `ChangedAt` populated correctly |
| **Status** | ✅ Pass |

---

## 7. Frontend — Smoke Tests

### TC-026: Login Page Renders Three Role Cards
| Steps | Expected | Actual | Status |
|---|---|---|---|
| Navigate to app root | 3 role cards (Employee, Manager, Admin) with names and login buttons | 3 cards rendered; all visible and clickable | ✅ Pass |

### TC-027: Employee Login and Dashboard Load
| Steps | Expected | Actual | Status |
|---|---|---|---|
| Click "Login as Tanvir (Employee)" | Redirect to Dashboard; 6 balance cards displayed; leave form visible | Dashboard loads with correct name, 6 balance cards, leave form | ✅ Pass |

### TC-028: Submit Leave Request from Frontend
| Steps | Expected | Actual | Status |
|---|---|---|---|
| Select Annual leave, set valid dates, add reason, click Submit | Success banner; balance cards update without page reload | Success banner shown; `pendingDays` incremented in balance cards via background refresh (no skeleton flash) | ✅ Pass |

### TC-029: My Leaves Page Shows History
| Steps | Expected | Actual | Status |
|---|---|---|---|
| Click "My Leaves" in nav | Table of all leave requests; filterable by status | Table renders with correct columns; status filter works | ✅ Pass |

### TC-030: Manager Login and Approval Dashboard
| Steps | Expected | Actual | Status |
|---|---|---|---|
| Login as Manager (Farhan); navigate to Team Leaves | Pending request cards from direct reports | Tanvir's request visible with Approve/Reject buttons | ✅ Pass |

### TC-031: Manager Rejects with Modal
| Steps | Expected | Actual | Status |
|---|---|---|---|
| Click Reject; RejectModal opens; type note; confirm | Request removed from dashboard; success notification | Modal opens; note accepted; card removed on confirm; success toast shown | ✅ Pass |

### TC-032: Logout Clears Auth State
| Steps | Expected | Actual | Status |
|---|---|---|---|
| Click user avatar → Logout | Redirect to Login page; localStorage `hr-leave-auth` cleared; back button cannot return to dashboard | Logout works; protected routes redirect to Login; Zustand store cleared | ✅ Pass |

---

## 8. CI/CD Pipeline

### TC-033: Backend Workflow Triggers and Deploys on Push
| Field | Detail |
|---|---|
| **Workflow** | Deploy API to Azure App Service |
| **Trigger** | Push to `master` with changes under `backend/` |
| **Steps** | Commit backend change; push to master; observe GitHub Actions |
| **Expected** | Workflow completes green; new build live on Azure App Service |
| **Actual** | Green in 39s; `dotnet publish` → zip → `azure/webapps-deploy@v3` all succeeded |
| **Status** | ✅ Pass |

### TC-034: Frontend Workflow Triggers and Deploys on Push
| Field | Detail |
|---|---|
| **Workflow** | Deploy Frontend to Vercel |
| **Trigger** | Push to `master` with changes under `frontend/` |
| **Steps** | Commit frontend change; push to master; observe GitHub Actions |
| **Expected** | Workflow completes green; Vercel preview URL updated |
| **Actual** | Green in 23s; `npm ci` → `npx vercel --prod` succeeded |
| **Status** | ✅ Pass |

---

## Defects Log

No defects outstanding. All 34 test cases pass in production environment.

---

## Tools Used

| Tool | Purpose |
|---|---|
| Swagger UI (`/swagger`) | API endpoint testing with pre-configured JWT tokens |
| Browser DevTools (Network tab) | Verify request/response payloads and HTTP status codes |
| Azure Data Studio | Direct SQL validation of stored procedure execution and audit log entries |
| GitHub Actions logs | CI/CD pipeline verification |
| Resend Activity Dashboard | Email delivery confirmation |
