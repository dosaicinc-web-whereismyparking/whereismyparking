export type ParkingType = 'PUBLIC' | 'PRIVATE';
export type CoverageType = 'OPEN' | 'COVERED' | 'MULTI';
export type ListingStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'REJECTED' | 'INACTIVE' | 'ARCHIVED';
export type SubscriptionStatus =
  | 'PENDING_PAYMENT'
  | 'PENDING_VERIFICATION'
  | 'ACTIVE'
  | 'GRACE_PERIOD'
  | 'EXPIRED'
  | 'INACTIVE'
  | 'REJECTED';

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
  ownerId: string;
  images?: string[] | null;
}

export interface Subscription {
  id: string;
  listingId: string;
  ownerId: string;
  startDate?: string;
  endDate?: string;
  status: SubscriptionStatus;
  upiId?: string;
  utr?: string;
  verifiedAt?: string;
  createdAt: string;
}
