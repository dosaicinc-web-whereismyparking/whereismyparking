import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGeolocation } from '../src/hooks/useGeolocation';

// Mocking Geolocation and Permissions API
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};

const mockPermissions = {
  query: vi.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  configurable: true,
});

Object.defineProperty(global.navigator, 'permissions', {
  value: mockPermissions,
  configurable: true,
});

describe('Geolocation hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation for permissions
    mockPermissions.query.mockResolvedValue({
      state: 'prompt',
      onchange: null,
    });
  });

  it('should initialize in prompt state if permissions are not determined', async () => {
    const { result } = renderHook(() => useGeolocation());
    
    // We wait for the initial useEffect to run
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.status).toBe('prompt');
    expect(result.current.position).toBeNull();
  });

  it('should request location and update state on success', async () => {
    const mockPos = {
      coords: {
        latitude: 12.9716,
        longitude: 77.5946,
      },
    };

    mockGeolocation.getCurrentPosition.mockImplementationOnce((success) => {
      success(mockPos);
    });

    const { result } = renderHook(() => useGeolocation());

    await act(async () => {
      result.current.requestLocation();
    });

    expect(result.current.status).toBe('granted');
    expect(result.current.position).toEqual({
      latitude: 12.9716,
      longitude: 77.5946,
    });
    expect(result.current.error).toBeNull();
  });

  it('should update state on permission denied', async () => {
    const mockError = {
      code: 1, // PERMISSION_DENIED
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    mockGeolocation.getCurrentPosition.mockImplementationOnce((success, error) => {
      error(mockError);
    });

    const { result } = renderHook(() => useGeolocation());

    await act(async () => {
      result.current.requestLocation();
    });

    expect(result.current.status).toBe('denied');
    expect(result.current.error).toContain('User denied the request');
  });

  it('should handle timeout error', async () => {
    const mockError = {
      code: 3, // TIMEOUT
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    mockGeolocation.getCurrentPosition.mockImplementationOnce((success, error) => {
      error(mockError);
    });

    const { result } = renderHook(() => useGeolocation());

    await act(async () => {
      result.current.requestLocation();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toContain('timed out');
  });

  it('should auto-request if permission is already granted', async () => {
    const mockPos = {
      coords: {
        latitude: 12.9716,
        longitude: 77.5946,
      },
    };

    mockPermissions.query.mockResolvedValue({
      state: 'granted',
      onchange: null,
    });

    mockGeolocation.getCurrentPosition.mockImplementationOnce((success) => {
      success(mockPos);
    });

    const { result } = renderHook(() => useGeolocation());

    // Wait for the useEffect to trigger requestLocation
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.status).toBe('granted');
    expect(result.current.position).toEqual({
      latitude: 12.9716,
      longitude: 77.5946,
    });
  });
});
