#!/bin/bash
docker exec supabase-db psql -U postgres -d postgres -c "CREATE OR REPLACE FUNCTION uuid_eq_text(uuid, text) RETURNS boolean AS 'SELECT \$1 = \$2::uuid' LANGUAGE sql IMMUTABLE;"
docker exec supabase-db psql -U postgres -d postgres -c "CREATE OPERATOR = (LEFTARG = uuid, RIGHTARG = text, PROCEDURE = uuid_eq_text);"
