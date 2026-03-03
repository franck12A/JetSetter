# JetSetter Backend Bug Report
**Date:** Current Session  
**Status:** In Progress - Audit Complete, Fixes Pending  
**Severity Overview:** 4 Critical + 4 High Priority Issues

---

## Executive Summary
Comprehensive backend security and functional audit identified **8 major issues** spanning authorization, authentication context validation, and endpoint duplication. Primary impact: unauthorized access to CRUD operations, privilege escalation, data integrity risks.

---

## Critical Issues (Must Fix Before Production)

### 🔴 CRITICAL-1: ProductController.deleteProduct() Missing Authorization
**File:** [ProductController.java](reservas-backend/src/main/java/com/empresa/vuelos/reservas/de/vuelos/Backend/modules/Product/Controller/ProductController.java#L186)  
**Endpoint:** `DELETE /api/products/{id}`  
**Severity:** CRITICAL - Unauthorized Data Deletion  
**Issue:** No @PreAuthorize or authentication check. **Any unauthenticated user can delete any flight product.**

```java
@DeleteMapping("/{id}")
public ResponseEntity<String> deleteProduct(@PathVariable Long id) {
    productService.deleteProduct(id);
    return ResponseEntity.ok("Producto eliminado correctamente");
}
```

**Expected Behavior:** Only ADMIN users can delete products  
**Impact:** Data integrity - flights can be deleted by any user, breaking reservations  
**Fix Required:** Add `@PreAuthorize("hasRole('ADMIN')")`

---

### 🔴 CRITICAL-2: FeatureController Lacks Authorization on All CRUD Operations
**File:** [FeatureController.java](reservas-backend/src/main/java/com/empresa/vuelos/reservas/de/vuelos/Backend/modules/Product/Controller/FeatureController.java)  
**Endpoints:** 
- `POST /api/features` - Create feature
- `PUT /api/features/{id}` - Update feature
- `DELETE /api/features/{id}` - Delete feature

**Severity:** CRITICAL - Unauthorized Data Modification  
**Issue:** No authorization checks on any write operations. **Any user can create, modify, or delete flight features.**

```java
@PostMapping
public Feature create(@Valid @RequestBody FeatureDTO dto) { ... }  // ❌ No auth

@PutMapping("/{id}")
public Feature update(@PathVariable Long id, @Valid @RequestBody FeatureDTO dto) { ... }  // ❌ No auth

@DeleteMapping("/{id}")
public void delete(@PathVariable Long id) { ... }  // ❌ No auth
```

**Impact:** Corrupted feature data affecting all users' flight searches and filtering  
**Fix Required:** Add `@PreAuthorize("hasRole('ADMIN')")` to POST, PUT, DELETE methods

---

### 🔴 CRITICAL-3: AuthController.updateUserRole() Missing Authorization Enforcement
**File:** [AuthController.java](reservas-backend/src/main/java/com/empresa/vuelos/reservas/de/vuelos/Backend/modules/Auth/Controller/AuthController.java#L113)  
**Endpoint:** `PUT /api/auth/{userId}/role?role=ROLE_ADMIN`  
**Severity:** CRITICAL - Privilege Escalation  
**Issue:** @PreAuthorize annotation is **commented out**. Any user can elevate any other user (or themselves) to ADMIN.

```java
@PutMapping("/{userId}/role")
//@PreAuthorize("hasAuthority('ROLE_ADMIN')") // ❌ COMMENTED OUT!
public ResponseEntity<?> updateUserRole(
        @PathVariable Long userId,
        @RequestParam String role
) { ... }
```

**Expected Behavior:** Only current ADMIN users can change other users' roles  
**Impact:** Complete security bypass - users can become admins, access admin panel  
**Fix Required:** 
1. Uncomment @PreAuthorize annotation
2. Verify current user requesting role change is ADMIN

---

### 🔴 CRITICAL-4: CategoryController.createCategory() Missing Authorization
**File:** [CategoryController.java](reservas-backend/src/main/java/com/empresa/vuelos/reservas/de/vuelos/Backend/modules/Category/Controller/CategoryController.java#L24)  
**Endpoint:** `POST /api/categories`  
**Severity:** CRITICAL - Unauthorized Data Modification  
**Issue:** No authorization check. Any user can create flight categories.

```java
@PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
public ResponseEntity<Category> createCategory(@RequestBody Category category) {
    return ResponseEntity.ok(categoryService.saveCategory(category));  // ❌ No auth
}
```

**Impact:** Spam/corrupted category data affecting all users  
**Fix Required:** Add `@PreAuthorize("hasRole('ADMIN')")`

---

## High Priority Issues (Functional Problems)

### 🟠 HIGH-1: Duplicate Favorite Endpoints Causing Routing Conflicts
**Files:** 
- [AuthController.java](reservas-backend/src/main/java/com/empresa/vuelos/reservas/de/vuelos/Backend/modules/Auth/Controller/AuthController.java#L81) - POST/DELETE at `/{userId}/favorites/{productId}`
- [FavoriteController.java](reservas-backend/src/main/java/com/empresa/vuelos/reservas/de/vuelos/Backend/modules/Booking/Controller/FavoriteController.java) - POST/DELETE at root level

**Severity:** HIGH - Ambiguous Routing  
**Issue:** Same functionality implemented in two controllers with different URL structures.

```java
// AuthController
@PostMapping("/{userId}/favorites/{productId}")
public ResponseEntity<?> addFavorite(@PathVariable Long userId, @PathVariable Long productId) { ... }

// FavoriteController  
@PostMapping
public ResponseEntity<String> addFavorite(...) { ... }
```

**Impact:** Frontend doesn't know which endpoint to call, 404 errors on favorite operations  
**Fix Required:** Consolidate into single FavoriteController, remove from AuthController

---

### 🟠 HIGH-2: Missing User Context Validation - getFavorites()
**File:** [AuthController.java](reservas-backend/src/main/java/com/empresa/vuelos/reservas/de/vuelos/Backend/modules/Auth/Controller/AuthController.java#L65)  
**Endpoint:** `GET /api/auth/{userId}/favorites`  
**Severity:** HIGH - Privacy/Data Exposure  
**Issue:** No validation that requesting user matches userId in path. Users can view other users' favorites.

```java
@GetMapping("/{userId}/favorites")
public ResponseEntity<?> getFavorites(@PathVariable Long userId) {
    try {
        Set<Product> favorites = authService.getFavorites(userId);  // ❌ No ownership check
        return ResponseEntity.ok(favorites);
    } catch (Exception e) { ... }
}
```

**Expected Behavior:** Users can only view their own favorites, or provide Authentication header validation  
**Impact:** Privacy breach - unauthorized access to other users' favorite flights  
**Fix Required:** Validate authenticated user matches userId parameter, or extract userId from Authentication context

---

### 🟠 HIGH-3: Missing User Ownership Validation - addFavorite/removeFavorite
**File:** [AuthController.java](reservas-backend/src/main/java/com/empresa/vuelos/reservas/de/vuelos/Backend/modules/Auth/Controller/AuthController.java#L82)  
**Endpoints:**
- `POST /api/auth/{userId}/favorites/{productId}`
- `DELETE /api/auth/{userId}/favorites/{productId}`

**Severity:** HIGH - Data Integrity  
**Issue:** Validates userId but doesn't verify it matches authenticated user. User A can add favorites for User B.

```java
@PostMapping("/{userId}/favorites/{productId}")
public ResponseEntity<?> addFavorite(@PathVariable Long userId, @PathVariable Long productId) {
    try {
        if (userId == null || userId <= 0) {
            return ResponseEntity.status(401).body("Debe iniciar sesión");
        }
        // ❌ No check that authenticated user == userId parameter
        User user = authService.addFavorite(userId, productId);
        user.setPassword(null);
        return ResponseEntity.ok(user);
    } catch (Exception e) { ... }
}
```

**Impact:** Users can modify other users' favorites, data corruption  
**Fix Required:** Extract userId from Authentication context or validate authenticated user matches parameter

---

### 🟠 HIGH-4: AuthController.getAllUsers() Missing Authorization
**File:** [AuthController.java](reservas-backend/src/main/java/com/empresa/vuelos/reservas\de\vuelos\Backend\modules\Auth\Controller\AuthController.java#L128)  
**Endpoint:** `GET /api/auth/all`  
**Severity:** HIGH - Information Disclosure  
**Issue:** No authorization check. **Any user can retrieve complete list of all registered users with details.**

```java
@GetMapping("/all")
public ResponseEntity<?> getAllUsers() {
    try {
        return ResponseEntity.ok(authService.getAllUsers());  // ❌ No auth check
    } catch (Exception e) { ... }
}
```

**Expected Behavior:** Only ADMIN can list users  
**Impact:** Privacy breach - expose all user emails and information  
**Fix Required:** Add `@PreAuthorize("hasRole('ADMIN')")`

---

## Testing Checklist - Complete Workflow Validation

- [ ] **Register Flow**
  - [ ] User successfully registers with valid email/password
  - [ ] User registration fails with duplicate email
  - [ ] Welcome email sent successfully

- [ ] **Login Flow**
  - [ ] User login with correct credentials returns JWT token
  - [ ] Token contains correct user role (ROLE_USER or ROLE_ADMIN)
  - [ ] Failed login with wrong password returns 401
  - [ ] Failed login with non-existent user returns 401

- [ ] **Booking Flow**
  - [ ] Authenticated user can create flight reservation
  - [ ] Booking shows correct user's bookings only (ownership validation)
  - [ ] Unauthorized user cannot create booking (requires authentication)
  - [ ] User can cancel own booking but not another user's booking

- [ ] **Favorites Flow**
  - [ ] Authenticated user can add flight to favorites
  - [ ] Authenticated user can remove flight from favorites
  - [ ] User can only see/modify own favorites (not other users')
  - [ ] Unauthenticated user cannot add/remove favorites

- [ ] **Admin Features**
  - [ ] Non-admin user cannot delete flight products (403)
  - [ ] ADMIN can delete flight products (200)
  - [ ] Non-admin cannot create/edit/delete flight features (403)
  - [ ] ADMIN can create/edit/delete features (successful)
  - [ ] Non-admin cannot create flight categories (403)
  - [ ] ADMIN can create categories (successful)
  - [ ] Non-admin cannot change user roles (403)
  - [ ] ADMIN can change user roles (successful)
  - [ ] Non-admin cannot list all users (403)
  - [ ] ADMIN can list all users (200)

- [ ] **Authorization Enforcement**
  - [ ] Super admin (admin@vuelos.com) cannot be deleted
  - [ ] Super admin role cannot be changed
  - [ ] Regular admin can be demoted to ROLE_USER

---

## Implementation Order

1. **Phase 1 - Security Critical (Do First)**
   - [ ] Uncomment and test @PreAuthorize in updateUserRole()
   - [ ] Add @PreAuthorize to ProductController.deleteProduct()
   - [ ] Add @PreAuthorize to all FeatureController write operations
   - [ ] Add @PreAuthorize to CategoryController.createCategory()

2. **Phase 2 - Authentication Context**
   - [ ] Update AuthController endpoints to extract userId from Authentication context
   - [ ] Add user ownership validation to getFavorites(), addFavorite(), removeFavorite()
   - [ ] Add @PreAuthorize to getAllUsers()

3. **Phase 3 - Architectural**
   - [ ] Consolidate favorite endpoints (keep FavoriteController, remove from AuthController)
   - [ ] Update frontend API calls to use single favorite endpoint
   - [ ] Verify all endpoints follow consistent authentication pattern

4. **Phase 4 - Testing**
   - [ ] Run complete workflow tests for all scenarios
   - [ ] Test authorization on all CRUD operations
   - [ ] Test user isolation and data ownership

---

## Files to Modify

1. **ProductController.java** - Add @PreAuthorize to deleteProduct()
2. **FeatureController.java** - Add @PreAuthorize to create(), update(), delete()
3. **CategoryController.java** - Add @PreAuthorize to createCategory()
4. **AuthController.java** - Uncomment @PreAuthorize, add user context validation, remove favorite endpoints
5. **FavoriteController.java** - Verify implementation, ensure it's the single source of truth
6. **SecurityConfig.java** (if exists) - Verify @EnableGlobalMethodSecurity is configured
7. **Frontend API calls** - Update to use consolidated endpoints

---

## Notes

- All endpoints currently use try/catch with ResponseEntity.badRequest() - consistent error handling is good
- AuthService has good validation logic (prevents super admin deletion, validates roles)
- JWT token generation appears correct with roles included
- Password fields properly nullified before returning to frontend
- Need to verify SecurityConfig has method-level security enabled

---

*Bug report generated during comprehensive backend audit. Issues identified through code review of controllers, services, and authentication flow validation.*
