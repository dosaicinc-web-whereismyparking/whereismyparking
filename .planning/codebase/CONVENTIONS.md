# Coding Conventions and Patterns

## Code Style

### Language Standards
- **TypeScript:** Strict mode enabled
- **ES2022+ features:** Modern JavaScript with Next.js transpilation
- **React:** Functional components with hooks (no class components)
- **Formatting:** Inconsistent (no Prettier/ESLint configured)

### TypeScript Configuration (`tsconfig.json`)
- **Target:** ES2022
- **Module:** ESNext
- **JSX:** React JSX Transform (no import React needed)
- **Strict:** All strict checks enabled
- **Paths:** Absolute imports configured (`src/*` → `./src/*`)

### Import Order
```typescript
// External dependencies (alphabetical)
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// Internal imports (grouped by layer)
import { Map } from 'components/Map'
import { useGeolocation } from 'hooks/useGeolocation'
import { supabase } from 'lib/supabase'
import { calculateDistance } from 'utils/distance'
```

## Naming Conventions

### Files
- **Components:** `PascalCase.tsx` (e.g., `Map.tsx`, `AuthModal.tsx`)
- **Hooks:** `useCamelCase.ts` (e.g., `useGeolocation.ts`)
- **Utilities:** `camelCase.ts` (e.g., `distance.ts`)
- **Libraries:** `camelCase.ts` (e.g., `supabase.ts`, `admin-auth.ts`)
- **Types:** `camelCase.ts` or `PascalCase.ts` (e.g., `supabase-types.ts`)

### Code Elements
- **Variables/Functions:** `camelCase`
- **Constants:** `UPPER_SNAKE_CASE` or `camelCase`
- **Types/Interfaces:** `PascalCase`
- **Enums:** `PascalCase`
- **Generic Type Parameters:** `T`, `U`, `V` (single letters)
- **Event Handlers:** `handleEvent` or `onEvent`
- **Boolean Props:** `isEnabled`, `hasData`, `canEdit`

### CSS Classes (Tailwind)
- **Utility Classes:** Tailwind standard (`flex`, `bg-blue-500`)
- **Custom Classes:** `camelCase` or `kebab-case`
- **Component Classes:** Prefixed with component name

## Component Patterns

### Functional Components
```typescript
interface MapProps {
  center?: [number, number]
  zoom?: number
}

export function Map({ center, zoom = 13 }: MapProps) {
  // Component logic
  return <div>...</div>
}
```

### Custom Hooks
```typescript
export function useGeolocation() {
  const [position, setPosition] = useState<GeolocationPosition | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Hook logic
  return { position, error, requestLocation }
}
```

### Props with Default Values
- Use destructuring with defaults
- Prefer optional props over overloads
- Use `interface` for complex prop types

## State Management Patterns

### Local Component State
- `useState` for simple state
- `useReducer` for complex state transitions
- Avoid prop drilling with context when possible

### Server State
- Direct Supabase queries for data fetching
- No global state management library (kept simple)
- Future: SWR or React Query for caching

### Form State
- React Hook Form for complex forms
- Zod for validation schemas
- Controlled components preferred

## Error Handling

### Async Operations
```typescript
try {
  const data = await supabase.from('parking').select('*')
  // Handle success
} catch (error) {
  console.error('Failed to fetch parking:', error)
  // Show user-friendly error message
}
```

### User-Facing Errors
- Display errors in UI components
- Use toast notifications or inline messages
- Avoid exposing technical details to users

### API Error Handling
- Check Supabase error responses
- Handle network failures gracefully
- Implement retry logic for transient failures

### Validation Errors
- Client-side validation with Zod
- Server-side validation via database constraints
- Clear error messages for form fields

## Database Patterns

### Prisma Usage
- Type-safe queries via generated client
- Raw SQL only when necessary (PostGIS functions)
- Connection pooling handled by Supabase

### Supabase Patterns
- RLS policies for security
- Real-time subscriptions for live updates
- Storage for file uploads (planned)

### Schema Conventions
- Table names: `snake_case`
- Column names: `snake_case`
- Foreign keys: `table_id` pattern
- Indexes on frequently queried columns

## Testing Patterns

### Test Structure
- Test files: `*.test.ts` or `*.test.tsx`
- Test directory mirrors source structure
- Setup file: `tests/setup.ts`

### Testing Framework
- **Runner:** Vitest
- **Environment:** JSDOM for DOM APIs
- **Utilities:** React Testing Library + Jest DOM

### Test Patterns
```typescript
import { render, screen } from '@testing-library/react'
import { Map } from 'components/Map'

describe('Map', () => {
  it('renders map container', () => {
    render(<Map />)
    expect(screen.getByRole('region')).toBeInTheDocument()
  })
})
```

### Mocking
- Supabase client mocking for API calls
- JSDOM for browser APIs
- Custom mocks for external dependencies

## Performance Patterns

### React Optimization
- `React.memo` for expensive components
- `useMemo`/`useCallback` for computed values
- Lazy loading for route components

### Database Optimization
- PostGIS indexes for spatial queries
- Pagination for large result sets
- Caching with appropriate TTL

### Build Optimization
- Next.js automatic code splitting
- Image optimization with Next.js Image
- Tree shaking via ES modules

## Security Patterns

### Authentication
- OTP-only authentication (no passwords)
- JWT tokens with secure storage
- Admin role validation on protected routes

### Data Protection
- RLS policies on all tables
- Input sanitization and validation
- HTTPS enforced by hosting

### API Security
- Server-side only API keys
- Rate limiting on sensitive endpoints
- CORS configuration for web clients

## Documentation Patterns

### Code Comments
- JSDoc for public APIs
- Inline comments for complex logic
- TODO comments for future work

### Component Documentation
- Prop types with TypeScript interfaces
- Usage examples in comments
- Accessibility notes

### File Headers
```typescript
/**
 * Interactive map component using Mapbox GL JS
 * Displays parking locations with clustering
 */
```

## Git Commit Patterns

### Commit Messages
- Format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Scopes: `auth`, `map`, `admin`, `api`

### Branch Naming
- Feature branches: `feature/description`
- Bug fixes: `fix/description`
- Documentation: `docs/description`

This codebase follows modern React/TypeScript patterns with emphasis on type safety, functional programming, and clear separation of concerns.