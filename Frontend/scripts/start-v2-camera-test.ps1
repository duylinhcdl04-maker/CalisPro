<#
  Chuẩn bị và chạy môi trường THỬ Assessment V2 với camera thật (DB thử calishealth_le_test, KHÔNG đụng DB chính).

  Cách dùng (PowerShell, từ thư mục Frontend):
      .\scripts\start-v2-camera-test.ps1                  # tạo học viên thử mới + bật backend (cổng 8099) + Vite (cổng 5199)
      .\scripts\start-v2-camera-test.ps1 -ShortRest       # đồng thời rút thời gian nghỉ giữa các lần đo còn 10 giây (đỡ phải chờ 2 phút)
      .\scripts\start-v2-camera-test.ps1 -PublishRules    # xuất bản luôn các rule chấm form nháp TRÊN DB THỬ để thử cả điểm form
      .\scripts\start-v2-camera-test.ps1 -RestoreRest     # trả thời gian nghỉ về 120 giây (làm sau khi thử xong) rồi thoát
      .\scripts\start-v2-camera-test.ps1 -NoStart         # chỉ chuẩn bị dữ liệu, không bật server

  Tài khoản thử: camera.test@example.test / Calis@2026Test  (chỉ tồn tại trên DB thử).
  Mỗi lần chạy lại script, học viên thử được tạo lại từ đầu (xoá dữ liệu cũ của chính tài khoản này).
  Cần: MySQL đang chạy, Maven offline đã có thư viện (mvn -o), Node, file backend\.env.
