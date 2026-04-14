# Phase 5: prototyping-self-hosted-stack-bugfixes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-14
**Phase:** 05-prototyping-self-hosted-stack-bugfixes
**Areas discussed:** Stack Migration Strategy, Local Environment Setup, Bug Fix Priority, Migration & Testing, Rollback & Monitoring, Deployment Automation

---

## Stack Migration Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Gradual migration with feature flags | Use environment variables to switch map providers, keep Supabase cloud during prototyping | |
| Full stack replacement | Replace Mapbox with MapLibre, set up self-hosted Supabase locally, update all client configurations simultaneously | ✓ |
| Component-level abstraction | Build MapProvider component that can switch between MapLibre/Mapbox, make Supabase client configurable | |

**User's choice:** Full stack replacement (Option 2) but sequenced — MapLibre first since it's already updated in plans, then self-hosted Supabase via Docker on Mac Mini. No feature flags, no abstraction layer needed for MVP. Keep it simple.
**Notes:** Sequenced approach: MapLibre first (frontend-only), then self-hosted Supabase. Keep implementation simple for MVP.

**Sub-decision - Supabase migration:**

| Option | Description | Selected |
|--------|-------------|----------|
| Keep Prisma for now | Continue using Prisma ORM, only change the database URL to point to localhost self-hosted instance | |
| Switch to raw SQL migrations | Remove Prisma entirely, use direct SQL migrations in supabase/migrations/ folder | ✓ |
| Hybrid approach | Use raw SQL for migrations but keep Prisma client for application queries | |

**User's choice:** Switch to raw SQL migrations as planned

**Sub-decision - Data migration:**

| Option | Description | Selected |
|--------|-------------|----------|
| Fresh start | Don't migrate existing data, create fresh local instance with sample parking data for development | ✓ |
| Selective export/import | Export critical data from cloud (users, listings) and import to local instance | |
| Full backup/restore | Create full backup of cloud database and restore to local self-hosted instance | |

**User's choice:** Fresh start - seed with sample data for testing

---

## Local Environment Setup

| Option | Description | Selected |
|--------|-------------|----------|
| Standard Docker Compose | Use official Supabase docker-compose.yml, customize for PostGIS, run via SSH | ✓ |
| Minimal setup | Just PostgreSQL + PostGIS, manual Supabase services | |
| Full self-hosted stack | Run complete Supabase stack via Docker Compose on Mac Mini | |

**User's choice:** Standard Docker Compose - Use official Supabase docker-compose.yml

**Sub-decision - SSH deployment:**

| Option | Description | Selected |
|--------|-------------|----------|
| Manual SSH commands | Document commands for manual execution: ssh into Mac Mini, run docker compose up, check logs | |
| Shell scripts | Create setup/migration scripts for Mac Mini | ✓ |
| Ansible automation | Use Ansible playbooks to automate Docker setup, environment configuration | |

**User's choice:** Shell scripts - Create setup/migration scripts for Mac Mini

---

## Bug Fix Priority

| Option | Description | Selected |
|--------|-------------|----------|
| Change button to submit type | Change button type from 'button' to 'submit', add form onSubmit handler | |
| Strengthen trigger validation | Keep button as type='button', but enhance trigger(['name', 'address']) with better error handling | ✓ |
| Add form state validation | Use formState.isValid or manual validation check before calling setStep(2) | |

**User's choice:** Strengthen trigger validation - Improve the existing trigger approach

**Sub-decision - Form state management:**

| Option | Description | Selected |
|--------|-------------|----------|
| Keep current approach | Continue using react-hook-form for all form state | |
| Add step validation guards | Add validation checks before allowing step changes | |
| Improve error display | Enhance error message display and field-level validation indicators | |

**User's choice:** Option 1 + 3 combined — keep React Hook Form as-is, just fix the validation bypass and improve error display. No step guards needed for MVP.

---

## Migration & Testing

| Option | Description | Selected |
|--------|-------------|----------|
| Convert existing Prisma schema | Analyze current prisma/schema.prisma and create equivalent SQL migration files | ✓ |
| Start fresh with basic schema | Create minimal SQL schema for testing without full migration from Prisma | |
| Incremental migration | Start with core tables, migrate auth-related schemas first | |

**User's choice:** Convert existing Prisma schema to SQL

**Sub-decision - Testing strategy:**

| Option | Description | Selected |
|--------|-------------|----------|
| API endpoint testing | Focus on backend functionality first | |
| End-to-end flow testing | Test complete user journeys against local stack | ✓ |
| Component isolation | Test UI components with mock data | |

**User's choice:** End-to-end flow testing - Test complete user journeys

---

## Rollback & Monitoring

| Option | Description | Selected |
|--------|-------------|----------|
| Environment variable switching | Use environment variables to switch between cloud/local at runtime | ✓ |
| Build-time configuration | Create separate builds/configs for each environment | |
| Feature flags | Add feature flags to switch stack components without rebuilds | |

**User's choice:** Environment variable switching - Runtime configuration

**Sub-decision - Performance monitoring:**

| Option | Description | Selected |
|--------|-------------|----------|
| Basic logging | Console logs and manual checks | |
| Local monitoring tools | Set up Prometheus/Grafana locally | |
| Browser dev tools | Rely on browser dev tools and manual testing | ✓ |

**User's choice:** Browser dev tools - Standard debugging approach

---

## Deployment Automation

| Option | Description | Selected |
|--------|-------------|----------|
| Basic setup scripts | Scripts for Docker and migration execution | ✓ |
| Full automation | Complete deployment pipeline | |
| Manual with documentation | Scripts as reference guides | |

**User's choice:** Basic setup scripts - Docker and migration execution

**Sub-decision - SSH approach:**

| Option | Description | Selected |
|--------|-------------|----------|
| Direct SSH commands | Run commands interactively | ✓ |
| Scripted SSH | Automated remote execution | |
| Hybrid approach | Local scripts with SSH verification | |

**User's choice:** Direct SSH commands - Run commands interactively

---

## Claude's Discretion
- Exact MapLibre GL JS integration details and configuration
- Specific SQL migration file structure and naming conventions
- Docker Compose customization for PostGIS and Mac Mini environment
- Error message improvements and validation UI enhancements
- Sample data seeding scripts and test data structure