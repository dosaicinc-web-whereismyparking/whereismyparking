'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { ParkingList } from '@/components/ParkingList';
import AuthModal from '@/components/AuthModal';
import { supabase } from '@/lib/supabase';
import { ParkingListing, ParkingType, CoverageType } from '@/lib/supabase-types';
import { Search, Loader2, Map as MapIcon, List as ListIcon, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const ParkingMap = dynamic(() => import('@/components/Map').then(mod => mod.ParkingMap), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 flex items-center justify-center animate-pulse"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
});


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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      <main className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header - Airbnb Style: White, Minimal, Centered Search */}
      <header className="bg-surface text-text-main py-3 px-4 md:px-8 border-b border-border z-20 sticky top-0">
        <div className="max-w-[2520px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                 <div className="w-4 h-4 bg-white rounded-full"></div>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-primary">WhereIsMyParking</h1>
            </Link>
          </div>
          
          {/* Central Search Bar - Premium Pill Shape */}
          <div className="flex-1 max-w-xl w-full">
            <form onSubmit={handleManualSearch} className="group relative">
              <div className="flex items-center bg-white border border-border rounded-full py-2.5 px-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex-1 px-4 border-r border-border hidden sm:block">
                  <span className="text-xs font-bold block">Where</span>
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search destinations" 
                    className="text-sm text-text-main placeholder-text-secondary w-full bg-transparent border-none p-0 focus:ring-0"
                  />
                </div>
                <div className="flex-1 px-4 sm:hidden">
                   <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Where are you going?" 
                    className="text-sm text-text-main placeholder-text-secondary w-full bg-transparent border-none p-0 focus:ring-0"
                  />
                </div>
                <button 
                  type="submit" 
                  className="bg-primary text-white p-2.5 rounded-full hover:bg-primary-hover transition-colors shadow-sm ml-2"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
          
          {/* User Actions */}
          <div className="flex items-center gap-3">
             {!mounted ? (
               <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse" />
             ) : user ? (
              <div className="flex items-center gap-2">
                <Link 
                  href="/dashboard" 
                  className="text-sm font-semibold hover:bg-gray-100 px-4 py-2.5 rounded-full transition-colors hidden lg:block"
                >
                  Host your space
                </Link>
                <div className="flex items-center gap-2 border border-border rounded-full p-2 pl-4 hover:shadow-md transition-shadow cursor-pointer">
                   <button 
                    onClick={handleLogout}
                    className="text-xs font-bold uppercase tracking-wide px-2"
                  >
                    Logout
                  </button>
                   <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                     {user.email?.charAt(0).toUpperCase() || user.phone?.charAt(user.phone.length - 1)}
                   </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-sm font-semibold hover:bg-gray-100 px-4 py-2.5 rounded-full transition-colors hidden sm:block"
                >
                  Host your space
                </button>
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-2 border border-border rounded-full p-2 hover:shadow-md transition-shadow"
                >
                   <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                     <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false" style={{display: 'block', height: '16px', width: '16px', fill: 'currentColor'}}><path d="m16 .7c-8.437 0-15.3 6.863-15.3 15.3s6.863 15.3 15.3 15.3 15.3-6.863 15.3-15.3-6.863-15.3-15.3-15.3zm0 28c-4.021 0-7.605-1.884-9.933-4.81a12.425 12.425 0 0 1 2.94-2.887 7.001 7.001 0 1 1 13.985 0 12.427 12.427 0 0 1 2.937 2.886c-2.327 2.927-5.911 4.811-9.929 4.811zm0-18a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm11.233 14.341c-2.731-3.155-6.732-5.341-11.233-5.341s-8.502 2.186-11.233 5.341a13.25 13.25 0 1 1 22.466 0z"></path></svg>
                   </div>
                   <span className="text-sm font-semibold pr-2">Login</span>
                </button>
              </div>
            )}
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
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
            <button 
              onClick={handleSearchArea}
              className="bg-surface text-text-main px-6 py-2.5 rounded-full shadow-airbnb hover:shadow-airbnb-hover border border-border text-sm font-semibold transition-all flex items-center gap-2 active:scale-95"
            >
              <Search className="w-4 h-4 text-primary" />
              Search this area
            </button>
          </div>

          {/* View Mode Toggle - Floating Pill at Bottom */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
             <div className="flex bg-text-main rounded-full p-1 shadow-lg border border-white/10">
              <button 
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${viewMode === 'map' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <MapIcon className="w-4 h-4" />
                Map
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <ListIcon className="w-4 h-4" />
                List
              </button>
              <button 
                onClick={() => setViewMode('split')}
                className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${viewMode === 'split' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Split
              </button>
            </div>
          </div>
          
          {/* Location status overlay */}
          {(status === 'prompt' || status === 'denied') && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 w-full max-w-sm px-4">
              <div className="bg-surface p-6 rounded-airbnb shadow-airbnb border border-border flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <AlertCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-base text-text-main">Location Access</p>
                    <p className="text-sm text-text-secondary leading-relaxed">Enable location to see parking spots around you on the map.</p>
                  </div>
                </div>
                <button 
                  onClick={requestLocation}
                  className="bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-hover shadow-sm transition-all active:scale-95"
                >
                  Enable GPS
                </button>
              </div>
            </div>
          )}
        </div>

        {/* List View */}
        <div className={`w-full md:w-96 lg:w-[480px] transition-all duration-300 flex-shrink-0 bg-surface border-l border-border ${showMapOnly ? 'hidden md:hidden' : 'block'}`}>
          {loading && parkingData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <p className="text-text-secondary font-medium">Finding nearby parking...</p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
              <div className="bg-red-50 p-4 rounded-full mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-text-main font-bold text-lg mb-2">Something went wrong</p>
              <p className="text-text-secondary text-sm mb-6 leading-relaxed">{error}</p>
              <button 
                onClick={() => position && fetchParking(position.latitude, position.longitude, filters)}
                className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-hover shadow-sm transition-all"
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
      {mounted && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}
    </main>
    </>
  );
}
