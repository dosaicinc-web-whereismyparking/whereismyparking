-- ─────────────────────────────────────────────────────────────────────────────
-- 09: Restore column defaults lost when the Prisma schema was converted to raw
-- SQL. Prisma supplied @default(cuid()) ids and @default(now())/@updatedAt
-- timestamps at the ORM layer; the hand-written API routes do not, so several
-- NOT NULL columns had no value source and every insert through them failed
-- (listing creation, subscription creation, admin public-parking add, and admin
-- activity logging). These defaults make the inserts self-sufficient.
-- ─────────────────────────────────────────────────────────────────────────────

-- Text primary keys that the app does not always populate.
ALTER TABLE "subscriptions"           ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "public_parking_records"  ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "admin_activities"        ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
-- parking_listings.id is supplied by the app ("listing_xxx"); give it a default
-- anyway so direct/SQL inserts are also safe.
ALTER TABLE "parking_listings"        ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- updatedAt: default to now() on insert (was NOT NULL with no default).
ALTER TABLE "parking_listings"        ALTER COLUMN "updatedAt" SET DEFAULT now();
ALTER TABLE "public_parking_records"  ALTER COLUMN "updatedAt" SET DEFAULT now();

-- Emulate Prisma's @updatedAt: bump updatedAt automatically on every UPDATE.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."updatedAt" := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_parking_listings_updated_at ON "parking_listings";
CREATE TRIGGER trg_parking_listings_updated_at
  BEFORE UPDATE ON "parking_listings"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_public_parking_records_updated_at ON "public_parking_records";
CREATE TRIGGER trg_public_parking_records_updated_at
  BEFORE UPDATE ON "public_parking_records"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
