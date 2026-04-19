#!/bin/zsh
echo "=== STEP 1: Add aud column ==="
docker exec -i supabase-db psql -U postgres -d postgres -c "ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS aud VARCHAR(255) DEFAULT 'authenticated'; UPDATE auth.users SET aud = 'authenticated' WHERE aud IS NULL;"

echo "=== STEP 2: List columns ==="
docker exec -i supabase-db psql -U postgres -d postgres -c "SELECT column_name FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' ORDER BY column_name;"

echo "=== STEP 4: Add other columns ==="
docker exec -i supabase-db psql -U postgres -d postgres -c "ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS role VARCHAR(255) DEFAULT 'authenticated'; ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS is_sso_user BOOLEAN DEFAULT false; ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ; ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS banned_until TIMESTAMPTZ; ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS reauthentication_token VARCHAR(255) DEFAULT ''; ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS reauthentication_sent_at TIMESTAMPTZ; ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN; ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS email_change_confirm_status SMALLINT DEFAULT 0;"

echo "=== STEP 5: Restart Auth ==="
docker restart supabase-auth
sleep 10

echo "=== STEP 6: Test createUser via curl ==="
SERVICE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY ~/WhereIsMyParking/.env.local | cut -d= -f2)
curl -X POST http://127.0.0.1:9999/admin/users \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919446976393", "phone_confirm": true}' \
  -s | python3 -m json.tool
