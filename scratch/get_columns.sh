#!/bin/bash
docker exec supabase-db psql -U postgres -d postgres -c "SELECT column_name FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users'"
