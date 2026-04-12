export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ParkingListing {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  [key: string]: any;
}

/**
 * Calculates the distance between two points in kilometers using the Spherical Law of Cosines.
 * Match pattern: Math.acos, Math.sin
 */
export const calculateDistance = (p1: { latitude: number; longitude: number }, p2: { latitude: number; longitude: number }): number => {
  const R = 6371; // Earth's radius in kilometers
  const lat1 = p1.latitude * (Math.PI / 180);
  const lat2 = p2.latitude * (Math.PI / 180);
  const lon1 = p1.longitude * (Math.PI / 180);
  const lon2 = p2.longitude * (Math.PI / 180);

  // Spherical Law of Cosines
  // d = acos( sin Ï†1 â‹… sin Ï†2 + cos Ï†1 â‹… cos Ï†2 â‹… cos Î”Î» ) â‹… R
  const distance = Math.acos(
    Math.sin(lat1) * Math.sin(lat2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)
  ) * R;

  return isNaN(distance) ? 0 : distance;
};

/**
 * Sorts an array of parking listings by their distance from a user's location.
 */
export const sortByDistance = <T extends ParkingListing>(
  listings: T[],
  userLocation: { latitude: number; longitude: number } | null
): (T & { distance: number | null })[] => {
  if (!userLocation) {
    return listings.map((listing) => ({ ...listing, distance: null }));
  }

  return listings
    .map((listing) => ({
      ...listing,
      distance: calculateDistance(userLocation, {
        latitude: listing.latitude,
        longitude: listing.longitude,
      }),
    }))
    .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
};
