param(
  [int]$BackendPort = 8080,
  [int]$FrontendPort = 5173,
  [switch]$NoKillConflicts
)

$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
$backendPath = Join-Path $root "reservas-backend"
$frontendPath = Join-Path $root "reservas-frontend"

function Get-ListeningPidsByPort {
  param([int]$Port)

  $pids = @()

  try {
    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($connections) {
      $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    }
  }
  catch {
    # Fallback below
  }

  if (-not $pids -or $pids.Count -eq 0) {
    $netstatLines = netstat -ano -p tcp | Select-String -Pattern "LISTENING"
    foreach ($line in $netstatLines) {
      $parts = ($line.ToString() -split "\s+") | Where-Object { $_ -ne "" }
      if ($parts.Count -lt 5) { continue }

      $localAddress = $parts[1]
      $ownerPid = $parts[4]

      if ($localAddress -match ":(\d+)$" -and [int]$Matches[1] -eq $Port) {
        $pids += [int]$ownerPid
      }
    }
  }

  return ($pids | Where-Object { $_ -and $_ -ne $PID } | Sort-Object -Unique)
}

function Wait-ForPortToBeFree {
  param(
    [int]$Port,
    [int]$TimeoutSeconds = 10
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    $pids = Get-ListeningPidsByPort -Port $Port
    if (-not $pids -or $pids.Count -eq 0) {
      return $true
    }
    Start-Sleep -Milliseconds 300
  }

  return $false
}

function Stop-ProcessByPort {
  param([int]$Port)

  $pids = Get-ListeningPidsByPort -Port $Port
  if (-not $pids -or $pids.Count -eq 0) { return }

  foreach ($procId in $pids) {
    try {
      $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
      $procName = if ($proc) { $proc.ProcessName } else { "desconocido" }
      Stop-Process -Id $procId -Force -ErrorAction Stop
      Write-Host "Puerto $Port liberado (PID $procId, proceso $procName)."
    }
    catch {
      Write-Host "No se pudo detener PID $procId en puerto $Port."
    }
  }
}

function Ensure-PortAvailable {
  param([int]$Port)

  $existing = Get-ListeningPidsByPort -Port $Port
  if (-not $existing -or $existing.Count -eq 0) { return }

  if ($NoKillConflicts) {
    throw "El puerto $Port ya está en uso por PID(s): $($existing -join ', ')."
  }

  Stop-ProcessByPort -Port $Port
  $isFree = Wait-ForPortToBeFree -Port $Port -TimeoutSeconds 12
  if (-not $isFree) {
    $stillUsed = Get-ListeningPidsByPort -Port $Port
    throw "No se pudo liberar el puerto $Port. Sigue en uso por PID(s): $($stillUsed -join ', ')."
  }
}

if (-not (Test-Path $backendPath)) {
  throw "No existe la carpeta del backend: $backendPath"
}

if (-not (Test-Path $frontendPath)) {
  throw "No existe la carpeta del frontend: $frontendPath"
}

if ($BackendPort -ne 8080) {
  Write-Host "Aviso: el frontend tiene URLs hardcodeadas a http://localhost:8080."
}

Write-Host "Verificando puertos (backend=$BackendPort, frontend=$FrontendPort)..."
Ensure-PortAvailable -Port $BackendPort
Ensure-PortAvailable -Port $FrontendPort

Write-Host "Iniciando backend..."
$backendProc = Start-Process `
  -FilePath "cmd.exe" `
  -ArgumentList "/c", "mvnw.cmd spring-boot:run -Dspring-boot.run.arguments=--server.port=$BackendPort" `
  -WorkingDirectory $backendPath `
  -NoNewWindow `
  -PassThru

Start-Sleep -Seconds 4

Write-Host "Backend:  http://localhost:$BackendPort"
Write-Host "Frontend: http://localhost:$FrontendPort"
Write-Host "Ejecutando frontend en primer plano..."
Write-Host ""

try {
  Set-Location $frontendPath
  npm run dev -- --port $FrontendPort
}
finally {
  if ($backendProc -and -not $backendProc.HasExited) {
    Write-Host ""
    Write-Host "Deteniendo backend..."
    Stop-Process -Id $backendProc.Id -Force
  }
}
