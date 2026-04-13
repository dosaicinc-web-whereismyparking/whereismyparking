# System Architecture

## Architectural Pattern

This application follows a **Component-Based Architecture** built on Next.js 13+ App Router, with clear separation of concerns between presentation, application, and infrastructure layers.

- **Presentation Layer:** React components for UI rendering
- **Application Layer:** Next.js pages and API routes for request handling
- **Domain Layer:** Business logic, utilities, and custom hooks
- **Infrastructure Layer:** External services (Supabase, Mapbox, Prisma)

## Layer Structure

### Presentation Layer (`src/components/`)
- **Purpose:** UI rendering and user interaction
- **Components:**
  - `Map.tsx` - Interactive parking map
  - `ParkingList.tsx` - Parking listing display
  - `AuthModal.tsx` - Authentication interface
  - `ListingForm.tsx` - Parking space listing form
  - `admin/` - Admin panel components (dashboard, tables, modals)
- **Patterns:** Functional components with hooks, Tailwind CSS for styling

### Application Layer (`src/app/`)
- **Purpose:** Request routing and page rendering
- **Entry Points:**
  - `page.tsx` - Home page with map and parking discovery
  - `layout.tsx` - Root layout with global styles
  - `dashboard/page.tsx` - Owner dashboard (future)
  - `admin/page.tsx` - Admin panel (future API routes)
- **Routing:** Next.js App Router with file-based routing

### Domain Layer (`src/lib/`, `src/hooks/`, `src/utils/`)
- **Purpose:** Business logic and reusable utilities
- **Key Modules:**
  - `lib/supabase.ts` - Supabase client configuration
  - `lib/supabase-types.ts` - Generated TypeScript types
  - `lib/admin-auth.ts` - Admin authentication logic
  - `lib/prisma.ts` - Prisma client for database operations
  - `hooks/useGeolocation.ts` - Geolocation hook
  - `utils/distance.ts` - Distance calculation utilities
- **Patterns:** Custom hooks for stateful logic, utility functions for pure computations

### Infrastructure Layer
- **Purpose:** External service integrations
- **Services:**
  - **Database:** Supabase PostgreSQL with PostGIS
  - **Auth:** Supabase Auth with OTP
  - **Maps:** Mapbox GL JS for visualization
  - **ORM:** Prisma for type-safe database queries
  - **Storage:** Supabase Storage for images (planned)
- **Configuration:** Environment variables and service clients

## Data Flow

### Read Operations (Parking Discovery)
1. User visits home page (`src/app/page.tsx`)
2. Browser requests geolocation permission
3. `useGeolocation` hook gets user coordinates
4. Map component (`src/components/Map.tsx`) renders with Mapbox
5. Parking search triggered by user interaction or auto-location
6. Client calls Supabase directly for nearby parking data
7. PostGIS spatial query executed on database
8. Results displayed in `ParkingList` component

### Write Operations (Owner Onboarding)
1. Owner accesses listing form (`src/components/ListingForm.tsx`)
2. Form validation via React Hook Form + Zod schemas
3. OTP authentication via Supabase Auth
4. Form submission creates parking listing in database
5. Admin approval workflow (future)

### Admin Operations
1. Admin logs in via OTP (`src/lib/admin-auth.ts`)
2. Admin panel loads (`src/components/admin/`)
3. CRUD operations on listings, payments, public parking
4. Real-time updates via Supabase subscriptions (planned)

## Key Abstractions

### Custom Hooks
- `useGeolocation` - Encapsulates geolocation API complexity
- Form state management via React Hook Form
- Data fetching patterns (future: SWR or React Query)

### Data Models
- Prisma schema defines database entities
- Supabase-generated types for type safety
- Zod schemas for runtime validation

### Error Handling
- Component-level error boundaries (not implemented)
- API error responses with user-friendly messages
- Database constraint validation

### State Management
- Local component state for UI interactions
- Server state via Supabase real-time subscriptions
- No global state management library (Redux, Zustand) - kept simple

## Entry Points

### Client Entry Points
- `src/app/page.tsx` - Main application entry
- `src/app/layout.tsx` - Global layout wrapper
- `src/app/dashboard/page.tsx` - Owner dashboard
- `src/app/admin/page.tsx` - Admin panel

### API Entry Points (Future)
- `/api/auth/*` - Authentication endpoints
- `/api/parking/*` - Parking CRUD operations
- `/api/admin/*` - Admin-only operations

### Build Entry Points
- `package.json` scripts define build and dev commands
- Next.js handles bundling and optimization
- Prisma generates client and types

## Cross-Cutting Concerns

### Security
- Row Level Security (RLS) on all database tables
- JWT-based authentication with refresh tokens
- HTTPS enforced by Vercel hosting
- Input validation via Zod schemas

### Performance
- Next.js SSR for initial page loads
- Image optimization via Next.js Image component
- Database query optimization with PostGIS indexes
- Client-side caching for map interactions

### Scalability
- Serverless architecture via Vercel + Supabase
- Horizontal scaling handled by cloud providers
- Database connection pooling managed by Supabase

### Monitoring (Future)
- Error tracking and logging
- Performance metrics collection
- Admin dashboard analytics

## Architectural Decisions

- **Next.js over Vite:** SSR for SEO-critical parking listings
- **Supabase over self-hosted:** Zero DevOps, built-in auth and real-time
- **Prisma over raw SQL:** Type safety and developer experience
- **Mapbox over Google Maps:** Better performance for dense markers, no billing surprises
- **Tailwind over CSS Modules:** Rapid iteration, consistent design system
- **OTP-only auth:** Reduces friction for Indian users, simpler security model