# External Integrations

## Databases

- **Primary Database:** Supabase PostgreSQL
  - Managed PostgreSQL instance with PostGIS for geospatial queries
  - Connection via @supabase/supabase-js client
  - Row Level Security (RLS) policies for multi-tenant data isolation
  - Auto-generated REST/GraphQL APIs

- **Development Database:** SQLite via Prisma
  - Local database file: `prisma/dev.db`
  - Used for development and testing
  - Schema defined in `prisma/schema.prisma`

## Authentication & Authorization

- **Auth Provider:** Supabase Auth
  - Phone/OTP-based authentication only (no email/password)
  - JWT tokens with HS256 signing
  - Session management via cookies
  - Built-in rate limiting and brute-force protection
  - Admin whitelist via RLS policies

- **Key Files:**
  - `src/lib/supabase.ts` - Supabase client configuration
  - `src/lib/admin-auth.ts` - Admin authentication utilities
  - `supabase/migrations/02_rls_policies.sql` - RLS policy definitions

## Mapping & Geolocation

- **Maps Provider:** Mapbox GL JS
  - Interactive vector maps for parking visualization
  - Geocoding and directions via deep-links to Google Maps
  - Clustering for dense urban parking markers
  - Offline map support (potential for mobile)

- **Geolocation:** Browser Geolocation API
  - Standard `navigator.geolocation.getCurrentPosition()`
  - Fallback handling for location services
  - Custom hook: `src/hooks/useGeolocation.ts`

- **Key Files:**
  - `src/components/Map.tsx` - Map component implementation
  - `src/utils/distance.ts` - Distance calculation utilities

## Payment Processing (Planned)

- **Payment Method:** UPI Deep Links
  - Manual UTR verification for ₹499/month subscriptions
  - No payment gateway integration in MVP
  - Deep-link URLs to GPay/PhonePe apps
  - Future: Razorpay or similar for auto-debit

## SMS Provider (Planned)

- **SMS Service:** MSG91 or Fast2SMS
  - India-optimized OTP delivery
  - Cost: ₹0.25-0.30/SMS
  - DLT template registration for TRAI compliance
  - Integration via Supabase SMS Hook

## Hosting & Deployment

- **Frontend Hosting:** Vercel
  - Next.js native deployment
  - Global CDN with 300+ edge locations
  - Automatic HTTPS/TLS 1.3
  - Preview deployments for PRs

- **Backend/Database:** Supabase Cloud
  - Managed PostgreSQL in Mumbai region (ap-south-1)
  - 99.9% uptime SLA
  - Automatic backups and scaling

## Webhooks

None implemented. Future integration points:
- Payment confirmation webhooks (when adding auto-debit)
- Admin notification webhooks
- Listing approval workflow webhooks

## Configuration

- **Environment Variables:** 
  - `.env.local` - Local development secrets
  - `.env.example` - Environment variable template
  - Supabase URL, anon key, service role key
  - Mapbox access token
  - Database connection strings

- **Key Configuration Files:**
  - `src/lib/supabase.ts` - Supabase client setup
  - `prisma/schema.prisma` - Database schema and connections
  - `next.config.ts` - Next.js configuration
  - `vitest.config.ts` - Test configuration

## Security Considerations

- HTTPS/TLS 1.3 enforced by Vercel
- Supabase RLS for database-level access control
- JWT token management with automatic refresh
- OTP brute-force protection (3 attempts + 15-min lockout)
- No client-side secret exposure (all API keys server-side)

## Performance Optimizations

- Supabase connection pooling for database queries
- PostGIS GIST indexes for geospatial search performance
- Next.js image optimization for parking photos
- Server-side caching (5 mins) for map pan/zoom queries
- 5km radius limit to prevent expensive spatial queries