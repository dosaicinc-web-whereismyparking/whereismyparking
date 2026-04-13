# Testing Structure and Practices

## Testing Framework

### Primary Framework
- **Test Runner:** Vitest 4.1.4
- **Environment:** Node.js with JSDOM 29.0.2
- **Integration:** React Testing Library 16.3.2 + Jest DOM 6.9.1
- **Configuration:** `vitest.config.ts`

### Configuration Details
```typescript
// vitest.config.ts
export default {
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true
  }
}
```

### Test Environment Setup
```typescript
// tests/setup.ts
import '@testing-library/jest-dom'
import { beforeAll, afterAll } from 'vitest'

// Global test setup
beforeAll(() => {
  // Setup code
})

afterAll(() => {
  // Cleanup code
})
```

## Test Structure

### Directory Organization
```
tests/
├── setup.ts                    # Global test configuration
├── auth.test.ts                # Authentication logic tests
├── discovery.test.tsx          # Parking discovery UI tests
├── location.test.ts            # Geolocation utilities tests
├── distance.test.ts            # Distance calculation tests
└── admin-dashboard.test.tsx    # Admin dashboard tests
```

### File Naming
- **Unit Tests:** `filename.test.ts` or `filename.test.tsx`
- **Integration Tests:** `feature.test.ts` or `feature.test.tsx`
- **Setup Files:** `setup.ts`

### Test File Patterns
```typescript
import { describe, it, expect, vi } from 'vitest'

describe('Distance Utils', () => {
  describe('calculateDistance', () => {
    it('calculates distance between two points', () => {
      const result = calculateDistance(point1, point2)
      expect(result).toBe(expectedDistance)
    })
  })
})
```

## Testing Categories

### Unit Tests
- **Focus:** Individual functions and utilities
- **Examples:**
  - Distance calculations (`distance.test.ts`)
  - Authentication utilities (`auth.test.ts`)
  - Location services (`location.test.ts`)

### Component Tests
- **Focus:** React component rendering and interactions
- **Examples:**
  - Map component rendering (`discovery.test.tsx`)
  - Admin dashboard interactions (`admin-dashboard.test.tsx`)

### Integration Tests
- **Focus:** Component interactions and data flow
- **Examples:** Form submissions, API integrations

## Mocking Strategies

### External Dependencies
```typescript
import { vi } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: mockData, error: null }))
    }))
  }))
}))
```

### Browser APIs
- **JSDOM Environment:** Automatic mocking of DOM APIs
- **Geolocation API:** Manual mocking for location services
- **Mapbox GL JS:** Mocked for component tests

### Custom Mocks
```typescript
// Mock geolocation API
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn((success) => {
      success({
        coords: { latitude: 12.9716, longitude: 77.5946 }
      })
    })
  },
  writable: true
})
```

## Test Coverage

### Coverage Configuration
- **Not currently configured**
- **Future setup:** `@vitest/coverage-v8` or similar
- **Target:** 80%+ coverage for critical paths

### Coverage Areas
- **Core utilities:** Distance calculations, authentication
- **UI components:** Map rendering, form interactions
- **API integrations:** Supabase queries, error handling

## Test Execution

### Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage"
  }
}
```

### Running Tests
- **Development:** `npm test` (watch mode)
- **CI/CD:** `npm run test:unit` (single run)
- **Coverage:** `npm run test:coverage` (when configured)

## Testing Best Practices

### Test Organization
- **Arrange-Act-Assert:** Clear test structure
- **Descriptive Names:** Tests explain what they're verifying
- **Independent Tests:** No shared state between tests

### Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Map } from 'components/Map'

describe('Map Component', () => {
  it('displays parking markers', () => {
    render(<Map />)
    expect(screen.getByRole('button', { name: /parking/i })).toBeInTheDocument()
  })

  it('handles location permission denied', () => {
    // Mock geolocation rejection
    render(<Map />)
    expect(screen.getByText(/location access denied/i)).toBeInTheDocument()
  })
})
```

### Async Testing
```typescript
it('fetches parking data', async () => {
  render(<ParkingList />)
  await waitFor(() => {
    expect(screen.getByText('Parking Spot 1')).toBeInTheDocument()
  })
})
```

### Error Testing
```typescript
it('handles API errors gracefully', async () => {
  // Mock API failure
  render(<ParkingList />)
  await waitFor(() => {
    expect(screen.getByText(/failed to load parking/i)).toBeInTheDocument()
  })
})
```

## CI/CD Integration

### GitHub Actions (Future)
```yaml
- name: Run Tests
  run: npm run test:unit

- name: Generate Coverage
  run: npm run test:coverage
```

### Pre-commit Hooks (Future)
- **Husky + lint-staged:** Run tests before commits
- **ESLint + Prettier:** Code quality checks

## Test Data Management

### Test Data
- **Mock Data:** Static JSON fixtures
- **Factory Functions:** Generate test data
- **Database Seeding:** For integration tests

### Database Testing
- **Test Database:** Separate SQLite instance
- **Migrations:** Run before test suites
- **Cleanup:** Truncate tables between tests

## Performance Testing

### Component Performance
- **React DevTools Profiler:** Manual performance checks
- **Bundle Analyzer:** Check bundle sizes

### API Performance
- **Response Time Tests:** Assert reasonable response times
- **Load Testing:** Future consideration for scaling

## Accessibility Testing

### A11y Checks
- **React Testing Library:** Built-in accessibility queries
- **Manual Testing:** Screen reader compatibility
- **Color Contrast:** Visual accessibility checks

### Example A11y Test
```typescript
it('has accessible map controls', () => {
  render(<Map />)
  expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument()
  expect(screen.getByLabelText(/map of parking locations/i)).toBeInTheDocument()
})
```

## Test Maintenance

### Flaky Test Prevention
- **Deterministic Tests:** Avoid random data
- **Proper Cleanup:** Reset state between tests
- **Network Mocks:** Control external dependencies

### Test Documentation
- **Test Comments:** Explain complex test scenarios
- **Test Naming:** Self-documenting test names
- **Test Organization:** Logical grouping and structure

This testing setup provides a solid foundation for maintaining code quality with modern JavaScript testing practices.