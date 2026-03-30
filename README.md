# ✈️ JetSetter

Aplicación web integral para la reserva de vuelos. Permite a los usuarios registrarse, buscar vuelos disponibles por fechas (con conexión a la API de Amadeus), ver detalles, gestionar sus vuelos como favoritos y realizar sus reservas. Los administradores disponen de un panel de control avanzado para gestionar los vuelos (productos), las aerolíneas, categorías y características. 

---

## ⚙️ Tecnologías

### 🖥️ Frontend
- **React 19 + Vite 7** (Componentes ágiles y rápido HMR)
- **CSS Vanilla (Módulos)** (Diseño adaptativo y estructurado)
- **Axios** (Peticiones HTTP)
- **React Router 7** (Enrutamiento del lado del cliente)
- **Swiper** (Carruseles dinámicos)
- **React Day Picker** (Selector de calendarios para las reservas)

### ☕ Backend
- **Java 17**
- **Spring Boot 3.5.6**
- **Spring Security + JWT** (Autenticación sin estado)
- **Spring Data JPA** (Persistencia y modelado de datos)
- **H2 Database / PostgreSQL** (Entorno local en memoria / Deploy)
- **Java Mail Sender** (Notificaciones automáticas por correo)
- **Amadeus API** (Gestión de ofertas y datos de vuelos)
- **Unsplash API** (Fotos dinámicas de los destinos)

---

## 🚀 Instalación local

### 🧩 Requisitos previos
- Node.js 18+
- Java 17 (JDK)
- Maven (Opcional, el proyecto incluye un Wrapper `mvnw`)

### 📦 Cloná el repositorio
```bash
git clone https://github.com/tu-usuario/jetsetter.git
cd jetsetter
```

---

### 📁 Backend (`/reservas-backend`)

```bash
cd reservas-backend
```

#### Configuración de Variables de Entorno y Secretos:
> Por defecto el backend de desarrollo corre con una base de datos **H2 en memoria** (la base de datos se recrea cada vez que arranca la aplicación de manera efímera, por lo que no hace falta levantar servicios externos como MySQL o PostgreSQL para probarlo).

```bash
touch src/main/resources/.env.properties
```

Ejemplo del archivo `.env.properties`:
```properties
# .env.properties (o en variables locales de tu sistema)
APP_PROVIDER_WHATSAPP=5491155550101
APP_PROVIDER_EMAIL=soporte@jetsetter.com
UNSPLASH_ACCESS_KEY=tu_clave_de_unsplash_api_key_aqui
```
*(Nota: Las claves de la API de Amadeus y el secreto JWT de desarrollo ya vienen en `application.properties` simplificando la instalación local).*

#### Correr el backend:
En PowerShell o Windows `cmd`:
```bash
.\mvnw.cmd spring-boot:run
```
> El Backend de Spring Boot estará disponible y escuchando peticiones en: `http://localhost:8080`
> La consola de la BD H2 en local está en `http://localhost:8080/h2-console`

---

### 🖼️ Frontend (`/reservas-frontend`)

Abre una nueva terminal para iniciar el frontend simultáneamente:

```bash
cd reservas-frontend
npm install
```

#### Configurar entorno local:
```bash
touch .env
```
Contenido de `.env`:
```dotenv
VITE_API_URL=http://localhost:8080/api
VITE_PROVIDER_WHATSAPP=5491155550101
```

#### Correr el proyecto:
```bash
npm run dev
```
> La SPA web estará corriendo en el puerto por defecto de Vite `http://localhost:5173`

---

## 📬 Endpoints de API Principales

| Método | Endpoint                        | Descripción                             | Auth requerida |
|--------|---------------------------------|-----------------------------------------|----------------|
| POST   | `/api/auth/register`            | Registro de nuevo pasajero.             | ❌             |
| POST   | `/api/auth/authenticate`        | Login de usuario y generación de token. | ❌             |
| GET    | `/api/products`                 | Listado de todos los vuelos disponibles.| ❌             |
| POST   | `/api/products`                 | Crear un nuevo vuelo y sus imágenes.    | ✅ (ADMIN)      |
| GET    | `/api/products/{id}`            | Ver detalles un producto individual.    | ❌             |
| GET    | `/api/bookings/user`            | Leer historial de vuelos del pasajero.  | ✅ (USER)       |
| GET    | `/api/bookings/product/{id}/dates`| Lee las fechas en las que un vuelo está ocupado.| ❌ |
| POST   | `/api/bookings/create`          | Formulario y ejecución de la reserva.   | ✅ (USER)       |
| POST   | `/api/favorites`                | Marcar o quitar "Me gusta" de vuelo.    | ✅ (USER)       |

> 📌 Por defecto, las consultas no autenticadas arrojarán código genérico de vuelos, pero los Endpoints protegidos devolverán un `401 Unauthorized`.

---

## 🧪 Testing

### Backend
Para las pruebas unitarias e integración se implementó el framework de **JUnit Jupiter** / **Mockito**, empleando el `MockMvc` integrado de Spring.
Los tests simulan usuarios logueados, creación de roles en H2 pre-testeo y aserción de estados HTTP.

```bash
cd reservas-backend
# Windows:
.\mvnw.cmd test
```

### Frontend
Para iniciar el linter en la carpeta `reservas-frontend`:
```bash
npm run lint
```

---

## ☁️ Deploy

### El proyecto está preparado para su despliegue moderno:
- **Backend (Spring Boot):** Contiene el empaquetado y drivers de PostgreSQL embebidos. Recomendado instanciar sobre **Railway, Render o AWS**.
- **Frontend (Static / React):** Preparado con `npm run build`. Recomendado publicar el compilado resultante a **Vercel** o **Netlify**.

---

## 👤 Autores

- [@FrancoEnrici](https://github.com/franck12A) -> (Modificar aquí tu usuario en GitHub)

---

## 📄 Licencia
Reservados todos los derechos.

---

## 📞 Atención al Pasajero
¿Encontraste un avión fuera de ruta?
- 🐛 Reportar error o falla
- 📧 Contáctate: soporte@jetsetter.com
