#!/bin/zsh
echo "=== STEP 1: Drop and recreate auth schema ==="
docker exec -i supabase-db psql -U postgres -d postgres -c "
DROP SCHEMA IF EXISTS auth CASCADE;
CREATE SCHEMA auth;
GRANT ALL ON SCHEMA auth TO postgres;
GRANT ALL ON SCHEMA auth TO public;
"

echo "=== STEP 2: Stop auth container ==="
docker stop supabase-auth

echo "=== STEP 3: Start auth container ==="
docker start supabase-auth

echo "=== STEP 4: Wait and check logs ==="
sleep 20
docker logs supabase-auth --tail 30

echo "=== STEP 5: Verify auth schema rebuilt ==="
docker exec -i supabase-db psql -U postgres -d postgres -c "
SELECT column_name FROM information_schema.columns 
WHERE table_schema = 'auth' AND table_name = 'users' 
ORDER BY column_name;"

echo "=== STEP 6: Test createUser via curl ==="
SERVICE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY ~/WhereIsMyParking/.env.local | cut -d= -f2)
CURL_OUT=$(curl -X POST http://127.0.0.1:9999/admin/users \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919446976393", "phone_confirm": true}' \
  -s)

echo "$CURL_OUT" | python3 -m json.tool

echo "=== STEP 7: Restart Next.js ==="
if echo "$CURL_OUT" | grep -q '"id"'; then
  echo "User created successfully. Restarting Next.js..."
  pkill -f next
  sleep 2
  cd ~/WhereIsMyParking
  nohup npm run dev -- -p 3000 -H 0.0.0.0 > ~/WhereIsMyParking/dev.log 2>&1 &
  echo "Next.js restarted in background."
else
  echo "createUser failed, skipping Next.js restart."
fi
