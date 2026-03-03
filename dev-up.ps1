[CmdletBinding()]
param(
  [switch]$PrepareOnly
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false

$root = Split-Path -Parent $PSCommandPath
$frontendPath = Join-Path $root 'front'
$backendProjectPath = Join-Path $root 'back\src\GreenLedger.Api\GreenLedger.Api.csproj'
$composeFilePath = Join-Path $root 'docker-compose.dev.yml'
$frontendEnvExamplePath = Join-Path $frontendPath '.env.example'
$frontendEnvPath = Join-Path $frontendPath '.env'
$backendDatabaseName = 'greenledger_app'
$backendPort = 5105
$frontendPort = 5173

function Write-Step([string]$message) {
  Write-Host ''
  Write-Host "==> $message" -ForegroundColor Cyan
}

function Assert-Command([string]$commandName, [string]$installHint) {
  if (-not (Get-Command $commandName -ErrorAction SilentlyContinue)) {
    throw "No encontre '$commandName'. $installHint"
  }
}

function Wait-ForContainerCommand(
  [string]$containerName,
  [string[]]$commandParts,
  [string]$readyMessage,
  [int]$timeoutSeconds = 60
) {
  $deadline = (Get-Date).AddSeconds($timeoutSeconds)
  $escapedParts = $commandParts | ForEach-Object {
    if ($_ -match '\s') {
      '"' + $_ + '"'
    }
    else {
      $_
    }
  }
  $dockerCommand = "docker exec $containerName $($escapedParts -join ' ') >nul 2>nul"

  while ((Get-Date) -lt $deadline) {
    cmd.exe /c $dockerCommand | Out-Null

    if ($LASTEXITCODE -eq 0) {
      Write-Host $readyMessage -ForegroundColor Green
      return
    }

    Start-Sleep -Seconds 2
  }

  throw "Timeout esperando a $containerName."
}

function Test-PortInUse([int]$port) {
  $listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  return $null -ne $listener
}

function Ensure-PostgresDatabase([string]$databaseName) {
  $queryOutput = & docker exec greenledger-postgres psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$databaseName'" 2>$null

  if ($LASTEXITCODE -ne 0) {
    throw 'No pude consultar las bases existentes dentro de PostgreSQL.'
  }

  if (($queryOutput | Out-String).Trim() -eq '1') {
    Write-Host "Base PostgreSQL lista: $databaseName" -ForegroundColor Green
    return
  }

  & docker exec greenledger-postgres psql -U postgres -c "CREATE DATABASE $databaseName;" | Out-Null

  if ($LASTEXITCODE -ne 0) {
    throw "No pude crear la base PostgreSQL '$databaseName'."
  }

  Write-Host "Base PostgreSQL creada: $databaseName" -ForegroundColor Green
}

function Start-DevWindow([string]$title, [string]$workingDirectory, [string]$command) {
  $encodedCommand = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($command))

  Start-Process powershell.exe `
    -WorkingDirectory $workingDirectory `
    -ArgumentList '-NoExit', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', $encodedCommand `
    -WindowStyle Normal | Out-Null

  Write-Host "Ventana iniciada: $title" -ForegroundColor Green
}

try {
  Write-Step 'Validando herramientas'
  Assert-Command 'docker' 'Instala Docker Desktop y vuelve a intentar.'
  Assert-Command 'dotnet' 'Instala .NET 8 SDK y vuelve a intentar.'
  Assert-Command 'npm' 'Instala Node.js LTS y vuelve a intentar.'

  cmd.exe /c "docker info >nul 2>nul" | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw 'Docker Desktop no parece estar corriendo.'
  }

  Write-Step 'Preparando frontend'
  if (-not (Test-Path $frontendEnvPath)) {
    Copy-Item $frontendEnvExamplePath $frontendEnvPath
    Write-Host 'Se creo front/.env a partir de .env.example' -ForegroundColor Yellow
  }
  else {
    Write-Host 'front/.env ya existe, no lo toque.' -ForegroundColor DarkYellow
  }

  if (-not (Test-Path (Join-Path $frontendPath 'node_modules'))) {
    Write-Host 'Instalando dependencias de frontend...' -ForegroundColor Yellow
    npm install --prefix $frontendPath
  }
  else {
    Write-Host 'node_modules ya existe en front, salto npm install.' -ForegroundColor DarkYellow
  }

  Write-Step 'Preparando backend'
  dotnet restore (Join-Path $root 'green_ledger.sln')

  Write-Step 'Levantando infraestructura local'
  docker compose -f $composeFilePath up -d postgres redis

  Wait-ForContainerCommand 'greenledger-postgres' @('pg_isready', '-U', 'postgres', '-d', 'postgres') 'PostgreSQL listo.'
  Ensure-PostgresDatabase $backendDatabaseName
  Wait-ForContainerCommand 'greenledger-redis' @('redis-cli', 'ping') 'Redis listo.'

  if ($PrepareOnly) {
    Write-Host ''
    Write-Host 'Preparacion terminada. No lance frontend ni backend porque usaste -PrepareOnly.' -ForegroundColor Green
    exit 0
  }

  Write-Step 'Lanzando backend y frontend'

  if (Test-PortInUse $backendPort) {
    Write-Host "Puerto $backendPort ya esta en uso. No abri otra ventana para backend." -ForegroundColor Yellow
  }
  else {
    $backendCommand = @"
`$host.UI.RawUI.WindowTitle = 'GreenLedger Backend'
`$env:ASPNETCORE_ENVIRONMENT = 'Development'
`$env:ASPNETCORE_URLS = 'http://localhost:$backendPort'
dotnet run --no-launch-profile --project '$backendProjectPath'
"@

    Start-DevWindow 'GreenLedger Backend' $root $backendCommand
  }

  if (Test-PortInUse $frontendPort) {
    Write-Host "Puerto $frontendPort ya esta en uso. No abri otra ventana para frontend." -ForegroundColor Yellow
  }
  else {
    $frontendCommand = @"
`$host.UI.RawUI.WindowTitle = 'GreenLedger Frontend'
Set-Location '$frontendPath'
npm run dev
"@

    Start-DevWindow 'GreenLedger Frontend' $frontendPath $frontendCommand
  }

  Write-Host ''
  Write-Host 'GreenLedger quedo levantando su stack local.' -ForegroundColor Green
  Write-Host "Backend esperado en: http://localhost:$backendPort" -ForegroundColor Gray
  Write-Host "Frontend esperado en: http://localhost:$frontendPort" -ForegroundColor Gray
}
catch {
  Write-Host ''
  Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
