# AuditFlow — Manual Testing Checklist

## Environment

| Component | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8080 |
| PostgreSQL | localhost:15432 |

## Test users

| Role | Email | Password |
|---|---|---|
| ADMIN | admin@auditflow.local | Admin123! |
| AUDITOR | auditor@auditflow.local | Auditor123! |

## Authentication tests

### Admin login

| Step | Expected result | Status |
|---|---|---|
| Open `/login` | Login page loads correctly | PASS |
| Login as `admin@auditflow.local` | Redirects to `/dashboard` | PASS |
| Dashboard loads user data | Admin name, email, role and organization are visible | PASS |

### Auditor login

| Step | Expected result | Status |
|---|---|---|
| Logout from admin session | User returns to `/login` | PASS |
| Login as `auditor@auditflow.local` | Redirects to `/dashboard` | PASS |
| Dashboard loads user data | Auditor name, email, role and organization are visible | PASS |

### Logout

| Step | Expected result | Status |
|---|---|---|
| Click logout | Backend clears auth cookie | PASS |
| User is redirected to `/login` | Login page is shown | PASS |
| Open `/dashboard` after logout | User is redirected to `/login` | PASS |

## Cookie security tests

| Test | Expected result | Status |
|---|---|---|
| Check browser cookies | `access_token` exists under backend origin | PASS |
| Check HttpOnly flag | Cookie is marked as HttpOnly | PASS |
| Check Secure flag in local | Secure is false in local development | PASS |
| Check SameSite | SameSite is Lax | PASS |
| Search frontend source for localStorage | No usage found | PASS |
| Search frontend source for sessionStorage | No usage found | PASS |

## Project tests

### Admin creates project

| Step | Expected result | Status |
|---|---|---|
| Login as ADMIN | Dashboard loads | PASS |
| Open `/projects` | Projects page loads | PASS |
| Fill create project form | Form accepts valid input | PASS |
| Submit project | Project is created successfully | PASS |
| Project appears in list | New project is visible | PASS |

### Auditor cannot create project

| Step | Expected result | Status |
|---|---|---|
| Login as AUDITOR | Dashboard loads | PASS |
| Open `/projects` | Projects page loads | PASS |
| Check create form | Form is hidden or blocked for AUDITOR | PASS |
| Try direct API request if needed | Backend returns 403 | PASS |

### Auditor sees only assigned projects

| Step | Expected result | Status |
|---|---|---|
| Login as AUDITOR | Dashboard loads | PASS |
| Open `/projects` | Only assigned projects are listed | PASS |
| Try to open unassigned project by ID | Backend returns 403 or frontend shows access error | PASS |

## Finding tests

### Auditor creates finding in assigned project

| Step | Expected result | Status |
|---|---|---|
| Login as AUDITOR | Dashboard loads | PASS |
| Open `/findings` | Findings page loads | PASS |
| Select assigned project | Project is available in dropdown | PASS |
| Fill finding form | Form accepts valid data | PASS |
| Submit finding | Finding is created successfully | PASS |
| Finding appears in list | New finding is visible | PASS |

### Auditor cannot create finding in unassigned project

| Step | Expected result | Status |
|---|---|---|
| Login as AUDITOR | Dashboard loads | PASS |
| Try to create finding for unassigned project by API | Backend returns 403 | PASS |
| UI should not expose unassigned projects | Unassigned project does not appear in dropdown | PASS |

## Findings filters and pagination

| Test | Expected result | Status |
|---|---|---|
| Open `/findings` | Findings list loads | PASS |
| Select severity HIGH | URL updates with `severity=HIGH` | PASS |
| Select status OPEN | URL updates with `status=OPEN` | PASS |
| Select project | URL updates with `projectId` | PASS |
| Click pagination next | URL updates with `page=1` | PASS |
| Reload page with filters | Filters remain selected | PASS |
| Paste filtered URL directly | Page loads filtered state correctly | PASS |
| Use invalid status `PUBLISHED` | Page does not break and shows warning | PASS |

## Local deployment test

| Step | Expected result | Status |
|---|---|---|
| Start PostgreSQL with Docker | Container runs successfully | PASS |
| Start backend | Spring Boot starts on port 8080 | PASS |
| Start frontend dev server | Next.js starts on port 3000 | PASS |
| Run frontend build | Build completes successfully | PASS |
| Run backend tests | Maven tests pass | PASS |

## Final result

Manual testing completed successfully.

Main security requirements verified:

- Cookie-based authentication with HTTPOnly cookie.
- No token stored in localStorage.
- No token stored in sessionStorage.
- Role-based access control.
- Organization-based access control.
- Project assignment validation for auditors.
- IDOR protection in backend.
- URL-based filters and pagination in findings module.