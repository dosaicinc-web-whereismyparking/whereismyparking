'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { ParkingMap } from '@/components/Map';
import { ParkingList } from '@/components/ParkingList';
import AuthModal from '@/components/AuthModal';
import { supabase } from '@/lib/supabase';
import { ParkingListing, ParkingType, CoverageType } from '@/lib/supabase-types';
import { Search, Loader2, Map as MapIcon, List as ListIcon, AlertCircle } from 'lucide-react';
import Link from 'next/link';


export default function Home() {
  const { position, status, loading: geoLoading, error: geoError, requestLocation } = useGeolocation();
  
  const [parkingData, setParkingData] = useState<ParkingListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');
  
  const [filters, setFilters] = useState<{
    type: ParkingType | 'ALL';
    coverage: CoverageType | 'ALL';
  }>({
    type: 'ALL',
    coverage: 'ALL'
  });

  const [mapCenter, setMapCenter] = useState<{
    latitude: number;
    longitude: number;
    zoom: number;
  }>({
    latitude: 19.0760, // Mumbai coordinates
    longitude: 72.8777,
    zoom: 12
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoSearchEnabled, setAutoSearchEnabled] = useState(true);
  const [lastFetchPosition, setLastFetchPosition] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth State Changed:", _event, session?.user?.id);
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('whereismyparking_demo_user');
  };

  // Initial map center from geolocation
  useEffect(() => {
    if (position && !mapCenter) {
      setMapCenter({
        latitude: position.latitude,
        longitude: position.longitude,
        zoom: 14
      });
    }
  }, [position, mapCenter]);

  const fetchParking = useCallback(async (lat: number, lng: number, f: typeof filters) => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/parking/nearby?lat=${lat}&lng=${lng}&radius=2000`;
      if (f.type !== 'ALL') url += `&type=${f.type}`;
      if (f.coverage !== 'ALL') url += `&coverage=${f.coverage}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch parking data');
      
      const data = await res.json();
      setParkingData(data.results || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching parking');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when location or filters change
  useEffect(() => {
    if (position) {
      fetchParking(position.latitude, position.longitude, filters);
    }
  }, [position, filters, fetchParking]);

  const handleMapMove = useCallback((viewState: any) => {
    setMapCenter(viewState);
  }, []);

  const handleSearchArea = useCallback(() => {
    if (mapCenter) {
      fetchParking(mapCenter.latitude, mapCenter.longitude, filters);
      setLastFetchPosition({ lat: mapCenter.latitude, lng: mapCenter.longitude });
    }
  }, [mapCenter, filters, fetchParking]);

  // Debounced auto-search on map move
  useEffect(() => {
    if (!autoSearchEnabled || !mapCenter) return;

    // Only auto-search if moved significantly (> 500m approx)
    if (lastFetchPosition) {
       const dist = Math.sqrt(
         Math.pow(mapCenter.latitude - lastFetchPosition.lat, 2) + 
         Math.pow(mapCenter.longitude - lastFetchPosition.lng, 2)
       );
       if (dist < 0.005) return; // ~500m threshold
    }

    const timer = setTimeout(() => {
      handleSearchArea();
    }, 1500);

    return () => clearTimeout(timer);
  }, [mapCenter, autoSearchEnabled, handleSearchArea, lastFetchPosition]);

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${token}&country=IN&limit=1`
      );
      const data = await res.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        const newCenter = {
          latitude: lat,
          longitude: lng,
          zoom: 14
        };
        setMapCenter(newCenter);
        fetchParking(lat, lng, filters);
        setLastFetchPosition({ lat, lng });
      }
    } catch (err) {
      console.error('Search geocoding error:', err);
      setError('Could not find that location. Please try again.');
    }
  };

  const handleSelect = (id: string | null) => {
    setSelectedId(id);
    if (id) {
        // If on mobile and in list mode, switch to map? 
        // Or just scroll to item if in split.
        const element = document.getElementById(`parking-${id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
  };

  const showListOnly = viewMode === 'list';
  const showMapOnly = viewMode === 'map';

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "WhereIsMyParking",
            "description": "Find and navigate to nearby parking spaces in urban India",
            "url": "https://whereismyparking.com",
            "applicationCategory": "Utility",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "INR"
            },
            "publisher": {
              "@type": "Organization",
              "name": "WhereIsMyParking",
              "url": "https://whereismyparking.com"
            }
          })
        }}
      />
      <main className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* Header */}
      <header className="bg-srd-blue text-white p-4 shadow-lg z-20 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">SOUP</h1>
            <span className="hidden sm:inline-block px-2 py-0.5 bg-srd-orange text-[10px] font-bold rounded uppercase tracking-widest leading-none">MVP</span>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="hidden md:flex items-center gap-2 bg-white text-srd-blue px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all hover:bg-gray-100 shadow-sm"
                >
                  Dashboard
                </Link>
                <button 
                  onClick={handleLogout}
                  className="text-sm font-bold text-white/80 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="hidden md:flex items-center gap-2 bg-srd-orange hover:bg-srd-orange/90 text-white px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
                >
                  List Your Parking
                </button>
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-sm font-bold text-white/80 hover:text-white transition-colors"
                >
                  Login
                </button>
              </>
            )}

            <div className="hidden sm:flex items-center gap-4">
              <form onSubmit={handleManualSearch} className="relative group">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search city or area in India..." 
                  className="bg-white/10 backdrop-blur-md text-white placeholder-blue-100/50 border border-white/20 rounded-full py-2 px-10 focus:ring-2 focus:ring-srd-orange focus:bg-white/20 w-80 text-sm transition-all outline-none"
                />
                <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-blue-100/50 group-focus-within:text-white transition-colors" />
                <button type="submit" className="sr-only">Search</button>
              </form>
            </div>
          </div>

          <div className="flex bg-black/20 backdrop-blur-sm rounded-xl p-1 border border-white/10">
            <button 
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-white text-srd-blue shadow-sm' : 'text-blue-100/70 hover:text-white'}`}
              title="Map view"
            >
              <MapIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-srd-blue shadow-sm' : 'text-blue-100/70 hover:text-white'}`}
              title="List view"
            >
              <ListIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('split')}
              className={`hidden md:block p-2 rounded-lg transition-all ${viewMode === 'split' ? 'bg-white text-srd-blue shadow-sm' : 'text-blue-100/70 hover:text-white'}`}
              title="Split view"
            >
              <div className="flex gap-0.5">
                 <div className="w-2.5 h-4.5 bg-current rounded-[1px]"></div>
                 <div className="w-2.5 h-4.5 bg-current rounded-[1px]"></div>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden">
        
        {/* Map View */}
        <div className={`flex-1 relative transition-all duration-300 ${showListOnly ? 'hidden md:hidden' : 'block'}`}>
          <ParkingMap 
            parkingData={parkingData}
            onMove={handleMapMove}
            onSelect={handleSelect}
            selectedId={selectedId}
            initialViewState={mapCenter || undefined}
          />
          
          {/* Search this area button (floating) */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
            <button 
              onClick={handleSearchArea}
              className="bg-white text-gray-800 px-4 py-2 rounded-full shadow-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search this area
            </button>
          </div>

          {/* Location status overlay */}
          {(status === 'prompt' || status === 'denied') && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-full max-w-sm px-4">
              <div className="bg-white p-4 rounded-xl shadow-xl border border-blue-100 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Location Access Required</p>
                    <p className="text-xs text-gray-600">Please enable location access to find parking spots near you.</p>
                  </div>
                </div>
                <button 
                  onClick={requestLocation}
                  className="bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Enable GPS
                </button>
              </div>
            </div>
          )}
        </div>

        {/* List View */}
        <div className={`w-full md:w-96 lg:w-[450px] transition-all duration-300 flex-shrink-0 ${showMapOnly ? 'hidden md:hidden' : 'block'}`}>
          {loading && parkingData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center bg-white">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
              <p className="text-gray-500 text-sm">Finding nearby parking...</p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center bg-white p-8 text-center">
              <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
              <p className="text-gray-900 font-semibold mb-1">Oops! Something went wrong</p>
              <p className="text-gray-500 text-sm mb-4">{error}</p>
              <button 
                onClick={() => position && fetchParking(position.latitude, position.longitude, filters)}
                className="text-blue-600 font-medium text-sm hover:underline"
              >
                Try again
              </button>
            </div>
          ) : (
            <ParkingList 
              parkingData={parkingData}
              selectedId={selectedId}
              onSelect={handleSelect}
              filters={filters}
              onFilterChange={setFilters}
            />
          )}
        </div>
      </div>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </main>
    </>
  );
}
