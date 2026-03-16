# Test Execution - Sprint 1

Date: 2026-03-16

## Automated tests
- Backend command: `.\mvnw.cmd test`
- Result: PASS
- Tests executed: 14 (contextLoads + product CRUD + search/random + gallery images + security checks)

Notes:
- Maven warned about duplicate `maven-compiler-plugin` entries in `pom.xml`, but tests still passed.

## Manual tests (UI)
Manual UI cases require the frontend and backend running. Not executed in this environment.

| ID | Status | Notes |
|---|---|---|
| TC-01 | Not executed | Frontend not running here |
| TC-02 | Not executed | Frontend not running here |
| TC-03 | Executed (API) | POST `/api/products` with admin role |
| TC-04 | Executed (API) | GET `/api/products` |
| TC-05 | Executed (API) | GET `/api/products/{id}` |
| TC-06 | Executed (API) | GET `/api/images/country` (mocked service) |
| TC-07 | Not executed | Frontend not running here |
| TC-08 | Not executed | Requires pagination view |
| TC-09 | Not executed | Requires admin panel |
| TC-10 | Executed (API) | GET `/api/products` (admin list) |
| TC-11 | Executed (API) | DELETE `/api/products/{id}` with admin role |
