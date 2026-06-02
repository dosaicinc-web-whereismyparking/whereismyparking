-- Seed realistic ACTIVE parking listings across major Indian cities for testing
-- All listings are pre-approved (ACTIVE + APPROVED) so they show in search/map immediately

-- Create a seed owner user (if not exists)
INSERT INTO users (id, phone, "createdAt")
VALUES ('seed-owner-001', '+910000000001', NOW())
ON CONFLICT (phone) DO UPDATE SET id = EXCLUDED.id;

-- Insert ACTIVE parking listings with real coordinates
INSERT INTO parking_listings (id, name, address, location, type, coverage, status, "moderationStatus", "ownerId", "updatedAt", "createdAt", "vehicleTypes", "availableHours")
VALUES
  -- Mumbai
  ('seed-001', 'Nariman Point Parking', 'Nariman Point, Mumbai, Maharashtra 400021', ST_SetSRID(ST_MakePoint(72.8229, 18.9248), 4326), 'PUBLIC', 'OPEN', 'ACTIVE', 'APPROVED', 'seed-owner-001', NOW(), NOW(), '["CAR","BIKE","AUTO"]'::jsonb, '{"open": "06:00", "close": "23:00"}'::jsonb),
  ('seed-002', 'Bandra West Multi-Level Parking', 'Hill Road, Bandra West, Mumbai 400050', ST_SetSRID(ST_MakePoint(72.8296, 19.0596), 4326), 'PUBLIC', 'MULTI', 'ACTIVE', 'APPROVED', 'seed-owner-001', NOW(), NOW(), '["CAR","BIKE"]'::jsonb, '{"open": "00:00", "close": "23:59"}'::jsonb),
  ('seed-003', 'Powai Private Parking', 'Hiranandani Gardens, Powai, Mumbai 400076', ST_SetSRID(ST_MakePoint(72.9060, 19.1197), 4326), 'PRIVATE', 'COVERED', 'ACTIVE', 'APPROVED', 'seed-owner-001', NOW(), NOW(), '["CAR"]'::jsonb, '{"open": "08:00", "close": "22:00"}'::jsonb),
  ('seed-004', 'Dadar TT Circle Parking', 'Dadar East, Mumbai 400014', ST_SetSRID(ST_MakePoint(72.8426, 19.0178), 4326), 'PUBLIC', 'OPEN', 'ACTIVE', 'APPROVED', 'seed-owner-001', NOW(), NOW(), '["CAR","BIKE","AUTO","BUS"]'::jsonb, NULL),
  ('seed-005', 'Lower Parel Covered Parking', 'Phoenix Mills Compound, Lower Parel, Mumbai 400013', ST_SetSRID(ST_MakePoint(72.8301, 18.9946), 4326), 'PRIVATE', 'COVERED', 'ACTIVE', 'APPROVED', 'seed-owner-001', NOW(), NOW(), '["CAR"]'::jsonb, '{"open": "09:00", "close": "23:00"}'::jsonb),
  -- Delhi
  ('seed-006', 'Connaught Place Parking Complex', 'Connaught Place, New Delhi 110001', ST_SetSRID(ST_MakePoint(77.2197, 28.6315), 4326), 'PUBLIC', 'MULTI', 'ACTIVE', 'APPROVED', 'seed-owner-001', NOW(), NOW(), '["CAR","BIKE"]'::jsonb, '{"open": "06:00", "close": "23:00"}'::jsonb),
  ('seed-007', 'Karol Bagh Market Parking', 'Ajmal Khan Road, Karol Bagh, New Delhi 110005', ST_SetSRID(ST_MakePoint(77.1897, 28.6519), 4326), 'PUBLIC', 'OPEN', 'ACTIVE', 'APPROVED', 'seed-owner-001', NOW(), NOW(), '["CAR","BIKE","AUTO"]'::jsonb, NULL),
  ('seed-008', 'South Ex Private Lot', 'South Extension Part II, New Delhi 110049', ST_SetSRID(ST_MakePoint(77.2164, 28.5650), 4326), 'PRIVATE', 'COVERED', 'ACTIVE', 'APPROVED', 'seed-owner-001', NOW(), NOW(), '["CAR"]'::jsonb, '{"open": "07:00", "close": "21:00"}'::jsonb),
  -- Bangalore
  ('seed-009', 'MG Road Parking Hub', 'Mahatma Gandhi Road, Bengaluru 560001', ST_SetSRID(ST_MakePoint(77.6063, 12.9748), 4326), 'PUBLIC', 'MULTI', 'ACTIVE', 'APPROVED', 'seed-owner-001', NOW(), NOW(), '["CAR","BIKE"]'::jsonb, '{"open": "08:00", "close": "22:00"}'::jsonb),
  ('seed-010', 'Koramangala Covered Parking', '5th Block, Koramangala, Bengaluru 560095', ST_SetSRID(ST_MakePoint(77.6244, 12.9279), 4326), 'PRIVATE', 'COVERED', 'ACTIVE', 'APPROVED', 'seed-owner-001', NOW(), NOW(), '["CAR"]'::jsonb, '{"open": "00:00", "close": "23:59"}'::jsonb),
  ('seed-011', 'Indiranagar Open Parking', '100 Feet Road, Indiranagar, Bengaluru 560038', ST_SetSRID(ST_MakePoint(77.6408, 12.9784), 4326), 'PUBLIC', 'OPEN', 'ACTIVE', 'APPROVED', 'seed-owner-001', NOW(), NOW(), '["CAR","BIKE","AUTO"]'::jsonb, NULL),
  -- Hyderabad
  ('seed-012', 'Hitech City Parking', 'Madhapur, Hitech City, Hyderabad 500081', ST_SetSRID(ST_MakePoint(78.3748, 17.4435), 4326), 'PUBLIC', 'MULTI', 'ACTIVE', 'APPROVED', 'seed-owner-001', NOW(), NOW(), '["CAR","BIKE"]'::jsonb, '{"open": "06:00", "close": "23:00"}'::jsonb),
  ('seed-013', 'Banjara Hills Road No 12 Parking', 'Road No 12, Banjara Hills, Hyderabad 500034', ST_SetSRID(ST_MakePoint(78.4378, 17.4146), 4326), 'PRIVATE', 'OPEN', 'ACTIVE', 'APPROVED', 'seed-owner-001', NOW(), NOW(), '["CAR"]'::jsonb, '{"open": "09:00", "close": "21:00"}'::jsonb),
  -- Chennai
  ('seed-014', 'Anna Nagar Parking', '2nd Avenue, Anna Nagar, Chennai 600040', ST_SetSRID(ST_MakePoint(80.2096, 13.0854), 4326), 'PUBLIC', 'OPEN', 'ACTIVE', 'APPROVED', 'seed-owner-001', NOW(), NOW(), '["CAR","BIKE","AUTO"]'::jsonb, NULL),
  ('seed-015', 'T Nagar Shopping Parking', 'Usman Road, T Nagar, Chennai 600017', ST_SetSRID(ST_MakePoint(80.2317, 13.0402), 4326), 'PUBLIC', 'MULTI', 'ACTIVE', 'APPROVED', 'seed-owner-001', NOW(), NOW(), '["CAR","BIKE"]'::jsonb, '{"open": "09:00", "close": "22:00"}'::jsonb),
  -- Pune
  ('seed-016', 'FC Road Parking', 'Fergusson College Road, Shivajinagar, Pune 411004', ST_SetSRID(ST_MakePoint(73.8446, 18.5233), 4326), 'PUBLIC', 'OPEN', 'ACTIVE', 'APPROVED', 'seed-owner-001', NOW(), NOW(), '["CAR","BIKE","AUTO"]'::jsonb, NULL),
  ('seed-017', 'Baner IT Park Parking', 'Baner Road, Baner, Pune 411045', ST_SetSRID(ST_MakePoint(73.7979, 18.5580), 4326), 'PRIVATE', 'COVERED', 'ACTIVE', 'APPROVED', 'seed-owner-001', NOW(), NOW(), '["CAR"]'::jsonb, '{"open": "07:00", "close": "21:00"}'::jsonb),
  -- Kochi (Kerala)
  ('seed-018', 'MG Road Kochi Parking', 'MG Road, Ernakulam, Kochi 682016', ST_SetSRID(ST_MakePoint(76.2936, 9.9850), 4326), 'PUBLIC', 'OPEN', 'ACTIVE', 'APPROVED', 'seed-owner-001', NOW(), NOW(), '["CAR","BIKE","AUTO"]'::jsonb, NULL),
  ('seed-019', 'Marine Drive Parking', 'Marine Drive, Ernakulam, Kochi 682031', ST_SetSRID(ST_MakePoint(76.2764, 9.9673), 4326), 'PUBLIC', 'OPEN', 'ACTIVE', 'APPROVED', 'seed-owner-001', NOW(), NOW(), '["CAR","BIKE"]'::jsonb, '{"open": "06:00", "close": "22:00"}'::jsonb),
  -- Ahmedabad
  ('seed-020', 'CG Road Parking', 'CG Road, Navrangpura, Ahmedabad 380009', ST_SetSRID(ST_MakePoint(72.5569, 23.0332), 4326), 'PUBLIC', 'MULTI', 'ACTIVE', 'APPROVED', 'seed-owner-001', NOW(), NOW(), '["CAR","BIKE"]'::jsonb, '{"open": "08:00", "close": "22:00"}'::jsonb)
ON CONFLICT (id) DO NOTHING;
