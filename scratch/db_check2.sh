docker exec postgres psql -U postgres -c "SELECT proname FROM pg_proc WHERE proname IN ('search_nearby_parking', 'search_parking_bbox');"
docker exec postgres psql -U postgres -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;"
docker exec postgres psql -U postgres -c "SELECT status, COUNT(*) FROM parking_listings GROUP BY status;"
