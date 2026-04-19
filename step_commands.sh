#!/bin/zsh
echo "=== STEP 1: dev.log auth verify ==="
tail -100 /Users/polaroiddosa/WhereIsMyParking/dev.log | grep -A 30 'Auth Verify'

echo ""
echo "=== STEP 2: createUser direct ==="
SERVICE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY /Users/polaroiddosa/WhereIsMyParking/.env.local | cut -d= -f2)
curl -X POST http://127.0.0.1:9999/admin/users \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919446976393", "phone_confirm": true}' \
  -v 2>&1 | tail -40

echo ""
echo "=== STEP 3: auth health ==="
curl -s http://127.0.0.1:9999/health
echo ""

echo ""
echo "=== STEP 4: auth logs ==="
docker logs supabase-auth --tail 50

echo ""
echo "=== STEP 6: .env.local on Mac ==="
grep -i 'auth_url\|service_role\|supabase_url' /Users/polaroiddosa/WhereIsMyParking/.env.local
