#!/bin/bash
KEY=$(grep SUPABASE_SERVICE_ROLE_KEY /Users/polaroiddosa/Documents/Projects/SOUP/.env.local | cut -d= -f2)
curl -v -X POST http://127.0.0.1:9999/admin/users \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919446976393",
    "phone_confirm": true,
    "user_metadata": {"phone_verified": true}
  }'
