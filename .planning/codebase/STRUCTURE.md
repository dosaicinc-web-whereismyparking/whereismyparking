# Directory Structure and Organization

## Root Directory Layout

```
WhereIsMyParking/
├── src/                          # Source code
│   ├── app/                      # Next.js App Router pages
│   │   ├── page.tsx             # Home page (parking discovery)
│   │   ├── layout.tsx           # Root layout
│   │   ├── dashboard/           # Owner dashboard (future)
│   │   └── globals.css          # Global styles
│   ├── components/              # React components
│   │   ├── Map.tsx             # Interactive map component
│   │   ├── ParkingList.tsx     # Parking listings display
│   │   ├── AuthModal.tsx       # Authentication modal
│   │   ├── ListingForm.tsx     # Parking space listing form
│   │   └── admin/              # Admin panel components
│   ├── lib/                    # Library code and configurations
│   │   ├── supabase.ts         # Supabase client setup
│   │   ├── supabase-types.ts   # Generated Supabase types
│   │   ├── admin-auth.ts       # Admin authentication utilities
│   │   └── prisma.ts           # Prisma database client
│   ├── hooks/                  # Custom React hooks
│   │   └── useGeolocation.ts   # Geolocation hook
│   └── utils/                  # Utility functions
│       └── distance.ts         # Distance calculation utilities
├── tests/                       # Test files
│   ├── setup.ts                # Test configuration
│   ├── auth.test.ts            # Authentication tests
│   ├── discovery.test.tsx      # Discovery feature tests
│   ├── location.test.ts        # Location services tests
│   ├── distance.test.ts        # Distance utilities tests
│   └── admin-dashboard.test.tsx # Admin dashboard tests
├── prisma/                      # Database schema and migrations
│   ├── schema.prisma           # Prisma schema definition
│   └── dev.db                  # SQLite development database
├── supabase/                    # Supabase configuration
│   └── migrations/             # Database migrations
│       ├── 01_initial.sql      # Initial schema
│       └── 02_rls_policies.sql # Row Level Security policies
├── .planning/                   # Project planning and documentation
│   ├── PROJECT.md              # Project vision and requirements
│   ├── REQUIREMENTS.md         # Detailed requirements
│   ├── ROADMAP.md              # Project roadmap
│   ├── STATE.md                # Current project state
│   ├── config.json             # Project configuration
│   ├── phases/                 # Phase-specific planning
│   └── codebase/               # Codebase analysis (this directory)
├── scratch/                     # Temporary development files
│   ├── admin-public-import-api.md # API design notes
│   └── test-api-hardening.js   # Test utilities
├── .next/                       # Next.js build artifacts
├── node_modules/                # Dependencies
├── .env.local                   # Local environment variables
├── .env.example                 # Environment variable template
├── package.json                 # Project dependencies and scripts
├── tsconfig.json                # TypeScript configuration
├── next.config.ts               # Next.js configuration
├── vitest.config.ts             # Test configuration
├── postcss.config.js            # PostCSS configuration
└── .gitignore                   # Git ignore patterns
```

## Key Locations Reference

### Entry Points
- **Main Application:** `src/app/page.tsx`
- **Global Layout:** `src/app/layout.tsx`
- **Owner Dashboard:** `src/app/dashboard/page.tsx` (planned)
- **Admin Panel:** `src/app/admin/page.tsx` (planned)

### Core Components
- **Map Display:** `src/components/Map.tsx`
- **Parking Listings:** `src/components/ParkingList.tsx`
- **Authentication:** `src/components/AuthModal.tsx`
- **Listing Form:** `src/components/ListingForm.tsx`

### Admin Components
- **Admin Dashboard:** `src/components/admin/AdminTabs.tsx`
- **Listing Management:** `src/components/admin/ListingApprovalCard.tsx`
- **Payment Review:** `src/components/admin/AdminReviewPanel.tsx`
- **Data Tables:** `src/components/admin/OwnerSubscriptionTable.tsx`

### Infrastructure
- **Supabase Client:** `src/lib/supabase.ts`
- **Database Client:** `src/lib/prisma.ts`
- **Auth Utilities:** `src/lib/admin-auth.ts`
- **Type Definitions:** `src/lib/supabase-types.ts`

### Utilities
- **Geolocation Hook:** `src/hooks/useGeolocation.ts`
- **Distance Calculations:** `src/utils/distance.ts`

### Configuration
- **Database Schema:** `prisma/schema.prisma`
- **Environment Variables:** `.env.local`
- **TypeScript Config:** `tsconfig.json`
- **Next.js Config:** `next.config.ts`
- **Test Config:** `vitest.config.ts`

## Naming Conventions

### Files and Directories
- **Directories:** `camelCase` (e.g., `src/components/admin/`)
- **React Components:** `PascalCase` (e.g., `Map.tsx`, `AuthModal.tsx`)
- **Hooks:** `camelCase` with `use` prefix (e.g., `useGeolocation.ts`)
- **Utilities:** `camelCase` (e.g., `distance.ts`)
- **Libraries/Config:** `camelCase` or `kebab-case` (e.g., `supabase.ts`, `admin-auth.ts`)
- **Tests:** `camelCase` with `.test.ts` or `.test.tsx` suffix

### Code Elements
- **Variables/Functions:** `camelCase`
- **Constants:** `UPPER_SNAKE_CASE` or `camelCase`
- **Types/Interfaces:** `PascalCase`
- **Database Tables:** `snake_case` (via Prisma conventions)
- **Database Columns:** `snake_case` (via Prisma conventions)
- **API Endpoints:** `kebab-case` (REST conventions)

### CSS Classes
- **Tailwind Utility Classes:** `kebab-case` (Tailwind standard)
- **Custom Classes:** `camelCase` or `kebab-case`
- **Component-specific Classes:** Prefixed with component name

## File Organization Patterns

### Component Co-location
- Related components grouped in subdirectories (e.g., `admin/`)
- Component files include styles, tests, and documentation when applicable

### Feature-based Organization
- Business features have dedicated directories when they grow
- Shared utilities in `lib/`, `hooks/`, `utils/` directories
- Test files mirror source structure in `tests/` directory

### Configuration Separation
- Application config in `src/lib/`
- Build config in root directory
- Environment-specific config in `.env.*` files

### Documentation Structure
- Project docs in `.planning/`
- Code comments follow TypeScript/JSDoc standards
- README files for complex directories

## Import Patterns

### Relative Imports
- Same directory: `./ComponentName`
- Parent directory: `../utils/helper`
- Sibling directories: `../../lib/config`

### Absolute Imports (Preferred)
- From `src/`: `components/Map`, `lib/supabase`, `utils/distance`
- Configured in `tsconfig.json` with `"baseUrl": "."` and `"paths"`

### External Dependencies
- Node modules: `import { useState } from 'react'`
- Scoped packages: `import { createClient } from '@supabase/supabase-js'`

## Build and Distribution

### Source Files
- All application code in `src/` directory
- TypeScript compilation outputs to `.next/`
- Static assets served from `public/` (not present)

### Generated Files
- Prisma client: Generated from `prisma/schema.prisma`
- Supabase types: Generated from database schema
- Next.js build artifacts: `.next/` directory

### Ignored Files
- Dependencies: `node_modules/`
- Environment secrets: `.env.local`
- Build artifacts: `.next/`, `tsconfig.tsbuildinfo`
- OS files: `.DS_Store`, `Thumbs.db`
- IDE files: `.vscode/`, `.idea/`
- Logs: `server.log`, `.next/trace*`

This structure follows Next.js 13+ App Router conventions with clear separation between features, infrastructure, and configuration.