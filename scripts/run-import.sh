#!/bin/bash
cd /Users/polaroiddosa/Documents/Projects/SOUP
node scripts/import-osm-thrissur.js
if [ -f scripts/import-osm.sql ]; then
  echo "Running SQL import..."
  docker exec -i supabase-db psql -U postgres -d postgres < scripts/import-osm.sql
  echo "Import complete."
else
  echo "Error: scripts/import-osm.sql not found."
  exit 1
fi
