'use client';

import React from 'react';
import { ParkingListing, ParkingType, CoverageType } from '@/lib/supabase-types';
import { Navigation, MapPin, Clock, Filter, ExternalLink } from 'lucide-react';

interface ParkingListProps {
  parkingData: ParkingListing[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  filters: {
    type: ParkingType | 'ALL';
    coverage: CoverageType | 'ALL';
  };
  onFilterChange: (filters: { type: ParkingType | 'ALL'; coverage: CoverageType | 'ALL' }) => void;
}

export const ParkingList: React.FC<ParkingListProps> = ({
  parkingData,
  selectedId,
  onSelect,
  filters,
  onFilterChange,
}) => {
  const handleNavigate = (latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Nearby Parking
        </h2>
        
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200">
            <Filter className="w-4 h-4 text-gray-500" />
            <select 
              className="bg-transparent text-sm focus:outline-none"
              value={filters.type}
              onChange={(e) => onFilterChange({ ...filters, type: e.target.value as any })}
            >
              <option value="ALL">All Types</option>
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200">
            <select 
              className="bg-transparent text-sm focus:outline-none"
              value={filters.coverage}
              onChange={(e) => onFilterChange({ ...filters, coverage: e.target.value as any })}
            >
              <option value="ALL">All Coverage</option>
              <option value="OPEN">Open</option>
              <option value="COVERED">Covered</option>
              <option value="MULTI">Multi-level</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {parkingData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No parking spots found matching your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {parkingData.map((parking) => (
              <div
                key={parking.id}
                id={`parking-${parking.id}`}
                className={`p-4 transition-colors cursor-pointer hover:bg-gray-50 ${
                  selectedId === parking.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => onSelect(parking.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{parking.name}</h3>
                  {parking.distance !== undefined && (
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {(parking.distance / 1000).toFixed(1)} km
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{parking.address}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                    {parking.type}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                    {parking.coverage}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>24/7 Available</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigate(parking.latitude, parking.longitude);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  Navigate
                  <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParkingList;