#>
param(
    [switch]$ShortRest,
    [switch]$PublishRules,
    [switch]$RestoreRest,
    [switch]$NoStart
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "Frontend"
$DbName = "calishealth_le_test"
$Email = "camera.test@example.test"
$PasswordHash = '$2a$10$orzwuBNYgbLOAOwF3DesFumy.oqIK1HNqiV.0lgb/eMDMFr2vcdhO'   # bcrypt của Calis@2026Test

# ---- đọc .env của backend ----
$envMap = @{}
Get-Content (Join-Path $backend ".env") | ForEach-Object {
    if ($_ -match '^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$') { $envMap[$Matches[1]] = $Matches[2].Trim() }
}
$mysql = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
if (-not (Test-Path $mysql)) { throw "Không thấy mysql.exe tại $mysql" }
$env:MYSQL_PWD = $envMap["DB_PASSWORD"]
$dbUser = if ($envMap["DB_USER"]) { $envMap["DB_USER"] } else { "root" }

function Invoke-Sql([string]$sql) {
    $out = & $mysql -u $dbUser --default-character-set=utf8mb4 -N -e $sql $DbName 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Lỗi SQL: $out" }
    return $out
}

if ($RestoreRest) {
    Invoke-Sql "UPDATE engine_parameters p JOIN rule_sets r ON r.id=p.rule_set_id SET p.param_value=120 WHERE r.code='LEVEL_ENGINE_V2' AND p.param_key='protocol.restSec';" | Out-Null
    Write-Host "Đã trả protocol.restSec về 120 giây." -ForegroundColor Green
    return
}

# ---- xoá dữ liệu cũ của học viên thử (nếu có) rồi tạo lại ----
$oldId = (Invoke-Sql "SELECT id FROM users WHERE email='$Email';" | Select-Object -First 1)
if ($oldId) {
    $id = [long]$oldId
    $lines = Invoke-Sql @"
SET FOREIGN_KEY_CHECKS=0;
SELECT CONCAT('DELETE FROM ', table_name, ' WHERE session_id IN (SELECT id FROM assessment_sessions WHERE user_id=$id);') FROM information_schema.columns WHERE table_schema='$DbName' AND column_name='session_id' AND table_name LIKE 'assessment\\_%' AND table_name<>'assessment_sessions';
SELECT CONCAT('DELETE FROM ', table_name, ' WHERE movement_session_id IN (SELECT id FROM movement_sessions WHERE user_id=$id);') FROM information_schema.columns WHERE table_schema='$DbName' AND column_name='movement_session_id' AND table_name<>'movement_sessions';
SELECT CONCAT('DELETE FROM ', table_name, ' WHERE user_id=$id;') FROM information_schema.columns WHERE table_schema='$DbName' AND column_name='user_id' AND table_name<>'users';
"@
    $cleanup = "SET FOREIGN_KEY_CHECKS=0;" + (($lines | Where-Object { $_ -match '^DELETE' }) -join "`n") + "`nDELETE FROM users WHERE id=$id;`nSET FOREIGN_KEY_CHECKS=1;"
    Invoke-Sql $cleanup | Out-Null
    Write-Host "Đã xoá học viên thử cũ (id $id)." -ForegroundColor DarkGray
}

Invoke-Sql @"
INSERT INTO users (email, password_hash, status, role, email_verified) VALUES ('$Email', '$PasswordHash', 'ACTIVE', 'USER', TRUE);
SET @u = LAST_INSERT_ID();
INSERT INTO user_profiles (user_id, first_name, last_name) VALUES (@u, 'Camera', 'Test');
INSERT INTO assessment_sessions (user_id, assessment_type_id, template_id, template_version, started_at, completed_at, status, version, created_at, purpose, source, execution_mode, onboarding_round)
VALUES (@u, 1, 10, 1, NOW(6), NOW(6), 'COMPLETED', '1', NOW(6), 'ONBOARDING', 'SELF_REPORTED', 'QUESTIONNAIRE', 99);
"@ | Out-Null
Write-Host "Đã tạo học viên thử: $Email / Calis@2026Test" -ForegroundColor Green

if ($ShortRest) {
    Invoke-Sql "UPDATE engine_parameters p JOIN rule_sets r ON r.id=p.rule_set_id SET p.param_value=10 WHERE r.code='LEVEL_ENGINE_V2' AND p.param_key='protocol.restSec';" | Out-Null
    Write-Host "Đã rút thời gian nghỉ giữa các lần đo còn 10 giây (nhớ chạy -RestoreRest sau khi thử xong)." -ForegroundColor Yellow
}
if ($PublishRules) {
    $n = Invoke-Sql "UPDATE ai_motion_rules SET status='PUBLISHED', approved_by='camera-test', approved_at=NOW(6) WHERE created_by='system-seed-benchmark' AND status='DRAFT'; SELECT ROW_COUNT();" | Select-Object -Last 1
    Write-Host "Đã xuất bản $n rule chấm form nháp TRÊN DB THỬ để thử điểm form." -ForegroundColor Yellow
}

if ($NoStart) { return }

# ---- bật backend và Vite ở hai cửa sổ riêng ----
function Test-Port([int]$port) { return [bool](Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue) }
$backendUp = Test-Port 8099
$viteUp = Test-Port 5199
if ($backendUp) { Write-Host "Backend đã chạy sẵn ở cổng 8099 (từ lần chạy trước): dùng lại, không bật thêm." -ForegroundColor Yellow }
if ($viteUp) { Write-Host "Vite đã chạy sẵn ở cổng 5199 (từ lần chạy trước): dùng lại, không bật thêm." -ForegroundColor Yellow }

$backendCmd = @"
`$env:DB_NAME='$DbName'; `$env:SERVER_PORT='8099'; `$env:ASSESSMENT_V2_ENABLED='true'; `$env:ASSESSMENT_V2_ALLOW_DRAFT='true';
`$env:DB_PASSWORD='$($envMap["DB_PASSWORD"])'; `$env:DB_USER='$dbUser'; `$env:JWT_SECRET='$($envMap["JWT_SECRET"])';
Set-Location '$backend'; mvn -o spring-boot:run '-Dspring-boot.run.arguments=--app.mail.log-only=true'
"@
if (-not $backendUp) { Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd -WindowStyle Normal }

$viteConfig = Join-Path $frontend "vite.camera-test.config.ts"
@'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({ plugins: [react()], server: { port: 5199, proxy: { "/api": { target: "http://localhost:8099", changeOrigin: true } } } });
'@ | Set-Content -Path $viteConfig -Encoding UTF8
if (-not $viteUp) { Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontend'; `$env:VITE_USE_MOCK_API='false'; npx vite --config vite.camera-test.config.ts" -WindowStyle Normal }

Write-Host ""
Write-Host ("Nếu vừa bật mới, backend mất khoảng 30-60 giây (chờ cửa sổ backend báo 'Started CalisHealthApplication'). Sau đó:") -ForegroundColor Cyan
Write-Host "  1) Mở  http://localhost:5199  (nên dùng Chrome/Edge, cho phép camera)"
Write-Host "  2) Đăng nhập: $Email  /  Calis@2026Test"
Write-Host "  3) Làm theo hướng dẫn trong backend\docs\HUONG_DAN_THU_CAMERA_THAT.md"
Write-Host "Khi xong: đóng hai cửa sổ vừa mở, và nếu đã dùng -ShortRest thì chạy .\scripts\start-v2-camera-test.ps1 -RestoreRest" -ForegroundColor Cyan
