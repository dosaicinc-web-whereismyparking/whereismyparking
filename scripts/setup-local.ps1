Write-Host "🚀 Checking prerequisites..." -ForegroundColor Blue
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "❌ Docker is not installed or not in PATH. Please install Docker Desktop and try again."
    exit 1
}

Write-Host "🚀 Starting self-hosted Supabase stack..." -ForegroundColor Blue
docker compose --env-file .env.supabase up -d

Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
do {
    $ready = docker exec supabase-db pg_isready -U postgres
    if ($LASTEXITCODE -ne 0) {
        Start-Sleep -Seconds 1
    }
} while ($LASTEXITCODE -ne 0)

Write-Host "📂 Applying migrations..." -ForegroundColor Green
Get-ChildItem "supabase/migrations/*.sql" | ForEach-Object {
    Write-Host "  -> Applying $($_.Name)..."
    Get-Content $_.FullName | docker exec -i supabase-db psql -U postgres -d postgres
}

Write-Host "🗄️ Initializing storage buckets..." -ForegroundColor Cyan
$initStorageSql = @'
INSERT INTO storage.buckets (id, name, public) VALUES ('parking-images', 'parking-images', true) ON CONFLICT (id) DO NOTHING;
'@
$initStorageSql | docker exec -i supabase-db psql -U postgres -d postgres

Write-Host "🌱 Seeding data..." -ForegroundColor Magenta
Get-Content "scripts/seed-local.sql" | docker exec -i supabase-db psql -U postgres -d postgres

Write-Host "✅ Local stack is ready!" -ForegroundColor Green

