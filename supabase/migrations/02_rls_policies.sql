-- Enable Row Level Security
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "admin_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "parking_listings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "otp_rate_limits" ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- USERS Table Policies
-- -----------------------------------------------------------------------------

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON "users"
    FOR SELECT USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles" ON "users"
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON "users"
    FOR UPDATE USING (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- ADMIN_USERS Table Policies
-- -----------------------------------------------------------------------------

-- Only existing admins can see the admin list
CREATE POLICY "Admins can read admin_users" ON "admin_users"
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- -----------------------------------------------------------------------------
-- PARKING_LISTINGS Table Policies
-- -----------------------------------------------------------------------------

-- PUBLIC can read ACTIVE listings
CREATE POLICY "Anyone can read active listings" ON "parking_listings"
    FOR SELECT USING (status = 'ACTIVE');

-- Owners can read all their own listings (even INACTIVE/PENDING)
CREATE POLICY "Owners can read own listings" ON "parking_listings"
    FOR SELECT USING (owner_id = auth.uid());

-- Admins can read all listings
CREATE POLICY "Admins can read all listings" ON "parking_listings"
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- Authenticated users can create listings
CREATE POLICY "Authenticated users can create listings" ON "parking_listings"
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Owners can update their listings
CREATE POLICY "Owners can update own listings" ON "parking_listings"
    FOR UPDATE USING (owner_id = auth.uid());

-- -----------------------------------------------------------------------------
-- SUBSCRIPTIONS Table Policies
-- -----------------------------------------------------------------------------

-- Owners can read their own subscriptions
CREATE POLICY "Owners can read own subscriptions" ON "subscriptions"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM parking_listings 
            WHERE id = parking_id AND owner_id = auth.uid()
        )
    );

-- Owners can create subscriptions for their listings
CREATE POLICY "Owners can create own subscriptions" ON "subscriptions"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM parking_listings 
            WHERE id = parking_id AND owner_id = auth.uid()
        )
    );

-- Admins can read all subscriptions
CREATE POLICY "Admins can read all subscriptions" ON "subscriptions"
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- Admins can update subscriptions (verification)
CREATE POLICY "Admins can update subscriptions" ON "subscriptions"
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- -----------------------------------------------------------------------------
-- OTP_RATE_LIMITS Table Policies
-- -----------------------------------------------------------------------------

-- Admins only (for monitoring)
CREATE POLICY "Admins can read rate limits" ON "otp_rate_limits"
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );
