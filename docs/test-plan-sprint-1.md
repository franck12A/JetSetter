# Test Plan - Sprint 1

## Scope
Sprint 1 user stories:
1. Colocar el encabezado
2. Definir el cuerpo del sitio
3. Registrar el producto
4. Revisar productos en el home
5. Visualizar detalle del producto
6. Visualizar galeria de imagenes
7. Colocar pie de pagina
8. Paginar productos
9. Panel de administracion
10. Listar productos
11. Eliminar productos

## Environment
- Frontend: Vite (reservas-frontend)
- Backend: Spring Boot (reservas-backend)
- DB: H2 in-memory (tests) / PostgreSQL (runtime)
- Tools: Postman for API checks

## Assumptions
- Backend running at local base URL (configurable).
- Frontend running with access to backend endpoints.
- Admin access available for admin panel flows.

## Test Cases

| ID | User story | Preconditions | Steps | Expected result |
|---|---|---|---|---|
| TC-01 | Colocar el encabezado | Frontend running | 1) Open Home | Header and navigation visible and aligned |
| TC-02 | Definir el cuerpo del sitio | Frontend running | 1) Open Home 2) Scroll | Main sections render without layout breaks |
| TC-03 | Registrar el producto | Backend running, admin access | 1) Go to Admin panel 2) Fill form 3) Submit | Product created and shown in list |
| TC-04 | Revisar productos en el home | Backend running | 1) Open Home | Product list renders with data |
| TC-05 | Visualizar detalle del producto | Backend running | 1) Open Home 2) Click product | Detail page shows product data |
| TC-06 | Visualizar galeria de imagenes | Backend running | 1) Open product detail 2) Open gallery | Modal opens with images and close works |
| TC-07 | Colocar pie de pagina | Frontend running | 1) Scroll to bottom | Footer visible and complete |
| TC-08 | Paginar productos | Backend running | 1) Go to list 2) Next/Prev page | Page changes and items update |
| TC-09 | Panel de administracion | Backend running, admin access | 1) Open Admin panel | Admin panel loads without errors |
| TC-10 | Listar productos | Backend running, admin access | 1) Open Admin list | Products visible in admin list |
| TC-11 | Eliminar productos | Backend running, admin access | 1) Click delete 2) Confirm | Product removed from list |
