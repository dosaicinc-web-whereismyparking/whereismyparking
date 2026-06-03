'use client';
import { Navigation, Clock } from 'lucide-react';

interface ParkingListing {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  distance_km?: number;
  type?: string;
  coverage?: string;
}

export default function ParkingCardNew({
  listing,
}: {
  listing: ParkingListing;
}) {
  const dist = listing.distance_km || (listing.distance ? listing.distance / 1000 : undefined);
  const distLabel = !dist
    ? null
    : dist < 1
      ? `${Math.round(dist * 1000)}m`
      : `${dist.toFixed(1)}km`;

  const mapsUrl =
    listing.latitude && listing.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`
      : null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-2.5 overflow-hidden w-full active:scale-[0.98] transition-transform duration-150">
      <div className="p-3.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">
              {listing.name}
            </h3>
            <p className="text-xs text-gray-500 mt-1 line-clamp-1 truncate">
              {listing.address}
            </p>
          </div>
          {distLabel && (
            <span className="flex-shrink-0 text-[10px] font-bold text-[#1A4A8A] bg-blue-50 px-2 py-1 rounded-full whitespace-nowrap">
              {distLabel}
            </span>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {listing.type && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                listing.type === 'PUBLIC'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-orange-50 text-orange-700'
              }`}
            >
              {listing.type === 'PUBLIC' ? 'Public' : 'Private'}
            </span>
          )}
          {listing.coverage && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {listing.coverage === 'COVERED'
                ? 'Covered'
                : listing.coverage === 'MULTI'
                  ? 'Multi-level'
                  : 'Open air'}
            </span>
          )}
          <span className="text-[10px] text-amber-600 font-medium flex items-center gap-0.5 ml-auto">
            <Clock className="w-2.5 h-2.5 flex-shrink-0" />
            Check on arrival
          </span>
        </div>

        {/* Navigate Button */}
        {mapsUrl ? (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#F97316] text-white font-semibold text-xs py-2.5 rounded-lg transition-colors active:bg-orange-600 min-h-[44px]"
          >
            <Navigation className="w-3.5 h-3.5" />
            Navigate with Google Maps
          </a>
        ) : (
          <div className="flex items-center justify-center gap-2 w-full bg-gray-100 text-gray-400 font-semibold text-xs py-2.5 rounded-lg min-h-[44px]">
            Location unavailable
          </div>
        )}
      </div>
    </div>
  );
}
