'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { ParkingMap } from '@/components/Map';
import { ParkingList } from '@/components/ParkingList';
import { ParkingListing, ParkingType, CoverageType } from '@/lib/supabase-types';
import { Search, Loader2, Map as MapIcon, List as ListIcon, AlertCircle } from 'lucide-react';

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
  } | null>(null);

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
    // We could refetch here, but let's do it on a 'Search this area' button or debounced
    // For now, let's keep it simple and only refetch if filters change or initial location is found
    setMapCenter(viewState);
  }, []);

  const handleSearchArea = () => {
    if (mapCenter) {
      fetchParking(mapCenter.latitude, mapCenter.longitude, filters);
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
    <main className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* Header */}
      <header className="bg-blue-700 text-white p-4 shadow-md z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">SOUP</h1>
          
          <div className="hidden sm:flex items-center gap-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search area..." 
                className="bg-blue-800 text-white placeholder-blue-300 border-none rounded-full py-1.5 px-10 focus:ring-2 focus:ring-white w-64"
                disabled
              />
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-blue-300" />
            </div>
          </div>

          <div className="flex bg-blue-800 rounded-lg p-1">
            <button 
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded ${viewMode === 'map' ? 'bg-white text-blue-700' : 'text-blue-200'}`}
              title="Map view"
            >
              <MapIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white text-blue-700' : 'text-blue-200'}`}
              title="List view"
            >
              <ListIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('split')}
              className={`hidden md:block p-1.5 rounded ${viewMode === 'split' ? 'bg-white text-blue-700' : 'text-blue-200'}`}
              title="Split view"
            >
              <div className="flex gap-0.5">
                 <div className="w-2 h-4 bg-current rounded-sm"></div>
                 <div className="w-2 h-4 bg-current rounded-sm"></div>
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
    </main>
  );
}
