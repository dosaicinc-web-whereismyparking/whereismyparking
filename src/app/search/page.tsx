'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Clock, MapPin, Loader2 } from 'lucide-react';
import ParkingCardNew from '@/components/ParkingCardNew';
import BottomNav from '@/components/BottomNav';

interface Suggestion {
  id: string;
  name: string;
  fullName: string;
  lat: number;
  lng: number;
  source: 'local' | 'nominatim';
}

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

export default function SearchPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [listings, setListings] = useState<ParkingListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
    // Load recent searches from localStorage
    const recent = localStorage.getItem('wimp_recent_searches');
    if (recent) {
      setRecentSearches(JSON.parse(recent).slice(0, 5));
    }
  }, []);

  const fetchSuggestions = async (input: string) => {
    if (input.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(input)}&format=json&limit=5&countrycodes=in&viewbox=74.8,8.0,77.6,12.8&addressdetails=1`;

      const [nomRes, dbRes] = await Promise.all([
        fetch(nominatimUrl, {
          headers: { 'User-Agent': 'WhereIsMyParking/1.0' },
        }),
        fetch(`/api/parking/search?q=${encodeURIComponent(input)}`),
      ]);

      const nomData = await nomRes.json();
      const dbData = await dbRes.json();

      // Map local DB results
      const localResults = (dbData.listings || []).map((item: any) => ({
        id: `db-${item.id}`,
        name: item.name,
        fullName: item.address,
        lat: item.latitude,
        lng: item.longitude,
        source: 'local' as const,
      }));

      // Map Nominatim results
      const nominatimResults = (nomData || []).map((item: any) => ({
        id: `osm-${item.place_id}`,
        name: item.display_name.split(',').slice(0, 2).join(',').trim(),
        fullName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        source: 'nominatim' as const,
      }));

      const combined = [...localResults, ...nominatimResults].slice(0, 7);
      setSuggestions(combined);
    } catch (err) {
      console.error('Fetch suggestions error:', err);
    }
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  const handleSelectSuggestion = async (s: Suggestion) => {
    setQuery(s.name);
    setShowSuggestions(false);

    // Save to recent searches
    const recent = JSON.parse(
      localStorage.getItem('wimp_recent_searches') || '[]'
    );
    const updated = [s.name, ...recent.filter((x: string) => x !== s.name)].slice(
      0,
      5
    );
    localStorage.setItem('wimp_recent_searches', JSON.stringify(updated));

    // Fetch parking
    setLoading(true);
    try {
      const res = await fetch(
        `/api/parking/nearby?lat=${s.lat}&lng=${s.lng}&radius=5`
      );
      const data = await res.json();
      setListings(data.results || []);
    } catch (err) {
      console.error('Failed to fetch parking:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecentClick = (search: string) => {
    setQuery(search);
    fetchSuggestions(search);
  };

  return (
    <div className="min-h-[100dvh] bg-[#F7F8FA] pb-[calc(64px+env(safe-area-inset-bottom,0px))]">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleQueryChange}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search parking by location..."
              className="w-full bg-gray-100 rounded-lg px-4 py-2.5 text-[15px] placeholder-gray-500 outline-none"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setSuggestions([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {showSuggestions && (query.length >= 2 || recentSearches.length > 0) ? (
          <div className="space-y-3">
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div>
                <h3 className="text-[13px] font-semibold text-gray-500 mb-2">
                  Results
                </h3>
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSuggestion(s)}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-[14px]">
                          {s.name}
                        </p>
                        <p className="text-[12px] text-gray-500 truncate">
                          {s.fullName}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && query.length < 2 && (
              <div>
                <h3 className="text-[13px] font-semibold text-gray-500 mb-2">
                  Recent
                </h3>
                {recentSearches.map((search) => (
                  <button
                    key={search}
                    onClick={() => handleRecentClick(search)}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3"
                  >
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 text-[14px]">{search}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* Results */}
        {listings.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[17px] font-bold text-gray-900">
                Parking Near {query}
              </h2>
              <span className="text-[13px] text-gray-500">
                {listings.length} spots
              </span>
            </div>
            {listings.map((listing) => (
              <ParkingCardNew key={listing.id} listing={listing} />
            ))}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#1A4A8A] animate-spin" />
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
