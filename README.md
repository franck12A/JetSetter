# JettSeter - Dev Run

## Levantar todo junto (Windows / PowerShell)

Desde la raiz del repo:

```powershell
.\dev-up.ps1
```

Opciones utiles:

```powershell
# Cambiar puertos
.\dev-up.ps1 -BackendPort 8080 -FrontendPort 5173

# No matar procesos que ocupan puertos (falla con mensaje claro)
.\dev-up.ps1 -NoKillConflicts
```

Este comando usa la misma terminal integrada de VS Code:

- Levanta backend en segundo plano.
- Levanta frontend en primer plano.
- Al cortar el frontend (`Ctrl + C`), detiene backend automaticamente.
- Libera puertos ocupados (backend/frontend) antes de iniciar, salvo que uses `-NoKillConflicts`.

## Levantar manual

Backend:

```powershell
cd .\reservas-backend
.\mvnw.cmd spring-boot:run
```

Frontend:

```powershell
cd .\reservas-frontend
npm install
npm run dev
```

URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
