# Bitacora Sprint 2

Fecha: 2026-03-17

## Objetivo
Consolidar categorias, autenticacion, caracteristicas de productos y notificaciones de registro.

## Actividades realizadas
- Categorizar productos con soporte de iconos e imagenes en categorias.
- Registrar usuario con validaciones y respuesta segura.
- Identificar usuario y rol desde login con token.
- Cerrar sesion desde el cliente limpiando el token y bloqueando endpoints protegidos sin auth.
- Identificar administrador con rol ROLE_ADMIN.
- Administrar caracteristicas de producto (crear, actualizar, eliminar).
- Visualizar caracteristicas disponibles.
- Notificacion de registro por Gmail.
- Crear seccion de categorias (listar).
- Agregar categoria desde admin.

## Dificultades y notas
- Lo mas complejo fue el manejo de categorias: sumar iconos/imagenes y separar vuelos por categoria al traerlos del back con distinta categoria.
- La parte de auth fue mas sencilla gracias a pruebas con Postman.
- La notificacion de Gmail se integro sin mayor complejidad.
