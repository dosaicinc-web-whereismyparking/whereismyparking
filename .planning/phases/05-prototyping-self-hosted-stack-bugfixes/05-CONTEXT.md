# Phase 5: prototyping-self-hosted-stack-bugfixes - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Shift to self-hosted Supabase stack with MapLibre GL JS, fix Phase 2 validation bypass, and establish local development environment on Mac Mini. This phase focuses on prototyping the new stack architecture while resolving critical bugs found during UAT testing. It does not include production deployment or full data migration from cloud to self-hosted.

</domain>

<decisions>
## Implementation Decisions

### Stack Migration Strategy
- **D-01:** Full stack replacement sequenced: MapLibre GL JS first, then self-hosted Supabase via Docker on Mac Mini
- **D-02:** No feature flags or abstraction layers for MVP - keep implementation simple and direct
- **D-03:** Switch to raw SQL migrations, remove Prisma entirely from the codebase
- **D-04:** Fresh start with sample data - no migration of existing cloud data to local instance

### Local Environment Setup
- **D-05:** Use official Supabase self-hosted docker-compose.yml with PostGIS extension enabled
- **D-06:** Deploy via direct SSH commands to Mac Mini - no automation beyond basic setup scripts
- **D-07:** Supabase JS client configured to point to Mac Mini localhost URLs during development

### Bug Fix Priority
- **D-08:** Strengthen trigger validation in handleStep1Next - improve existing trigger(['name', 'address']) approach
- **D-09:** Keep React Hook Form for all form state management, just fix validation bypass
- **D-10:** Improve error display and validation feedback in UI without adding step guards

### Migration & Testing
- **D-11:** Convert existing Prisma schema to equivalent SQL migration files
- **D-12:** Test complete end-to-end user journeys against local stack (OTP → listing → payment → admin approval)
- **D-13:** Update all API endpoints to work with localhost Supabase URLs

### Rollback & Monitoring
- **D-14:** Environment variable switching for runtime configuration between cloud/local stacks
- **D-15:** Use browser dev tools and manual testing for monitoring local stack performance and errors

### Deployment Automation
- **D-16:** Create basic setup scripts for Docker Compose and migration execution
- **D-17:** Document SSH commands for manual execution on Mac Mini
- **D-18:** Focus on setup, migration, and basic health checks rather than full automation

### Claude's Discretion
- Exact MapLibre GL JS integration details and configuration
- Specific SQL migration file structure and naming conventions
- Docker Compose customization for PostGIS and Mac Mini environment
- Error message improvements and validation UI enhancements
- Sample data seeding scripts and test data structure

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Documentation
- `.planning/PROJECT.md` - Technology stack constraints, Supabase self-hosted requirements, MapLibre vs Mapbox decision
- `.planning/REQUIREMENTS.md` - Current implementation status and validation requirements
- `.planning/ROADMAP.md` - Phase 5 scope and dependencies

### Phase 2 UAT Results
- `.planning/phases/02-owner-onboarding-subscriptions/02-UAT.md` - Critical validation bypass bug in ListingForm.tsx handleStep1Next
- `src/components/ListingForm.tsx` - Current form implementation with validation bypass issue

### Current Stack Implementation
- `src/lib/supabase.ts` - Current Supabase client configuration pointing to cloud URLs
- `prisma/schema.prisma` - Current database schema that needs SQL migration conversion
- `src/components/Map.tsx` - Current Mapbox implementation to be replaced with MapLibre

### Supabase Self-Hosted Documentation
- Official Supabase self-hosted docker-compose.yml from GitHub
- PostGIS extension setup for geospatial queries
- Supabase migration file format and conventions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/supabase.ts` - Supabase client setup that needs URL configuration changes
- `src/components/ListingForm.tsx` - Form component with validation bypass bug to fix
- `src/components/Map.tsx` - Map component using Mapbox that needs MapLibre conversion
- `prisma/schema.prisma` - Database schema reference for SQL migration creation

### Established Patterns
- React Hook Form + Zod validation pattern used throughout forms
- Supabase client usage in API routes and components
- Environment variable configuration for external services
- Component structure with TypeScript and Tailwind CSS

### Integration Points
- All Supabase database calls need URL updates for local environment
- Map component integration in listing creation and discovery flows
- Form validation affects the entire listing creation user journey
- Admin approval flows depend on database schema changes

</code_context>

<specifics>
## Specific Ideas

- Start with MapLibre integration as it's frontend-only and can be tested immediately
- Create SQL migrations by analyzing current Prisma schema and converting table definitions
- Focus validation fix on the trigger() call in handleStep1Next - ensure it properly blocks progression
- Use environment variables like NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_MAP_PROVIDER to switch stacks
- Test local Supabase with basic user registration/login before complex flows

</specifics>

<deferred>
## Deferred Ideas

- Production deployment of self-hosted stack (deferred to future phase)
- Full data migration from cloud to self-hosted (using fresh sample data instead)
- Advanced monitoring and performance optimization (using browser dev tools for now)
- Automated deployment scripts (keeping manual SSH approach for simplicity)

</deferred>

---

*Phase: 05-prototyping-self-hosted-stack-bugfixes*
*Context gathered: 2026-04-14*