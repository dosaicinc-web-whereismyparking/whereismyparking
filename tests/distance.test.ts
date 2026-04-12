import { describe, it, expect } from 'vitest';
import { calculateDistance, sortByDistance } from '../src/utils/distance';

describe('Distance utilities', () => {
  it('should calculate distance correctly using spherical law of cosines', () => {
    // Distance from Bangalore (12.9716, 77.5946) to Mumbai (19.0760, 72.8777)
    // Roughly 835-850km depending on formula
    const bangalore = { latitude: 12.9716, longitude: 77.5946 };
    const mumbai = { latitude: 19.0760, longitude: 72.8777 };
    
    const distance = calculateDistance(bangalore, mumbai);
    expect(distance).toBeGreaterThan(830);
    expect(distance).toBeLessThan(860);
  });

  it('should return 0 for the same point', () => {
    const point = { latitude: 12.9716, longitude: 77.5946 };
    expect(calculateDistance(point, point)).toBe(0);
  });

  it('should sort parking listings by distance', () => {
    const user = { latitude: 12.97, longitude: 77.59 };
    const listings = [
      { id: '1', name: 'Far', latitude: 13.5, longitude: 78.5 },
      { id: '2', name: 'Near', latitude: 12.98, longitude: 77.60 },
      { id: '3', name: 'Medium', latitude: 13.1, longitude: 77.8 },
    ];

    const sorted = sortByDistance(listings, user);
    
    expect(sorted[0].name).toBe('Near');
    expect(sorted[1].name).toBe('Medium');
    expect(sorted[2].name).toBe('Far');
    expect(sorted[0].distance).not.toBeNull();
  });

  it('should handle null user location', () => {
    const listings = [
      { id: '1', name: 'Far', latitude: 13.5, longitude: 78.5 },
    ];

    const sorted = sortByDistance(listings, null);
    
    expect(sorted[0].distance).toBeNull();
  });
});
