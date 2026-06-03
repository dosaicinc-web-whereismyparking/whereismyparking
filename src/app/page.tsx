'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Loader2 } from 'lucide-react';
import ParkingCardNew from '@/components/ParkingCardNew';
import BottomNav from '@/components/BottomNav';

interface ParkingListing {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  type?: string;
  coverage?: string;
}

export default function Home() {
  const router = useRouter();
  const [listings, setListings] = useState<ParkingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('Kochi');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchParking(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // Default to Kochi
          fetchParking(10.0259, 76.339);
        }
      );
    } else {
      fetchParking(10.0259, 76.339);
    }
  }, []);

  const fetchParking = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/parking/nearby?lat=${lat}&lng=${lng}&radius=5`
      );
      const data = await res.json();
      setListings(data.results || []);
    } catch (err) {
      console.error('Failed to fetch parking:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[100dvh] bg-[#F7F8FA] pb-[calc(56px+env(safe-area-inset-bottom,0px))] overflow-x-hidden">
      {/* Hero */}
      <div className="bg-[#1A4A8A] px-4 pt-12 pb-8">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-base">
            WhereIsMyParking
          </span>
        </div>
        <h1 className="text-white font-extrabold text-2xl leading-tight mb-2">
          Park anywhere.
          <br />
          Go anywhere.
        </h1>
        <p className="text-white/60 text-xs">
          {city} · Kerala
        </p>
      </div>

      {/* Search Bar — nav trigger */}
      <div className="mx-4 -mt-5 relative z-10 mb-5">
        <button
          suppressHydrationWarning
          onClick={() => router.push('/search')}
          className="w-full bg-white rounded-xl shadow-md border border-gray-100 flex items-center gap-3 px-4 py-3.5 text-left active:scale-[0.98] transition-transform duration-150"
        >
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-gray-400 text-sm">
            Where do you want to park?
          </span>
        </button>
      </div>

      {/* Listings */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">
            Nearby Parking
          </h2>
          <span className="text-xs text-gray-500">
            {listings.length} spots
          </span>
        </div>

        {loading ? (
          // Skeleton cards
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 mb-3">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded-full w-3/4" />
                <div className="h-3 bg-gray-200 rounded-full w-1/2" />
                <div className="h-12 bg-gray-200 rounded-xl" />
              </div>
            </div>
          ))
        ) : listings.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-gray-300" />
            </div>
            <p className="font-bold text-gray-700 text-lg">
              No parking found nearby
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Try searching a specific area
            </p>
            <button
              suppressHydrationWarning
              onClick={() => router.push('/search')}
              className="mt-4 px-6 py-2.5 border-2 border-[#1A4A8A] text-[#1A4A8A] font-semibold rounded-xl text-sm"
            >
              Search now
            </button>
          </div>
        ) : (
          listings.map((listing) => (
            <ParkingCardNew key={listing.id} listing={listing} />
          ))
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
