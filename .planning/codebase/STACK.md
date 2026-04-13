# Technology Stack

## Languages and Runtime

- **Primary Language:** TypeScript
- **Runtime:** Node.js (via Next.js)
- **Target Environment:** Browser (client-side), Node.js (server-side via Next.js API routes)

## Frameworks and Libraries

- **Frontend Framework:** Next.js 16 (React-based full-stack framework)
- **UI Framework:** React 19
- **Styling:** Tailwind CSS 4
- **Forms:** React Hook Form with Zod validation
- **Maps:** Mapbox GL JS 3.21.0 with react-map-gl 8.1.1
- **Database ORM:** Prisma 6
- **Backend-as-a-Service:** Supabase (PostgreSQL + Auth + Storage)

## Dependencies

### Production Dependencies
- @supabase/supabase-js: 2.103.0 - Supabase client
- @prisma/client: 6.19.3 - Prisma ORM client
- next: 16.2.3 - Next.js framework
- react: 19.2.5 - React library
- react-dom: 19.2.5 - React DOM
- tailwindcss: 4.2.2 - Tailwind CSS
- @tailwindcss/postcss: 4.2.2 - Tailwind PostCSS plugin
- autoprefixer: 10.4.27 - CSS autoprefixer
- postcss: 8.5.9 - PostCSS
- lucide-react: 1.8.0 - Icon library
- mapbox-gl: 3.4.1 - Mapbox GL JS
- @types/mapbox-gl: 3.4.1 - TypeScript types for Mapbox
- react-map-gl: 8.1.1 - React wrapper for Mapbox GL
- react-hook-form: 7.72.1 - Form state management
- @hookform/resolvers: 5.2.2 - Form validation resolvers
- zod: 4.3.6 - Schema validation

### Development Dependencies
- typescript: 6.0.2 - TypeScript compiler
- vitest: 4.1.4 - Test runner
- @testing-library/react: 16.3.2 - React testing utilities
- @testing-library/jest-dom: 6.9.1 - Jest DOM testing utilities
- @types/node: 25.6.0 - Node.js types
- @types/react: 19.2.14 - React types
- @types/react-dom: 19.2.3 - React DOM types
- @vitejs/plugin-react: 6.0.1 - Vite React plugin
- jsdom: 29.0.2 - DOM environment for testing
- prisma: 6.19.3 - Prisma CLI

## Configuration

- **Package Manager:** npm (package-lock.json present)
- **Build Tool:** Next.js built-in (next build)
- **Development Server:** Next.js dev server (next dev)
- **Testing:** Vitest with JSDOM environment
- **Linting/Formatting:** Not configured (no ESLint/Prettier in package.json)
- **Database:** Prisma with SQLite (dev.db) and Supabase (production)
- **Environment:** .env.local for local development, .env.example for template

## Key Files

- `package.json` - Project dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `next.config.ts` - Next.js configuration
- `vitest.config.ts` - Vitest configuration
- `postcss.config.js` - PostCSS configuration
- `prisma/schema.prisma` - Database schema
- `supabase/migrations/` - Database migrations

## Development Workflow

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm test` - Run tests
- `npm run test:unit` - Run unit tests

This is a modern React/Next.js application using TypeScript, with Supabase as the backend and Mapbox for mapping functionality. The project follows standard Next.js conventions with custom Prisma integration for database operations.