export type ParkingType = 'PUBLIC' | 'PRIVATE';
export type CoverageType = 'OPEN' | 'COVERED' | 'MULTI';
export type ListingStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED';

export interface ParkingListing {
  id: string;
  name: string;
  address: string;
  type: ParkingType;
  coverage: CoverageType;
  availableHours: any;
  status: ListingStatus;
  latitude: number;
  longitude: number;
  distance?: number;
}
