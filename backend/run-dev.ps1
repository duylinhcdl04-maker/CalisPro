$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$envFile = Join-Path $root ".env"
if (-not (Test-Path $envFile)) {
  Write-Warning ".env not found - copy .env.example to .env first."
  exit 1
}

Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*([^#][^=]*)=(.*)$') {
    $k = $matches[1].Trim()
    $v = $matches[2].Trim().Trim('"').Trim("'")
    Set-Item -Path "Env:$k" -Value $v
  }
}

$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot"
$env:Path = "$env:JAVA_HOME\bin;C:\tools\apache-maven-3.9.16\bin;$env:Path"

Write-Host "DB:   jdbc:mysql://$($env:DB_HOST):$($env:DB_PORT)/$($env:DB_NAME) (user=$($env:DB_USER))"
Write-Host "Port: $($env:SERVER_PORT)"
Write-Host ""

mvn spring-boot:run
