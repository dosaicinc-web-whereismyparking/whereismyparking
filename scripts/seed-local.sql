-- Seed Users
INSERT INTO "users" ("id", "phone") VALUES 
('user_admin_01', '+919876543210'),
('user_owner_01', '+919999999999');

-- Seed Admin Users
INSERT INTO "admin_users" ("userId") VALUES 
('user_admin_01');

-- Seed Public Parking Records (Kochi Area)
INSERT INTO "public_parking_records" ("id", "name", "address", "latitude", "longitude", "type", "coverage", "updatedAt") VALUES 
('pub_01', 'Lulu Mall Kochi Parking', 'Edappally, Kochi', 10.0271, 76.3080, 'PUBLIC', 'MULTI', NOW()),
('pub_02', 'Marine Drive Ground', 'Marine Drive, Kochi', 9.9800, 76.2750, 'PUBLIC', 'OPEN', NOW());

-- Seed Parking Listings (Owned by user_owner_01)
INSERT INTO "parking_listings" ("id", "name", "address", "location", "type", "coverage", "status", "ownerId", "updatedAt") VALUES 
('list_01', 'Skyline Apartments Visitor Slot', 'Kakkanad, Kochi', ST_SetSRID(ST_MakePoint(76.3280, 10.0120), 4326), 'PRIVATE', 'COVERED', 'ACTIVE', 'user_owner_01', NOW());

-- Seed Subscriptions
INSERT INTO "subscriptions" ("id", "listingId", "ownerId", "status", "utr", "amount") VALUES 
('sub_01', 'list_01', 'user_owner_01', 'ACTIVE', 'VERIFIED_UTR_01', 499);
