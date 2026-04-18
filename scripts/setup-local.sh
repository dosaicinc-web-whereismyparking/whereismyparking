#!/bin/bash
set -e

echo "🚀 Starting self-hosted Supabase stack..."
docker compose --env-file .env.supabase up -d

echo "⏳ Waiting for database to be ready..."
until docker exec supabase-db pg_isready -U postgres; do
  sleep 1
done

echo "📂 Applying migrations..."
for f in supabase/migrations/*.sql; do
  echo "  -> Applying $f..."
  cat "$f" | docker exec -i supabase-db psql -U postgres -d postgres
done

echo "🗄️ Initializing storage buckets..."
docker exec -i supabase-db psql -U postgres -d postgres <<EOF
INSERT INTO storage.buckets (id, name, public) 
VALUES ('parking-images', 'parking-images', true)
ON CONFLICT (id) DO NOTHING;
EOF

echo "🌱 Seeding data..."
cat scripts/seed-local.sql | docker exec -i supabase-db psql -U postgres -d postgres

echo "✅ Local stack is ready!"
